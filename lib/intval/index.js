'use strict'

const log = require('../log')('intval')

let Gpio
try {
	Gpio = require('onoff').Gpio
} catch (e) {
	log.warn('Failed including Gpio, using sim')
	Gpio = require('../../lib/onoffsim').Gpio
}


const PINS = {
	fwd : {
		pin : 13,
		dir : 'out'
	},
	bwd : {
		pin : 19,
		dir : 'out'
	},
	micro : {
		pin : 5,
		dir : 'in',
		edge : 'both'
	},
	release : {
		pin : 6,
		dir  : 'in',
		edge : 'both'
	}
}

/** Class representing the intval3 features */
class Intval {
	constructor () {
		this._pin = {}
		this._state = {
			dir : true, //forward
			frame : {
				start : 0, //time frame started, timestamp
				active : false, //should frame be running
				time : 0, //length of frame, in ms
				delay : 0, //delay before start of frame, in ms

				expected : 1000 //expected length of frame, in ms
			},
			release : {
				time: 0,
				active : false //is pressed
			},
			micro : {
				time : 0,
				primed : false //is ready to stop frame
			}
		}
		
		this._releaseMin = 50
		this._releaseSequence = 1000
		this._microDelay = 10 // delay after stop signal before stopping motors

		this._declarePins()
		process.on('SIGINT', this._undeclarePins)
		process.on('uncaughtException', this._undeclarePins)
	}
	/**
	* (internal function) Declares all Gpio pins that will be used
	*
	*/
	_declarePins () {
		let pin
		for (let p in PINS) {
			pin = PINS[p]
			if (pin.edge) this._pin[p] = Gpio(pin.pin, pin.dir, pin.edge)
			if (!pin.edge) this._pin[p] = Gpio(pin.pin, pin.dir)
			log.info('_declarePins', { pin : pin.pin, dir : pin.dir, edge : pin.edge })
		}
		this._pin.release.watch(this._watchRelease)
	}
	/** 
	* (internal function) Undeclares all Gpio in event of uncaught error
	* that interupts the node process
	*
	*/
	_undeclarePins () {
		if (!this._pin) {
			log.warn('_undeclarePins', { reason : 'No pins'})
			return process.exit()
		}
		log.warn('_undeclarePins', { pin : PINS.fwd.pin, val : 0, reason : 'exiting'})
		this._pin.fwd.writeSync(0)
		log.warn('_undeclarePins', { pin : PINS.bwd.pin, val : 0, reason : 'exiting'})
		this._pin.bwd.writeSync(0)
		this._pin.fwd.unexport()
		this._pin.bwd.unexport()
		this._pin.micro.unexport()
		this._pin.release.unexport()
		process.exit()
	}
	/**
	* Start motor in forward direction by setting correct pins in h-bridge
	*
	*/
 	_startFwd () {
		this._pin.fwd.writeSync(1)
		this._pin.bwd.writeSync(0)
		//start high-cpu watch
	}
	/**
	* Start motor in backward direction by setting correct pins in h-bridge
	*
	*/
	_startBwd () {
		this._pin.fwd.writeSync(0)
		this._pin.bwd.writeSync(1)
	}
	/** 
	* Stop motor by setting both motor pins to 0 (LOW)
	*
	*/
	_stop () {
		this._pin.fwd.writeSync(0)
		this._pin.bwd.writeSync(0)

		let len = (+new Date()) - this._state.frame.start

		log.info(`Frame stopped ${len}ms`)

		this._pin.micro.unwatch()
		this._state.frame.active = false
		this._state.frame.start = 0
	}
	/**
	* Callback for watching relese switch state changes.
	* Using GPIO 06 on Raspberry Pi Zero W.
	*
	* 1) If closed AND frame active, start timer, set state primed to `true`.
	* 1) If opened AND frame active, stop frame
	*
	* Microswitch + 10K ohm resistor 
	* * 1 === open 
	* * 0 === closed
	*
	*
	* @param {object} 	err 	Error object present if problem reading pin
	* @param {integer} 	val 	Current value of the pin
	*
	*/
	_watchMicro (err, val) {
		const NOW = +new Date()
		if (err) {
			log.error('_watchMicro', err)
		}
		//determine when to stop
		if (val === 0 && this._state.frame.active) {
			if (!this._state.micro.primed) {
				this._state.micro.primed = true
				this._state.micro.time = NOW
				log.info('Mircoswitch primed to stop motor')
			}
		} else if (val === 1 && this._state.frame.active) {
			if (this._state.micro.primed) {
				this._state.micro.primed = false
				this._state.micro.time = 0
				setTimeout( () => {
					log.info(`Stopped frame after ${NOW - this._state.micro.time}ms`)
				}, this._microDelay)
			}
		}
	}
	/**
	* Callback for watching relese switch state changes.
	* Using GPIO 05 on Raspberry Pi Zero W.
	*
	* 1) If closed, start timer.
	* 2) If opened, check timer AND
	* 3) If `press` (`now - this._state.release.time`) greater than minimum and less than `this._releaseSequence`, start frame
	* 4) If `press` greater than `this._releaseSequence`, start sequence
	*
	* Button + 10K ohm resistor 
	* * 1 === open 
	* * 0 === closed
	*
	* @param {object} 	err 	Error object present if problem reading pin
	* @param {integer} 	val 	Current value of the pin
	*
	*/
	_watchRelease (err, val) {
		const now = +new Date()
		let press = 0
		if (err) {
			return log.error(err)
		}
		log.info(`Release switch val: ${val}`)
		if (val === 0) {
			//closed
			if (this._releaseClosedState(now)) {
				this._state.release.time = now
				this._state.release.active = true //maybe unncecessary 
			}
		} else if (val === 1) {
			//opened
			if (this._state.release.active) {
				press = now - this._state.release.time
				if (press > this._releaseMin && press < this._releaseSequence) {
					this.frame()
				} else if (press >= this._releaseSequence) {
					this.sequence()
				}
				log.info(`Release closed for ${press}ms`)
				this._state.release.time = 0
				this._state.release.active = false
			}
		}
		log.info('completed if statement')
	}

