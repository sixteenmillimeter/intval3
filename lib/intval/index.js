'use strict'

let Gpio
try {
	Gpio = require('onoff').Gpio
} catch (e) {
	console.warn('Failed including Gpio, using sim')
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
		pin : 6,
		dir : 'in',
		edge : 'both'
	},
	release : {
		pin : 5,
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
				start : 0,
				active : false,
				time : 0,
				delay : 0,
				val : 0,
				expected : 0
			},
			release : {
				time: 0,
				active : false
			}
		}
		this._releaseMin = 50
		this._releaseSequence = 1000
		this._declarePins()
		process.on('SIGINT', this._undeclarePins)
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
		}
		console.dir(this._pin)
		this._pin.release.watch(this._watchRelease)
	}
	/** 
	* (internal function) Undeclares all Gpio in event of uncaught error
	* that interupts the node process
	*
	*/
	_undeclarePins () {
		this._pin.fwd.unexport()
		this._pin.bwd.unexport()
		this._pin.micro.unexport()
		this._pin.release.unexport()
	}
	/**
	* Start motor in forward direction by setting correct pins in h-bridge
	*
	*/
 	_startFwd () {
		this._pin.fwd.set(1)
		this._pin.bwd.set(0)
		//start high-cpu watch
	}
	/**
	* Start motor in backward direction by setting correct pins in h-bridge
	*
	*/
	_startBwd () {
		this._pin.fwd.set(0)
		this._pin.bwd.set(1)
	}
	/** 
	* Stop motor by setting both motor pins to 0 (LOW)
	*
	*/
	_stop () {
		this._pin.fwd.set(0)
		this._pin.bwd.set(0)

		let len = (+new Date()) - this._state.frame.start

		console.log(`Frame stopped ${len}ms`)

		this._pin.micro.unwatch()
		this._state.frame.active = false
	}
	/**
	* Callback for watching relese switch state changes.
	* Using GPIO 06 on Raspberry Pi Zero W.
	* * If closed, start timer.
	* * If opened, check timer AND
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
		if (err) {
			console.error(err)
		}
		this._state.frame.val = val
		//determine when to stop
	}
	/**
	* Callback for watching relese switch state changes.
	* Using GPIO 05 on Raspberry Pi Zero W.
	*
	* 1) If closed, start timer.
	* 2) If opened, check timer AND
	* 3) If `press` (`NOW - this._state.release.time`) greater than minimum and less than `this._releaseSequence`, start frame
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
		const NOW = +new Date()
		let press = 0
		if (err) {
			return console.error(err)
		}
		console.log(`Release switch val: ${val}`)
		if (val === 0) {
			if ((!this._state.release.active && this._state.release.time === 0) || (this._state.release.active && (NOW - this._state.release.time) > (this._releaseSequence * 10))
			) {
				this._state.release.time = NOW
				this._state.release.active = true //maybe unncecessary 
			}
		} else if (val === 1) {
			if (this._state.release.active) {
				press = NOW - this._state.release.time
				if (press > this._releaseMin && press < this._releaseSequence) {
					this.frame()
				} else if (press >= this._releaseSequence) {
					this.sequence()
				}
				console.log(`Release closed for ${press}`)
				this._state.release.time = 0
				this._state.release.active = false
			}
		}
	}
	setDir (val = true) {
		if (typeof val !== 'boolean') {
			return console.warn('Direction must be represented as either true or false')
		}
		this._state.dir = val
	} 
	/**
	* Begin a single frame with set variables or defaults
	*
	* @param {?boolean} 	[dir="null"] 		(optional) Direction of the frame
	* @param {?integer} 	[time="null"] 		(optional) Exposure time, 0 = minimum
	* @param {?integer} 	[delay="null"] 		(optional) Delay after frame before another can be started
	*
	*/
	frame (dir = null, time = null, delay = null) { //may be overloaded, delay is suspect
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

		if (delay === null && this._state.delay !== 0) {
			delay = this._state.delay
		} else {
			delay = 0
		}

		this._state.frame.start = +new Date()
		this._state.frame.active = true
		this._pin.micro.watch(this._watchMicro)

		if (delay !== 0) {
			setTimeout(function () {
				if (dir) {
					this._startFwd()
				} else {
					this._startBwd()
				}
				
			}, delay)
		} else {
			if (dir) {
				this._startFwd()
			} else {
				this._startBwd()
			}
		}
	}
	sequence () {
		console.log(`Started sequence`)
	}
	status () {
		return this._state
	}
}

module.exports = new Intval()