'use strict'

let fs
let input;

/** Object representing mscript parser */
const mscript = {}

/**
* Determine whether or not argument flag has been set
*
*
* @param {string} 	shrt 	Short flag name (ie `-a`)
* @param {string} 	lng 	Long flag name (ie `--apple`)
*
*/
mscript.arg = function arg (shrt, lng) {
	if (process.argv.indexOf(shrt) !== -1 ||
		process.argv.indexOf(lng) !== -1) {
		return true
	}
	return false
}
/**
* Determine position of flag, in argument array
*
*
* @param {string} 	shrt 	Short flag name (ie `-a`)
* @param {string} 	lng 	Long flag name (ie `--apple`)
*
*/
mscript.arg_pos = function arg_pos (shrt, lng) {
	let pos = process.argv.indexOf(shrt)
	if (pos === -1) {
		pos = process.argv.indexOf(lng)
	}
	return pos
}

mscript.black = '0,0,0'

mscript.cmd = [
	'CF',
	'PF',
	'BF',
	'CB',
	'PB',
	'BB',
	'D'
]
mscript.alts = {
	'CF' : ['CAMERA FORWARD', 'CAM FORWARD', 'C'],
	'PF' : ['PROJECTOR FORWARD', 'PROJ FORWARD', 'P'],
	'BF' : ['BLACK FORWARD'],
	'CB' : ['CAMERA BACKWARD', 'CAM BACKWARD', 'CAMERA BACK', 'CAM BACK'],
	'PB' : ['PROJECTOR FORWARD', 'PROJ FORWARD', 'PROJECTOR BACK', 'PROJ BACK'],
	'BB' : ['BLACK BACKWARD', 'BLACK BACK'],
	'L ' : ['LIGHT', 'COLOR', 'LAMP']
}

mscript.state = {}
//TODO: This will memory leak
mscript.state_clear = function state_clear () {
	mscript.state = {
		cam : 0,
		proj : 0,
		color : '',
		loops : [],
		rec : -1
	}
}

mscript.alts_unique = function alts_unique () {
	const ids = Object.keys(mscript.alts)
	const all = []
	for (let i = 0; i < ids.length; i++) {
		if (all.indexOf(ids[i]) === -1) {
			all.push(ids[i])
		} else {
			mscript.fail(1, "Can't parse")
		}
	}
}

