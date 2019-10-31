'use strict'

const db = require('../db')
const log = require('../log')('intval')
import storage = require('node-persist')
import { pathExists, mkdir } from 'fs-extra'
import { delay } from '../delay'

let Gpio : any
try {
	Gpio = require('onoff').Gpio
} catch (e) {
	log.warn('Failed including Gpio, using sim')
	Gpio = require('../../lib/onoffsim').Gpio
}


const PINS : any = {
	fwd : {
		pin : 13,
		dir : 'out'
	},
	bwd : {
		pin : 19,
		dir : 'out'
	},
	micro : {
		pin : 5,
		dir : 'in',
		edge : 'both'
	},
	release : {
		pin : 6,
		dir  : 'in',
		edge : 'both'
	}
}

interface State {

}

interface Entry {
	start : number
	stop : number
	len : number
	dir : number
	exposure  : number
	counter  : number
	sequence : number
}

/** class representing the intval3 features */
export default class Intval {

	private STATE_DIR : string = '~/state'

	private _frame : any = {
		open : 250, 	//delay before pausing frame in open state
		openBwd : 400,
		closed : 100,   //time that frame actually remains closed for
		expected : 530 	//expected length of frame, in ms
	}
	private _release : any = {
		min : 20,
		seq : 1000,
		time : 0,
		active : false
	}

	private _micro : any = {
		time : 0,
		primed : false, //is ready to stop frame
		delay : 10// delay after stop signal before stopping motors
	}

	private _pin : any = {};
	private _state : any = {};
	private storage : any;

	public sequence : any;

	constructor() {
		this._init()
	}

	/**
	 * Initialize the storage object and bind functions to process events.
	 */

	private async _init () {
		let dirExists : boolean;
		const storateOptions = {
			dir: this.STATE_DIR,
			stringify: JSON.stringify,
			parse: JSON.parse,
			encoding: 'utf8',
			logging: false,  // can also be custom logging function
			continuous: true, // continously persist to disk
			interval: false, // milliseconds, persist to disk on an interval
			ttl: false, // ttl* [NEW], can be true for 24h default or a number in MILLISECONDS
			//expiredInterval: 2 * 60 * 1000, // [NEW] every 2 minutes the process will clean-up the expired cache
		    //forgiveParseErrors: false // [NEW]
		}
		
		try {
			dirExists = await pathExists(this.STATE_DIR);
		} catch (err) {
		 	log.error('_init', `Error locating state directory ${this.STATE_DIR}`);
		}

		if (!dirExists) {
			try {
				await mkdir(this.STATE_DIR);
			} catch (err) {
				log.error('_init', `Error creating state directory ${this.STATE_DIR}`);
			}
		}
		
		try {
			await storage.init(storateOptions);
		} catch (err) {
			log.error('_init', err);
		}

		try {
			await this._restoreState();
		} catch (err) { 
			log.warn('_init', err) ;
			this.reset();
			this._declarePins();
		}

		process.on('SIGINT', this._undeclarePins.bind(this));
		process.on('uncaughtException', this._undeclarePins.bind(this));
	}

	/**
	 * Restore the state from the storage object
	 */

	private async _restoreState () {
		let data : any;

		try {
			data = await storage.getItem('_state');
		} catch (err) {
			log.error('_restoreState', err);
		}

		try {
			this._setState(data);
		} catch (err) {
			log.error('_restoreState', err);
			this._setState();
		}

		this._declarePins();
	}

	/**
	 * Creating the state object.
	 */

	private _setState (data : any = undefined) {
		if (typeof data !== 'undefined') {
			this._state = data;
			this._state.frame.cb = () => {};
			log.info('_setState', 'Restored intval state from disk');
			return true;
		}
		log.info('_setState', 'Setting state from defaults');
		this._state = {
			frame : {
				dir : true, 	//forward
				start : 0, 		//time frame started, timestamp
				active : false, //should frame be running
				paused : false,
				exposure : 0, 	//length of frame exposure, in ms
				delay : 0, 		//delay before start of frame, in ms
				current : {}, //current settings
				cb : () => {}
			},
			counter : 0,
			sequence : false
		}
		this._storeState();
	}

	/**
	 * Store the state object.
	 */

	private _storeState () {
		try {
			storage.setItem('_state', this._state);
		} catch (err) {
			log.error('_storeState', err);
		}
	}

	/**
	 * (internal function) Declares all Gpio pins that will be used.
	 */

