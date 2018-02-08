/* jshint esversion:6, strict:true, browser:true*/
/* global console, alert */


'use strict';
var mobile = {};

mobile.ble = {
	BLENO_DEVICE_NAME : 'intval3',
	DEVICE_ID : 'intval3',
	SERVICE_ID : '149582bd-d49d-4b5c-acd1-1ae503d09e7a',
	CHAR_ID : '47bf69fb-f62f-4ef8-9be8-eb727a54fae4', //general data
	WIFI_ID : '3fe7d9cf-7bd2-4ff0-97c5-ebe87288c2cc', //wifi only
	devices : [],
	device : {},
	connected : false,
	active : false
};

mobile.wifi = {
	current : 'null',
	available : [],
	ip : null
};

mobile.ble.scan = function () {
	spinnerShow();
	ble.scan([], 5, mobile.ble.onDiscover, mobile.ble.onError);
	mobile.ble.devices = [];
	setTimeout(() => {
		spinnerHide();
		if (!mobile.ble.connected) {
			alert('No INTVAL devices found.');
			settingsPage();
		}
	}, 5000);
};

mobile.ble.onDiscover = function (device) {
	if (device && device.name && device.name.indexOf('intval3') !== -1) {
		console.log('BLE - Discovered INTVAL');
		console.dir(device);
		mobile.ble.devices.push(device);
		if (!mobile.ble.connected) {
			mobile.ble.connect(device);
		}
	} else {
		//console.log(`BLE - Discovered Other ${device.id}`);
	}
};

mobile.ble.connect = function (device) {
	console.log(`BLE - Connecting to ${device.id}`);
	ble.connect(device.id, (peripheral) => {
		mobile.ble.onConnect(peripheral, device);
	}, mobile.ble.onError);
};

mobile.ble.onConnect = function (peripheral, device) {
	const elem = document.getElementById('bluetooth');
	const option = document.createElement('option');
	const disconnect = document.getElementById('disconnect');
	const scan = document.getElementById('scan');

	spinnerHide();
	console.log(`BLE - Connected to ${device.id}`);
	console.log(peripheral);
	console.dir(device);

	mobile.ble.device = device;
	mobile.ble.connected = true;

	elem.innerHTML = '';
	option.text = device.name;
	option.value = device.id;
	elem.add(option);

	disconnect.classList.add('active');
	scan.classList.remove('active');

	getState();
	mobile.getWifi();
};

mobile.ble.disconnect = function () {
	const elem = document.getElementById('bluetooth');
	const option = document.createElement('option');
	const disconnect = document.getElementById('disconnect');
	const scan = document.getElementById('scan');
	let device;
	if (!mobile.ble.connected) {
		console.warn('Not connected to any device');
		return false;
	}
	device = mobile.ble.device;
	console.log(`BLE - Disconnecting from ${device.id}`);
	ble.disconnect(device.id, mobile.ble.onDisconnect, mobile.ble.onDisconnect);

	elem.innerHTML = '';
	option.text = 'N/A';
	elem.add(option);

	disconnect.classList.remove('active');
	scan.classList.add('active');
};

mobile.ble.onDisconnect = function (res) {
	console.log(`BLE - Disconnected from ${res}`);
	mobile.ble.connected = false;
	mobile.ble.device = {};
};

mobile.ble.onError = function (err) {
	alert(JSON.stringify(err));
};

mobile.init = function () {
	const bleInputs = document.querySelectorAll('.ble');
	const bolIso = document.querySelector('.iso');
	const bolF = document.querySelector('.fstop');

	document.querySelector('body').classList.add('mobile');

	window.frame = mobile.frame;
	window.getState = mobile.getState;
	window.setDir = mobile.setDir;
	window.setExposure = mobile.setExposure;
	window.setDelay = mobile.setDelay;
	window.setCounter = mobile.setCounter;
	window.sequence = mobile.sequence;

	//show ble-specific fields in settings
	for (let i of bleInputs) {
		i.classList.add('active');
	}
	spinnerInit();
	mobile.ble.scan();
	mobile.cameraValues();

};

