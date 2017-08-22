'use strict'

const ble = require('./lib/blootstrap')
const intval = require('intval')
const restify = require('restify')
const logger = require('winston')
const fs = require('fs')
const pin = {}

const PACKAGE = require('./package.json')
const PORT = process.env.PORT || 6699
const APPNAME = PACKAGE.name
const INDEX = fs.readFileSync('./app/www/index.html', 'utf8')

let app = restify.createServer({
	name: APPNAME,
	version: '0.0.1'
})

function createServer () {
	app.get('/', index)
	app.all('/frame', rFrame)
	app.get('/status', rStatus)
	app.listen(PORT, () => {
		console.log(`${APPNAME} listening on port ${PORT}!`)
	})
}

function rFrame (req, res, next) {
	res.send({})
	return next()
}

function rStatus (req, res, next) {
	const obj = status()
	res.send(obj)
	return next()
}

function status () {
	const obj = {}
	return obj
}

function index (req, res, next) {
	res.end(INDEX)
	return next()
}


function init () {
	createPins()
	createServer()

	ble.on('data', (str) => {
		console.log(str)
	})
}

init()