	_releaseClosedState (now) {
		if (!this._state.release.active && this._state.release.time === 0) {
			return true
		}
		if (this._state.release.active && (now - this._state.release.time) > (this._releaseSequence * 10)) {
			return true
		}
		return false
	}
	/**
	* Set the default direction of the camera.
	* * forward = true
	* * backward = false
	*
	* @param {boolean} 	[dir=true] 		Direction of the camera
	*
	*/
	setDir (val = true) {
		if (typeof val !== 'boolean') {
			return log.warn('Direction must be represented as either true or false')
		}
		this._state.dir = val
	} 
	/**
	* Begin a single frame with set variables or defaults
	*
	* @param {?boolean} 	[dir="null"] 		(optional) Direction of the frame
	* @param {?integer} 	[time="null"] 		(optional) Exposure time, 0 = minimum
	*
	*/
	frame (dir = null, time = null) {
		if (dir === true || (dir === null && this._state.dir === true) ) {
			dir =  true
		} else {
			dir = false
		}
		
		if (time === null && this._state.time !== 0) {
			time = this._state.time
		} else {
			time = 0
		}

		this._state.frame.start = +new Date()
		this._state.frame.active = true
		this._pin.micro.watch(this._watchMicro)

		log.info('frame', {dir : dir, time : time})

		if (dir) {
			this._startFwd()
		} else {
			this._startBwd()
		}
	}
	/**
	* Start a sequence of frames, using defaults or explicit instructions
	*
	*/
	sequence () {
		log.info('sequence', `Started sequence`)
	}
	status () {
		return this._state
	}
}

module.exports = new Intval()