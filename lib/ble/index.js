'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/** @module ble */
/** Bluetooth Low Energy module */
const util_1 = require("util");
const os_1 = require("os");
const fs_extra_1 = require("fs-extra");
const log = require('../log')('ble');
const wifi_1 = require("../wifi");
const wifi = new wifi_1.Wifi();
const DEVICE_NAME = typeof process.env.DEVICE_NAME !== 'undefined' ? process.env.DEVICE_NAME : 'intval3';
const SERVICE_ID = typeof process.env.SERVICE_ID !== 'undefined' ? process.env.SERVICE_ID : 'intval3_ble';
const CHAR_ID = typeof process.env.CHAR_ID !== 'undefined' ? process.env.CHAR_ID : 'intval3char';
const WIFI_ID = typeof process.env.WIFI_ID !== 'undefined' ? process.env.WIFI_ID : 'wifichar';
const NETWORK = os_1.networkInterfaces(); //?type?
const MAC = getMac() || spoofMac();
//Give the device a unique device name, needs to be in env
process.env.BLENO_DEVICE_NAME += '_' + MAC;
const bleno_1 = __importDefault(require("bleno"));
const { Characteristic } = bleno_1.default;
let currentWifi = 'disconnected';
let currentAddr = null;
let getState;
const chars = [];
function createChar(name, uuid, prop, write, read) {
    const characteristic = function () {
        Characteristic.call(this, {
            uuid,
            properties: prop
        });
    };
    util_1.inherits(characteristic, Characteristic);
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
    const permissions = ['read', 'write'];
    createChar('intval3', CHAR_ID, permissions, onWrite, onRead);
    createChar('wifi', WIFI_ID, permissions, onWifiWrite, onWifiRead);
}
async function onWifiWrite(data, offset) {
    let result;
    let utf8;
    let obj = {};
    let ssid;
    let pwd;
    let psk;
    if (offset) {
        log.warn(`Offset scenario`);
        result = bleno_1.default.Characteristic.RESULT_ATTR_NOT_LONG;
        return result;
    }
    utf8 = data.toString('utf8');
    obj = JSON.parse(utf8);
    ssid = obj.ssid;
    pwd = obj.pwd;
    log.info(`connecting to AP`, { ssid: ssid });
    try {
        psk = await wifi.createPSK(ssid, pwd);
    }
    catch (err) {
        log.error('Error hashing wifi password', err);
        result = bleno_1.default.Characteristic.RESULT_UNLIKELY_ERROR;
        return result;
    }
    try {
        await wifi.setNetwork(ssid, psk.plaintext, psk.hash);
    }
    catch (err) {
        log.error('Error configuring wifi', err);
        result = bleno_1.default.Characteristic.RESULT_UNLIKELY_ERROR;
        return result;
    }
    currentWifi = ssid;
    currentAddr = getIp();
    log.info(`Connected to AP`, { ssid, ip: currentAddr });
    result = bleno_1.default.Characteristic.RESULT_SUCCESS;
    return result;
}
async function onWifiRead(offset, callback) {
    let result = bleno_1.default.Characteristic.RESULT_SUCCESS;
    let wifiRes = {};
    let data;
    let list;
    try {
        list = await wifi.list();
    }
    catch (err) {
        result = bleno_1.default.Characteristic.RESULT_UNLIKELY_ERROR;
        return callback(result);
    }
    wifiRes.available = list;
    wifiRes.current = currentWifi;
    wifiRes.ip = currentAddr;
    log.info('Discovered available APs', { found: list.length });
    data = new Buffer(JSON.stringify(wifiRes));
    return callback(result, data.slice(offset, data.length));
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
    const IDFILE = os_1.homedir() + '/.intval3id';
    let uuid;
    let UUIDPATH;
    let TMP;
    let MACTMP;
    let dashRe;
    delete require.cache[FSPATH];
    if (fs_extra_1.existsSync(IDFILE)) {
        return fs_extra_1.readFileSync(IDFILE, 'utf8');
    }
    uuid = require('uuid').v4;
    UUIDPATH = require.resolve('uuid');
    delete require.cache[UUIDPATH];
    TMP = uuid();
    MACTMP = TMP.replace(dashRe, '').substring(0, 12);
    dashRe = new RegExp('-', 'g');
    fs_extra_1.writeFileSync(IDFILE, MACTMP, 'utf8');
    return MACTMP;
}
function getIp() {
    let addr = null;
    let ipv4;
    const ifaces = os_1.networkInterfaces();
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
function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}
/** Class representing the bluetooth interface */
class BLE {
    /**
    * Establishes Bluetooth Low Energy services, accessible to process through this class
    *
    * @constructor
    */
    constructor(bleGetState) {
        this.listeners = {};
        log.info('Starting bluetooth service');
        getState = bleGetState;
        bleno_1.default.on('stateChange', (state) => {
            log.info('stateChange', { state });
            if (state === 'poweredOn') {
                log.info('Starting advertising', { DEVICE_NAME, DEVICE_ID: process.env.BLENO_DEVICE_NAME });
                bleno_1.default.startAdvertising(DEVICE_NAME, [CHAR_ID]);
            }
            else {
                bleno_1.default.stopAdvertising();
            }
        });
        bleno_1.default.on('advertisingStart', (err) => {
            log.info('advertisingStart', { res: (err ? 'error ' + err : 'success') });
            createChars(this._onWrite.bind(this), this._onRead.bind(this));
            if (!err) {
                bleno_1.default.setServices([
                    new bleno_1.default.PrimaryService({
                        uuid: SERVICE_ID,
                        characteristics: chars
                    })
                ]);
            }
        });
        bleno_1.default.on('accept', (clientAddress) => {
            log.info('accept', { clientAddress });
        });
        bleno_1.default.on('disconnect', (clientAddress) => {
            log.info('disconnect', { clientAddress });
        });
        this._refreshWifi();
    }
    async _refreshWifi() {
        let ssid;
        try {
            ssid = await wifi.getNetwork();
        }
        catch (err) {
            return log.error('wifi.getNetwork', err);
        }
        currentWifi = ssid;
        currentAddr = getIp();
        log.info('wifi.getNetwork', { ssid: ssid, ip: currentAddr });
    }
    _onWrite(data, offset, withoutResponse, callback) {
        let result = {};
        let utf8;
        let obj;
        if (offset) {
            log.warn(`Offset scenario`);
            result = bleno_1.default.Characteristic.RESULT_ATTR_NOT_LONG;
            return callback(result);
        }
        utf8 = data.toString('utf8');
        obj = JSON.parse(utf8);
        result = bleno_1.default.Characteristic.RESULT_SUCCESS;
        if (obj.type && this.listeners[obj.type]) {
            return this.listeners[obj.type](obj, () => {
                callback(result);
            });
        }
        else {
            return callback(result);
        }
    }
    _onRead(offset, callback) {
        const result = bleno_1.default.Characteristic.RESULT_SUCCESS;
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
        this.listeners[eventName] = callback;
    }
}
module.exports = BLE;
//# sourceMappingURL=index.js.map