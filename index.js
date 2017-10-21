'use strict'

const restify = require('restify')
const log = require('./lib/log')('main')
const fs = require('fs')

//const ble = require('./lib/blootstrap')
const intval = require('./lib/intval')

const PACKAGE = require('./package.json')
const PORT = process.env.PORT || 6699
const APPNAME = PACKAGE.name
const INDEXPATH = './app/www/index.html'

let app = restify.createServer({
	name: APPNAME,
	version: '0.0.1'
})

function createServer () {
	app.use(restify.plugins.queryParser())
	app.use(restify.plugins.bodyParser({ mapParams: false }))
	app.get('/', index)
	app.get('/dir', rDir)
	app.post('/dir', rDir)
	app.get('/exposure', rExposure)
	app.post('/exposure', rExposure)
	app.get('/frame', rFrame)
	app.post('/frame', rFrame)
	app.get('/sequence', () => {})
	app.post('/sequence', () => {})
	app.get('/status', rStatus)
	app.listen(PORT, () => {
		log.info('server', { name : APPNAME, port : PORT })
	})
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
		intval.setExposure(exposure)
	} else {
		exposure = intval._state.frame.exposure
	}
	res.send({ exposure : exposure })
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
	} else if (req.body && typeof req.body.delay !== 'udnefined') {
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
	res.send({ delay : delay })
}

function rFrame (req, res, next) {
	intval.frame()
	res.send({})
	return next()
}

function rStatus (req, res, next) {
	const obj = intval.status()
	res.send(obj)
	return next()
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

	/*ble.on('data', (str) => {
		console.log(str)
	})*/
	//intval.init()
}

init()
