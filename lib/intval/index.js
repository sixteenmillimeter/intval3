'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const db = require('../db');
const log = require('../log')('intval');
const storage = require("node-persist");
const fs_extra_1 = require("fs-extra");
const delay_1 = require("../delay");
let Gpio;
try {
    Gpio = require('onoff').Gpio;
}
catch (e) {
    log.warn('Failed including Gpio, using sim');
    Gpio = require('../../lib/onoffsim').Gpio;
}
const PINS = {
    fwd: {
        pin: 13,
        dir: 'out'
    },
    bwd: {
        pin: 19,
        dir: 'out'
    },
    micro: {
        pin: 5,
        dir: 'in',
        edge: 'both'
    },
    release: {
        pin: 6,
        dir: 'in',
        edge: 'both'
    }
};
/** class representing the intval3 features */
class Intval {
    constructor() {
        this.STATE_DIR = '~/state';
        this._frame = {
            open: 250,
            openBwd: 400,
            closed: 100,
            expected: 530 //expected length of frame, in ms
        };
        this._release = {
            min: 20,
            seq: 1000,
            time: 0,
            active: false
        };
        this._micro = {
            time: 0,
            primed: false,
            delay: 10 // delay after stop signal before stopping motors
        };
        this._pin = {};
        this._state = {};
        this._init();
    }
    /**
     * Initialize the storage object and bind functions to process events.
     */
    async _init() {
        let dirExists;
        const storateOptions = {
            dir: this.STATE_DIR,
            stringify: JSON.stringify,
            parse: JSON.parse,
            encoding: 'utf8',
            logging: false,
            continuous: true,
            interval: false,
            ttl: false,
        };
        try {
            dirExists = await fs_extra_1.pathExists(this.STATE_DIR);
        }
        catch (err) {
            log.error('_init', `Error locating state directory ${this.STATE_DIR}`);
        }
        if (!dirExists) {
            try {
                await fs_extra_1.mkdir(this.STATE_DIR);
            }
            catch (err) {
                log.error('_init', `Error creating state directory ${this.STATE_DIR}`);
            }
        }
        try {
            await storage.init(storateOptions);
        }
        catch (err) {
            log.error('_init', err);
        }
        try {
            await this._restoreState();
        }
        catch (err) {
            log.warn('_init', err);
            this.reset();
            this._declarePins();
        }
        process.on('SIGINT', this._undeclarePins.bind(this));
        process.on('uncaughtException', this._undeclarePins.bind(this));
    }
    /**
     * Restore the state from the storage object
     */
    async _restoreState() {
        let data;
        try {
            data = await storage.getItem('_state');
        }
        catch (err) {
            log.error('_restoreState', err);
        }
        try {
            this._setState(data);
        }
        catch (err) {
            log.error('_restoreState', err);
            this._setState();
        }
        this._declarePins();
    }
    /**
     * Creating the state object.
     */
    _setState(data = undefined) {
        if (typeof data !== 'undefined') {
            this._state = data;
            this._state.frame.cb = () => { };
            log.info('_setState', 'Restored intval state from disk');
            return true;
        }
        log.info('_setState', 'Setting state from defaults');
        this._state = {
            frame: {
                dir: true,
                start: 0,
                active: false,
                paused: false,
                exposure: 0,
                delay: 0,
                current: {},
                cb: () => { }
            },
            counter: 0,
            sequence: false
        };
        this._storeState();
    }
    /**
     * Store the state object.
     */
    _storeState() {
        try {
            storage.setItem('_state', this._state);
        }
        catch (err) {
            log.error('_storeState', err);
        }
    }
    /**
     * (internal function) Declares all Gpio pins that will be used.
     */
    _declarePins() {
        let pin;
        for (let p in PINS) {
            pin = PINS[p];
            if (pin.edge)
                this._pin[p] = new Gpio(pin.pin, pin.dir, pin.edge);
            if (!pin.edge)
                this._pin[p] = new Gpio(pin.pin, pin.dir);
            log.info('_declarePins', { pin: pin.pin, dir: pin.dir, edge: pin.edge });
        }
        this._pin.release.watch(this._watchRelease.bind(this));
    }
    /**
     * (internal function) Undeclares all Gpio in event of uncaught error
     * that interupts the node process.
     */
    _undeclarePins(e) {
        log.error('_undeclarePins', e);
        if (!this._pin) {
            log.warn('_undeclarePins', { reason: 'No pins' });
            return process.exit();
        }
        log.warn('_undeclarePins', { pin: PINS.fwd.pin, val: 0, reason: 'exiting' });
        this._pin.fwd.writeSync(0);
        log.warn('_undeclarePins', { pin: PINS.bwd.pin, val: 0, reason: 'exiting' });
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
    _startFwd() {
        this._pin.fwd.writeSync(1);
        this._pin.bwd.writeSync(0);
    }
    /**
     * Start motor in backward direction by setting correct pins in h-bridge
     */
    _startBwd() {
        this._pin.fwd.writeSync(0);
        this._pin.bwd.writeSync(1);
    }
    /**
     * Turn off all directions
     */
    _pause() {
        this._pin.fwd.writeSync(0);
        this._pin.bwd.writeSync(0);
        //log.info('_pause', 'frame paused')
    }
    /**
     * Stop motor by setting both motor pins to 0 (LOW)
     */
    _stop() {
        const entry = {};
        const now = +new Date();
        const len = now - this._state.frame.start;
        this._pin.fwd.writeSync(0);
        this._pin.bwd.writeSync(0);
        log.info(`_stop`, { frame: len });
        this._pin.micro.unwatch();
        this._state.frame.active = false;
        if (this._state.frame.cb)
            this._state.frame.cb(len);
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
    async _watchMicro(err, val) {
        const now = +new Date();
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
        }
        else if (val === 1 && this._state.frame.active) {
            if (this._micro.primed && !this._micro.paused && (now - this._state.frame.start) > this._frame.open) {
                this._micro.primed = false;
                this._micro.time = 0;
                await delay_1.delay(this._micro.delay);
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
    _watchRelease(err, val) {
        const now = +new Date();
        let press = 0;
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
        }
        else if (val === 1) {
            //opened
            if (this._release.active) {
                press = now - this._release.time;
                if (press > this._release.min && press < this._release.seq) {
                    this.frame();
                }
                else if (press >= this._release.seq) {
                    this._sequence();
                }
                //log.info(`Release closed for ${press}ms`)
                this._release.time = 0;
                this._release.active = false;
            }
        }
    }
    _sequence() {
        if (this.sequence) {
            this._state.sequence = this.sequence();
        }
    }
    /**
     *
     */
    _releaseClosedState(now) {
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
    reset() {
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
    setDir(val = true) {
        if (typeof val !== 'boolean') {
            return log.warn('Direction must be represented as either true or false');
        }
        this._state.frame.dir = val;
        this._storeState();
        log.info('setDir', { direction: val ? 'forward' : 'backward' });
    }
    /**
     * Set the exposure value for a single frame.
     *
     * @param {integer} val Length in milliseconds
     */
    setExposure(val = 0) {
        this._state.frame.exposure = val;
        this._storeState();
        log.info('setExposure', { exposure: val });
    }
    /**
     * Set the delay time between each frame.
     *
     * @param {integer} val Length in milliseconds
     */
    setDelay(val = 0) {
        this._state.frame.delay = val;
        this._storeState();
        log.info('setDelay', { delay: val });
    }
    /**
     * Set the counter to the value.
     *
     * @param {integer} val Frame number
     */
    setCounter(val = 0) {
        this._state.counter = val;
        this._storeState();
        log.info('setCounter', { counter: val });
    }
    /**
    * Begin a single frame with set variables or defaults
    *
    * @param {?boolean} 	[dir="null"] 			(optional) Direction of the frame
    * @param {?integer} 	[exposure="null"] 		(optional) Exposure time, 0 = minimum
    *
    */
    async frame(dir = null, exposure = null) {
        if (dir === true || (dir === null && this._state.frame.dir === true)) {
            dir = true;
        }
        else {
            dir = false;
        }
        if (exposure === null && this._state.frame.exposure !== 0) {
            exposure = this._state.frame.exposure;
        }
        else if (exposure === null) {
            exposure = 0; //default speed
        }
        this._state.frame.current.exposure = exposure;
        this._state.frame.current.dir = dir;
        this._state.frame.start = +new Date();
        this._state.frame.active = true;
        this._pin.micro.watch(this._watchMicro.bind(this));
        log.info('frame', { dir: dir ? 'forward' : 'backward', exposure });
        if (dir) {
            this._startFwd();
        }
        else {
            this._startBwd();
        }
        if (exposure !== 0) {
            this._state.frame.paused = true;
            if (dir) {
                await delay_1.delay(this._frame.open);
                this._pause();
                await delay_1.delay(exposure + this._frame.closed);
                this._state.frame.paused = false;
                this._startFwd();
            }
            else {
                await delay_1.delay(this._frame.openBwd);
                this._pause();
                await delay_1.delay(exposure + this._frame.closed);
                this._state.frame.paused = false;
                this._startBwd();
            }
        }
        if (dir) {
            this._state.frame.cb = (len) => {
                this._state.counter++;
                this._storeState();
            };
        }
        else {
            this._state.frame.cb = (len) => {
                this._state.counter--;
                this._storeState();
            };
        }
    }
    /**
     * Returns the state of the
     */
    status() {
        return this._state;
    }
}
exports.default = Intval;
module.exports = Intval;
//# sourceMappingURL=index.js.map