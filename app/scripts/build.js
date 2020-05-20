'use strict';

const fs = require('fs')
const uuid = require('uuid').v4
const PACKAGE = require('../package.json')

const INDEX = './www/index.html'
const CONFIG = './config.xml'

function patch (versionStr) {
	const parts = versionStr.split('.');
	const patch = parseInt(parts[2])
	return `${parts[0]}.${parts[1]}.${patch+1}`
}

async function main () {
	const build = uuid()
	const short = build.split('-')[0]
	const index = fs.readFileSync(INDEX, 'utf8')
	const config = fs.readFileSync(CONFIG, 'utf8')
	let lines = index.split('\n')
	let output

	for (let i = 0; i < lines.length; i++) {
		if (lines[i].indexOf('id="version"') !== -1) {
			lines[i] = `	<div id="version">v${PACKAGE.version} build ${short}</div>`
			break
		}
	}

	output = lines.join('\n')
	fs.writeFileSync(INDEX, output, 'utf8')

	lines = config.split('\n')

	for (let i = 0; i < lines.length; i++) {
		if (lines[i].indexOf('id="com.sixteenmillimeter.intval3"') !== -1) {
			lines[i] = `<widget id="com.sixteenmillimeter.intval3" version="${PACKAGE.version}" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">`
			break
		}
	}
	output = lines.join('\n')
	fs.writeFileSync(CONFIG, output, 'utf8')

}

main()