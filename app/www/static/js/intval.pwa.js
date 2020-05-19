/* jshint esversion:6, strict:true, browser:true*/
/* global console, alert */


'use strict';
var pwa = {};

pwa.wble = {
	BLENO_DEVICE_NAME : 'intval3',
	DEVICE_ID : 'intval3',
	SERVICE_ID : '149582bd-d49d-4b5c-acd1-1ae503d09e7a',
	CHAR_ID : '47bf69fb-f62f-4ef8-9be8-eb727a54fae4', //general data
	WIFI_ID : '3fe7d9cf-7bd2-4ff0-97c5-ebe87288c2cc', //wifi only
	devices : [],
	device : {},
	peripheral : {},
	service : {},
	characteristics : {},
	descriptors : {},
	connected : false,
	active : false
};

pwa.wifi = {
	current : 'null',
	available : [],
	ip : null
};

async function delay (ms) {
	return new Promise((resolve, reject) => {
		return setTimeout(resolve, ms);
	})
}

pwa.wble.scan = async function () {
	let device;
	UI.spinner.show('Scanning for INTVAL3...');
	UI.overlay.show();
	document.getElementById('tap').style.display = 'none';

	pwa.wble.devices = [];
	
	try {
		device = await navigator.bluetooth.requestDevice({
			filters: [{
				name : pwa.wble.DEVICE_ID
			}],
			optionalServices: [ pwa.wble.SERVICE_ID ]
		});
	} catch (err) {
		console.error(err);
		pwa.wble.onError(err.message);
	}
	
	if (device) {
		pwa.wble.onDiscover(device);
	}

	await delay(5000);

	UI.spinner.hide();
	UI.overlay.hide();

	if (!pwa.wble.connected) {
		pwa.alert('No devices found.')
		settingsPage();
	}
};

pwa.wble.onDiscover = function (device) {
	if (device && device.name && device.name.indexOf('intval3') !== -1) {
		console.log('BLE - Discovered INTVAL3');
		//console.dir(device);
		pwa.wble.devices.push(device);
		if (!pwa.wble.connected) {
			pwa.wble.connect(device);
		}
	} else {
		//console.log(`BLE - Discovered Other ${device.id}`);
	}
};

pwa.wble.connect = async function (device) {
	console.log(`BLE - Connecting to ${device.id}`);
	let peripheral;
	let service;

	try {
		peripheral = await device.gatt.connect();
	} catch (err) {
		pwa.wble.onError(err);
	}
	try {
		service = await peripheral.getPrimaryService(pwa.wble.SERVICE_ID);
	} catch (err) {
		console.error(err);
		pwa.wble.onError(err.message);
		return false;
	}
	
	pwa.wble.onConnect(peripheral, device, service);
};

pwa.wble.onConnect = function (peripheral, device, service) {
	const elem = document.getElementById('bluetooth');
	const option = document.createElement('option');
	const disconnect = document.getElementById('disconnect');
	const scan = document.getElementById('scan');

	UI.spinner.hide();
	UI.overlay.hide();

	console.log(`BLE - Connected to ${device.id}`);
	//console.dir(peripheral);
	//console.dir(device);

	pwa.wble.peripheral = peripheral;
	pwa.wble.device = device;
	pwa.wble.service = service;
	pwa.wble.connected = true;

	elem.innerHTML = '';
	option.text = device.name;
	option.value = device.id;
	elem.add(option);

	disconnect.classList.add('active');
	scan.classList.remove('active');

	getState();
	getWifi();
};

pwa.wble.disconnect = function () {
	const elem = document.getElementById('bluetooth');
	const option = document.createElement('option');
	const disconnect = document.getElementById('disconnect');
	const scan = document.getElementById('scan');
	let device;
	if (!pwa.wble.connected) {
		console.warn('Not connected to any device');
		return false;
	}
	device = pwa.wble.device;
	console.log(`BLE - Disconnecting from ${device.id}`);
	//ble.disconnect(device.id, pwa.wble.onDisconnect, pwa.wble.onDisconnect);

	elem.innerHTML = '';
	option.text = 'N/A';
	elem.add(option);

	disconnect.classList.remove('active');
	scan.classList.add('active');
	UI.spinner.hide();
	UI.overlay.hide();
};

