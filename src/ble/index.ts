'use strict'

/** @module ble */
/** Bluetooth Low Energy module */

import { inherits } from 'util'
import { networkInterfaces, homedir } from 'os'
import { readFileSync, existsSync, writeFileSync } from 'fs-extra'

const log = require('../log')('ble')
import { Wifi } from '../wifi'
const wifi = new Wifi()

const DEVICE_NAME : string = typeof process.env.DEVICE_NAME !== 'undefined' ? process.env.DEVICE_NAME : 'intval3'
const SERVICE_ID : string  = typeof process.env.SERVICE_ID !== 'undefined' ? process.env.SERVICE_ID : 'intval3_ble'
const CHAR_ID : string  = typeof process.env.CHAR_ID !== 'undefined' ? process.env.CHAR_ID : 'intval3char'
const WIFI_ID  : string = typeof process.env.WIFI_ID !== 'undefined' ? process.env.WIFI_ID : 'wifichar'
const NETWORK : any = networkInterfaces() //?type?
const MAC : string = getMac() || spoofMac()

//Give the device a unique device name, needs to be in env
process.env.BLENO_DEVICE_NAME  += '_' + MAC
import bleno from 'bleno'
const { Characteristic } = bleno

let currentWifi : string = 'disconnected'
let currentAddr : string = null
let getState : Function

const chars : any[] = []

interface WifiInfo {
	ssid : string
	pwd : string
}

interface WifiResponse {
	available : string[]
	current : string
	ip : string
}

function createChar(name : string, uuid : string, prop : string[], write : Function, read : Function) {
	const characteristic : any = function () {
		Characteristic.call(this, {
			uuid,
			properties: prop
		})
	}
	inherits(characteristic, Characteristic)
	if (prop.indexOf('read') !== -1) {
		//data, offset, withoutResponse, callback
		characteristic.prototype.onReadRequest = read
	}
	if (prop.indexOf('write') !== -1) {
		characteristic.prototype.onWriteRequest = write	
	}
	chars.push(new characteristic())
}

function createChars (onWrite : Function, onRead : Function) {
	const permissions : string[] = ['read', 'write'];
	createChar('intval3', CHAR_ID, permissions, onWrite, onRead)
	createChar('wifi', WIFI_ID, permissions, onWifiWrite, onWifiRead)
}

async function onWifiWrite (data : any, offset : number) {
	let result : any
	let utf8 : string
	let obj : WifiInfo = {} as WifiInfo
	let ssid : string
	let pwd : string
	let psk : any

	if (offset) {
		log.warn(`Offset scenario`)
		result = bleno.Characteristic.RESULT_ATTR_NOT_LONG
    	return result
	}
	 
 	utf8 = data.toString('utf8')
 	obj = JSON.parse(utf8)
 	ssid = obj.ssid
 	pwd = obj.pwd
	 
	log.info(`connecting to AP`, { ssid : ssid })
	
	try {
		psk = await wifi.createPSK(ssid, pwd)
	} catch (err) {
		log.error('Error hashing wifi password', err)
		result = bleno.Characteristic.RESULT_UNLIKELY_ERROR
	    return result
	}

	try {
		await wifi.setNetwork(ssid, psk.plaintext, psk.hash)
	} catch (err) {
		log.error('Error configuring wifi', err)
		result = bleno.Characteristic.RESULT_UNLIKELY_ERROR
		return result
	}

	currentWifi = ssid
	currentAddr = getIp()
	log.info(`Connected to AP`, { ssid, ip : currentAddr })
	result = bleno.Characteristic.RESULT_SUCCESS
	return result
}

async function onWifiRead (offset : number, callback : Function) {
	let result : any = bleno.Characteristic.RESULT_SUCCESS
	let wifiRes : WifiResponse = {} as WifiResponse
	let data : any
	let list : any

	try {
		list = await wifi.list()
	} catch (err) {
		result = bleno.Characteristic.RESULT_UNLIKELY_ERROR
		return callback(result)
	}

	wifiRes.available = list
	wifiRes.current = currentWifi
	wifiRes.ip = currentAddr
	log.info('Discovered available APs', { found : list.length })
	data = new Buffer(JSON.stringify(wifiRes))

	return callback(result, data.slice(offset, data.length))
}

function getMac () {
	const colonRe = new RegExp(':', 'g')
	if (NETWORK && NETWORK.wlan0 && NETWORK.wlan0[0] && NETWORK.wlan0[0].mac) {
		return NETWORK.wlan0[0].mac.replace(colonRe, '')
	}
	return undefined
}