mobile.getState = function () {
	if (!mobile.ble.connected) {
		//returning here will prevent error alert
	}
	ble.read(mobile.ble.device.id,
			mobile.ble.SERVICE_ID,
			mobile.ble.CHAR_ID,
			mobile.stateSuccess,
			mobile.ble.onError);
};
mobile.stateSuccess = function (data) {
	let str = bytesToString(data);
	let res = JSON.parse(str);
	setState(res);
};

mobile.frame = function () {
	const opts = {
		type : 'frame'
	};
	if (!mobile.ble.connected) {
		return alert('Not connected to an INTVAL device.');
	}
	if (mobile.ble.active) {
		return false;
	}
	ble.write(mobile.ble.device.id,
			mobile.ble.SERVICE_ID,
			mobile.ble.CHAR_ID,
			stringToBytes(JSON.stringify(opts)), //check length?
			mobile.frameSuccess,
			mobile.ble.onError);
	document.getElementById('frame').classList.add('focus');
	mobile.ble.active = true;
};


mobile.frameSuccess = function () {
	if (STATE.exposure < 5000) {
		console.log('Frame finished, getting state.');
		mobile.ble.active = false;
		document.getElementById('frame').classList.remove('focus');
		mobile.getState();
	} else {
		setTimeout(() => {
			console.log('Frame finished, getting state.');
			mobile.ble.active = false;
			document.getElementById('frame').classList.remove('focus');
			mobile.getState();
		}, STATE.exposure + 500)
	}
}
mobile.setDir = function () {
	const opts = {
		type : 'dir',
		dir : !document.getElementById('dir').checked
	};

	ble.write(mobile.ble.device.id,
			mobile.ble.SERVICE_ID,
			mobile.ble.CHAR_ID,
			stringToBytes(JSON.stringify(opts)), //check length?
			mobile.dirSuccess,
			mobile.ble.onError);
};
mobile.dirSuccess = function () {
	console.log('Set direction');
	mobile.getState();
	setTimeout(() => {
		setDirLabel(STATE.dir);
	}, 50);
};
mobile.setExposure = function () {
	let exposure = document.getElementById('exposure').value;
	let scaledExposure;
	let opts = {
		type : 'exposure'
	};
	if (exposure === '' || exposure === null) {
		exposure = 0;
	}
	scaledExposure = scaleTime(exposure, STATE.scale);
	opts.exposure = scaledExposure;
	ble.write(mobile.ble.device.id,
			mobile.ble.SERVICE_ID,
			mobile.ble.CHAR_ID,
			stringToBytes(JSON.stringify(opts)), //check length?
			mobile.exposureSuccess,
			mobile.ble.onError);
};
mobile.exposureSuccess = function () {
	console.log('Set exposure');
	mobile.getState();
};

mobile.setDelay = function () {
	const delay = document.getElementById('delay').value;
	const scaledDelay = scaleTime(delay, STATE.delayScale);
	let opts = {
		type : 'delay',
		delay : scaledDelay
	};
	ble.write(mobile.ble.device.id,
			mobile.ble.SERVICE_ID,
			mobile.ble.CHAR_ID,
			stringToBytes(JSON.stringify(opts)), //check length?
			mobile.delaySuccess,
			mobile.ble.onError);
}

mobile.delaySuccess = function () {
	console.log('Set delay');
	mobile.getState();
};

mobile.setCounter = function () {
	const counter = document.getElementById('counter').value;
	const change = prompt(`Change counter value?`, counter);
	if (change === null || !isNumeric(change)) return false;
		let opts = {
		type : 'counter',
		counter : change
	};
	ble.write(mobile.ble.device.id,
		mobile.ble.SERVICE_ID,
		mobile.ble.CHAR_ID,
		stringToBytes(JSON.stringify(opts)), //check length?
		mobile.counterSuccess,
		mobile.ble.onError);
};

