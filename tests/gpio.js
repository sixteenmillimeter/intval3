'use strict'

const Gpio = require('onoff').Gpio

function releaseTest () {
	const PIN = 5
	const btn = Gpio(PIN, 'in', 'both')
	console.log(`Watching input on GPIO 0${PIN}`)
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
	const PIN = 6
	const btn = Gpio(PIN, 'in', 'both')
	console.log(`Watching input on GPIO 0${PIN}`)
	let saveTime = 0
	let frameActive = true //this._state.frame.active
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
		if (val === 0 && frameActive) {
			if (!primed) {
				primed = true
				saveTime = NOW
				console.log('Primed')
			}
		} else if (val === 1 && frameActive) {
			if (primed) {
				primed = false
				setTimeout( () => {
					console.log(`Stop Frame after ${NOW - saveTime}`)
				}, 10)
			}
		}
	})
}

//test stepping up of 3.3V RPI logic via 
//Sparkfun PRT-10967 (NPC1402)
function stepupTest () {
	const FWD = 13
	const BWD = 19
	const fwd = Gpio(FWD, 'out')
	const bwd = Gpio(BWD, 'out')

	console.log(`Setting pin ${FWD} high`)
	fwd.writeSync(1)
}

//releaseTest()
//microTest()
stepupTest()