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
	}, 5000)
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
}

mobile.ble.connect = function (device) {
	console.log(`BLE - Connecting to ${device.id}`)
	ble.connect(device.id, (peripheral) => {
		mobile.ble.onConnect(peripheral, device);
	}, mobile.ble.onError);
};

mobile.ble.onConnect = function (peripheral, device) {
	const elem = document.getElementById('bluetooth')
	const option = document.createElement('option')
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
		console.warn('Not connected to any device')
		return false
	}
	device = mobile.ble.device
	console.log(`BLE - Disconnecting from ${device.id}`)
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
	const bleInputs = document.querySelectorAll('.ble')
	document.querySelector('body').classList.add('mobile')

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
	mobile.cameraValues()

};

mobile.getState = function () {
	if (!mobile.ble.connected) {
		//
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
	setState(res)
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
	console.log('Frame finished, getting state.');
	mobile.ble.active = false;
	document.getElementById('frame').classList.remove('focus');
	mobile.getState();
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
	const scaledDelay = scaleTime(delay, STATE.delayScale)
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
	console.log('Set delay')
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
	if (!mobile.ble.connected) {
		return alert('Not connected to an INTVAL device.');
	}
	ble.write(mobile.ble.device.id,
			mobile.ble.SERVICE_ID,
			mobile.ble.CHAR_ID,
			stringToBytes(JSON.stringify(opts)), //check length?
			mobile.frameSuccess,
			mobile.ble.onError);
	document.getElementById('seq').classList.add('focus');
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

mobile.getCamera = function () {
	var opts = {
		quality: 30,
		sourceType: Camera.PictureSourceType.CAMERA,
    	destinationType: Camera.DestinationType.FILE_URI
	};
	navigator.camera.getPicture(mobile.cameraSuccess, mobile.cameraError, opts);
};
mobile.cameraSuccess = function (result) {
	var thisResult = JSON.parse(result);
	var metadata = JSON.parse(thisResult.json_metadata);
	
	mobile.cameraExposure(fstop, metadata);
}
mobile.cameraError = function (err) {
	console.error(err);
	alert(err);
};

mobile.cameraExposure = function (exif) {
	var fstop = document.querySelector('.fstop').value || 5.6;
	var iso = document.querySelector('.iso').value || 100;
	/*
	ApertureValue: 1.6959938131099002
	BrightnessValue: -0.3966568568788107
	ColorSpace: 65535
	DateTimeDigitized: "2018:01:08 23:06:13"
	DateTimeOriginal: "2018:01:08 23:06:13"
	ExposureBiasValue: 0
	ExposureMode: 0
	ExposureProgram: 2
	ExposureTime: 0.2
	FNumber: 1.8
	Flash: 24
	FocalLenIn35mmFilm: 28
	FocalLength: 3.99
	ISOSpeedRatings: [100] (1)
	LensMake: "Apple"
	LensModel: "iPhone 8 back camera 3.99mm f/1.8"
	LensSpecification: [3.99, 3.99, 1.8, 1.8] (4)
	MeteringMode: 5
	PixelXDimension: 4032
	PixelYDimension: 3024
	SceneType: 1
	SensingMethod: 2
	ShutterSpeedValue: 2.38401125849867
	SubjectArea: [2015, 1511, 2217, 1330] (4)
	SubsecTimeDigitized: "567"
	SubsecTimeOriginal: "567"
	WhiteBalance: 0
	*/
	exif.AperatureValue || exif.FNumber
	exif.ExposureTime
	exif.ISOSpeedRatings
};
mobile.cameraValues = function () {
	document.querySelectorAll('.iso').forEach(input => {
		input.onchange = function () {
			var val = this.value;
			document.querySelectorAll('.iso').forEach(e => {
				e.value = val;
			})
		}
	})
}

/** 
 *  Mobile helper functions
 */

function bytesToString (buffer) {
	return String.fromCharCode.apply(null, new Uint8Array(buffer));
};
function stringToBytes(string) {
	var array = new Uint8Array(string.length);
	for (var i = 0, l = string.length; i < l; i++) {
		array[i] = string.charCodeAt(i);
	}
	return array.buffer;
};