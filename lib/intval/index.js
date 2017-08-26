'use strict'

const Gpio = require('onoff')
console.dir(Gpio)
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
		this._startFrame = 0
		this._declarePins()
	}
	_declarePins () {
		this._pin.fwd = Gpio(4, 'out')
		this._pin.bwd = Gpio(5, 'out')
		this._pin.micro = Gpio(6, 'in', 'rising')
		this._pin.release = Gpio(7, 'in', 'both')
	}
	_startFwd () {
		this._pin.fwd.set(1)
		this._pin.bwd.set(0)
	}
	_startBwd () {
		this._pin.fwd.set(0)
		this._pin.bwd.set(1)
	}
	frame (dir = true, time = 0, delay = 0) {
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
	status () {
		return {}
	}
}

module.exports = new Intval()