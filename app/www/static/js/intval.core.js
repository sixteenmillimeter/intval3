'use strict';
const BOLEX = {
	angle : 133,
	prism : 0.8,
	expected : 630
};
const STATE = {
	dir : true,
	exposure : 630, //always ms
	delay : 0,
	scale : 'ms',
	delayScale : 'ms',
	counter : 0
};

//functions
window.frame = null;
window.getState = null;
window.setDir = null;
window.setExposure = null;
window.setDelay = null;
window.setCounter = null;

//ms
var shutter = function (exposure) {
	let fraction = BOLEX.expected / 1000;
	let speed;
	let corrected;
	let str;
	if (exposure > BOLEX.expected) {
		//if exposure is explicitly set
		fraction = exposure / 1000;
		speed = fraction;
	} else {
		speed = fraction * (BOLEX.angle / 360);
	}
	corrected = speed * BOLEX.prism;
	if (corrected < 1.0) {
		//less than a second
		str = '1/' + Math.round(Math.pow(corrected, -1)) + ' sec';
	}  else if (corrected >= 1.0 && corrected < 60) {
		//greater than a second, less than a minute
		str = '' + (Math.round(corrected * 10) / 10) + ' sec'
	} else if (corrected >= 60 && corrected < 60 * 60) {
		//greater than a minute, less than an hour
		str = '' + (Math.round(corrected / 6) / 10) + ' min';
	} else if (corrected >= 60 * 60 && corrected < 60 * 60 * 24) {
		//greater than an hour, less than a day
		str = '' + (Math.round(corrected / (6 * 60)) / 10) + ' hr';
	} else if (corrected >= 60 * 60 * 24) {
		//greater than a day
		str = '' + (Math.round(corrected / (6 * 60 * 24)) / 10) + ' day';
	}
	return { speed : speed, str : str }
};

var scaleAuto = function (ms) {
	if (ms < 1000) {
		return 'ms'
	} else if (ms >= 1000 && ms < 1000 * 60) {
		return 'sec'
	} else if (ms >= 1000 * 60 && ms < 1000 * 60 * 60) {
		return 'min'
	} else if (ms >= 1000 * 60 * 60) {
		return 'hour'
	}
};

var scaleTime = function (raw, scale) {
	if (scale === 'ms') {
		return raw
	} else if (scale === 'sec') {
		return raw * 1000;
	} else if (scale === 'min') {
		return raw * (1000 * 60);
	} else if (scale === 'hour') {
		return raw * (1000 * 60 * 60);
	}
};

var setExposureScale = function () {
	const scale = document.getElementById('scale').value;
	const elem = document.getElementById('exposure');
	if (scale === 'ms') {
		elem.value = STATE.exposure;
	} else if (scale === 'sec') {
		elem.value = STATE.exposure / 1000;
	} else if (scale === 'min') {
		elem.value = STATE.exposure / (1000 * 60);
	} else if (scale === 'hour') {
		elem.value = STATE.exposure / (1000 * 60 * 60);
	}
	STATE.scale = scale;
};

var setDelayScale = function () {
	const scale = document.getElementById('delayScale').value;
	const elem = document.getElementById('delay');
	if (scale === 'ms') {
		elem.value = STATE.delay;
	} else if (scale === 'sec') {
		elem.value = STATE.delay / 1000;
	} else if (scale === 'min') {
		elem.value = STATE.delay / (1000 * 60);
	} else if (scale === 'hour') {
		elem.value = STATE.delay / (1000 * 60 * 60);
	}
	STATE.delayScale = scale;
};

var setDirLabel = function (dir) {
	const bwdLabel = document.getElementById('bwdLabel');
	const fwdLabel = document.getElementById('fwdLabel');
	if (dir) {
		bwdLabel.classList.remove('selected')
		fwdLabel.classList.add('selected')
	} else {
		fwdLabel.classList.remove('selected')
		bwdLabel.classList.add('selected')
	}
};
var incCounter = function (val) {
	const elem = document.getElementById('counter');
	const current = elem.value;
	elem.value = (parseInt(current) + val);
	STATE.counter += val;
};
var forceCounter = function (val) {
	document.getElementById('counter').value = val;
}
var unsetPages = function () {
	const pages = document.querySelectorAll('.page');
	const icons = document.querySelectorAll('.icon');
	for (let icon of icons) {
		if (icon.classList.contains('selected')) icon.classList.remove('selected');
	};
	for (let page of pages){;
		if (page.classList.contains('selected')) page.classList.remove('selected');
	}

};

var setState = function (res) {
	let exposure;
	let exposureScale;
	let delayScale;
	
	if (res.frame.dir !== true) {
		document.getElementById('dir').checked = true;
		STATE.dir = res.frame.dir;
		setDirLabel(false);
	}
	document.getElementById('counter').value = res.counter;
	STATE.counter = res.counter;
	//Exposure
	if (res.frame.exposure === 0) {
		res.frame.exposure = BOLEX.expected;
	}
	STATE.exposure = res.frame.exposure;
	exposure = shutter(STATE.exposure);
	exposureScale = scaleAuto(STATE.exposure);

	document.getElementById('str').value = exposure.str;
	document.getElementById('scale').value = exposureScale;
	setExposureScale();

	STATE.delay = res.frame.delay;
	delayScale = scaleAuto(STATE.delay);
	document.getElementById('delayScale').value = delayScale;
	setDelayScale();
};
var appPage = function () {
	unsetPages();
	document.getElementById('app').classList.add('selected');
	document.getElementById('appIcon').classList.add('selected');
};
var settingsPage = function () {
	unsetPages();
	document.getElementById('settings').classList.add('selected');
	document.getElementById('settingsIcon').classList.add('selected');
};
var mscriptPage = function () {
	unsetPages();
	document.getElementById('mscript').classList.add('selected');
	document.getElementById('mscriptIcon').classList.add('selected');
	editor.cm.refresh();
};
var spinnerInit = function () {
	const spinnerOpts = {
		  lines: 13 // The number of lines to draw
		, length: 33 // The length of each line
		, width: 11 // The line thickness
		, radius: 30 // The radius of the inner circle
		, scale: 0.5 // Scales overall size of the spinner
		, corners: 1 // Corner roundness (0..1)
		, color: '#fff' // #rgb or #rrggbb or array of colors
		, opacity: 0.25 // Opacity of the lines
		, rotate: 0 // The rotation offset
		, direction: 1 // 1: clockwise, -1: counterclockwise
		, speed: 1 // Rounds per second
		, trail: 60 // Afterglow percentage
		, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
		, zIndex: 2e9 // The z-index (defaults to 2000000000)
		, className: 'spinner' // The CSS class to assign to the spinner
		, top: '50%' // Top position relative to parent
		, left: '50%' // Left position relative to parent
		, shadow: true // Whether to render a shadow
		, hwaccel: true // Whether to use hardware acceleration
		, position: 'relative' // Element positioning
	};
	const target = document.getElementById('spinner');
	const spinner = new Spinner(spinnerOpts).spin(target);
};
var spinnerShow = function () {
	const elem = document.getElementById('overlay');
	if (!elem.classList.contains('active')) {
		elem.classList.add('active');
	}
};
var spinnerHide = function () {
	const elem = document.getElementById('overlay');
	if (elem.classList.contains('active')) {
		elem.classList.remove('active');
	}
}
var isNumeric = function (n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
};