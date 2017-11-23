'use strict'

const sequence = {
	active : false,
	frame: false,
	delay : false
}

sequence.start = function (options, cb) {
	sequence.active = true 
}

sequence.stop = function (cb) {
	sequence.active = false
}

module.exports = sequence