mscript.interpret = function interpret (text, callback) {
	mscript.state_clear()
	if (typeof text === 'undefined') {
		mscript.fail(2, 'No input')
	}
	const lines = text.split('\n')
	const arr = []
	const light = []
	const output = {}

	let two = ''
	let target = 0
	let dist = 0 //?
	let x

	//loop through all lines
	for (let line of lines) {
		//preprocess line
		line = mscript.preprocess(line)
		two = line.substring(0, 2)

		if (mscript.cmd.indexOf(two) !== -1) {
			if (mscript.state.loops.length > 0) {
				//hold generated arr in state loop array
				mscript.state.loops[mscript.state.rec].arr.push.apply(mscript.state.loops[mscript.state.rec].arr, mscript.str_to_arr(line, two))
				mscript.state.loops[mscript.state.rec].light.push.apply(mscript.state.loops[mscript.state.rec].light, mscript.light_to_arr(line, two))
			} else {
				arr.push.apply(arr, mscript.str_to_arr(line, two))
				light.push.apply(light, mscript.light_to_arr(line, two))
			}

		} else if (line.substring(0, 4) === 'LOOP') {
			mscript.state.rec++
			mscript.state.loops[mscript.state.rec] = {
				arr : [],
				light : [],
				cam : 0,
				proj : 0,
				cmd : line + ''
			}
		} else if (line.substring(0, 2) === 'L ') {
			mscript.light_state(line)
		} else if (line.substring(0, 3) === 'END') {
			for (x = 0; x < mscript.loop_count(mscript.state.loops[mscript.state.rec].cmd); x++) {
				if (mscript.state.rec === 0) {
					arr.push.apply(arr, mscript.state.loops[mscript.state.rec].arr);
					light.push.apply(light, mscript.state.loops[mscript.state.rec].light);
				} else if (mscript.state.rec >= 1) {
					mscript.state.loops[mscript.state.rec - 1].arr.push.apply(mscript.state.loops[mscript.state.rec - 1].arr, mscript.state.loops[mscript.state.rec].arr)
					mscript.state.loops[mscript.state.rec - 1].light.push.apply(mscript.state.loops[mscript.state.rec - 1].light, mscript.state.loops[mscript.state.rec].light)
				}
			}
			mscript.state_update('END', mscript.loop_count(mscript.state.loops[mscript.state.rec].cmd));
			delete mscript.state.loops[mscript.state.rec]
			mscript.state.rec--
		} else if (line.substring(0, 3) === 'CAM') { //directly go to that frame (black?)
			target = parseInt(line.split('CAM ')[1])
			if (mscript.state.loops.length > 0) {
				if (target > mscript.state.cam) {
					dist = target - mscript.state.cam
					for (x = 0; x < dist; x++) {
						mscript.state.loops[mscript.state.rec].arr.push('BF')
						mscript.state.loops[mscript.state.rec].light.push(mscript.black)
						mscript.state_update('BF')
					} 
				} else {
					dist = mscript.state.cam - target
					for (x = 0; x < dist; x++) {
						mscript.state.loops[mscript.state.rec].arr.push('BB')
						mscript.state.loops[mscript.state.rec].light.push(mscript.black)
						mscript.state_update('BB')
					}
				}
			} else {
				if (target > mscript.state.cam) {
					dist = target - mscript.state.cam
					for (x = 0; x < dist; x++) {
						arr.push('BF')
						light.push(mscript.black)
						mscript.state_update('BF')
					} 
				} else {
					dist = mscript.state.cam - target
					for (x = 0; x < dist; x++) {
						arr.push('BB')
						light.push(mscript.black)
						mscript.state_update('BB')
					}
				}
			}
		} else if (line.substring(0, 4) === 'PROJ') { //directly go to that frame
			target = parseInt(line.split('PROJ ')[1])
			if (mscript.state.loops.length > 0) {
				if (target > mscript.state.proj) {
					dist = target - mscript.state.proj
					for (x = 0; x < dist; x++) {
						mscript.state.loops[mscript.state.rec].arr.push('PF')
						mscript.state.loops[mscript.state.rec].light.push('')
						mscript.state_update('PF')
					} 
				} else {
					dist = mscript.state.proj - target
					for (x = 0; x < dist; x++) {
						mscript.state.loops[mscript.state.rec].arr.push('PB')
						mscript.state.loops[mscript.state.rec].light.push('')
						mscript.state_update('PB')
					} 
				}
			} else {
				if (target > mscript.state.proj) {
					dist = target - mscript.state.proj
					for (x = 0; x < dist; x++) {
						arr.push('PF')
						light.push('')
						mscript.state_update('PF')
					} 
				} else {
					dist = mscript.state.proj - target
					for (x = 0; x < dist; x++) {
						arr.push('PB')
						light.push('')
						mscript.state_update('PB');
					} 
				}
			}
		} else if (line.substring(0, 3) === 'SET') { //set that state
			if (line.substring(0, 7) === 'SET CAM') {
				mscript.state.cam = parseInt(line.split('SET CAM')[1]);
			} else if (line.substring(0, 8) === 'SET PROJ') {
				mscript.state.proj = parseInt(line.split('SET PROJ')[1]);
			}
		} else if (line.substring(0, 1) === '#' || line.substring(0, 2) === '//') {
			//comments
			//ignore while parsing
		}
	}
	output.success = true
	output.arr = arr
	output.light = light
	output.cam = mscript.state.cam
	output.proj = mscript.state.proj
	if (typeof callback !== 'undefined') {
		//should only be invoked by running mscript.tests()
		callback(output)
	} else {
		return mscript.output(output)
	}
}

mscript.preprocess = function preprocess (line) {
	line = line.replace(/\t+/g, '') //strip tabs
	line = line.trim() //remove excess whitespace before and after command
	line = line.toUpperCase()
	return line
}

mscript.last_loop = function last_loop () {
	return mscript.state.loops[mscript.state.loops.length - 1]
}

mscript.parent_loop = function parent_loop () {
	return mscript.state.loops[mscript.state.loops.length - 2]
}