pwa.wble.onDisconnect = function (res) {
	console.log(`BLE - Disconnected from ${res}`);
	pwa.wble.connected = false;
	pwa.wble.device = {};
};

pwa.wble.onError = function (err) {
	if (err.errorMessage && err.errorMessage === 'Peripheral Disconnected') {
		console.log('Device disconnected');
		pwa.wble.disconnect()
	} else {
		pwa.alert(JSON.stringify(err));
	}
};

pwa.wble.read = async function (characteristicId) {
	const decoder = new TextDecoder('utf-8');
	let characteristic;
	let value;
	let json;
	let obj;

	if (typeof pwa.wble.characteristics[characteristicId] === 'undefined') {
		try {
			characteristic = await pwa.wble.service.getCharacteristic(characteristicId);
			pwa.wble.characteristics[characteristicId] = characteristic;
		} catch (err) {
			console.error(err);
			pwa.wble.onError(err.message);
			return false;
		}
	} else {
		characteristic = pwa.wble.characteristics[characteristicId]
	}

	try {
		value = await characteristic.readValue();
	} catch (err) {
		console.error(err);
		pwa.wble.onError(err.message);
	}

	json = decoder.decode(value);

	try {
		obj = JSON.parse(json);
	} catch (err) {
		console.warn(json);
		throw err;
	}

	return obj;
}

pwa.wble.write = async function ( characteristicId, json) {
	const encoder = new TextEncoder('utf-8');
	let characteristic;
	let value;

	if (typeof pwa.wble.characteristics[characteristicId] === 'undefined') {
		try {
			characteristic = await pwa.wble.service.getCharacteristic(characteristicId);
			pwa.wble.charactersitics[characteristicId] = characteristic;
		} catch (err) {
			console.error(err);
			pwa.wble.onError(err.message);
			return false;
		}
	} else {
		characteristic = pwa.wble.characteristics[characteristicId];
	}

	value = JSON.stringify(json);
	encoder.encode(value);

	try {
		await characteristic.writeValue(encoder.encode(value))
	} catch (err) {
		console.error(err);
		pwa.wble.onError(err.message);
		return false;
	}

	return true;
}

pwa.init = function () {
	const bleInputs = document.querySelectorAll('.ble');
	const bolIso = document.querySelector('.iso');
	const bolF = document.querySelector('.fstop');
	const tap = document.getElementById('tap');

	//document.querySelector('body').classList.add('mobile');

	window.frame = pwa.frame;
	window.getState = pwa.getState;
	window.setDir = pwa.setDir;
	window.setExposure = pwa.setExposure;
	window.setDelay = pwa.setDelay;
	window.setCounter = pwa.setCounter;
	window.sequence = pwa.sequence;
	window.reset = pwa.reset;
	window.restart = pwa.restart;
	window.update = pwa.update;
	window.getWifi = pwa.getWifi;
	window.setWifi = pwa.setWifi;
	window.editWifi = pwa.editWifi;
	window.advanced = pwa.advanced;

	//show ble-specific fields in settings
	for (let i of bleInputs) {
		i.classList.add('active');
	}
	UI.spinner.init();
	UI.overlay.show();

	tap.onclick = pwa.wble.scan;
	tap.style.display = 'block';
	//pwa.cameraValues();

};

pwa.pairInteraction = function () {
	pwa.wble.scan();
}

pwa.getState = async function () {
	let state;
	if (!pwa.wble.connected) {
		return false
	}
	try {
		state = await pwa.wble.read(pwa.wble.CHAR_ID);
	} catch (err) {
		console.error(err);
		pwa.wble.onError(err.message);
		return false;
	}
	setState(state);
};

