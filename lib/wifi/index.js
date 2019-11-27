'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const networkPattern = /network[\s\S]*?=[\s\S]*?{([\s\S]*?)}/gi;
const quoteRe = new RegExp('"', 'g');
const filePath = '/etc/wpa_supplicant/wpa_supplicant.conf';
const reconfigure = '/sbin/wpa_cli reconfigure';
const refresh = 'ip link set wlan0 down && ip link set wlan0 up';
const iwlist = '/sbin/iwlist wlan0 scanning | grep "ESSID:"';
const iwgetid = '/sbin/iwgetid';
const log = require('../log')('wifi');
const child_process_1 = require("child_process");
const fs_extra_1 = require("fs-extra");
/** Class representing the wifi features */
class Wifi {
    constructor() {
        this._ssid = null;
        this._entry = null;
    }
    /**
    * List available wifi access points
    *
    * @param {function} 	callback 	Function which gets invoked after list is returned
    */
    async list() {
        return new Promise((resolve, reject) => {
            return child_process_1.exec(iwlist, (err, stdout, stderr) => {
                if (err) {
                    log.error('list', err);
                    return reject(err);
                }
                const limit = 20;
                const lines = stdout.split('\n');
                let output = [];
                let line;
                let i = 0;
                for (let l of lines) {
                    line = l.replace('ESSID:', '').trim();
                    if (line !== '""' && i < limit) {
                        line = line.replace(quoteRe, '');
                        output.push(line);
                    }
                    i++;
                }
                output = output.filter(ap => {
                    if (ap !== '')
                        return ap;
                });
                return resolve(output);
            });
        });
    }
    /**
    * (internal function) Invoked after config file is read,
    * then invokes file write on the config file
    *
    */
    async _readConfig() {
        let data;
        let parsed;
        let current;
        try {
            data = await fs_extra_1.readFile(filePath, 'utf8');
        }
        catch (err) {
            log.error('_readConfig', err);
            throw err;
        }
        parsed = this._parseConfig(data);
        current = parsed.find((network) => {
            return network.ssid === this._ssid;
        });
        if (typeof current !== 'undefined') {
            data = data.replace(current.raw, this._entry);
        }
        else {
            data += '\n\n' + this._entry;
        }
        this._entry = null;
        return data;
    }
    /**
    * (internal function) Invoked after config file is written,
    * then executes reconfiguration command
    *
    */
    async _writeConfig(data) {
        try {
            await fs_extra_1.writeFile(filePath, data, 'utf8');
        }
        catch (err) {
            log.error('_readConfigCb', err);
            throw err;
        }
    }
    /**
    * (internal function) Invoked after reconfiguration command is complete
    *
    */
    async _reconfigure() {
        return new Promise((resolve, reject) => {
            return child_process_1.exec(reconfigure, (err, stdout, stderr) => {
                if (err) {
                    return reject(err);
                }
                log.info('Wifi reconfigured');
                return resolve(true);
            });
        });
    }
    /**
    * (internal function) Invoked after wifi refresh command is complete
    *
    */
    async _refresh() {
        return new Promise((resolve, reject) => {
            return child_process_1.exec(refresh, (err, stdout, stderr) => {
                if (err) {
                    return reject(err);
                }
                log.info('Wifi refreshed');
                return resolve({ ssid: this._ssid });
            });
        });
    }
    _parseConfig(str) {
        const networks = [];
        const lines = str.split('\n');
        let network = {};
        for (let line of lines) {
            if (line.substring(0, 9) === 'network={') {
                network = {};
                network.raw = line;
            }
            else if (network.raw && line.indexOf('ssid=') !== -1) {
                network.ssid = line.replace('ssid=', '').trim().replace(quoteRe, '');
                if (network.raw) {
                    network.raw += '\n' + line;
                }
            }
            else if (network.raw && line.substring(0, 1) === '}') {
                network.raw += '\n' + line;
                networks.push(network);
                network = {};
            }
            else if (network.raw) {
                network.raw += '\n' + line;
            }
        }
        return networks;
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
    createPSK(ssid, pwd) {
        const cmd = `wpa_passphrase '${ssid.replace(/'/g, `'\\''`)}' '${pwd.replace(/'/g, `'\\''`)}' | grep "psk="`;
        let lines;
        let hash;
        let plaintext;
        return new Promise((resolve, reject) => {
            return child_process_1.exec(cmd, (err, stdout, stderr) => {
                if (err) {
                    return reject(err);
                }
                lines = stdout.replace('#psk=', '').split('psk=');
                hash = lines[1];
                plaintext = lines[0];
                return resolve({ hash: hash.trim(), plaintext: plaintext.trim() });
            });
        });
    }
    /**
    * Function which initializes the processes for adding a wifi access point authentication
    *
    * @param {string} 	ssid 		SSID of network to configure
    * @param {string} 	pwd 		Password of access point, plaintext to be masked
    * @param {string} 	hash 		Password/SSID of access point, securely hashed
    */
    async setNetwork(ssid, pwd, hash) {
        let masked = pwd.split('').map(char => { return char !== '"' ? '*' : '"'; }).join('');
        let data;
        this._entry = `network={\n\tssid="${ssid}"\n\t#psk=${masked}\n\tpsk=${hash}\n}\n`;
        this._ssid = ssid;
        try {
            data = await this._readConfig();
        }
        catch (err) {
            log.error(err);
        }
        try {
            await this._writeConfig(data);
        }
        catch (err) {
            log.error(err);
        }
        try {
            await this._reconfigure();
        }
        catch (err) {
            log.error(err);
        }
        try {
            await this._refresh();
        }
        catch (err) {
            log.error(err);
        }
        return { ssid: this._ssid };
    }
    /**
    * Executes command which gets the currently connected network
    *
    * @param {function} 	callback 	Function which is invoked after command is completed
    */
    async getNetwork() {
        let output;
        return new Promise((resolve, reject) => {
            return child_process_1.exec(iwgetid, (err, stdout, stderr) => {
                if (err) {
                    return reject(err);
                }
                output = stdout.split('ESSID:')[1].replace(quoteRe, '').trim();
                return resolve(output);
            });
        });
    }
}
exports.Wifi = Wifi;
module.exports.Wifi = Wifi;
//# sourceMappingURL=index.js.map