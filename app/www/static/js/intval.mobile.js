'use strict';
var mobile = {};

mobile.ble = {
	BLENO_DEVICE_NAME : 'intval3',
	DEVICE_ID : 'intval3',
	SERVICE_ID : '149582bd-d49d-4b5c-acd1-1ae503d09e7a',
	CHAR_ID : '47bf69fb-f62f-4ef8-9be8-eb727a54fae4', //general data
	WIFI_ID : '3fe7d9cf-7bd2-4ff0-97c5-ebe87288c2cc', //wifi only
	DEVICES : []
};

mobile.ble.scan = function () {
	ble.scan([], 5, mobile.ble.onDiscover, BLE.onError);
};

mobile.ble.onDiscover = function (device) {
	console.dir(device);
	mobile.ble.connect(device.id);
}

mobile.ble.connect = function (deviceId) {
	ble.connect(deviceId, function (peripheral) {
		mobile.ble.onConnect(peripheral, deviceId);
	}, mobile.ble.onError);
};

mobile.ble.onConnect = function (peripheral, deviceId) {
	console.log(peripheral);
	console.log(deviceId);
};

mobile.ble.onError = function (err) {
	alert(JSON.stringify(err));
};

mobile.init = function () {
	frame = mobile.frame;
	getState = mobile.getState;
	setDir = mobile.setDir;
	setExposure = mobile.setExposure;
	setCounter = mobile.setCounter;
};

mobile.frame = function () {};
mobile.getState = function () {};
mobile.setDir = function () {};
mobile.setExposure = function () {};
mobile.setCounter = function () {};