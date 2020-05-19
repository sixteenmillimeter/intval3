'use strict';

const fs = require('fs')
const uuid = require('uuid').v4
const PACKAGE = require('../package.json')

const INDEX = './www/index.html'

function patch (versionStr) {
	const parts = versionStr.split('.');
	const patch = parseInt(parts[2])
	return `${parts[0]}.${parts[1]}.${patch+1}`
}

async function main () {
	const build = uuid()
	const short = build.split('-')[0]
	const index = fs.readFileSync(INDEX, 'utf8')
	const lines = index.split('\n')
	let output

	for (let i = 0; i < lines.length; i++) {
		if (lines[i].indexOf('id="version"') !== -1) {
			lines[i] = `	<div id="version">v${PACKAGE.version} build ${short}</div>`
		}
	}
	output = lines.join('\n')
	fs.writeFileSync(INDEX, output, 'utf8')
}

main()