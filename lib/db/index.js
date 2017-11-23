'use strict'

const os = require('os')
const sqlite3 = require('sqlite3').verbose()
const squel = require('squel')
const DB_FILE = os.homedir() + '/.intval3.db'
const db = new sqlite3.Database(DB_FILE)

class DB {
	constructor () {
		this._table = 'frames'
		this.createTable()
	}
	createTable () {
		const query = `CREATE TABLE
		IF NOT EXISTS ${this._table} (
			dir BOOLEAN,
			exposure INTEGER,
			start INTEGER,
			stop INTEGER,
			len INTEGER,
			counter INTEGER
		);`
		db.run(query)
	}
	insert (obj) {
		const query = squel.insert()
				.into(this._table)
				.setFields(obj) //dir, exposure, start, stop, len, counter
				.toString()
		db.run(query)
	}
}

module.exports = new DB()