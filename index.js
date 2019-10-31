'use strict'

const restify = require('restify')
const log = require('./lib/log')('main')
const fs = require('fs')
const { exec } = require('child_process')

const BLE = require('./lib/ble')
const Intval = require('./lib/intval')
const intval = new Intval()
const Sequence = require('./lib/sequence')
const sequence = new Sequence(intval)

const PACKAGE = require('./package.json')
const PORT = process.env.PORT || 6699
const APPNAME = PACKAGE.name
const INDEXPATH = './app/www/index.html'

let app = restify.createServer({
	name: APPNAME,
	version: PACKAGE.version
})

let ble

function createServer () {
	app.use(restify.plugins.queryParser())
	app.use(restify.plugins.bodyParser({ mapParams: false }))
	app.get( '/', index)
	app.get( '/dir', rDir)
	app.post('/dir', rDir)
	app.get( '/exposure', rExposure)
	app.post('/exposure', rExposure)
	app.get( '/delay', rDelay)
	app.post('/delay', rDelay)
	app.get( '/counter', rCounter)
	app.post('/counter', rCounter)
	app.get( '/frame', rFrame)
	app.post('/frame', rFrame)
	app.get( '/sequence', rSequence)
	app.post('/sequence', rSequence)

	app.get( '/status', rStatus)
	app.post('/reset', rReset)
	app.post('/update', rUpdate)
	app.post('/restart', rRestart)
	

	app.listen(PORT, () => {
		log.info('server', { name : APPNAME, port : PORT })
	})
}

function createBLE () {
	ble = new BLE(() => {
		return intval.status()
	})
	ble.on('frame', bFrame)
	ble.on('dir', bDir)
	ble.on('exposure', bExposure)
	ble.on('delay', bDelay)
	ble.on('counter', bCounter)
	ble.on('sequence', bSequence)

	ble.on('reset', bReset)
	ble.on('update', bUpdate)
	ble.on('restart', bRestart)
}

//Restify functions
function rDir (req, res, next) {
	let dir = true
	let set = false
	if (req.query && typeof req.query.dir !== 'undefined') {
		if (typeof req.query.dir === 'string') {
			dir = (req.query.dir === 'true')
		} else {
			dir = req.query.dir
		}
		set = true
	} else if (req.body && typeof req.body.dir !== 'undefined') {
		if (typeof req.body.dir === 'string') {
			dir = (req.body.dir === 'true')
		} else {
			dir = req.body.dir
		}
		set = true
	}
	if (set) {
		intval.setDir(dir)
	} else {
		dir = intval._state.frame.dir
	}
	log.info('/dir', { method: req.method, set : set, dir : dir})
	res.send({ dir : dir })
	return next()
}

function rExposure (req, res, next) {
	let exposure = 0
	let set = false
	if (req.query && typeof req.query.exposure !== 'undefined') {
		if (typeof req.query.exposure === 'string') {
			exposure = parseInt(req.query.exposure)
		} else {
			exposure = req.query.exposure
		}
		set = true
	} else if (req.body && typeof req.body.exposure !== 'undefined') {
		if (typeof req.body.exposure === 'string') {
			exposure = parseInt(req.body.exposure)
		} else {
			exposure = req.body.exposure
		}
		set = true
	}
	if (set) {
		if (exposure <= intval._frame.expected) {
			exposure = 0;
		}
		intval.setExposure(exposure)
	} else {
		exposure = intval._state.frame.exposure
	}
	log.info('/exposure', { method: req.method, set : set, exposure : exposure })
	res.send({ exposure : exposure })
	return next()
}

function rDelay (req, res, next) {
	let delay = 0
	let set = false
	if (req.query && typeof req.query.delay !== 'undefined') {
		if (typeof req.query.delay === 'string') {
			delay = parseInt(req.query.delay)
		} else {
			delay = req.query.delay
		}
		set = true
	}
	if (req.body && typeof req.body.delay !== 'undefined') {
		if (typeof req.body.delay === 'string') {
			delay = parseInt(req.body.delay)
		} else {
			delay = req.body.delay
		}
		set = true
	}
	if (set) {
		intval.setDelay(delay)
	} else {
		delay = intval._state.frame.delay
	}
	log.info('/delay', { method: req.method, set : set, delay : delay })
	res.send({ delay : delay })
	return next()
}

