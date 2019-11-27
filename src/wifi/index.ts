'use strict'

const networkPattern : RegExp = /network[\s\S]*?=[\s\S]*?{([\s\S]*?)}/gi
const quoteRe : RegExp = new RegExp('"', 'g')

const filePath : string = '/etc/wpa_supplicant/wpa_supplicant.conf'
const reconfigure : string = '/sbin/wpa_cli reconfigure'
const refresh : string = 'ip link set wlan0 down && ip link set wlan0 up'
const iwlist : string = '/sbin/iwlist wlan0 scanning | grep "ESSID:"'
const iwgetid : string = '/sbin/iwgetid'

const log : any = require('../log')('wifi')
import { exec } from 'child_process'
import { readFile, writeFile } from 'fs'
import { reject } from 'q'

interface Network {
	raw : string
	ssid : string
}

/** Class representing the wifi features */
export class Wifi {
	private _ssid : string = null
	private _entry : string = null

	constructor () {

	}
	/**
	* List available wifi access points
	*
	* @param {function} 	callback 	Function which gets invoked after list is returned
	*/
	public async list () {
		return new Promise ((resolve : Function, reject : Function) => {
			return exec(iwlist, (err, stdout, stderr) => {
				if (err) {
					log.error('list', err)
					return reject(err)
				}
				const limit : number = 20;
				const lines : string[] = stdout.split('\n')
				let output : string[] = []
				let line : string
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
				return resolve(output)
			})
		})
	}
	/**
	* (internal function) Invoked after config file is read, 
	* then invokes file write on the config file
	*
	*/
	async _readConfig () {
		let data : string
		let parsed : Network[]
		let current : Network

		try {
			data = await readFile(filePath, 'utf8')
		} catch (err) {
			log.error('_readConfig', err)
			throw err
		}

		parsed = this._parseConfig(data)
		current = parsed.find((network : Network) => {
			return network.ssid === this._ssid
		})
		if (typeof current !== 'undefined') {
			data = data.replace(current.raw, this._entry)
		} else {
			data += '\n\n' + this._entry
		}
		this._entry = null

		return data

	}
	/**
	* (internal function) Invoked after config file is written, 
	* then executes reconfiguration command
	*
	*/
	private async _writeConfig (data : string) {
		try {
			await writeFile(filePath, data, { encoding : 'utf-8' })
		} catch (err) {
			log.error('_readConfigCb', err)
			throw err
		}

	}
	/**
	* (internal function) Invoked after reconfiguration command is complete
	*
	*/
	private async _reconfigure () {
		return new Promise((resolve : Function, reject : Function) => {
			return exec(reconfigure, (err : Error, stdout : string, stderr : string) => {
				if (err) {
					return reject(err)
				}
				log.info('Wifi reconfigured')
				return resolve(true)
			})
		})
	}
	/**
	* (internal function) Invoked after wifi refresh command is complete
	*
	*/
	private async _refresh () {
		return new Promise((resolve : Function, reject : Function) => {
			return exec(refresh, (err : Error, stdout : string, stderr : string) => {
				if (err) {
					return reject(err)
				}
				log.info('Wifi refreshed')
				return resolve({ ssid : this._ssid });
			})
		})
	}

	private _parseConfig (str : string) : Network[] {
		const networks : Network[] = []
		const lines = str.split('\n')
		let network : Network = {} as Network
		for (let line of lines) {
			if (line.substring(0, 9) === 'network={') {
				network = {} as Network
				network.raw = line
			} else if (network.raw && line.indexOf('ssid=') !== -1) {
				network.ssid = line.replace('ssid=', '').trim().replace(quoteRe, '')
				if (network.raw) {
					network.raw += '\n' + line
				}
			} else if (network.raw && line.substring(0, 1) === '}') {
				network.raw += '\n' + line
				networks.push(network)
				network = {} as Network
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
	 */
	createPSK (ssid : string, pwd : string) {
		const cmd : string = `wpa_passphrase '${ssid.replace(/'/g, `'\\''`)}' '${pwd.replace(/'/g, `'\\''`)}' | grep "psk="`
		let lines : string[]
		let hash : string
		let plaintext : string
		return new Promise ((resolve : Function, reject : Function) => {
			return exec(cmd, (err, stdout, stderr) => {
				if (err) {
					return reject(err)
				}
				lines = stdout.replace('#psk=', '').split('psk=')
				hash = lines[1]
				plaintext = lines[0]
				return resolve({ hash : hash.trim(), plaintext : plaintext.trim()})
			})
		})
	}
	/**
	* Function which initializes the processes for adding a wifi access point authentication
	*
	* @param {string} 	ssid 		SSID of network to configure
	* @param {string} 	pwd 		Password of access point, plaintext to be masked
	* @param {string} 	hash 		Password/SSID of access point, securely hashed
	*/
	async setNetwork (ssid : string, pwd : string, hash : string) {
		let masked : string = pwd.split('').map(char => { return char !== '"' ? '*' : '"' }).join('')
		let data : string
		this._entry = `network={\n\tssid="${ssid}"\n\t#psk=${masked}\n\tpsk=${hash}\n}\n`
		this._ssid = ssid
		
		try {
			data = await this._readConfig()
		} catch (err) {
			log.error(err)
		}
		try {
			await this._writeConfig(data)
		} catch (err) {
			log.error(err)
		}
		try {
			await this._reconfigure()
		} catch (err) {
			log.error(err)
		}
		try {
			await this._refresh()
		} catch (err) {
			log.error(err)
		}

		return { ssid : this._ssid }
	}
	/**
	* Executes command which gets the currently connected network
	*
	* @param {function} 	callback 	Function which is invoked after command is completed
	*/
	public async getNetwork () {
		let output : string
		return new Promise((resolve : Function, reject : Function) => {
			return exec(iwgetid, (err : Error, stdout : string, stderr : string) => {
				if (err) {
					return reject(err)
				}
				output = stdout.split('ESSID:')[1].replace(quoteRe, '').trim()
				return resolve(output)
			})
		}) 

	}
}

module.exports.Wifi = Wifi