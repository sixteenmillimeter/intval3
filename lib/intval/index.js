'use strict'

const log = require('../log')('intval')

let Gpio
try {
	Gpio = require('onoff').Gpio
} catch (e) {
	log.warn('Failed including Gpio, using sim')
	Gpio = require('../../lib/onoffsim').Gpio
}


const PINS = {
	fwd : {
		pin : 13,
		dir : 'out'
	},
	bwd : {
		pin : 19,
		dir : 'out'
	},
	micro : {
		pin : 5,
		dir : 'in',
		edge : 'both'
	},
	release : {
		pin : 6,
		dir  : 'in',
		edge : 'both'
	}
}

/** Object representing the intval3 features */
const intval = {}

intval.init = function () {
	intval._pin = {}
	intval._state = {
		dir : true, //forward
		frame : {
			start : 0, 		//time frame started, timestamp
			active : false, //should frame be running
			paused : false,
			time : 0, 		//length of frame, in ms
			delay : 0, 		//delay before start of frame, in ms
			open : 250, 	//delay before pausing frame in open state
			openBwd : 400,
			closed : 100,   //time that frame actually remains closed for
			expected : 630 	//expected length of frame, in ms
		},
		release : {
			time: 0,
			active : false //is pressed
		},
		micro : {
			time : 0,
			primed : false //is ready to stop frame
		}
	}
	intval._frame = {

	}
	intval._release = {
		min : 20,
		seq : 1000
	}
	intval._microDelay = 10 // delay after stop signal before stopping motors

	intval._declarePins()
	process.on('SIGINT', intval._undeclarePins)
	process.on('uncaughtException', intval._undeclarePins)
}
/**
* (internal function) Declares all Gpio pins that will be used
*
*/
intval._declarePins = function () {
	let pin
	for (let p in PINS) {
		pin = PINS[p]
		if (pin.edge) intval._pin[p] = Gpio(pin.pin, pin.dir, pin.edge)
		if (!pin.edge) intval._pin[p] = Gpio(pin.pin, pin.dir)
		log.info('_declarePins', { pin : pin.pin, dir : pin.dir, edge : pin.edge })
	}
	intval._pin.release.watch(intval._watchRelease)
}
/** 
* (internal function) Undeclares all Gpio in event of uncaught error
* that interupts the node process
*
*/
intval._undeclarePins = function (e) {
	log.error(e)
	if (!intval._pin) {
		log.warn('_undeclarePins', { reason : 'No pins'})
		return process.exit()
	}
	log.warn('_undeclarePins', { pin : PINS.fwd.pin, val : 0, reason : 'exiting'})
	intval._pin.fwd.writeSync(0)
	log.warn('_undeclarePins', { pin : PINS.bwd.pin, val : 0, reason : 'exiting'})
	intval._pin.bwd.writeSync(0)
	intval._pin.fwd.unexport()
	intval._pin.bwd.unexport()
	intval._pin.micro.unexport()
	intval._pin.release.unexport()
	process.exit()
}
/**
* Start motor in forward direction by setting correct pins in h-bridge
*
*/
intval._startFwd = function () {
	intval._pin.fwd.writeSync(1)
	intval._pin.bwd.writeSync(0)
	//start high-cpu watch
}
/**
* Start motor in backward direction by setting correct pins in h-bridge
*
*/
intval._startBwd = function () {
	intval._pin.fwd.writeSync(0)
	intval._pin.bwd.writeSync(1)
}