pwa.frame = async function () {
	const opts = {
		type : 'frame'
	};
	if (!pwa.wble.connected) {
		return pwa.alert('Not connected to an INTVAL3 device.');
	}
	if (pwa.wble.active) {
		return false;
	}

	document.getElementById('frame').classList.add('focus');
	pwa.wble.active = true;
	
	try {
		await pwa.wble.write(pwa.wble.CHAR_ID, opts);
	} catch (err) {
		console.error(err);
		pwa.wble.onError(err.message);
		return false;``
	}

	pwa.frameSuccess();
};


pwa.frameSuccess = function () {
	if (STATE.exposure < 5000) {
		console.log('Frame finished, getting state.');
		pwa.wble.active = false;
		document.getElementById('frame').classList.remove('focus');
		pwa.getState();
	} else {
		setTimeout(() => {
			console.log('Frame finished, getting state.');
			pwa.wble.active = false;
			document.getElementById('frame').classList.remove('focus');
			pwa.getState();
		}, STATE.exposure + 500)
	}
}
pwa.setDir = async function () {
	const opts = {
		type : 'dir',
		dir : !document.getElementById('dir').checked
	};

	try {
		await pwa.wble.write(pwa.wble.CHAR_ID, opts);
	} catch (err) {
		console.error(err);
		pwa.wble.onError(err.message);
		return false;
	}

	pwa.dirSuccess();
};
pwa.dirSuccess = function () {
	console.log('Set direction');
	pwa.getState();
	setTimeout(() => {
		setDirLabel(STATE.dir);
	}, 50);
};

pwa.setExposure = async function () {
	const opts = {
		type : 'exposure'
	};
	let exposure = document.getElementById('exposure').value;
	let scaledExposure;
	if (exposure === '' || exposure === null) {
		exposure = 0;
	}
	scaledExposure = scaleTime(exposure, STATE.scale);
	opts.exposure = scaledExposure;
	
	try {
		await pwa.wble.write(pwa.wble.CHAR_ID, opts);
	} catch (err) {
		console.error(err);
		pwa.wble.onError(err.message);
		return false;
	}
	pwa.exposureSuccess();
};

pwa.exposureSuccess = function () {
	console.log('Set exposure');
	pwa.getState();
};

pwa.setDelay = async function () {
	const delay = document.getElementById('delay').value;
	const scaledDelay = scaleTime(delay, STATE.delayScale);
	const opts = {
		type : 'delay',
		delay : scaledDelay
	};
	
	try {
		await pwa.wble.write(pwa.wble.CHAR_ID, opts);
	} catch (err) {
		console.error(err);
		pwa.wble.onError(err.message);
		return false;
	}

	pwa.delaySuccess();
}

pwa.delaySuccess = function () {
	console.log('Set delay');
	pwa.getState();
};

pwa.setCounter = async function () {
	const opts = {
		type : 'counter',
		counter : null
	};
	const counter = document.getElementById('counter').value;
	const change = prompt(`Change counter value?`, counter);

	if (change === null || !isNumeric(change)) return false;

	if (change === counter) return true;

	opts.counter = change;
	try {
		await pwa.wble.write(pwa.wble.CHAR_ID, opts);
	} catch (err) {
		console.error(err);
		pwa.wble.onError(err.message);
		return false;
	}
	pwa.counterSuccess();
		
};

pwa.counterSuccess = function () {
	console.log('Set counter');
	pwa.getState();
};

pwa.sequence = async function () {
	const opts = {
		type : 'sequence'
	};
	const elem = document.getElementById('seq');
	if (!pwa.wble.connected) {
		return pwa.alert('Not connected to an INTVAL3 device.');
	}
	try {
		await pwa.wble.write(pwa.wble.CHAR_ID, opts);
	} catch (err) {
		console.error(err);
		pwa.wble.onError(err.message);
		return false;
	}

	pwa.sequenceSuccess();

	if (!elem.classList.contains('focus')) {
		elem.classList.add('focus');
	}

	pwa.wble.active = true;
};

