'use strict'

const restify = require('restify')
const log = require('./lib/log')('main')
const fs = require('fs')

const ble = require('./lib/blootstrap')
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
	app.get('/', index)
	app.get('/dir', rDir)
	app.post('/dir', rDir)
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
	fs.readFile(INDEXPATH, (err, data) => {
		if (err) {
			return next(err)
		}
		res.end(data)
		next()
	}, 'utf8')
}


function init () {
	createServer()

	ble.on('data', (str) => {
		console.log(str)
	})
}

init()
