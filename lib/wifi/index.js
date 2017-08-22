'use strict'

const networkPattern = /network[\s\S]*?=[\s\S]*?{([\s\S]*?)}/gi
const quoteRe = new RegExp('"', 'g')

const filePath = '/etc/wpa_supplicant/wpa_supplicant.conf'
const reconfigure = '/sbin/wpa_cli reconfigure'
const refresh = '/sbin/ifdown wlan0 && /sbin/ifup --force wlan0'
const iwlist = '/sbin/iwlist wlan0 scanning | grep "ESSID:"'
const iwgetid = '/sbin/iwgetid'

const exec = require('child_process').exec
const fs = require('fs')

class wifi {
	constructor () {
		this._callback = () => {}
		this._entry = null
		this._ssid = null
	}
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
	_readConfigCb (err, data) {
		if (err) {
			console.error(err)
			return this._callback(err)
		}
		if (data.search(networkPattern) === -1) {
			data += `\n${this._entry}`
		} else {
			data = data.replace(networkPattern, this._entry)
		}
		this._entry = null
		fs.writeFile(filePath, data, 'utf8', this._writeConfigCb)
	}
	_writeConfigCb (err) {
		if (err) {
			console.error(err)
			return this._callback(err)
		}
		exec(reconfigure, this._reconfigureCb)
	}
	_reconfigureCb (err, stdout, stderr) {
		if (err) {
			console.error(err)
			return this._callback(err)
		}
		console.log('Wifi reconfigured')
		exec(refresh, this._refreshCb)
	}
	_refreshCb (err, stdout, stderr) {
		if (err) {
			console.error(err)
			return this._callback(err)
		}
		console.log('Wifi refreshed')
		//this._callback(null, { ssid : ssid, pwd : pwd.length })
		this._callback = () => {}
	}
	setNetwork (ssid, pwd, callback) {
		this._entry = `network={\n\tssid="${ssid}"\n\tpsk="${pwd}"\n}\n`
		this._callback = callback
		this._ssid = ssid
		fs.readFile(filePath, 'utf8', this._readConfigCb)
	}
	getNetwork (callback) {
		exec(iwgetid, (err, stdout, stderr) => {
			if (err) {
				return callback(err)
			}
			callback(null, stdout)
		})
	}
}

module.exports = new wifi()