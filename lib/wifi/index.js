'use strict'

const networkPattern = /network[\s\S]*?=[\s\S]*?{([\s\S]*?)}/gi
const quoteRe = new RegExp('"', 'g')

const filePath = '/etc/wpa_supplicant/wpa_supplicant.conf'
const reconfigure = '/sbin/wpa_cli reconfigure'
const refresh = '/sbin/ifdown wlan0 && /sbin/ifup --force wlan0'
const iwlist = '/sbin/iwlist wlan0 scanning | grep "ESSID:"'
const iwgetid = '/sbin/iwgetid'

const log = require('../log')('wifi')
const exec = require('child_process').exec
const fs = require('fs')

let _entry = null
let _ssid = null
let _cb = null

/** Class representing the wifi features */
class Wifi {
	constructor () {

	}
	/**
	* List available wifi access points
	*
	* @param {function} 	callback 	Function which gets invoked after list is returned
	*/
	list (callback) {
		exec(iwlist, (err, stdout, stderr) => {
			if (err) {
				console.error(err)
				return callback(err)
			}
			const lines = stdout.split('\n')
			const output = []
			let line
			for (let l of lines) {
				line = l.replace('ESSID:',  '').trim()
				if (line !== '""') {
					line = line.replace(quoteRe, '')
					output.push(line)
				}
			}
			return callback(null, output)
		})
	}
	/**
	* (internal function) Invoked after config file is read, 
	* then invokes file write on the config file
	*
	* @param {object} 	err 		(optional) Error object only present if problem reading config file
	* @param {string} 	data 		Contents of the config file
	*/
	_readConfigCb (err, data) {
		if (err) {
			console.error(err)
			return _cb(err)
		}
		if (data.search(networkPattern) === -1) {
			data += `\n${_entry}`
		} else {
			data = data.replace(networkPattern, _entry)
		}
		_entry = null
		fs.writeFile(filePath, data, 'utf8', this._writeConfigCb)
	}
	/**
	* (internal function) Invoked after config file is written, 
	* then executes reconfiguration command
	*
	* @param {object} 	err 		(optional) Error object only present if problem writing config file
	*/
	_writeConfigCb (err) {
		if (err) {
			console.error(err)
			return _cb(err)
		}
		exec(reconfigure, this._reconfigureCb)
	}
	/**
	* (internal function) Invoked after reconfiguration command is complete
	*
	* @param {object} 	err 		(optional) Error object only present if configuration command fails
	* @param {string} 	stdout 		Standard output from reconfiguration command
	* @param {string} 	stderr 		Error output from command if fails
	*/
	_reconfigureCb (err, stdout, stderr) {
		if (err) {
			console.error(err)
			return _cb(err)
		}
		console.log('Wifi reconfigured')
		exec(refresh, this._refreshCb)
	}
	/**
	* (internal function) Invoked after wifi refresh command is complete
	*
	* @param {object} 	err 		(optional) Error object only present if refresh command fails
	* @param {string} 	stdout 		Standard output from refresh command
	* @param {string} 	stderr 		Error output from command if fails
	*/
	_refreshCb (err, stdout, stderr) {
		if (err) {
			console.error(err)
			return _cb(err)
		}
		console.log('Wifi refreshed')
		//this._callback(null, { ssid : ssid, pwd : pwd.length })
		_cb = () => {}
	}
	/**
	 * (internal function) Create sanitized wpa_supplicant.conf stanza for
	 * configuring wifi without storing plaintext passwords
	 * @example
	 * network={
	 *	 	ssid="YOUR_SSID"
	 *		#psk="YOUR_PASSWORD"
	 *		psk=6a24edf1592aec4465271b7dcd204601b6e78df3186ce1a62a31f40ae9630702
	 *	}
	 *
	 * @param {string} 	ssid 		SSID of wifi network
	 * @param {string}
	 */
	_createPSK (ssid, pwd, callback) {
		const cmd = `wpa_passphrase "${ssid}" "${pwd}" | grep "psk="`
		let output
		exec(cmd, (err, stdout, stderr) => {
			if (err) {
				return callback(err)
			}
			output = stdout.replace('#psk=', '').split('psk=')[1]
			callback(null, output.trim())
		})
	}
	/**
	* Function which initializes the processes for adding a wifi access point authentication
	*
	* @param {string} 	ssid 		SSID of network to configure
	* @param {string} 	pwd 		Password of access point, plaintext
	* @param {function} callback 	Function invoked after process is complete, or fails
	*/
	setNetwork (ssid, pwd, callback) {
		_entry = `network={\n\tssid="${ssid}"\n\tpsk="${pwd}"\n}\n`
		_cb = callback
		_ssid = ssid
		fs.readFile(filePath, 'utf8', this._readConfigCb)
	}
	/**
	* Executes command which gets the currently connected network
	*
	* @param {function} 	callback 	Function which is invoked after command is completed
	*/
	getNetwork (callback) {
		exec(iwgetid, (err, stdout, stderr) => {
			if (err) {
				return callback(err)
			}
			callback(null, stdout)
		})
	}
}

module.exports = new Wifi()