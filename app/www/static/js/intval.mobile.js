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