function rCounter (req, res, next) {
	let counter = 0
	let set = false
	if (req.query && typeof req.query.counter !== 'undefined') {
		if (typeof req.query.counter === 'string') {
			counter = parseInt(req.query.counter)
		} else {
			counter = req.query.counter
		}
		set = true
	}
	if (req.body && typeof req.body.counter !== 'undefined') {
		if (typeof req.body.counter !== 'string') {
			counter = parseInt(req.body.counter)
		} else {
			counter = req.body.counter
		}
		set = true
	}
	if (set) {
		intval.setCounter(counter)
	} else {
		counter = intval._state.counter
	}
	log.info('/counter', { method : req.method, set : set, counter : counter })
	res.send({ counter : counter })
	return next()
}

async function rFrame (req, res, next) {
	let dir = true
	let exposure = 0
	if (intval._state.frame.dir !== true) {
		dir = false
	}
	if (intval._state.frame.exposure !== 0) {
		exposure = intval._state.frame.exposure
	}
	if (req.query && typeof req.query.dir !== 'undefined') {
		if (typeof req.query.dir === 'string') {
			dir = (req.query.dir === 'true')
		} else {
			dir = req.query.dir
		}
	}
	if (req.body && typeof req.body.dir !== 'undefined') {
		if (typeof req.body.dir === 'string') {
			dir = (req.body.dir === 'true')
		} else {
			dir = req.body.dir
		}
	}
	if (req.query && typeof req.query.exposure !== 'undefined') {
		if (typeof req.query.exposure === 'string') {
			exposure = parseInt(req.query.exposure)
		} else {
			exposure = req.query.exposure
		}
	}
	if (req.body && typeof req.body.exposure !== 'undefined') {
		if (typeof req.body.exposure === 'string') {
			exposure = parseInt(req.body.exposure)
		} else {
			exposure = req.body.exposure
		}
	}
	if (req.query && typeof req.query.delay !== 'undefined') {
		if (typeof req.query.delay === 'string') {
			delay = parseInt(req.query.delay)
		} else {
			delay = req.query.delay
		}
	}
	if (req.body && typeof req.body.delay !== 'undefined') {
		if (typeof req.body.delay === 'string') {
			delay = parseInt(req.body.delay)
		} else {
			delay = req.body.delay
		}
	}
	log.info('/frame', { method : req.method, dir : dir, exposure : exposure })

	if (exposure < 30000) {
		await intval.frame(dir, exposure)
	} else {
		intval.frame(dir, exposure)
		res.send({ dir : dir, len : exposure, delaying : true })
		return next()
	}
}

function rStatus (req, res, next) {
	const obj = intval.status()
	res.send(obj)
	return next()
}

