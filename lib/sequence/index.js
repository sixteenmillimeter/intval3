'use strict'

const log = require('../log')('seq')

/** Object sequence features */
const sequence = {};

sequence._state = {
	arr : [],
	active : false,
	paused : false,
	frame: false,
	delay : false,
	count : 0,
	stop : null
}

sequence._loop = {
	arr : [],
	count : 0,
	max : 0
}

sequence.start = function (options, cb) {
	sequence._state.active = true
	sequence._state.count = 0

	if (options.arr) {
		sequence._state.arr = options.arr
	}

	if (options.loop) {
		sequence._loop.arr = options.loop
		sequence._loop.count = 0
	}

	if (options.maxLoop) {
		sequence._loop.max = options.maxLoop
	} else {
		sequence._loop.max = 0
	}

	sequence.step() 
}

sequence.stop = function (next) {
	sequence._state.active = false
	sequence._state.count = 0
	sequence._loop.count = 0
	console.dir(sequence._state.stop)
	console.trace()
	if (next) next()
}

sequence.pause = function () {
	sequence._state.paused = true
}

sequence.resume = function () {
	sequence._state.paused = false
	sequence.step()
}

sequence.step = function () {
	if (sequence._state.active && !sequence._state.paused) {
		if (sequence._state.arr.length > 0 && typeof sequence._state.arr[sequence._state.count] !== 'undefined') {
			return sequence._state.arr[sequence._state.count](() => {
				sequence._state.count++
				sequence.step()
			})
		} else if (sequence._loop.arr.length > 0 && typeof sequence._loop.arr[sequence._state.count] !== 'undefined') {
			if (sequence._state.count > sequence._loop.arr.length) {
				sequence._state.count = 0
				sequence._loop.count++
			}
			if (sequence._loop.count > sequence._loop.max) {
				return sequence.stop()
			}
			return sequence._loop.arr[sequence._state.count](() => {
				sequence._state.count++
				sequence.step()
			})
		} else{
			return sequence.stop()
		}
	} else if (sequence._state.paused) {
		log.info('Sequence paused', { loop : sequence._loop.count, count : sequence._state.count })
	} else if (!sequence._state.active) {
		log.info('Sequence stopped', { loop : sequence._loop.count, count : sequence._state.count })
	}
}

module.exports = sequence