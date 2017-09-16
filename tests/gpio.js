'use strict'

const Gpio = require('onoff').Gpio

const btn = Gpio(12, 'in', 'both')

console.log('Watching input on button 18')
btn.watch((err, val) => {
	if (err) {
		return console.error(err)
	}
	console.log(val)
})