pwa.sequenceSuccess = function () {
	console.log('Sequence state changed');
	pwa.getState();
	setTimeout(() => {
		if (STATE.sequence) {
			pwa.wble.active = true;
			seqState(true);
		} else {
			pwa.wble.active = false;
			seqState(false);
		}
	}, 20);
};


pwa.advanced = async function () {
	const len = parseInt(document.getElementById('len').value);
	const multiple = parseInt(document.getElementById('multiple').value);
	const opts = {
		type : 'sequence',
		len,
		multiple
	};
	
	if (!opts.len) {
		return pwa.alert('You must set a total frame count.');
	}

	if (!opts.multiple) {
		return pwa.alert('You must set a frame multiple value.');
	}
	const elem = document.getElementById('run');
	if (!pwa.wble.connected) {
		return pwa.alert('Not connected to an INTVAL3 device.');
	}
	try {
		await pwa.wble.write(pwa.wble.CHAR_ID, opts);
	} catch (err) {
		console.error(err);
		pwa.wble.onError(err.message);
		return false;
	}

	pwa.advancedSuccess();

	if (!elem.classList.contains('focus')) {
		elem.classList.add('focus');
	}

	pwa.wble.active = true;
};

pwa.advancedSuccess = function () {
	console.log('Sequence state changed');
	pwa.getState();
	setTimeout(() => {
		if (STATE.sequence) {
			seqState(true);
		} else {
			seqState(false);
		}
		document.getElementById('seq').blur();
	}, 42);
	setTimeout(() => {
		console.log('Sequence complete');
		getState();
		setTimeout(() => {
			if (STATE.sequence) {
				seqState(true);
			} else {
				seqState(false);
			}
		}, 42);
	}, STATE.advanced + 1000);
};

//retreive object with list of available Wifi APs,
//and state of current connection, if available 
pwa.getWifi = async function () {
	let wifiRes;
	UI.spinner.show('Refreshing WIFI...');
	UI.overlay.show();
	
	try {
		wifiRes = await pwa.wble.read(pwa.wble.WIFI_ID);
	} catch (err) {
		console.error(err);
		pwa.wble.onError(err.message);
		return false
	}

	pwa.getWifiSuccess(wifiRes);
};

pwa.getWifiSuccess = function (res) {
	const elem = document.getElementById('available');
	const wifi = document.getElementById('wifi');
	const password = document.getElementById('password');
	const ip = document.getElementById('ip');
	let option = document.createElement('option');

	UI.spinner.hide();
	UI.overlay.hide();
	elem.innerHTML = '';
	console.dir(res);
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
	pwa.wifi.current = res.current;
	pwa.wifi.available = res.available;
	pwa.wifi.ip = res.ip;
};

pwa.editWifi = function () {
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
	if (available.value !== pwa.wifi.current && available.classList.contains('active')) {
		available.classList.remove('active');
	}
};

pwa.setWifi = async function () {
	const ssid = document.getElementById('available').value;
	const pwd = document.getElementById('password').value;
	const opts = {
		ssid : ssid,
		pwd : pwd
	};
	UI.spinner.show('Setting WIFI...');
	UI.overlay.show();
	
	if (ssid === '' || ssid === null || ssid === undefined) {
		return pwa.alert('Cannot set wireless credentials with a blank SSID');
	}
	if (pwd === '' || pwd === null || pwd === undefined) {
		return pwa.alert('Cannot set wireless credentials with a blank passphrase');
	}
	if (pwd.length < 8 || pwd.length > 63) {
		return pwa.alert('Passphrase must be 8..63 characters');
	}
	try {
		await pwa.wble.write(pwa.wble.WIFI_ID, opts);
	} catch (err) {
		console.error(err);
		pwa.wble.onError(err.message);
		return false;
	}
	pwa.setWifiSuccess();
};

