'use strict'
const log = require('../lib/log')('mscript-tests')
const mscript = require('../lib/mscript')
//TODO: rewrite for mocha

const tests = function tests () {
	log.info('Running mscript tests')
	console.time('Tests took')

	mscript.alts_unique(); //perform check only during tests
	var fail = function (script, obj) {
		log.error('...Failed :(')
		log.error('script', script)
		log.error('err', obj)
		process.exit(1)
	}
	let script = 
`CF
PF
CB
PB
BF
BB`
	log.info('Basic function test...');
	mscript.interpret(script, function (obj) {
		if (obj.success === true 
			&& obj.cam === 0
			&& obj.proj === 0 
			&& obj.arr.length === 6) {
			log.info('...Passed!')
		} else {
			fail(script, obj)
		}
	})

	script = 
`CF
PF
CB
PB
BF
BB`
	log.info('Functions with integers test...')
	mscript.interpret(script, function (obj) {
		if (obj.success === true 
			&& obj.cam === 0
			&& obj.proj === 0 
			&& obj.arr.length === 6) {
			log.info('...Passed!')
		} else {
			fail(script, obj)
		}
	})

	script = 
`CF 1000
CB 1000
SET PROJ 200
PB 200`
	log.info('Basic state test...')
	mscript.interpret(script, function (obj) {
		if (obj.success === true 
			&& obj.cam === 0
			&& obj.proj === 0) {
			log.info('...Passed!')
		} else {
			fail(script, obj)
		}
	})

	script = 
`LOOP 10
CF 3
PF 1
END LOOP`
	log.info('Basic loop test...')
	mscript.interpret(script, function (obj) {
		if (obj.success === true 
			&& obj.cam === 30
			&& obj.proj === 10
			&& obj.arr.length === 40) {
			log.info('...Passed!')
		} else {
			fail(script, obj)
		}
	});

	script = `LOOP 4\nLOOP 4\nPF\nBF\nEND LOOP\nEND LOOP`
	log.info('Recursive loop test...');
	mscript.interpret(script, function (obj) {
		if (obj.success === true 
			&& obj.cam === 16
			&& obj.proj === 16
			&& obj.arr.length === 32) {
			log.info('...Passed!');
		} else {
			fail(script, obj);
		}
	});

	//Lighting tests
	script = `L 255,255,255\nCF\nPF`
	log.info('Basic light test...');
	mscript.interpret(script, function (obj) {
		if (obj.success === true 
			&& obj.cam === 1
			&& obj.proj === 1
			&& obj.arr.length === 2
			&& obj.light.length === 2
			&& obj.light[0] === '255,255,255'
			&& obj.light[1] === '') {
			log.info('...Passed!');
		} else {
			fail(script, obj);
		}
	});
	script = 'L 255,255,255\nCF\nPF\nBF';
	log.info('Basic black test...');
	mscript.interpret(script, function (obj) {
		if (obj.success === true 
			&& obj.cam === 2
			&& obj.proj === 1
			&& obj.arr.length === 3
			&& obj.light.length === 3
			&& obj.light[0] === '255,255,255'
			&& obj.light[1] === ''
			&& obj.light[2] === mscript.black) {
			log.info('...Passed!');
		} else {
			fail(script, obj);
		}
	});
	script = 'LOOP 2\nL 1,1,1\nCF\nL 2,2,2\nCF\nEND';
	log.info('Basic light loop test...');
	mscript.interpret(script, function (obj) {
		if (obj.success === true 
			&& obj.cam === 4
			&& obj.proj === 0
			&& obj.arr.length === 4
			&& obj.light.length === 4
			&& obj.light[0] === '1,1,1'
			&& obj.light[3] === '2,2,2') {
			log.info('...Passed!');
		} else {
			fail(script, obj);
		}
	});

	//LOOP W/ CAM and PROJ
	script = 'LOOP 2\nCAM 4\nPROJ 4\nEND';
	log.info('Basic cam/proj loop test...');
	mscript.interpret(script, function (obj) {
		if (obj.success === true 
			&& obj.cam === 8
			&& obj.proj === 8
			&& obj.arr.length === 16
			&& obj.light.length === 16
			&& obj.light[0] === mscript.black) {
			log.info('...Passed!');
		} else {
			fail(script, obj);
		}
	});

	log.info('All tests completed');
	console.timeEnd('Tests took');
}

tests()