async function rSequence (req, res, next) {
	let dir = true
	let exposure = 0
	let delay = 0
	let options = {}

	if (intval._state.frame.dir !== true) {
		dir = false
	}
	if (intval._state.frame.exposure !== 0) {
		exposure = intval._state.frame.exposure
	}
	if (intval._state.frame.delay !== 0) {
		delay = intval._state.frame.delay
	}

	if (req.query && typeof req.query.dir !== 'undefined') {
		if (typeof req.query.dir === 'string') {
			dir = (req.query.dir === 'true')
		} else {
			dir = req.query.dir
		}
	}
	if (req.body && typeof req.body.dir !== 'undefined') {
		if (typeof req.body.dir === 'string') {
			dir = (req.body.dir === 'true')
		} else {
			dir = req.body.dir
		}
	}
	if (req.query && typeof req.query.exposure !== 'undefined') {
		if (typeof req.query.exposure === 'string') {
			exposure = parseInt(req.query.exposure)
		} else {
			exposure = req.query.exposure
		}
	}
	if (req.body && typeof req.body.exposure !== 'undefined') {
		if (typeof req.body.exposure === 'string') {
			exposure = parseInt(req.body.exposure)
		} else {
			exposure = req.body.exposure
		}
	}
	if (req.query && typeof req.query.delay !== 'undefined') {
		if (typeof req.query.delay === 'string') {
			delay = parseInt(req.query.delay)
		} else {
			delay = req.query.delay
		}
	}
	if (req.body && typeof req.body.delay !== 'undefined') {
		if (typeof req.body.delay === 'string') {
			delay = parseInt(req.body.delay)
		} else {
			delay = req.body.delay
		}
	}

	if (req.query && typeof req.query.len !== 'undefined') {
		if (typeof req.query.len === 'string') {
			options.len = parseInt(req.query.len)
		} else {
			options.len = req.query.len
		}
	}
	if (req.body && typeof req.body.len !== 'undefined') {
		if (typeof req.body.len === 'string') {
			options.len = parseInt(req.body.len)
		} else {
			options.len = req.body.len
		}
	}

	if (req.query && typeof req.query.multiple !== 'undefined') {
		if (typeof req.query.multiple === 'string') {
			options.multiple = parseInt(req.query.multiple)
		} else {
			options.multiple = req.query.multiple
		}
	}
	if (req.body && typeof req.body.multiple !== 'undefined') {
		if (typeof req.body.multiple === 'string') {
			options.multiple = parseInt(req.body.multiple)
		} else {
			options.multiple = req.body.multiple
		}
	}

	if (intval._state.sequence && sequence.active) {
		intval._state.sequence = false
		sequence.stop()
		res.send({ stopped : true })

		return next()

	} else {
		intval._state.sequence = true
		sequence.start(options)
		res.send({ started : true })
		
		return next()
	}
}

function rReset (req, res, next) {
	log.info(`/reset`, {time : +new Date()})
	intval.reset()
	setTimeout(() => {
		const obj = intval.status()
		res.send(obj)
		return next()
	}, 10)
}

function rUpdate (req, res, next) {
	log.info(`/update`, { time : +new Date() })
	exec('sh ./scripts/update.sh', (err, stdio, stderr) => {
		if (err) {
			log.error(err)
		}
		log.info(`/update`, { git : stdio })
		res.send({ success : true, action : 'update', output : stdio })
		res.end()
		next()
		setTimeout(() => {
			process.exit(0)
		}, 100)
	})
}

function rRestart (req, res, next) {
	log.info(`/restart`, { time : +new Date() })
	res.send({ success : true, action : 'restart' })
	res.end()
	next()
	setTimeout(() => {
		process.exit(0)
	}, 100)
}

//Ble functions

async function bFrame (obj, cb) {
	let dir = true
	let exposure = 0

	if (sequence.active) {
		return cb()
	}
	
	if (intval._state.frame.dir !== true) {
		dir = false
	}
	if (intval._state.frame.exposure !== 0) {
		exposure = intval._state.frame.exposure
	}
	if (typeof obj.dir !== 'undefined') {
		if (typeof obj.dir === 'string') {
			dir = (obj.dir === 'true')
		} else {
			dir = obj.dir
		}
	}
	if (typeof obj.exposure !== 'undefined') {
		if (typeof obj.exposure === 'string') {
			exposure = parseInt(obj.exposure)
		} else {
			exposure = obj.exposure
		}
	}
	log.info('frame', { method : 'ble', dir : dir, exposure : exposure })

	if (exposure < 5000) {
		await intval.frame(dir, exposure)
		return cb()
	} else {
		intval.frame(dir, exposure)
		return cb()
	}

	//setTimeout(cb, exposure === 0 ? 630 : exposure)
}

function bDir (obj, cb) {
	let dir = true
	let set = false
	if (obj.dir !== 'undefined') {
		if (typeof obj.dir === 'string') {
			dir = (obj.dir === 'true')
		} else {
			dir = obj.dir
		}
	}
	intval.setDir(dir)
	log.info('dir', { method: 'ble', dir : dir })
	cb()
}

