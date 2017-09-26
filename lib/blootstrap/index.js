'use strict'

const ipc = require('node-ipc')
const log = require('../log')('ble')

function capitalize (s) {
    return s[0].toUpperCase() + s.slice(1)
}

/** Class representing the bluetooth interface */
class Blootstrap {
	constructor () {
		this._onData = () => {}
		ipc.connectTo('blootstrap_ble', () => {
			ipc.of.blootstrap_ble.on('connect', () => {
				log.info('connect', `Connected to the blootstrap_ble service`)

			})
			ipc.of.blootstrap_ble.on('data', data => {
				const str = data.toString()
				log.info('data', str)
				this._onData(str)
			})
			ipc.of.blootstrap_ble.on('disconnect', () => {
				log.info('disconnect', `Disconnected from the blootstrap_ble service`)
			})
			ipc.of.blootstrap_ble.on('error', (err) => {
				if (err.code === 'EACCES') {
					log.warn('error', `Cannot access ipc`)
				}
			})
		})
	}
	/**
	* Binds functions to events that are triggered by BLE messages
	*
	* @param {string} 		eventName 	Name of the event to to bind
	* @param {function} 	callback 	Invoked when the event is triggered
	*/
	on (eventName, callback) {
		this[`_on${capitalize(eventName)}`] = callback
	}
}

module.exports = new Blootstrap()