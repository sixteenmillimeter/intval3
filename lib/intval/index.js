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
		pin : 4,
		dir : 'out'
	},
	bwd : {
		pin : 5,
		dir : 'out'
	},
	micro : {
		pin : 6,
		dir : 'in',
		edge : 'rising'
	},
	release : {
		pin : 7,
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
		this._declarePins()
		process.on('SIGINT', this._undeclarePins)
	}
	/**
	* Intval._declarePins() - 
	* (internal function) Declares all Gpio pins that will be used
	*
	*/
	_declarePins () {
		this._pin.fwd = Gpio(13, 'out')
		this._pin.bwd = Gpio(19, 'out')
		this._pin.micro = Gpio(5, 'in', 'rising') //
		this._pin.release = Gpio(6, 'in', 'both')

		this._pin.release.watch(this._watchRelease)
	}
	/**
	* Intval._undeclarePins() - 
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
 	_startFwd () {
		this._pin.fwd.set(1)
		this._pin.bwd.set(0)
		//start high-cpu watch
	}
	_startBwd () {
		this._pin.fwd.set(0)
		this._pin.bwd.set(1)
	}
	_watchMicro (err, val) {
		/* Microswitch + 10K ohm resistor */
		/* 1 = open */
		/* 0 = closed */
		if (err) {
			console.error(err)
		}
		this._state.frame.val = val
		//determine when to stop
	}
	_watchRelease (err, val) {
		const NOW = +new Date()
		/* Button + 10K ohm resistor */
		/* 1 = open */
		/* 0 = closed */
		if (err) {
			return console.error(err)
		}
		console.log(`Release switch val: ${val}`)
		if (val === 0) {
			if (this._state.release.time === 0) {
				this._state.release.time = NOW
				this._state.release.active = true //maybe unncecessary 
			} else if (this._state.release.active) {
				if (NOW - this._state.release.time > 100) {
					this.frame()
				} else if (NOW - this._state.release.time > 1000) {
					this.sequence()
				}
				console.log(`Release closed for ${NOW - this._state.release.time}`)
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
	* Intval.frame() -
	* Begin a single frame with set variables or defaults
	*
	* @param {boolean} 	dir 	(optional) Direction of the frame
	* @param {integer} 	time 	(optional) Exposure time, 0 = minimum
	* @param {delay} 	delay 	(optional) Delay after frame before another can be started
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
 	_stop () {
		this._pin.fwd.set(0)
		this._pin.bwd.set(0)

		let len = (+new Date()) - this._state.frame.start

		console.log(`Frame stopped ${len}ms`)

		this._pin.micro.unwatch()
		this._state.frame.active = false
	}
	status () {
		return this._state
	}
}

module.exports = new Intval()