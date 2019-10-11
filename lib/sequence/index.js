'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require('uuid').v4;
const log = require('../log')('seq');
require("../delay");
/** Object sequence features */
class Sequence {
    constructor() {
        this._state = {
            arr: [],
            active: false,
            paused: false,
            frame: false,
            delay: false,
            count: 0,
            stop: null
        };
        this._loop = {
            arr: [],
            count: 0,
            max: 0
        };
        this.stop = function () {
            this._state.active = false;
            this._state.count = 0;
            this._state.arr = [];
            this._loop.count = 0;
            this._loop.max = 0;
            this._loop.arr = [];
            if (this._state.stop)
                this._state.stop();
            this._state.stop = null;
        };
    }
    start(options, cb) {
        if (this._state.active) {
            return false;
        }
        this._state.active = true;
        this._state.count = 0;
        if (options.arr) {
            this._state.arr = options.arr;
        }
        if (options.loop) {
            this._loop.arr = options.loop;
            this._loop.count = 0;
        }
        if (options.maxLoop) {
            this._loop.max = options.maxLoop;
        }
        else {
            this._loop.max = 0;
        }
        this._state.stop = cb;
        this.step();
        this._state.id = uuid();
        return this._state.id;
    }
    setStop() {
        this._state.active = false;
    }
    pause() {
        this._state.paused = true;
    }
    resume() {
        this._state.paused = false;
        this.step();
    }
    step() {
        if (this._state.active && !this._state.paused) {
            if (this._state.arr.length > 0) {
                if (this._state.count > this._state.arr.length - 1) {
                    return this.stop();
                }
                log.info('step', { count: this._state.count, id: this._state.id });
                return this._state.arr[this._state.count](() => {
                    this._state.count++;
                    this.step();
                });
            }
            else if (this._loop.arr.length > 0) {
                if (this._state.count > this._loop.arr.length - 1) {
                    this._state.count = 0;
                    this._loop.count++;
                }
                if (this._loop.max > 0 && this._loop.count > this._loop.max) {
                    return this.stop();
                }
                log.info('step', { count: this._state.count, id: this._state.id });
                return this._loop.arr[this._state.count](() => {
                    this._state.count++;
                    this.step();
                });
            }
            else {
                return this.stop();
            }
        }
        else if (this._state.paused) {
            log.info('step', 'Sequence paused', { loop: this._loop.count, count: this._state.count });
        }
        else if (!this._state.active) {
            log.info('step', 'Sequence stopped', { loop: this._loop.count, count: this._state.count });
        }
    }
}
module.exports = new Sequence();
//# sourceMappingURL=index.js.map