'use strict'

const ble = require('./lib/blootstrap')
const restify = require('restify')
const logger = require('winston')
const gpio = require('gpio')
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

function createPins () {
	pin.four = gpio.export(4, {
		direction: 'out',
		interval: 100,
		ready : () => {
			logger.info(`Set pin 4 to OUTPUT`)
		}
	})
}

function createServer () {
	app.get('/', index)
	//app.all('/frame', rFrame)
	app.get('/status', status)
	app.listen(PORT, () => {
		console.log(`${APPNAME} listening on port ${PORT}!`)
	})
}

function rFrame (req, res, next) {
	res.send({})
	return next()
}

function frame (dir = true, length = 0, delay = 0) {

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