intval._pause = function () {
	intval._pin.fwd.writeSync(0)
	intval._pin.bwd.writeSync(0)
	//log.info('_pause', 'frame paused')
}
/** 
* Stop motor by setting both motor pins to 0 (LOW)
*
*/
intval._stop = function () {
	intval._pin.fwd.writeSync(0)
	intval._pin.bwd.writeSync(0)
	const now = +new Date()
	const len = now - intval._state.frame.start

	log.info(`Frame stopped ${len}ms`)

	intval._pin.micro.unwatch()
	intval._state.frame.active = false
}
/**
* Callback for watching relese switch state changes.
* Using GPIO 06 on Raspberry Pi Zero W.
*
* 1) If closed AND frame active, start timer, set state primed to `true`.
* 1) If opened AND frame active, stop frame
*
* Microswitch + 10K ohm resistor 
* * 1 === open 
* * 0 === closed
*
*
* @param {object} 	err 	Error object present if problem reading pin
* @param {integer} 	val 	Current value of the pin
*
*/
intval._watchMicro = function (err, val) {
	const NOW = +new Date()
	if (err) {
		log.error('_watchMicro', err)
	}
	log.info(`Microswitch val: ${val}`)
	//determine when to stop
	if (val === 0 && intval._state.frame.active) {
		if (!intval._state.micro.primed) {
			intval._state.micro.primed = true
			intval._state.micro.time = NOW
			log.info('Microswitch primed to stop motor')
		}
	} else if (val === 1 && intval._state.frame.active) {
		if (intval._state.micro.primed && !intval._state.micro.paused) {
			intval._state.micro.primed = false
			intval._state.micro.time = 0
			//setTimeout( () => {
				intval._stop()
			//}, intval._microDelay)
		}
	}
}
/**
* Callback for watching relese switch state changes.
* Using GPIO 05 on Raspberry Pi Zero W.
*
* 1) If closed, start timer.
* 2) If opened, check timer AND
* 3) If `press` (`now - intval._state.release.time`) greater than minimum and less than `intval._release.seq`, start frame
* 4) If `press` greater than `intval._release.seq`, start sequence
*
* Button + 10K ohm resistor 
* * 1 === open 
* * 0 === closed
*
* @param {object} 	err 	Error object present if problem reading pin
* @param {integer} 	val 	Current value of the pin
*
*/
intval._watchRelease = function (err, val) {
	const now = +new Date()
	let press = 0
	if (err) {
		return log.error(err)
	}
	//log.info(`Release switch val: ${val}`)
	if (val === 0) {
		//closed
		if (intval._releaseClosedState(now)) {
			intval._state.release.time = now
			intval._state.release.active = true //maybe unncecessary 
		}
	} else if (val === 1) {
		//opened
		if (intval._state.release.active) {
			press = now - intval._state.release.time
			if (press > intval._release.min && press < intval._release.seq) {
				intval.frame()
			} else if (press >= intval._release.seq) {
				intval.sequence()
			}
			//log.info(`Release closed for ${press}ms`)
			intval._state.release.time = 0
			intval._state.release.active = false
		}
	}
}

intval._releaseClosedState = function (now) {
	if (!intval._state.release.active && intval._state.release.time === 0) {
		return true
	}
	if (intval._state.release.active && (now - intval._state.release.time) > (intval._release.seq * 10)) {
		return true
	}
	return false
}
/**
* Set the default direction of the camera.
* * forward = true
* * backward = false
*
* @param {boolean} 	[dir=true] 		Direction of the camera
*
*/
intval.setDir = function (val = true) {
	if (typeof val !== 'boolean') {
		return log.warn('Direction must be represented as either true or false')
	}
	intval._state.dir = val
	log.info('setDir', { direction : val ? 'forward' : 'backward' })
}
intval.setTime = function (val = 0) {
	intval._state.frame.time = val
	log.info('setTime', { time : val })
} 
intval.setDelay = function (val = 0) {
	intval._state.frame.delay = val
	log.info('setDelay', { delay : val })
}
/**
* Begin a single frame with set variables or defaults
*
* @param {?boolean} 	[dir="null"] 		(optional) Direction of the frame
* @param {?integer} 	[time="null"] 		(optional) Exposure time, 0 = minimum
*
*/
intval.frame = function (dir = null, time = null) {
	if (dir === true || (dir === null && intval._state.dir === true) ) {
		dir =  true
	} else {
		dir = false
	}
	
	if (time === null && intval._state.frame.time !== 0) {
		time = intval._state.frame.time
	} else if (time === null) {
		time = 0 //default speed
	}

	intval._state.frame.start = +new Date()
	intval._state.frame.active = true
	intval._pin.micro.watch(intval._watchMicro)

	log.info('frame', {dir : dir, time : time})

	if (dir) {
		intval._startFwd()
	} else {
		intval._startBwd()
	}
	if (time !== 0) {
		intval._state.frame.paused = true
		
		if (dir) {
			setTimeout(intval._pause, intval._state.frame.open)
			//log.info('frame', { pausing : time + intval._state.frame.open })
			setTimeout( () => {
				//log.info('frame', 'restarting')
				intval._state.frame.paused = false
				intval._startFwd()
			}, time + intval._state.frame.closed)
		} else {
			setTimeout(intval._pause, intval._state.frame.openBwd)
			setTimeout( () => {
				//log.info('frame', 'restarting')
				intval._state.frame.paused = false
				intval._startBwd()
			}, time + intval._state.frame.closed)
		}
	}
}
/**
* Start a sequence of frames, using defaults or explicit instructions
*
*/
intval.sequence = function () {
	log.info('sequence', `Started sequence`)
}
intval.status = function () {
	return intval._state
}

module.exports = intval