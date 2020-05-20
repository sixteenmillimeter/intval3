'use strict';
const BOLEX = {
	angle : 133,
	prism : 0.8,
	iso : 100,
	fstop : 5.6,
	expected : 530
};
const STATE = {
	dir : true,
	exposure : 530, //always ms
	delay : 0,
	scale : 'ms',
	delayScale : 'ms',
	counter : 0,
	sequence : false,
	advanced : 0
};

//functions
window.frame = null;
window.getState = null;
window.setDir = null;
window.setExposure = null;
window.setDelay = null;
window.setCounter = null;
window.sequence = null;
window.reset = null;
window.restart = null;
window.update = null;
window.advanced = null;

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
	const but = document.getElementById('frame');
	if (dir) {
		bwdLabel.classList.remove('selected');
		fwdLabel.classList.add('selected');
		but.innerHTML = '+1 FRAME';
	} else {
		fwdLabel.classList.remove('selected');
		bwdLabel.classList.add('selected');
		but.innerHTML = '-1 FRAME';
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
	} else {
		document.getElementById('dir').checked = false;
		STATE.dir = res.frame.dir;
		setDirLabel(true);
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

	document.getElementById('str').innerHTML = exposure.str;
	document.getElementById('scale').value = exposureScale;
	setExposureScale();

	STATE.delay = res.frame.delay;
	delayScale = scaleAuto(STATE.delay);
	document.getElementById('delayScale').value = delayScale;
	setDelayScale();

	calcStats();

	if (res.sequence == true) {
		if (mobile.ble) mobile.ble.active = true;
		if (pwa.wble) pwa.wble.active = true;
		seqState(true);
	} else {
		if (mobile.ble) mobile.ble.active = false;
		if (pwa.wble) pwa.wble.active = false;
		seqState(false);
	}
};

