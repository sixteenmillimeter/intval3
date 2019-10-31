'use strict'

import uuid from 'uuid/v4';
const log = require('../log')('seq');
import { delay } from '../delay';

const MAX_INTEGER = 2147483647;

interface Options {
	len? : number;
	multiple? : number;
	delay? : number;
}

interface Loop {
	count : number;
	max : number;
	delay : number;
}

/** Object sequence features */
export class Sequence {
	private id : string

	private active : boolean = false

	private delay : number = 0
	private count : number = 0

	private intval : any

	/**
	 * @constructor
	 *
	 * Create a sequencer object from class
	 **/

	constructor (intval : any) {
		this.intval = intval
		this.intval.sequence = function () {
			if (this.active) {
				this.stop()
				return false
			} else {
				this.start()
				return true
			}
		}
	}

	/**
	 * Start running a "sequence" of frames. Shoots a continuous sequence
	 * of single frames with a delay in between each one.
	 **/

	public async start (options : Options) {
		let len : number = typeof options.len !== 'undefined' ? options.len : MAX_INTEGER
		let multiple : number = typeof options.multiple !== 'undefined' ? options.multiple : 1
		
		this.id = uuid()
		this.delay = typeof options.delay !== 'undefined' ? options.delay : 0
		this.count = 0
		this.active = true

		log.info({ id : this.id, started : true })

		for (let i = 0; i < len; i++) {
			if (multiple > 1) {
				for (let x = 0; x < multiple; x++) {
					await this.intval.frame()
					log.info('start', { id : this.id, count : this.count })
					this.count++
				}
			} else {
				await this.intval.frame()
				log.info('start', { id : this.id, count : this.count })
				this.count++
			}


			if (this.delay > 0 && i < len - 1) {
				await delay(this.delay)
			}

			if (!this.active) {
				break
			}
		}

		this.stop()
	}

	/**
	 * Stop a running sequence and reset counter and delay
	 **/
	public stop = function () {
		this.active = false
		this.count = 0
		this.delay = 0

		log.info('start', { id : this.id, stopped : true })
	}
}

module.exports = Sequence

