'use strict'

const networkPattern = /network[\s\S]*?=[\s\S]*?{([\s\S]*?)}/gi
const quoteRe = new RegExp('"', 'g')

const filePath = '/etc/wpa_supplicant/wpa_supplicant.conf'
const reconfigure = '/sbin/wpa_cli reconfigure'
const refresh = 'ip link set wlan0 down && ip link set wlan0 up'
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
			const limit = 20;
			const lines = stdout.split('\n')
			let output = []
			let line
			let i = 0
			for (let l of lines) {
				line = l.replace('ESSID:',  '').trim()
				if (line !== '""' && i < limit) {
					line = line.replace(quoteRe, '')
					output.push(line)
				}
				i++
			}
			output = output.filter(ap => {
				if (ap !== '') return ap
			})
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
		let parsed
		let current
		if (err) {
			console.error(err)
			return _cb(err)
		}
		parsed = this._parseConfig(data)
		current = parsed.find(network => {
			return network.ssid === _ssid
		})
		if (typeof current !== 'undefined') {
			data = data.replace(current.raw, _entry)
		} else {
			data += '\n\n' + _entry
		}
		_entry = null
		fs.writeFile(filePath, data, 'utf8', this._writeConfigCb.bind(this))
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
		exec(reconfigure, this._reconfigureCb.bind(this))
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
		exec(refresh, this._refreshCb.bind(this))
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
		_cb(null, { ssid : _ssid })
		_cb = () => {}
	}
	_parseConfig (str) {
		const networks = []
		const lines = str.split('\n')
		let network = {}
		for (let line of lines) {
			if (line.substring(0, 9) === 'network={') {
				network = {}
				network.raw = line
			} else if (network.raw && line.indexOf('ssid=') !== -1) {
				network.ssid = line.replace('ssid=', '').trim().replace(quoteRe, '')
				if (network.raw) {
					network.raw += '\n' + line
				}
			} else if (network.raw && line.substring(0, 1) === '}') {
				network.raw += '\n' + line
				networks.push(network)
				network = {}
			} else if (network.raw) {
				network.raw += '\n' + line
			}
		}
		return networks
	}
	/**
	 * Create sanitized wpa_supplicant.conf stanza for
	 * configuring wifi without storing plaintext passwords
	 * @example
	 * network={
	 *	 	ssid="YOUR_SSID"
	 *		#psk="YOUR_PASSWORD"
	 *		psk=6a24edf1592aec4465271b7dcd204601b6e78df3186ce1a62a31f40ae9630702
	 *	}
	 *
	 * @param {string} 	ssid 		SSID of wifi network
	 * @param {string}  pwd 		Plaintext passphrase of wifi network
	 * @param {function} callback 	Function called after psk hash is generated
	 */
	createPSK (ssid, pwd, callback) {
		const cmd = `wpa_passphrase "${ssid}" "${pwd}" | grep "psk="`
		let lines
		let hash
		let plaintext
		exec(cmd, (err, stdout, stderr) => {
			if (err) {
				return callback(err)
			}
			lines = stdout.replace('#psk=', '').split('psk=')
			hash = lines[1]
			plaintext = lines[0]
			callback(null, hash.trim(), plaintext.trim())
		})
	}
	/**
	* Function which initializes the processes for adding a wifi access point authentication
	*
	* @param {string} 	ssid 		SSID of network to configure
	* @param {string} 	pwd 		Password of access point, plaintext to be masked
	* @param {string} 	hash 		Password/SSID of access point, securely hashed
	* @param {function} callback 	Function invoked after process is complete, or fails
	*/
	setNetwork (ssid, pwd, hash, callback) {
		let masked = pwd.split('').map(char => { return char !== '"' ? '*' : '"' }).join('')
		_entry = `network={\n\tssid="${ssid}"\n\t#psk=${masked}\n\tpsk=${hash}\n}\n`
		_cb = callback
		_ssid = ssid
		fs.readFile(filePath, 'utf8', this._readConfigCb.bind(this))
	}
	/**
	* Executes command which gets the currently connected network
	*
	* @param {function} 	callback 	Function which is invoked after command is completed
	*/
	getNetwork (callback) {
		let output
		exec(iwgetid, (err, stdout, stderr) => {
			if (err) {
				return callback(err)
			}
			output = stdout.split('ESSID:')[1].replace(quoteRe, '').trim()
			callback(null, output)
		})
	}
}

module.exports = new Wifi()