pwa.setWifiSuccess = function () {
	UI.spinner.hide();
	UI.overlay.hide();
	console.log('Set new wifi credentials');
	setTimeout(pwa.getWifi, 100);
};
/*
pwa.exif = {}

pwa.getCamera = function () {
	const opts = {
		quality: 30,
		sourceType: Camera.PictureSourceType.CAMERA,
    	destinationType: Camera.DestinationType.FILE_URI
	};
	navigator.camera.getPicture(pwa.cameraSuccess, pwa.cameraError, opts);
};
pwa.cameraSuccess = function (result) {
	const thisResult = JSON.parse(result);
	const metadata = JSON.parse(thisResult.json_metadata);
	
	pwa.cameraExposure(metadata.Exif);
};
pwa.cameraError = function (err) {
	console.error(err);
	pwa.alert(JSON.stringify(err));
};

pwa.cameraExposure = function (exif) {
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

	pwa.exif = exif;

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

	function exposureConfirm (index) {
		if (index === 1) {
			e1 = new Event('change');
			e2 = new Event('change');

			scale_elem = document.getElementById('scale');
			exposure_elem = document.getElementById('exposure');

			scale_elem.value = 'ms';
			scale_elem.dispatchEvent(e1);

			exposure_elem.value = exposure;
			exposure_elem.dispatchEvent(e2);
		}
	}

	if (exposure > 500) {
		navigator.notification.confirm(
			`Set camera exposure to ${exposure}ms to match photo?`,
			exposureConfirm,
			'INTVAL3',
			['Okay', 'Cancel']
		);
	}

	
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
	
};

pwa.refreshExposure = function () {
	if (typeof pwa.exif.ExposureTime !== 'undefined') {
		pwa.cameraExposure(pwa.exif);
	}
};

pwa.EV = function (fstop, shutter) {
	const sec = shutter / 1000; //shutter in ms => seconds
	const square = Math.pow(fstop, 2);
	return Math.log(square / sec);
};*/

pwa.reset = async function () {
	const opts = {
		type : 'reset'
	};
	const cont = confirm(`Reset INTVAL3 to default settings and clear counter?`);
	if (cont) {
		try {
			await pwa.wble.write(pwa.wble.CHAR_ID, opts);
		} catch (err) {
			console.error(err);
			pwa.wble.onError(err.message);
			return false;
		}
		pwa.resetSuccess();
	}
	
};

pwa.resetSuccess = function () {
	console.log('Reset to default settings');
	setTimeout(() => {
		pwa.getState();
	}, 100)
};

pwa.update = async function () {
	const opts = {
		type : 'update'
	};
	const cont = confirm(`Check for updates? You will be disconnected from the INTVAL3 during this process.`);
	if (cont) {
		UI.spinner.show('Updating INTVAL3...');
		UI.overlay.show();
		try {
			await pwa.wble.write(pwa.wble.CHAR_ID, opts);
		} catch (err) {
			console.error(err);
			pwa.wble.onError(err.message);
			return false;
		}
		pwa.updateSuccess();
	}
};

pwa.updateSuccess = function () {
	console.log('Finished updating firmware, restarting...');
};

pwa.restart = async function () {
	const opts = {
		type : 'restart'
	};
	const cont = confirm(`Restart the INTVAL3? You will be disconnected from it during this process.`);
	if (cont) {
		UI.spinner.show('Restarting INTVAL3...');
		UI.overlay.show();
		try {
			await pwa.wble.write(pwa.wble.CHAR_ID, opts);
		} catch (err) {
			console.error(err);
			pwa.wble.onError(err.message);
			return false;
		}
		pwa.restartSuccess();
	}
};
pwa.restartSuccess = function () {
	console.log('Restarting... ');
}

pwa.alert = function (msg) {
	if (typeof navigator !== 'undefined' && typeof navigator.notification !== 'undefined') {
		navigator.notification.alert(
				msg,
				() => {},
				'INTVAL3',
				'Okay'
			);
	} else {
		alert(msg);
	}
};

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