function spoofMac () {
	const fs = require('fs')
	const FSPATH = require.resolve('uuid')
	const IDFILE = homedir() + '/.intval3id'
	let uuid
	let UUIDPATH
	let TMP
	let MACTMP
	let dashRe
	delete require.cache[FSPATH]
	if (existsSync(IDFILE)) {
		return readFileSync(IDFILE, 'utf8')
	}
	uuid = require('uuid').v4
	UUIDPATH = require.resolve('uuid')
	delete require.cache[UUIDPATH]
	TMP = uuid()
	MACTMP = TMP.replace(dashRe, '').substring(0, 12)
	dashRe = new RegExp('-', 'g')
	writeFileSync(IDFILE, MACTMP, 'utf8')
	return MACTMP
}

function getIp () {
	let addr = null
	let ipv4
	const ifaces = networkInterfaces()
	if (ifaces && ifaces.wlan0) {
		ipv4 = ifaces.wlan0.filter(iface => {
			if (iface.family === 'IPv4') {
				return iface
			}
		})
		if (ipv4.length === 1) {
			addr = ipv4[0].address
		}
	}
	return addr
}


function capitalize (str : string) {
    return str[0].toUpperCase() + str.slice(1)
}

type functionKeys = "_onRead" | "_onWrite";

/** Class representing the bluetooth interface */
class BLE {
	listeners : any = {}	
	/**
	* Establishes Bluetooth Low Energy services, accessible to process through this class
	*
	* @constructor
	*/
	constructor (bleGetState : Function) {
		log.info('Starting bluetooth service')

		getState = bleGetState

		bleno.on('stateChange', (state : any ) => {
			log.info('stateChange', { state })
			if (state === 'poweredOn') {
				log.info('Starting advertising', { DEVICE_NAME, DEVICE_ID : process.env.BLENO_DEVICE_NAME })
				bleno.startAdvertising(DEVICE_NAME, [CHAR_ID])
			} else {
				bleno.stopAdvertising()
			}
		})

		bleno.on('advertisingStart', (err : Error) => {
			log.info('advertisingStart', { res : (err ? 'error ' + err : 'success') })
			createChars(this._onWrite.bind(this), this._onRead.bind(this))
			if (!err) {
				bleno.setServices([
					new bleno.PrimaryService({
						uuid : SERVICE_ID, //hardcoded across panels
						characteristics : chars
					})
				])
			}
		})

		bleno.on('accept', (clientAddress : any) => {
			log.info('accept', { clientAddress })
		})

		bleno.on('disconnect', (clientAddress : any) => {
			log.info('disconnect', { clientAddress })
		})

		this._refreshWifi()
	}
	
	private async _refreshWifi () {
		let ssid : string

		try {
			ssid = await wifi.getNetwork() as string
		} catch (err) {
			return log.error('wifi.getNetwork', err)
		}
		
		currentWifi = ssid
		currentAddr = getIp()
		log.info('wifi.getNetwork', {ssid : ssid, ip : currentAddr })
	}

	private _onWrite (data : any, offset : number, withoutResponse : Function, callback : Function) {
		let result : any = {}
		let utf8 : string
		let obj : any

		if (offset) {
			log.warn(`Offset scenario`)
			result = bleno.Characteristic.RESULT_ATTR_NOT_LONG
	    	return callback(result)
		}
		 
	 	utf8 = data.toString('utf8')
 		obj = JSON.parse(utf8)
	 	result = bleno.Characteristic.RESULT_SUCCESS
		 
	 	if (obj.type && this.listeners[obj.type]) {
	 		return this.listeners[obj.type](obj, () => {
	 			callback(result)
	 		})
	 	} else {
	 		return callback(result)
	 	}
	}

	private _onRead (offset : number, callback : Function) {
		const result = bleno.Characteristic.RESULT_SUCCESS
		const state = getState()
		const data = new Buffer(JSON.stringify( state ))
		callback(result, data.slice(offset, data.length))
	}
	/**
	* Binds functions to events that are triggered by BLE messages
	*
	* @param {string} 		eventName 	Name of the event to to bind
	* @param {function} 	callback 	Invoked when the event is triggered
	*/
	on (eventName : string, callback : Function) {
		this.listeners[eventName] = callback
	}

}

module.exports = BLE