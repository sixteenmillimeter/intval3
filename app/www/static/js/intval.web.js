'use strict'
const web = {};
web._header = new Headers({ 'content-type' : 'application/json' })
web.frame = function () {
	const opts = {
		method : 'POST',
		headers : web._header
	};
	fetch('/frame', opts)
		.then(res => {
			return res.json()
		})
		.then(web.frameSuccess)
		.catch(err => {
			console.error('Error triggering frame')
			console.error(err)
		});
}
web.frameSuccess = function (res) {
	document.getElementById('frame').blur();
	console.log(`Frame ${res.dir ? 'forward' : 'backward'} took ${res.len}ms`)
	if (res.dir === true) {
		incCounter(1);
	} else {
		incCounter(-1);
	}
};
web.setDir = function () {
	const dir = !document.getElementById('dir').checked;
	const opts = {
		method : 'POST',
		headers : web._header,
		body : JSON.stringify({ dir : dir })
	};
	fetch('/dir', opts)
		.then(res => {
			return res.json()
		})
		.then(web.setDirSuccess)
		.catch(err => {
			console.error('Error setting direction')
			console.error(err);
		});
};
web.setDirSuccess = function (res) {
	STATE.dir = res.dir;
	setDirLabel(res.dir);
	console.log(`setDir to ${res.dir}`);
};
web.getState = function () {
	const opts = {
		method : 'GET'
	}
	fetch('/status', opts)
		.then(res => {
			return res.json();
		})
		.then(setState)
		.catch(err => {
			console.error('Error getting state');
			console.error(err);
		});
};
web.setExposure = function () {
	let exposure = document.getElementById('exposure').value;
	let scaledExposure;
	let opts
	if (exposure === '' || exposure === null) {
		exposure = 0;
	}
	scaledExposure = scaleTime(exposure, STATE.scale);
	opts = {
		method : 'POST',
		headers : web._header,
		body : JSON.stringify({ exposure : scaledExposure })
	}
	fetch('/exposure', opts)
		.then(web.useJson)
		.then(web.setExposureSuccess)
		.catch(err => {
			console.error('Error setting exposure');
			console.error(err);
		});
};
web.setExposureSuccess = function (res) {
	let exposure;
	if (res.exposure < BOLEX.expected) {
		res.exposure = BOLEX.expected;
	}
	STATE.exposure = res.exposure;
	exposure = shutter(STATE.exposure);
	document.getElementById('str').innerHTML = exposure.str;
	console.log(`setExposure to ${res.exposure}`);
};
web.setDelay = function () {
	const delay = document.getElementById('delay').value;
	const scaledDelay = scaleTime(delay, STATE.delayScale)
	let opts = {
		method : 'POST',
		headers : web._header,
		body : JSON.stringify({ delay : scaledDelay })
	}
	fetch('/delay', opts)
		.then(web.useJson)
		.then(web.setDelaySuccess)
		.catch(err => {
			console.error('Error setting delay');
			console.error(err);
		})
};
web.setDelaySuccess = function (res) {
	STATE.delay = res.delay;
	console.log(`setDelay to ${res.delay}`);
};
web.setCounter = function () {
	const counter = document.getElementById('counter').value;
	const change = prompt(`Change counter value?`, counter);
	if (change === null || !isNumeric(change)) return false;
	const opts = {
		method : 'POST',
		headers : web._header,
		body : JSON.stringify({ counter : change })
	}
	fetch('/counter', opts)
		.then(web.useJson)
		.then(web.setCounterSuccess)
		.catch(err => {
			console.error('Error setting counter');
			console.error(err);
		})
};
web.setCounterSuccess = function (res) {
	STATE.counter = res.counter;
	forceCounter(res.counter);
	console.log(`setCounter to ${res.counter}`);
};
web.sequence = function () {
	const opts = {
		method : 'POST',
		headers : web._header,
		body : JSON.stringify({})
	}
	fetch('/sequence', opts)
		.then(web.useJson)
		.then(web.sequenceSuccess)
		.catch(err => {
			console.error('Error getting /sequence');
			console.error(err);
		})
};
web.sequenceSuccess = function (res) {
	if (res.started && res.started != false) {
		STATE.sequence = true;
		document.getElementById('seq').focus();
		seqState(true);
	} else if (res.stopped) {
		STATE.sequence = false;
		document.getElementById('seq').blur();
		seqState(false);
		mobile.getState();
	}
};
web.reset = function () {
	const opts = {
		method : 'POST',
		headers : web._header,
		body : JSON.stringify({})
	}
	fetch('/reset', opts)
		.then(web.useJson)
		.then(setState)
		.catch(err => {
			console.error('Error posting to /reset');
			console.error(err);
		})
};
web.restart = function () {
	const opts = {
		method : 'POST',
		headers : web._header,
		body : JSON.stringify({})
	}
	fetch('/restart', opts)
		.then(web.useJson)
		.then(web.restartSuccess)
		.catch(err => {
			console.error('Error posting to /restart');
			console.error(err);
		})
};
web.restartSuccess = function (res) {
	console.dir(res)
};
web.update = function () {
	const opts = {
		method : 'POST',
		headers : web._header,
		body : JSON.stringify({})
	}
	fetch('/update', opts)
		.then(web.useJson)
		.then(web.updateSuccess)
		.catch(err => {
			console.error('Error posting to /update');
			console.error(err);
		})
};
web.updateSuccess = function (res) {
	console.dir(res)
};
web.useJson = function (res) {
	return res.json();
};
web.init = function () {
	window.frame = web.frame;
	window.getState = web.getState;
	window.setDir = web.setDir;
	window.setDelay = web.setDelay;
	window.setExposure = web.setExposure;
	window.setCounter = web.setCounter;
	window.sequence = web.sequence;
	window.reset = web.reset;
	window.restart = web.restart;
	window.update = web.update;
	console.log('started web')
};