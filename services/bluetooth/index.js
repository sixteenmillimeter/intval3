'use strict'

const ipc = require('node-ipc')
const bleno = require('bleno')
const util = require('util')
const wifi = require('../../lib/wifi')

const BLENO_DEVICE_NAME = process.env.BLENO_DEVICE_NAME || 'my_project'
const DEVICE_ID = process.env.DEVICE_ID || 'my_project_id'
const SERVICE_ID = process.env.SERVICE_ID || 'blootstrap'
const CHAR_ID = process.env.CHAR_ID || 'blootstrapwifi'

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
	if (prop.indexOf('read')) {
		//data, offset, withoutResponse, callback
		characteristic.prototype.onReadRequest = read
	}
	if (prop.indexOf('write')) {
		characteristic.prototype.onWriteRequest = write	
	}
	char.push(new characteristic())
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
 		console.log(`Connected to ${ssid}`)
 		result = bleno.Characteristic.RESULT_SUCCESS
		return callback(result)
 	})
}

function onWifiRead (offset, callback) {
	const result = bleno.Characteristic.RESULT_SUCCESS
	
	callback(result, data.slice(offset, data.length))
}

console.log('Starting bluetooth service')

bleno.on('stateChange', state  => {
	console.log('on -> stateChange: ' + state)
	if (state === 'poweredOn') {
		console.log('Started advertising blootstrap services')
		bleno.startAdvertising(BLENO_DEVICE_NAME, [DEVICE_ID])
	} else {
		bleno.stopAdvertising()
	}
})

bleno.on('advertisingStart', err => {
	console.log('on -> advertisingStart: ' + (err ? 'error ' + err : 'success'))
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