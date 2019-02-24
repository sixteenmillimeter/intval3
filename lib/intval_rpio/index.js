'use strict'

//Optimized rpio-writebuf re-write of the intval module
//https://gist.github.com/jperkin/e1f0ce996c83ccf2bca9
//on hold

const db = require('../db')
const log = require('../log')('intval3')
const storage = require('node-persist')
const fs = require('fs')
const Rpio = require('rpio')

const intval = {}


intval.init = function () {}
intval._restoreState = function () {}
intval._setState = function () {}
intval._storeState = function () {}
intval._declarePins = function () {}
intval._undeclarePins = function () {}
intval._startFwd = function () {}
intval._startBwd = function () {}
intval._pause = function () {}
intval._stop = function () {}
intval._watchMicro = function () {}
intval._watchRelease = function () {}
intval._releaseStateColsed = function () {}

intval.reset = function () {}
intval.setDir = function () {}
intval.setExposure = function () {}
intval.setDelay = function () {}
intval.setCounter = function () {} 
intval.frame = function () {}
intval.status = function () {}

module.exports = intval