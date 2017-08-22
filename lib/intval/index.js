'use strict'

const gpio = require('gpio')

class Intval {
	constructor () {
		this._pin = {}
		this._startFrame = 0
		this._declarePins()
	}
	_declarePins () {
		this._pin.four = gpio.export(4, {
			direction: 'out',
			interval: 100,
			ready : () => {
				console.info(`Set pin 4 to OUTPUT`)
			}
		})
	}
	status () {
		return {}
	}
}

module.exports = new Intval()