mobile.counterSuccess = function () {
	console.log('Set counter');
	mobile.getState();
};

mobile.sequence = function () {
	const opts = {
		type : 'sequence'
	};
	const elem = document.getElementById('seq');
	if (!mobile.ble.connected) {
		return alert('Not connected to an INTVAL3 device.');
	}
	ble.write(mobile.ble.device.id,
			mobile.ble.SERVICE_ID,
			mobile.ble.CHAR_ID,
			stringToBytes(JSON.stringify(opts)), //check length?
			mobile.sequenceSuccess,
			mobile.ble.onError);

	if (!elem.classList.contains('focus')) {
		elem.classList.add('focus');
	}

	mobile.ble.active = true;
};

mobile.sequenceSuccess = function () {
	console.log('Sequence state changed');
	mobile.getState();
	setTimeout(() => {
		if (STATE.sequence) {
			mobile.ble.active = true;
			seqState(true);
		} else {
			mobile.ble.active = false;
			seqState(false);
		}
	}, 20);
};


//retreive object with list of available Wifi APs,
//and state of current connection, if available 
mobile.getWifi = function () {
	spinnerShow();
	ble.read(mobile.ble.device.id,
			mobile.ble.SERVICE_ID,
			mobile.ble.WIFI_ID,
			mobile.getWifiSuccess,
			mobile.ble.onError);
};

mobile.getWifiSuccess = function (data) {
	const elem = document.getElementById('available');
	const wifi = document.getElementById('wifi');
	const password = document.getElementById('password');
	const ip = document.getElementById('ip');
	let option = document.createElement('option');
	let str = bytesToString(data);
	let res = JSON.parse(str);

	spinnerHide();
	elem.innerHTML = ''
	if (!res.available || res.available.length === 0) {
		if (elem.classList.contains('active')) {
			elem.classList.remove('active');
		}
		option.text = 'N/A'
		elem.add(option);
		elem.value = '';
	} else {
		for (let ap of res.available) {
			option = document.createElement('option');
			option.text = ap;
			option.value = ap;
			elem.add(option);
		}
		if (res.current && res.available.indexOf(res.current) !== -1) {
			elem.value = res.current
			if (!elem.classList.contains('active')) {
				elem.classList.add('active');
			}
			if (wifi.classList.contains('active')) {
				wifi.classList.remove('active');
			}
			if (password.classList.contains('active')) {
				password.classList.remove('active');
			}
		} else {
			if (!wifi.classList.contains('active')) {
				wifi.classList.add('active');
			}
			if (!password.classList.contains('active')) {
				password.classList.add('active');
			}
		}
	}
	if (typeof res.ip !== 'undefined' && res.ip != null ) {
		ip.innerHTML = `Local IP: <span onclick="window.open('http://${res.ip}', '_system', 'location=yes');">${res.ip}</span>`
		if (!ip.classList.contains('active')) {
			ip.classList.add('active');
		}
	} else {
		ip.innerHTML = 'Local IP: null'
		if (ip.classList.contains('active')) {
			ip.classList.remove('active');
		}
	}
	mobile.wifi.current = res.current;
	mobile.wifi.available = res.available;
	mobile.wifi.ip = res.ip;
};

mobile.editWifi = function () {
	const available = document.getElementById('available');
	const wifi = document.getElementById('wifi');
	const password = document.getElementById('password');
	if (!wifi.classList.contains('active')) {
		wifi.classList.add('active');
	}
	if (!password.classList.contains('active')) {
		password.classList.add('active');
	}
	password.focus();
	if (available.value !== mobile.wifi.current && available.classList.contains('active')) {
		available.classList.remove('active');
	}
};

