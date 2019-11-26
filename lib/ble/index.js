'use strict';
/** @module ble */
/** Bluetooth Low Energy module */
const util = require('util');
const os = require('os');
const log = require('../log')('ble');
const wifi = require('../wifi');
const DEVICE_NAME = process.env.DEVICE_NAME || 'intval3';
const SERVICE_ID = process.env.SERVICE_ID || 'intval3_ble';
const CHAR_ID = process.env.CHAR_ID || 'intval3char';
const WIFI_ID = process.env.WIFI_ID || 'wifichar';
const NETWORK = os.networkInterfaces();
const MAC = getMac() || spoofMac();
//Give the device a unique device name, needs to be in env
process.env.BLENO_DEVICE_NAME += '_' + MAC;
const bleno = require('bleno');
let currentWifi = 'disconnected';
let currentAddr = null;
let getState;
const chars = [];
function createChar(name, uuid, prop, write, read) {
    function characteristic() {
        bleno.Characteristic.call(this, {
            uuid: uuid,
            properties: prop
        });
    }
    util.inherits(characteristic, bleno.Characteristic);
    if (prop.indexOf('read') !== -1) {
        //data, offset, withoutResponse, callback
        characteristic.prototype.onReadRequest = read;
    }
    if (prop.indexOf('write') !== -1) {
        characteristic.prototype.onWriteRequest = write;
    }
    chars.push(new characteristic());
}
function createChars(onWrite, onRead) {
    createChar('intval3', CHAR_ID, ['read', 'write'], onWrite, onRead);
    createChar('wifi', WIFI_ID, ['read', 'write'], onWifiWrite, onWifiRead);
}
function onWifiWrite(data, offset, withoutResponse, callback) {
    let result;
    let utf8;
    let obj;
    let ssid;
    let pwd;
    if (offset) {
        log.warn(`Offset scenario`);
        result = bleno.Characteristic.RESULT_ATTR_NOT_LONG;
        return callback(result);
    }
    utf8 = data.toString('utf8');
    obj = JSON.parse(utf8);
    ssid = obj.ssid;
    pwd = obj.pwd;
    log.info(`connecting to AP`, { ssid: ssid });
    return wifi.createPSK(ssid, pwd, (err, hash, plaintext) => {
        if (err) {
            log.error('Error hashing wifi password', err);
            result = bleno.Characteristic.RESULT_UNLIKELY_ERROR;
            return callback(result);
        }
        return wifi.setNetwork(ssid, plaintext, hash, (err, data) => {
            if (err) {
                log.error('Error configuring wifi', err);
                result = bleno.Characteristic.RESULT_UNLIKELY_ERROR;
                return callback(result);
            }
            currentWifi = ssid;
            currentAddr = getIp();
            log.info(`Connected to AP`, { ssid: ssid, ip: currentAddr });
            result = bleno.Characteristic.RESULT_SUCCESS;
            return callback(result);
        });
    });
}
function onWifiRead(offset, callback) {
    let result = bleno.Characteristic.RESULT_SUCCESS;
    let wifiRes = {};
    let data;
    wifi.list((err, list) => {
        if (err) {
            result = bleno.Characteristic.RESULT_UNLIKELY_ERROR;
            return callback(result);
        }
        wifiRes.available = list;
        wifiRes.current = currentWifi;
        wifiRes.ip = currentAddr;
        log.info('Discovered available APs', { found: list.length });
        data = new Buffer(JSON.stringify(wifiRes));
        callback(result, data.slice(offset, data.length));
    });
}
function getMac() {
    const colonRe = new RegExp(':', 'g');
    if (NETWORK && NETWORK.wlan0 && NETWORK.wlan0[0] && NETWORK.wlan0[0].mac) {
        return NETWORK.wlan0[0].mac.replace(colonRe, '');
    }
    return undefined;
}
function spoofMac() {
    const fs = require('fs');
    const FSPATH = require.resolve('uuid');
    const IDFILE = os.homedir() + '/.intval3id';
    let uuid;
    let UUIDPATH;
    let TMP;
    let MACTMP;
    let dashRe;
    delete require.cache[FSPATH];
    if (fs.existsSync(IDFILE)) {
        return fs.readFileSync(IDFILE, 'utf8');
    }
    uuid = require('uuid').v4;
    UUIDPATH = require.resolve('uuid');
    delete require.cache[UUIDPATH];
    TMP = uuid();
    MACTMP = TMP.replace(dashRe, '').substring(0, 12);
    dashRe = new RegExp('-', 'g');
    fs.writeFileSync(IDFILE, MACTMP, 'utf8');
    return MACTMP;
}
function getIp() {
    let addr = null;
    let ipv4;
    const ifaces = os.networkInterfaces();
    if (ifaces && ifaces.wlan0) {
        ipv4 = ifaces.wlan0.filter(iface => {
            if (iface.family === 'IPv4') {
                return iface;
            }
        });
        if (ipv4.length === 1) {
            addr = ipv4[0].address;
        }
    }
    return addr;
}
function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
}
/** Class representing the bluetooth interface */
class BLE {
    /**
    * Establishes Bluetooth Low Energy services, accessible to process through this class
    *
    * @constructor
    */
    constructor(bleGetState) {
        log.info('Starting bluetooth service');
        getState = bleGetState;
        bleno.on('stateChange', state => {
            log.info('stateChange', { state: state });
            if (state === 'poweredOn') {
                log.info('Starting advertising', { DEVICE_NAME, DEVICE_ID: process.env.BLENO_DEVICE_NAME });
                bleno.startAdvertising(DEVICE_NAME, [CHAR_ID]);
            }
            else {
                bleno.stopAdvertising();
            }
        });
        bleno.on('advertisingStart', err => {
            log.info('advertisingStart', { res: (err ? 'error ' + err : 'success') });
            createChars(this._onWrite.bind(this), this._onRead.bind(this));
            if (!err) {
                bleno.setServices([
                    new bleno.PrimaryService({
                        uuid: SERVICE_ID,
                        characteristics: chars
                    })
                ]);
            }
        });
        bleno.on('accept', clientAddress => {
            log.info('accept', { clientAddress: clientAddress });
        });
        bleno.on('disconnect', clientAddress => {
            log.info('disconnect', { clientAddress: clientAddress });
        });
        wifi.getNetwork((err, ssid) => {
            if (err) {
                return log.error('wifi.getNetwork', err);
            }
            currentWifi = ssid;
            currentAddr = getIp();
            log.info('wifi.getNetwork', { ssid: ssid, ip: currentAddr });
        });
    }
    _onWrite(data, offset, withoutResponse, callback) {
        let result = {};
        let utf8;
        let obj;
        let fn;
        if (offset) {
            log.warn(`Offset scenario`);
            result = bleno.Characteristic.RESULT_ATTR_NOT_LONG;
            return callback(result);
        }
        utf8 = data.toString('utf8');
        obj = JSON.parse(utf8);
        result = bleno.Characteristic.RESULT_SUCCESS;
        fn = `_on${capitalize(obj.type)}`;
        if (obj.type && this[fn]) {
            return this[fn](obj, () => {
                callback(result);
            });
        }
        else {
            return callback(result);
        }
    }
    _onRead(offset, callback) {
        const result = bleno.Characteristic.RESULT_SUCCESS;
        const state = getState();
        const data = new Buffer(JSON.stringify(state));
        callback(result, data.slice(offset, data.length));
    }
    /**
    * Binds functions to events that are triggered by BLE messages
    *
    * @param {string} 		eventName 	Name of the event to to bind
    * @param {function} 	callback 	Invoked when the event is triggered
    */
    on(eventName, callback) {
        this[`_on${capitalize(eventName)}`] = callback;
    }
}
module.exports = BLE;
//# sourceMappingURL=index.js.map