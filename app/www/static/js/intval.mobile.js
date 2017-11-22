'use strict';
var mobile = {};
mobile.init = function () {
	frame = web.frame;
	getState = web.getState;
	setDir = web.setDir;
	setExposure = web.setExposure;
	setCounter = web.setCounter;

	mobile.getState();
};

mobile.frame = function () {};
mobile.getState = function () {};
mobile.setDir = function () {};
mobile.setExposure = function () {};
mobile.setCounter = function () {};