	private _declarePins () {
		let pin : any;
		for (let p in PINS) {
			pin = PINS[p];
			if (pin.edge) this._pin[p] = new Gpio(pin.pin, pin.dir, pin.edge);
			if (!pin.edge) this._pin[p] = new Gpio(pin.pin, pin.dir);
			log.info('_declarePins', { pin : pin.pin, dir : pin.dir, edge : pin.edge });
		}
		this._pin.release.watch(this._watchRelease.bind(this));
	}

	/** 
	 * (internal function) Undeclares all Gpio in event of uncaught error
	 * that interupts the node process.
	 */

	private _undeclarePins (e : Error) {
		log.error('_undeclarePins', e);
		if (!this._pin) {
			log.warn('_undeclarePins', { reason : 'No pins'});
			return process.exit();
		}
		log.warn('_undeclarePins', { pin : PINS.fwd.pin, val : 0, reason : 'exiting'});
		this._pin.fwd.writeSync(0);
		log.warn('_undeclarePins', { pin : PINS.bwd.pin, val : 0, reason : 'exiting'});
		this._pin.bwd.writeSync(0);
		this._pin.fwd.unexport();
		this._pin.bwd.unexport();
		this._pin.micro.unexport();
		this._pin.release.unexport();
		process.exit();
	}

	/**
	 * Start motor in forward direction by setting correct pins in h-bridge
	 */

	private _startFwd () {
		this._pin.fwd.writeSync(1);
		this._pin.bwd.writeSync(0);
	}

	/**
	 * Start motor in backward direction by setting correct pins in h-bridge
	 */

	private _startBwd () {
		this._pin.fwd.writeSync(0);
		this._pin.bwd.writeSync(1);
	}

	/**
	 * Turn off all directions
	 */

	private _pause () {
		this._pin.fwd.writeSync(0);
		this._pin.bwd.writeSync(0);
		//log.info('_pause', 'frame paused')
	}

	/** 
	 * Stop motor by setting both motor pins to 0 (LOW)
	 */

	private _stop () {
		const entry : any = {};
		const now : number = +new Date();
		const len : number = now - this._state.frame.start;

		this._pin.fwd.writeSync(0);
		this._pin.bwd.writeSync(0);

		log.info(`_stop`, { frame : len });

		this._pin.micro.unwatch();
		this._state.frame.active = false;

		if (this._state.frame.cb) this._state.frame.cb(len);
		
		entry.start = this._state.frame.start;
		entry.stop = now;
		entry.len = len;
		entry.dir = this._state.frame.current.dir ? 1 : 0;
		entry.exposure = this._state.frame.current.exposure;
		entry.counter = this._state.counter;
		entry.sequence = this._state.sequence ? 1 : 0;

		db.insert(entry);

		this._state.frame.current = {};
	}

	/**
	* Callback for watching relese switch state changes.
	* Using GPIO 06 on Raspberry Pi Zero W.
	*
	* 1) If closed AND frame active, start timer, set state primed to `true`.
	* 1) If opened AND frame active, stop frame
	*
	* Microswitch + 10K ohm resistor 
	* * 1 === open 
	* * 0 === closed
	*
	*
	* @param {object} 	err 	Error object present if problem reading pin
	* @param {integer} 	val 	Current value of the pin
	*
	*/

	private async _watchMicro (err : Error, val : number) {
		const now : number = +new Date();
		if (err) {
			log.error('_watchMicro', err);
		}
		//log.info(`Microswitch val: ${val}`)
		//determine when to stop
		if (val === 0 && this._state.frame.active) {
			if (!this._micro.primed) {
				this._micro.primed = true;
				this._micro.time = now;
				log.info('Microswitch primed to stop motor');
			}
		} else if (val === 1 && this._state.frame.active) {
			if (this._micro.primed && !this._micro.paused && (now - this._state.frame.start) > this._frame.open) {
				this._micro.primed = false;
				this._micro.time = 0;
				await delay(this._micro.delay)
				this._stop();
			}
		}
	}

	/**
	* Callback for watching relese switch state changes.
	* Using GPIO 05 on Raspberry Pi Zero W.
	*
	* 1) If closed, start timer.
	* 2) If opened, check timer AND
	* 3) If `press` (`now - this._release.time`) greater than minimum and less than `this._release.seq`, start frame
	* 4) If `press` greater than `this._release.seq`, start sequence
	*
	* Button + 10K ohm resistor 
	* * 1 === open 
	* * 0 === closed
	*
	* @param {object} 	err 	Error object present if problem reading pin
	* @param {integer} 	val 	Current value of the pin
	*
	*/