var seqState = function (state) {
	const elem = document.getElementById('seq');
	const advancedElem = document.getElementById('run');

	if (state) {
		if (!elem.classList.contains('focus')) {
			elem.classList.add('focus');
		}
		if (!advancedElem.classList.contains('focus')) {
			advancedElem.classList.add('focus');
		}
		elem.innerHTML = 'STOP SEQUENCE';
		advancedElem.innerHTML = 'STOP';
		STATE.sequence = true;
	} else {
		if (elem.classList.contains('focus')) {
			elem.classList.remove('focus');
		}
		if (advancedElem.classList.contains('focus')) {
			advancedElem.classList.remove('focus');
		}
		elem.innerHTML = 'START SEQUENCE';
		advancedElem.innerHTML = 'RUN';
		STATE.sequence = false;
	}
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
var cameraPage = function () {
	unsetPages();
	document.getElementById('camera').classList.add('selected');
	document.getElementById('cameraIcon').classList.add('selected');
};
var advancedPage = function () {
	unsetPages();
	document.getElementById('advanced').classList.add('selected');
	document.getElementById('advancedIcon').classList.add('selected');
};

var isNumeric = function (n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
};

var calcStats = function () {
	const extraFwd = BOLEX.expected;
	const extraBwd = BOLEX.expected + 150;
	const total = parseInt(document.getElementById('len').value);
	const multiple = parseInt(document.getElementById('multiple').value);
	const filmTime = (total * multiple) / 24;
	const delays = total - 1;
	const frameEnd = STATE.counter + (STATE.dir ? total * multiple : -total * multiple);

	let exp;
	let realTime;
	let realTimePartial;
	let realTimeDisplay;
	let filmTimeDisplay;

	if (STATE.exposure > BOLEX.expected) {
		exp = STATE.exposure + (STATE.dir ? extraFwd : extraBwd);
	} else {
		exp = BOLEX.expected;
	}
	realTime = (exp * total * multiple) + (delays * STATE.delay);

	STATE.advanced = realTime;

	if (realTime < 60 * 1000) { //1min
		realTimeDisplay = Math.floor(realTime * 100) / 100000;
		realTimeDisplay += ' sec';
	} else if (realTime >= 60 * 1000 && realTime < 60 * 60 * 1000) {   //1hr
		realTimePartial = Math.floor(realTime * 100) / (60 * 100000);
		realTimeDisplay = Math.floor(realTimePartial);
		realTimeDisplay += ' min';
		if (realTimePartial > Math.floor(realTimePartial)) {
			realTimeDisplay += ' ' + Math.round((realTimePartial - Math.floor(realTimePartial) ) * 60);
			realTimeDisplay += ' sec'
		}
	} else if (realTime >= 60 * 60 * 1000 && realTime < 24 * 60 * 60 * 1000) { //1day
		realTimePartial = Math.floor(realTime * 100) / (60 * 60 * 100000);
		realTimeDisplay = Math.floor(realTimePartial);
		realTimeDisplay += ' hr';
		if (realTimePartial > Math.floor(realTimePartial)) {
			realTimeDisplay += ' ' + Math.round((realTimePartial - Math.floor(realTimePartial) ) * 60);
			realTimeDisplay += ' min'
		}
	} else if (realTime >= 24 * 60 * 60 * 1000 && realTime < 24 * 60 * 60 * 1000) { //1day
		realTimePartial = Math.floor(realTime * 100) / (60 * 60 * 100000);
		realTimeDisplay = Math.floor(realTimePartial);
		realTimeDisplay += ' day';
		if (realTimePartial > Math.floor(realTimePartial)) {
			realTimeDisplay += ' ' + Math.round((realTimePartial - Math.floor(realTimePartial) ) * 24);
			realTimeDisplay += ' hr'
		}
	}

	if (filmTime < 60 * 1000) { //1min
		filmTimeDisplay = Math.floor(filmTime * 100) / 100;
		filmTimeDisplay += ' sec';
	} else if (filmTime >= 60 * 1000) {  
		filmTimePartial = Math.floor(filmTime * 100) / (60 * 100000);
		filmTimeDisplay = Math.floor(filmTimePartial);
		filmTimeDisplay += ' min';
		if (filmTimePartial > Math.floor(filmTimePartial)) {
			filmTimeDisplay += ' ' + Math.round((filmTimePartial - Math.floor(filmTimePartial) ) * 60);
			filmTimeDisplay += ' sec'
		}
	}

	document.getElementById('realTime').innerHTML = realTimeDisplay;
	document.getElementById('filmTime').innerHTML = filmTimeDisplay;
	document.getElementById('frameEnd').innerHTML = frameEnd;
};

var seqProgress = function () {
	console.log('sequence progress')
	const extraFwd = BOLEX.expected;
	const extraBwd = BOLEX.expected + 150;
	const loops = parseInt(document.getElementById('len').value);
	const multiple = parseInt(document.getElementById('multiple').value);
	const progressElem = document.getElementById('progress');
	const total = loops * multiple;
	let delay = 0;

	let exp;

	if (STATE.exposure > BOLEX.expected) {
		exp = STATE.exposure + (STATE.dir ? extraFwd : extraBwd);
	} else {
		exp = BOLEX.expected;
	}

	if (!progressElem.classList.contains('active')) {
		progressElem.classList.add('active');
	}
	
	for (let x = 0; x < loops; x++) {
		for (let y = 0; y < multiple; y++) {
			let progress = ((x * multiple) + y + 1) / total;
			let time = (((x * multiple) + y) * exp) + delay;
			setTimeout(() => {
				//console.log(progress);
				document.getElementById('progressVal').style = `width: ${progress * 100}%;`;
				document.getElementById('progressText').innerHTML = `${Math.round(progress * 100)}%`;
			}, time);
		}
		delay += STATE.delay;
	}
	setTimeout(() => {
		//console.log(progress);
		document.getElementById('progressVal').style = `width: 100%;`;
		document.getElementById('progressText').innerHTML = `100%`;

	}, (exp * total) + ((loops - 1) * STATE.delay));
}

var UI = {};

UI.overlay = {
	elem : document.getElementById('overlay')
}
UI.overlay.show = function () {
	if (!UI.overlay.elem.classList.contains('active')) {
		UI.overlay.elem.classList.add('active');
	}
};
UI.overlay.hide = function () {
	if (UI.overlay.elem.classList.contains('active')) {
		UI.overlay.elem.classList.remove('active');
	}
};
UI.spinner = {
	elem : document.getElementById('spinner')
}
UI.spinner.opts = {
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
UI.spinner.init = function () {
	const spinner = new Spinner(UI.spinner.opts).spin(UI.spinner.elem);
};
UI.spinner.show = function (text) {
	if (!UI.spinner.elem.classList.contains('active')) {
		UI.spinner.elem.classList.add('active');
	}
	if (text) {
		UI.message.show(text)
	}
};
UI.spinner.hide = function () {
	if (UI.spinner.elem.classList.contains('active')) {
		UI.spinner.elem.classList.remove('active');
	}

};
UI.message = {
	elem : document.getElementById('msg')
};
UI.message.show = function (text) {
	UI.message.elem.innerHTML = text
	if (!UI.message.elem.classList.contains('active')) {
		UI.message.elem.classList.add('active');
	}
};
UI.message.hide = function () {
	if (UI.message.elem.classList.contains('active')) {
		UI.message.elem.classList.remove('active');
	}
};

var init = function () {
	document.querySelector('.angle').oninput = function () {
		BOLEX.angle = parseInt(this.value);
	};
	document.querySelector('.iso').oninput = function () {
		BOLEX.iso = parseInt(this.value);
	};
	document.querySelector('.fstop').oninput = function () {
		BOLEX.fstop = parseFloat(this.value);
	};
	document.getElementById('len').oninput = calcStats;
	document.getElementById('multiple').oninput = calcStats;
};