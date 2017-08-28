'use strict'

const ipc = require('node-ipc')
const os = require('os')
const bleno = require('bleno')
const util = require('util')

const wifi = require('../../lib/wifi')

const BLENO_DEVICE_NAME = process.env.BLENO_DEVICE_NAME || 'my_project'
const DEVICE_ID = process.env.DEVICE_ID || 'my_project_id'
const SERVICE_ID = process.env.SERVICE_ID || 'blootstrap'
const CHAR_ID = process.env.CHAR_ID || 'blootstrapchar'
const WIFI_ID = process.env.WIFI_ID || 'blootstrapwifi'
const NETWORK = os.networkInterfaces()
const MAC = getMac() || spoofMac()

let currentWifi = 'disconnected'

const chars = []

ipc.config.id = 'blootstrap_ble'
ipc.config.retry = 1500
ipc.config.rawBuffer = true
ipc.config.encoding = 'hex'

function createChar(name, uuid, prop, write, read) {
	function characteristic () {
		bleno.Characteristic.call(this, {
			uuid : uuid,
			properties: prop
		})
	}
	util.inherits(characteristic, bleno.Characteristic)
	if (prop.indexOf('read') !== -1) {
		//data, offset, withoutResponse, callback
		characteristic.prototype.onReadRequest = read
	}
	if (prop.indexOf('write') !== -1) {
		characteristic.prototype.onWriteRequest = write	
	}
	chars.push(new characteristic())
}

function createChars () {
	createChar('wifi', WIFI_ID, ['read', 'write'], onWifiWrite, onWifiRead)
}

function onWifiWrite (data, offset, withoutResponse, callback) {
	let result
	let utf8
	let obj
	let ssid
	let pwd
	if (offset) {
		console.warn(`Offset scenario`)
		result = bleno.Characteristic.RESULT_ATTR_NOT_LONG
    	return callback(result)
 	}
 	utf8 = data.toString('utf8')
 	obj = JSON.parse(utf8)
 	ssid = obj.ssid
 	pwd = obj.pwd
 	console.log(`Connecting to AP: ${ssid}...`)
 	return wifi.setNetwork(ssid, pwd, (err, data) => {
 		if (err) {
 			console.error('Error configuring wifi', err)
 			result = bleno.Characteristic.RESULT_UNLIKELY_ERROR
			return callback(result)
 		}
 		currentWifi = ssid
 		console.log(`Connected to ${ssid}`)
 		result = bleno.Characteristic.RESULT_SUCCESS
		return callback(result)
 	})
}

function onWifiRead (offset, callback) {
	const result = bleno.Characteristic.RESULT_SUCCESS
	const data = new Buffer(JSON.stringify(currentWifi))
	callback(result, data.slice(offset, data.length))
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
	const IDFILE = os.homedir() + '/.intval3id'
	let uuid
	let UUIDPATH
	let TMP
	let MACTMP
	let dashRe
	delete require.cache[FSPATH]
	if (fs.existsSync(IDFILE)) {
		return fs.readFileSync(IDFILE, 'utf8')
	}
	uuid = require('uuid').v4
	UUIDPATH = require.resolve('uuid')
	delete require.cache[UUIDPATH]
	TMP = uuid()
	MACTMP = TMP.replace(dashRe, '').substring(0, 12)
	dashRe = new RegExp('-', 'g')
	fs.writeFileSync(IDFILE, MACTMP, 'utf8')
	return MACTMP
}

console.log('Starting bluetooth service')

bleno.on('stateChange', state  => {
	const BLE_ID = `${DEVICE_ID}_${MAC}`
	console.log(`on -> stateChange: ${state}`)
	if (state === 'poweredOn') {
		console.log(`Started advertising BLE serveses as ${BLE_ID}`)
		bleno.startAdvertising(BLENO_DEVICE_NAME, [BLE_ID])
	} else {
		bleno.stopAdvertising()
	}
})

bleno.on('advertisingStart', err => {
	console.log('on -> advertisingStart: ' + (err ? 'error ' + err : 'success'))
	createChars()
	if (!err) {
		bleno.setServices([
			new bleno.PrimaryService({
				uuid : SERVICE_ID, //hardcoded across panels
				characteristics : chars
			})
		])
	}
})

bleno.on('accept', clientAddress => {
	console.log(`${clientAddress} accepted`)
})

bleno.on('disconnect', clientAddress => {
	console.log(`${clientAddress} disconnected`)
})

ipc.serve(() => {
	ipc.server.on('connect', socket => {
		ipc.log('Client connected to socket')  
	})
	ipc.server.on('disconnect', () => {
		ipc.log('Client disconnected from socket')  
	})
	ipc.server.on('data', (data, socket) => {
		ipc.server.emit(socket, JSON.stringify({}))
	})
})

ipc.server.start()