mscript.state_update = function state_update (cmd, val) {
	if (cmd === 'END') {
		for (var i = 0; i < val; i++) {
			if (mscript.state.rec === 0) {
				mscript.state.cam += mscript.state.loops[mscript.state.rec].cam
				mscript.state.proj += mscript.state.loops[mscript.state.rec].proj
			} else if (mscript.state.rec >= 1) {
				mscript.state.loops[mscript.state.rec - 1].cam += mscript.state.loops[mscript.state.rec].cam
				mscript.state.loops[mscript.state.rec - 1].proj += mscript.state.loops[mscript.state.rec].proj
			}
		}
	} else if (cmd === 'CF') {
		if (mscript.state.loops.length < 1) {
			mscript.state.cam++
		} else {
			mscript.state.loops[mscript.state.rec].cam++
		}
	} else if (cmd === 'CB') {
		if (mscript.state.loops.length < 1) {
			mscript.state.cam--
		} else {
			mscript.state.loops[mscript.state.rec].cam--
		}
	} else if (cmd === 'PF') {
		if (mscript.state.loops.length < 1) {
			mscript.state.proj++
		} else {
			mscript.state.loops[mscript.state.rec].proj++
		}		
	} else if (cmd === 'PB') {
		if (mscript.state.loops.length < 1) {
			mscript.state.proj--
		} else {
			mscript.state.loops[mscript.state.rec].proj--
		}		
	} else if (cmd === 'BF') {
		if (mscript.state.loops.length < 1) {
			mscript.state.cam++
		} else {
			mscript.state.loops[mscript.state.rec].cam++
		}		
	} else if (cmd === 'BB') {
		if (mscript.state.loops.length < 1) {
			mscript.state.cam--
		} else {
			mscript.state.loops[mscript.state.rec].cam++
		}		
	} else if (cmd === 'L ') {
		//TODO : ????
	}
}

mscript.str_to_arr = function str_to_arr (str, cmd) {
	const cnt = str.split(cmd)
	let arr = []
	let c = parseInt(cnt[1])

	if (cnt[1] === '') {
		c = 1
	} else {
		c = parseInt(cnt[1])
	}
	for (var i = 0; i < c; i++) {
		arr.push(cmd)
		mscript.state_update(cmd)
	}
	return arr
}

mscript.light_state = function light_state (str) {
	//add parsers for other color spaces
	const color = str.replace('L ', '').trim()
	mscript.state.color = color
}

mscript.light_to_arr = function light_to_arr (str, cmd) {
	const cnt = str.split(cmd)
	const arr = []
	let c = parseInt(cnt[1])
	
	if (cnt[1] === '') {
		c = 1
	} else {
		c = parseInt(cnt[1])
	}
	for (var i = 0; i < c; i++) {
		if (cmd === 'CF' || cmd === 'CB') {
			arr.push(mscript.state.color)
		} else if (cmd === 'BF' || cmd === 'BB') {
			arr.push(mscript.black)
		} else {
			arr.push('')
		}
	}
	return arr
}

mscript.loop_count = function loop_count (str) {
	return parseInt(str.split('LOOP ')[1])
}

mscript.fail = function fail (code, reason) {
	const obj = { success: false, error: true, msg : reason }
	console.error(JSON.stringify(obj))
	if (process) process.exit()
}

mscript.output = function output (data) {
	let json = true; //default
	if (mscript.arg('-j', '--json')) {
		json = true
	}

	if (mscript.arg('-t', '--text')) {
		json = false
	}

	if (json) {
		console.log(JSON.stringify(data))
	} else {
		var ids = Object.keys(data)
		for (var i = 0; i < ids.length; i++) {
			console.log(ids[i] + ': ' + data[ids[i]])
		}
	}
}

mscript.init = function init () {
	if (mscript.arg('-t', '--tests')) {
		return mscript.tests()
	}

	if (mscript.arg('-v', '--verbose')) {
		console.time('mscript')
	}

	if (mscript.arg('-c', '--cam')) {
		mscript.state.cam = parseInt(process.argv[mscript.arg_pos('-c', '--cam') + 1])
	}

	if (mscript.arg('-p', '--proj')) {
		mscript.state.proj = parseInt(process.argv[mscript.arg_pos('-p', '--proj') + 1])
	}

	if (mscript.arg('-f', '--file')) {
		input = process.argv[mscript.arg_pos('-f', '--file') + 1]
		mscript.interpret(fs.readFileSync(input, 'utf8'))
	} else {
		mscript.interpret(input)
	}

	if (mscript.arg('-v', '--verbose')) {
		console.timeEnd('mscript')
	}
};

if (typeof document === 'undefined' && typeof module !== 'undefined' && !module.parent) {
	//node script
	fs = require('fs')
	input = process.argv[2]
	mscript.init()
} else if (typeof module !== 'undefined' && module.parent) {
	//module
	fs = require('fs')
	module.exports = mscript
} else {
	//web
}


/*

CAM # - go to camera frame #
PROJ # - go to projector frame #

SET CAM # - sets camera count to #
SET PROJ # - sets projector count to #

LOOP # - begin loop, can nest recursively, # times
END LOOP - (or END) closes loop

L #RGB - sets light to rgb value

FADE

CF - Camera forwards
PF - Projector forwards
BF - Black forwards
CB - Camera backwards
PB - Projector backwards
BB - Black backwards

*/