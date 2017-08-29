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

class Intval {
	constructor () {
		this._pin = {}
		this._state = {
			dir : true, //forward
			running : false,
			startFrame : 0
		}
		this._declarePins()
	}
	_declarePins () {
		this._pin.fwd = Gpio(4, 'out')
		this._pin.bwd = Gpio(5, 'out')
		this._pin.micro = Gpio(6, 'in', 'rising')
		this._pin.release = Gpio(7, 'in', 'both')

		this._pin.release.watch(this._watchRelease)
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
		if (err) {
			console.error(err)
		}
	}
	_watchRelease (err, val) {
		if (err) {
			console.error(err)
		}
	}
	setDir (val = true) {
		if (typeof val !== 'boolean') {
			return console.warn('Direction must be represented as either true or false')
		}
		this._state.dir = val
	} 
	frame (dir = true, time = 0, delay = 0) {
		this._state.running = true
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
	_stop () {
		this._pin.fwd.set(0)
		this._pin.bwd.set(0)
		this._pin.micro.unwatch()
		this._state.running = false
	}
	status () {
		return this._state
	}
}

module.exports = new Intval()