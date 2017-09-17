'use strict'

const Gpio = require('onoff').Gpio

const btn = Gpio(5, 'in', 'both')

console.log('Watching input on GPIO 05')

let saveTime = 0
let active = false
btn.watch((err, val) => {
	const NOW = +new Date()
	/* Button + 10K ohm resistor */
	/* 1 = open */
	/* 0 = closed */
	if (err) {
		return console.error(err)
	}
	console.log(`Release switch val: ${val}`)
	if (val === 0) {
		if (saveTime === 0) {
			saveTime = NOW
			active = true //maybe unncecessary 
		} else if (active) {
			if (NOW - saveTime > 100) {
				console.log('Started Frame')
			} else if (NOW - saveTime > 1000) {
				console.log('Started Sequence')
			}
			console.log(`Release closed for ${NOW - saveTime}`)
			saveTime = 0
			active = false
		}
	}
})

/*setInterval(() => {
	console.log(btn.readSync())
}, 1000)*/