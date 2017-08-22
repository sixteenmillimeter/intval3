'use strict'

const gpio = require('gpio')

class Intval {
	constructor () {
		this._pin = {}
		this._startFrame = 0
		this._declarePins()
	}
	_declarePins () {
		this._pin.fwd = gpio.export(4, {
			direction: 'out',
			interval: 100,
			ready : () => {
				console.info(`Set pin 4 to OUTPUT`)
			}
		})
		this._pin.bwd = gpio.export(5, {
			direction: 'out',
			interval: 100,
			ready : () => {
				console.info(`Set pin 5 to OUTPUT`)
			}
		})
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