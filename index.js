'use strict'

const restify = require('restify')
const log = require('./lib/log')('main')
const fs = require('fs')

const BLE = require('./lib/ble')
const intval = require('./lib/intval')
const sequence = require('./lib/sequence')

const PACKAGE = require('./package.json')
const PORT = process.env.PORT || 6699
const APPNAME = PACKAGE.name
const INDEXPATH = './app/www/index.html'

let app = restify.createServer({
	name: APPNAME,
	version: '0.0.1'
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
	app.get( '/counter', rCounter)
	app.post('/counter', rCounter)
	app.get( '/frame', rFrame)
	app.post('/frame', rFrame)
	app.get( '/sequence', rSequence)
	app.post('/sequence', rSequence)
	app.post('/reset', rReset)
	app.get( '/status', rStatus)
	app.listen(PORT, () => {
		log.info('server', { name : APPNAME, port : PORT })
	})
}

function bleBindings () {
	
}

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
	} else if (req.body && typeof req.body.dir !== 'udnefined') {
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
	} else if (req.body && typeof req.body.exposure !== 'udnefined') {
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
	if (req.body && typeof req.body.delay !== 'udnefined') {
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

function rFrame (req, res, next) {
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
	if (req.body && typeof req.body.delay !== 'udnefined') {
		if (typeof req.body.delay === 'string') {
			delay = parseInt(req.body.delay)
		} else {
			delay = req.body.delay
		}
	}
	log.info('/frame', { method : req.method, dir : dir, exposure : exposure })
	intval.frame(dir, exposure, (len) => {
		res.send({ dir : dir, len : len})
		return next()
	})
}

function rStatus (req, res, next) {
	const obj = intval.status()
	res.send(obj)
	return next()
}

function rReset (req, res, next) {
	intval.reset()
	setTimeout(() => {
		res.send(intval._state)
		return next()
	}, 10)
}

function rSequence (req, res, next) {
	let dir = true
	let exposure = 0
	let delay = 0
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
	if (sequence.active) {
		return sequence.stop(() => {
			res.send({ stopped : true })
			return next()
		})
	} else {
		return sequence.start({}, (seq) => {
			res.send(seq)
			return next()
		})
	}
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
	createServer()
	intval.init()
	ble = new BLE(() => {
		return intval.status()
	})
	ble.on('data', (str) => {
		console.log(str)
	})
}

init()
