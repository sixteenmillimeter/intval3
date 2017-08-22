'use strict'

const ble = require('./lib/blootstrap')
const express = require('express')
const app = express()
const gpio = require('gpio')
const gpio4 = gpio.export(4, {
	direction: 'out',
	interval: 100,
	ready : () => {
	}
})
const PORT = process.env.PORT || 6699
const APPNAME = 'my_project'

function blink (req, res, next) {
	console.log('Blinking!')
	gpio4.set(1)
	setTimeout(() => {
		gpio4.set(0)
		res.send('<h1>You blinked!</h1>')
		next()
	}, 1000)
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