	private _watchRelease (err : Error, val : number) {
		const now : number = +new Date();
		let press : number = 0;
		if (err) {
			return log.error(err);
		}
		//log.info(`Release switch val: ${val}`)
		if (val === 0) {
			//closed
			if (this._releaseClosedState(now)) {
				this._release.time = now;
				this._release.active = true; //maybe unncecessary 
			}
		} else if (val === 1) {
			//opened
			if (this._release.active) {
				press = now - this._release.time;
				if (press > this._release.min && press < this._release.seq) {
					this.frame();
				} else if (press >= this._release.seq) {
					this._sequence();
				}
				//log.info(`Release closed for ${press}ms`)
				this._release.time = 0;
				this._release.active = false;
			}
		}
	}

	private _sequence () {
		if (this.sequence) {
			this._state.sequence = this.sequence()
		}
	}

	/**
	 * 
	 */

	private _releaseClosedState (now : number) {
		if (!this._release.active && this._release.time === 0) {
			return true;
		}
		if (this._release.active && (now - this._release.time) > (this._release.seq * 10)) {
			return true;
		}
		return false;
	}

	/**
	 * Reset the state and store it.
	 */

	public reset () {
		this._setState();
		this._storeState();
	}

	/**
	* Set the default direction of the camera.
	* * forward = true
	* * backward = false
	*
	* @param {boolean} 	[dir=true] 		Direction of the camera
	*/

	public setDir (val : boolean = true) {
		if (typeof val !== 'boolean') {
			return log.warn('Direction must be represented as either true or false');
		}
		this._state.frame.dir = val;
		this._storeState();
		log.info('setDir', { direction : val ? 'forward' : 'backward' });
	}

	/**
	 * Set the exposure value for a single frame.
	 *
	 * @param {integer} val Length in milliseconds
	 */

	public setExposure (val : number = 0) {
		this._state.frame.exposure = val;
		this._storeState();
		log.info('setExposure', { exposure : val });
	} 

	/**
	 * Set the delay time between each frame.
	 *
	 * @param {integer} val Length in milliseconds
	 */

	public setDelay (val : number = 0) {
		this._state.frame.delay = val;
		this._storeState();
		log.info('setDelay', { delay : val });
	}

	/**
	 * Set the counter to the value.
	 *
	 * @param {integer} val Frame number
	 */

	public setCounter (val : number = 0) {
		this._state.counter = val;
		this._storeState();
		log.info('setCounter', { counter : val });
	}

	/**
	* Begin a single frame with set variables or defaults
	*
	* @param {?boolean} 	[dir="null"] 			(optional) Direction of the frame
	* @param {?integer} 	[exposure="null"] 		(optional) Exposure time, 0 = minimum
	*
	*/

	public async frame (dir : boolean = null, exposure : number = null) {
		if (dir === true || (dir === null && this._state.frame.dir === true) ) {
			dir =  true;
		} else {
			dir = false;
		}
		
		if (exposure === null && this._state.frame.exposure !== 0) {
			exposure = this._state.frame.exposure;
		} else if (exposure === null) {
			exposure = 0; //default speed
		}

		this._state.frame.current.exposure = exposure;
		this._state.frame.current.dir = dir;

		this._state.frame.start = +new Date();
		this._state.frame.active = true;
		this._pin.micro.watch(this._watchMicro.bind(this));

		log.info('frame', {dir : dir ? 'forward' : 'backward', exposure });

		if (dir) {
			this._startFwd();
		} else {
			this._startBwd();
		}

		if (exposure !== 0) {
			this._state.frame.paused = true;
			if (dir) {
				await delay(this._frame.open)

				this._pause()
				
				await delay(exposure + this._frame.closed)

				this._state.frame.paused = false
				this._startFwd()
			} else {

				await delay(this._frame.openBwd)

				this._pause()
				
				await delay(exposure + this._frame.closed)

				this._state.frame.paused = false;
				this._startBwd()
			}
		}

		if (dir) {
			return new Promise (function (resolve, reject) {
				this._state.frame.cb = (len : number) => {
					this._state.counter++
					this._storeState()
					return resolve()
				}
			}.bind(this))
		} else {
			return new Promise (function (resolve, reject) {
				this._state.frame.cb = (len : number) => {
					this._state.counter--
					this._storeState()
					return resolve()
				}
			}.bind(this))
		}
	}

	/**
	 * Returns the state of the 
	 */

	public status () {
		return this._state;
	}
}

module.exports = Intval