mobile.setWifi = function () {
	const ssid = document.getElementById('available').value;
	const pwd = document.getElementById('password').value;
	const opts = {
		ssid : ssid,
		pwd : pwd
	}
	spinnerShow();
	if (ssid === '' || ssid === null || ssid === undefined) {
		return alert('Cannot set wireless credentials with a blank SSID');
	}
	if (pwd === '' || pwd === null || pwd === undefined) {
		return alert('Cannot set wireless credentials with a blank passphrase');
	}
	if (pwd.length < 8 || pwd.length > 63) {
		return alert('Passphrase must be 8..63 characters');
	}
	ble.write(mobile.ble.device.id,
		mobile.ble.SERVICE_ID,
		mobile.ble.WIFI_ID,
		stringToBytes(JSON.stringify(opts)),
		mobile.setWifiSuccess,
		mobile.ble.onError);
};

mobile.setWifiSuccess = function () {
	spinnerHide();
	console.log('Set new wifi credentials');
	setTimeout(mobile.getWifi, 100);
};
mobile.exif = {}

mobile.getCamera = function () {
	const opts = {
		quality: 30,
		sourceType: Camera.PictureSourceType.CAMERA,
    	destinationType: Camera.DestinationType.FILE_URI
	};
	navigator.camera.getPicture(mobile.cameraSuccess, mobile.cameraError, opts);
};
mobile.cameraSuccess = function (result) {
	const thisResult = JSON.parse(result);
	const metadata = JSON.parse(thisResult.json_metadata);
	
	mobile.cameraExposure(metadata.Exif);
};
mobile.cameraError = function (err) {
	console.error(err);
	alert(err);
};

mobile.cameraExposure = function (exif) {
	const cam_exp = document.getElementById('cam_exp');
	const cam_f = document.getElementById('cam_f');
	const cam_iso = document.getElementById('cam_iso');
	const bol_exp = document.getElementById('bol_exp');
	const bol_f = document.getElementById('bol_f');
	const bol_iso = document.getElementById('bol_iso');
	const bol_f_diff = document.getElementById('bol_f_diff');
	const bol_iso_diff = document.getElementById('bol_iso_diff');
	const bol_exp_diff = document.getElementById('bol_exp_diff');

	const fstop = 	BOLEX.fstop || 5.6;
	const iso = 	BOLEX.iso 	|| 100;
	const prism = 	BOLEX.prism	|| 0.8;

	const cFstop = exif.ApertureValue || exif.FNumber;
	const cExposure = exif.ExposureTime * 1000;
	const cIso = exif.ISOSpeedRatings[0];

	//convert fstop to "fnumber", an absolute scale where stops are scaled to 1.0
	const f = fnumber(cFstop);
	const target = fnumber(fstop); //bolex

	let exposure = cExposure;
	let isoStops = 0;
	let fStops = 0;
	let expDiff;

	let scale_elem;
	let exposure_elem;

	let proceed;
	let e1;
	let e2;

	mobile.exif = exif;

	//Determine if fstop of phone camera "f"
	if (target !== f) {
		fStops = f - target;
		exposure = exposure / Math.pow(2, fStops);
	}
	
	if (cIso != iso) {
		isoStops = (Math.log(cIso) / Math.log(2)) - (Math.log(iso) / Math.log(2));
	}

	//Double or halve exposure based on the differences in ISO stops
	exposure = exposure * Math.pow(2, isoStops);

	//Compensate for Bolex prism
	exposure = exposure * Math.pow(2, prism);

	exposure = Math.round(exposure) //round to nearest millisecond
	
	bol_f.value = fstop;
	bol_iso.value = iso;
	bol_exp.value = exposure;

	//Total difference in exposure from phone camera to Bolex
	expDiff = (Math.log(exposure) / Math.log(2)) - (Math.log(cExposure) / Math.log(2));

	bol_exp_diff.innerHTML = floatDisplay(expDiff);
	bol_iso_diff.innerHTML = floatDisplay(isoStops);
	bol_f_diff.innerHTML = floatDisplay(-fStops);

	cam_exp.value = cExposure;
	cam_f.value = cFstop;
	cam_iso.value = cIso;

	if (exposure > 500) {
		proceed = confirm(`Set camera exposure to ${exposure}ms to match photo.`);
	}

	if (proceed && exposure > 500) {
		e1 = new Event('change');
		e2 = new Event('change');

		scale_elem = document.getElementById('scale');
		exposure_elem = document.getElementById('exposure');

		scale_elem.value = 'ms';
		scale_elem.dispatchEvent(e1);

		exposure_elem.value = exposure;
		exposure_elem.dispatchEvent(e2);
	}

	/*
{
	"Exif": {
		"DateTimeOriginal": "2018:02:02 16:59:13",
		"ExposureBiasValue": 0,
		"SensingMethod": 2,
		"BrightnessValue": -0.9969016228800144,
		"LensMake": "Apple",
		"FNumber": 1.8,
		"FocalLength": 3.99,
		"ShutterSpeedValue": 2.049355412374274,
		"SceneType": 1,
		"ApertureValue": 1.6959938131099002,
		"SubjectArea": [
			2015,
			1511,
			2217,
			1330
		],
		"ColorSpace": 65535,
		"LensSpecification": [
			3.99,
			3.99,
			1.8,
			1.8
		],
		"PixelYDimension": 3024,
		"WhiteBalance": 0,
		"DateTimeDigitized": "2018:02:02 16:59:13",
		"ExposureMode": 0,
		"ISOSpeedRatings": [
			100
		],
		"PixelXDimension": 4032,
		"LensModel": "iPhone 8 back camera 3.99mm f/1.8",
		"ExposureTime": 0.25,
		"Flash": 24,
		"SubsecTimeDigitized": "209",
		"SubsecTimeOriginal": "209",
		"ExposureProgram": 2,
		"FocalLenIn35mmFilm": 28,
		"MeteringMode": 5
	}
}
	*/
};

