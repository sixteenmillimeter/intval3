'use strict'

const Gpio = require('onoff').Gpio

const btn = Gpio(5, 'in', 'both')

console.log('Watching input on GPIO 05')

/*btn.watch((err, val) => {
	if (err) {
		return console.error(err)
	}
	console.log(val)
})*/

setInterval(() => {
	console.log(btn.readSync())
}, 1000)