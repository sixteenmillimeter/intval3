'use strict'

const Gpio = require('onoff').Gpio

const btn = Gpio(5, 'in', 'both')

console.log('Watching input on GPIO 05')

function releaseTest () {
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
			//console.log('closed')
		} else if (val === 1) {
			//console.log('open')
		}
		if (val === 0) {
			//closed
			if ((!active && saveTime === 0) || (active && NOW - saveTime > 10 * 1000)) {
				saveTime = NOW
				active = true //maybe unncecessary 
			} else {
				//saveTime = 0
				//active = false
			}
		} else if (val === 1) {
			//open
			if (active) {
				if (NOW - saveTime > 50 && NOW - saveTime < 1000) {
					console.log('Started Frame')
				} else if (NOW - saveTime >= 1000) {
					console.log('Started Sequence')
				}
				console.log(`Release closed for ${NOW - saveTime}`)
				saveTime = 0
				active = false
			}
		}
	})
}

function microTest () {
	let saveTime = 0
	let active = false //this._state.active
	let primed = false //this._state.primed
	btn.watch((err, val) => {
		const NOW = +new Date()
		if (err) {
			return console.error(err)
		}
		console.log(`Micro switch val: ${val}`)
		if (val === 0) {
			//console.log('closed')
		} else if (val === 1) {
			//console.log('open')
		}
		if (val === 0) {
			//console.log('closed')
		} else if (val === 1) {
			//console.log('open')
		}
	})
}

//releaseTest()
microTest()