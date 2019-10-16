'use strict'

import uuid from 'uuid/v4';
const log = require('../log')('seq');
import '../delay';

const MAX_INTEGER = 2147483647;

interface Options {
	len? : number;
}

/** Object sequence features */
class Sequence {
	public _state : any = {
		arr : []
	}
	private id : string;

	private active : boolean = false;
	private paused : boolean = false;

	private frame : boolean = false;
	private delay : boolean = false;
	private count : number = 0;

	private _stop : Function = null;

	public _loop : any = {
		arr : [],
		count : 0,
		max : 0
	}

	constructor (intval : Intval) {

	}
	/**
	 * Start running a "sequence" of frames. Shoots a continuous sequence
	 * of single frames with a delay in between each one.
	 **/
	public startOld (options : any, cb : Function) {
		if (this._state.active) {
			return false
		}

		this.active = true
		this.count = 0

		if (options.arr) {
			this._state.arr = options.arr
		}

		if (options.loop) {
			this._loop.arr = options.loop
			this._loop.count = 0
		}

		if (options.maxLoop) {
			this._loop.max = options.maxLoop
		} else {
			this._loop.max = 0
		}
		this._stop = cb
		this.step() 
		this.id = uuid()
		return this.id
	}

	public async start (options : Options) {

	}

	public setStop () {
		this.active = false
	}

	public stop = function () {
		this.active = false
		this.count = 0
		this._state.arr = []

		this._loop.count = 0
		this._loop.max = 0
		this._loop.arr = []

		if (this._stop) this._stop()

		this._stop = null
	}

	public pause () {
		this.paused = true
	}

	public resume () {
		this.paused = false
		this.step()
	}

	public step () {
		if (this.active && !this.paused) {
			if (this._state.arr.length > 0) {
				if (this.count > this._state.arr.length - 1) {
					return this.stop()
				}
				log.info('step', { count : this.count, id : this._state.id })
				return this._state.arr[this.count](() => {
					this.count++
					this.step()
				})
			} else if (this._loop.arr.length > 0) {
				if (this.count > this._loop.arr.length - 1) {
					this.count = 0
					this._loop.count++
				}
				if (this._loop.max > 0 && this._loop.count > this._loop.max) {
					return this.stop()
				}
				log.info('step', { count : this.count, id : this.id })
				return this._loop.arr[this.count](() => {
					this.count++
					this.step()
				})
			} else{
				return this.stop()
			}
		} else if (this.paused) {
			log.info('step', 'Sequence paused', { loop : this._loop.count, count : this.count })
		} else if (!this.active) {
			log.info('step', 'Sequence stopped', { loop : this._loop.count, count : this.count })
		}
	}
}

module.exports = new Sequence();