function bExposure (obj, cb) {
	let exposure = 0
	if (typeof obj.exposure !== 'undefined') {
		if (typeof obj.exposure === 'string') {
			exposure = parseInt(obj.exposure)
		} else {
			exposure = obj.exposure
		}
	}
	intval.setExposure(exposure)
	log.info('exposure', { method: 'ble', exposure : exposure })
	return cb()
}

function bDelay (obj, cb) {
	let delay = 0
	let set = false
	if (typeof obj.delay !== 'undefined') {
		if (typeof obj.delay === 'string') {
			delay = parseInt(obj.delay)
		} else {
			delay = obj.delay
		}
		set = true
	}
	intval.setDelay(delay)
	log.info('delay', { method: 'ble', delay : delay })
	return cb()
}

function bCounter (obj, cb) {
	let counter = 0
	if (typeof obj.counter !== 'undefined') {
		if (typeof obj.counter !== 'string') {
			counter = parseInt(obj.counter)
		} else {
			counter = obj.counter
		}
	}
	intval.setCounter(counter)
	log.info('counter', { method : 'ble', counter : counter })
	return cb()
}

function bSequence (obj, cb) {
	let dir = true
	let exposure = 0
	let delay = 0
	let options = {}

	if (intval._state.frame.dir !== true) {
		dir = false
	}
	if (intval._state.frame.exposure !== 0) {
		exposure = intval._state.frame.exposure
	}
	if (intval._state.frame.delay !== 0) {
		delay = intval._state.frame.delay
	}

	if (typeof obj.dir !== 'undefined') {
		if (typeof obj.dir === 'string') {
			dir = (obj.dir === 'true')
		} else {
			dir = obj.dir
		}
	}
	if (typeof obj.exposure !== 'undefined') {
		if (typeof obj.exposure === 'string') {
			exposure = parseInt(obj.exposure)
		} else {
			exposure = obj.exposure
		}
	}
	if (typeof obj.len !== 'undefined') {
		if (typeof obj.len === 'string') {
			options.len = parseInt(obj.len)
		} else {
			options.len = obj.len
		}
	}
	if (typeof obj.multiple !== 'undefined') {
		if (typeof obj.multiple === 'string') {
			options.multiple = parseInt(obj.multiple)
		} else {
			options.multiple = obj.multiple
		}
	}

	if (intval._state.sequence && sequence._state.active) {
		//should not occur with single client
		intval._state.sequence = false
		sequence.stop()
		log.info('sequence stop', { method : 'ble' })
		return cb()
	} else {
		intval._state.sequence = true
		sequence.start(options)
		log.info('sequence start', { method : 'ble' })
		return cb()
	}
}

function bSequenceStop (obj, cb) {
	if (intval._state.sequence && sequence.active) {
		sequence.stop()
		intval._state.sequence = false
		log.info('sequence stop', { method : 'ble' })
		return cb()
	}
}

function bReset (obj, cb) {
	log.info(`reset`, { method: 'ble' })
	intval.reset()
	setTimeout(cb, 10)
}

function bUpdate (obj, cb) {
	log.info('update', { method : 'ble' })
	exec('sh ./scripts/update.sh', (err, stdio, stderr) => {
		if (err) {
			log.error('update', err)
		}
		log.info('update', { stdio : stdio })
		cb()
		setTimeout(() => {
			process.exit(0)
		}, 20)
	})
}

function bRestart (obj, cb) {
	log.info('restart', { method : 'ble' })
	cb()
	setTimeout(() => {
		process.exit(0)
	}, 20)
}

function index (req, res, next) {
	fs.readFile(INDEXPATH, 'utf8', (err, data) => {
		if (err) {
			return next(err)
		}
		res.end(data)
		next()
	})
}

function init () {
	intval.sequence = seq
	createServer()
	createBLE()
}

init()