mobile.refreshExposure = function () {
	if (typeof mobile.exif.ExposureTime !== 'undefined') {
		mobile.cameraExposure(mobile.exif);
	}
};

mobile.EV = function (fstop, shutter) {
	const sec = shutter / 1000; //shutter in ms => seconds
	const square = Math.pow(fstop, 2);
	return Math.log(square / sec);
};

mobile.reset = function () {
	const reset = confirm(`Reset INTVAL3 to default settings and clear counter?`);
	if (!reset) return false;
	let opts = {
		type : 'reset'
	};
	ble.write(mobile.ble.device.id,
		mobile.ble.SERVICE_ID,
		mobile.ble.CHAR_ID,
		stringToBytes(JSON.stringify(opts)),
		mobile.resetSuccess,
		mobile.ble.onError);
};

mobile.resetSuccess = function () {
	console.log('Reset to default settings');
	mobile.getState();
};

mobile.update = function () {
	const reset = confirm(`Check for updates? You will be disconnected from the INTVAL3 during this process.`);
	if (!reset) return false;
	let opts = {
		type : 'reset'
	};
	ble.write(mobile.ble.device.id,
		mobile.ble.SERVICE_ID,
		mobile.ble.CHAR_ID,
		stringToBytes(JSON.stringify(opts)),
		mobile.updateSuccess,
		mobile.ble.onError);
};

mobile.updateSuccess = function () {
	alert()
};

mobile.restart = function () {}

/** 
 *  Mobile helper functions
 */

function bytesToString (buffer) {
	return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

function stringToBytes(string) {
	var array = new Uint8Array(string.length);
	for (var i = 0, l = string.length; i < l; i++) {
		array[i] = string.charCodeAt(i);
	}
	return array.buffer;
}

function fnumber (fstop) {
	return Math.log(fstop) / Math.log(Math.sqrt(2));
}

function floatDisplay (value) {
	let str = value + '';
	const period = str.indexOf('.');
	if (period === -1) {
		str = str + '.0';
	} else {
		str = roundTenth(value) + '';
	}
	if (value < 0) {
		str = `<span class="neg">${(str + '')}</span>`;
	} else if (value > 0) {
		str = `<span class="pos">+${(str + '')}</span>`;
	}
	return str;
}

function roundTenth (value) {
	return Math.round((value * 10) / 10)
}

