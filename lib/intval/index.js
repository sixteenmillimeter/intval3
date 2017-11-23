'use strict'

const db = require('../db')
const log = require('../log')('intval')
const storage = require('node-persist')
const fs = require('fs')

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
	if (!fs.existsSync('./state')) fs.mkdirSync('./state')
	storage.init({
		dir: './state',
		stringify: JSON.stringify,
		parse: JSON.parse,
		encoding: 'utf8',
		logging: false,  // can also be custom logging function
		continuous: true, // continously persist to disk
		interval: false, // milliseconds, persist to disk on an interval
		ttl: false, // ttl* [NEW], can be true for 24h default or a number in MILLISECONDS
		expiredInterval: 2 * 60 * 1000, // [NEW] every 2 minutes the process will clean-up the expired cache
	    forgiveParseErrors: false // [NEW]
	}).then((res) => { 
		//console.dir(res) 
		storage.getItem('_state', 'test').then(intval._setState).catch((err) => {
			intval._setState(undefined)
			log.error('init', err)
		})
	}).catch((err) => { 
		log.error('init', err) 
	})

	intval._frame = {
		open : 250, 	//delay before pausing frame in open state
		openBwd : 400,
		closed : 100,   //time that frame actually remains closed for
		expected : 630 	//expected length of frame, in ms
	}
	intval._release = {
		min : 20,
		seq : 1000
	}
	intval._microDelay = 10 // delay after stop signal before stopping motors
	intval._pin = {}

	intval._declarePins()
	process.on('SIGINT', intval._undeclarePins)
	process.on('uncaughtException', intval._undeclarePins)
}

intval._setState = function (data) {
	if (typeof data !== 'undefined') {
		intval._state = data
		intval._state.frame.cb = () => {}
		log.info('_setState', 'Restored intval state from disk')
		return true
	}
	intval._state = {
		frame : {
			dir : true, 	//forward
			start : 0, 		//time frame started, timestamp
			active : false, //should frame be running
			paused : false,
			exposure : 0, 	//length of frame exposure, in ms
			delay : 0, 		//delay before start of frame, in ms
			current : {}, //current settings
			cb : () => {}
		},
		release : {
			time: 0,
			active : false //is pressed
		},
		micro : {
			time : 0,
			primed : false //is ready to stop frame
		},
		counter : 0
	}
	intval._storeState()
}

intval._storeState = function () {
	storage.setItem('_state', intval._state)
		.then(() => {})
		.catch((err) => {
			log.error('_storeState', err)
		})
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
	const entry = {}
	const now = +new Date()
	const len = now - intval._state.frame.start

	intval._pin.fwd.writeSync(0)
	intval._pin.bwd.writeSync(0)

	log.info(`_stop`, { frame : len })

	intval._pin.micro.unwatch()
	intval._state.frame.active = false

	if (intval._state.frame.cb) intval._state.frame.cb(len)
	
	entry.start = intval._state.frame.start
	entry.stop = now
	entry.len = len
	entry.dir = intval._state.frame.current.dir
	entry.exposure = intval._state.frame.current.exposure
	entry.counter = intval._state.counter

	db.insert(entry)

	intval._state.frame.current = {}
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
	const now = +new Date()
	if (err) {
		log.error('_watchMicro', err)
	}
	//log.info(`Microswitch val: ${val}`)
	//determine when to stop
	if (val === 0 && intval._state.frame.active) {
		if (!intval._state.micro.primed) {
			intval._state.micro.primed = true
			intval._state.micro.time = now
			//log.info('Microswitch primed to stop motor')
		}
	} else if (val === 1 && intval._state.frame.active) {
		if (intval._state.micro.primed && !intval._state.micro.paused && (now - intval._state.frame.start) > intval._frame.open) {
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

intval.reset = function () {
	intval._setState(undefined)
	intval._storeState()
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
	intval._state.frame.dir = val
	intval._storeState()
	log.info('setDir', { direction : val ? 'forward' : 'backward' })
}

intval.setExposure = function (val = 0) {
	intval._state.frame.exposure = val
	intval._storeState()
	log.info('setExposure', { exposure : val })
} 

intval.setDelay = function (val = 0) {
	intval._state.frame.delay = val
	intval._storeState()
	log.info('setDelay', { delay : val })
}
intval.setCounter = function (val = 0) {
	intval._state.counter = val
	intval._storeState()
	log.info('setCounter', { counter : val })
}
/**
* Begin a single frame with set variables or defaults
*
* @param {?boolean} 	[dir="null"] 			(optional) Direction of the frame
* @param {?integer} 	[exposure="null"] 		(optional) Exposure time, 0 = minimum
*
*/
intval.frame = function (dir = null, exposure = null, cb = () => {}) {
	if (dir === true || (dir === null && intval._state.frame.dir === true) ) {
		dir =  true
	} else {
		dir = false
	}
	
	if (exposure === null && intval._state.frame.exposure !== 0) {
		exposure = intval._state.frame.exposure
	} else if (exposure === null) {
		exposure = 0 //default speed
	}

	intval._state.frame.start = +new Date()
	intval._state.frame.active = true
	intval._pin.micro.watch(intval._watchMicro)

	log.info('frame', {dir : dir ? 'forward' : 'backward', exposure : exposure})

	if (dir) {
		intval._startFwd()
	} else {
		intval._startBwd()
	}
	if (exposure !== 0) {
		intval._state.frame.paused = true
		if (dir) {
			setTimeout(intval._pause, intval._frame.open)
			//log.info('frame', { pausing : time + intval._frame.open })
			setTimeout( () => {
				intval._state.frame.paused = false
				intval._startFwd()
			}, exposure + intval._frame.closed)
		} else {
			setTimeout(intval._pause, intval._frame.openBwd)
			setTimeout( () => {
				//log.info('frame', 'restarting')
				intval._state.frame.paused = false
				intval._startBwd()
			}, exposure + intval._frame.closed)
		}
	}
	if (dir) {
		intval._state.frame.cb = (len) => {
			intval._state.counter++
			intval._storeState()
			cb(len)
		}
	} else {
		intval._state.frame.cb = (len) => {
			intval._state.counter--
			intval._storeState()
			cb(len)
		}
	}
	intval._state.frame.current = {
		dir: dir,
		exposure: exposure
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