'use strict'

const ble = require('./lib/blootstrap')
const restify = require('restify')
const logger = require('winston')

const gpio = require('gpio')
const pin = {}

const PORT = process.env.PORT || 6699
const APPNAME = 'intval3'

let app = restify.createServer({
	name: APPNAME,
	version: '1.0.0'
})

function createPins () {
	pin.four = gpio.export(4, {
		direction: 'out',
		interval: 100,
		ready : () => {

		}
	})
}

function Frame (dir = true, length = 0, delay = 0) {

}

function index (req, res, next) {
	res.send(
	`<h1>Welcome to my app!</h1>
	<form action="/blink" method="post">
	<input type="submit" value="Blink!" />
	</form>`)
	next()
}

ble.on('data', (str) => {
	console.log(str)
	blink()
})

app.get('/', index)
app.all('/blink', blink)

app.listen(PORT, () => {
	console.log(`${APPNAME} listening on port ${PORT}!`)
})