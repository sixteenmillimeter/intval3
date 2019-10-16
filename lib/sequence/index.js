'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v4_1 = __importDefault(require("uuid/v4"));
const log = require('../log')('seq');
require("../delay");
/** Object sequence features */
class Sequence {
    constructor() {
        this._state = {
            arr: []
        };
        this.active = false;
        this.paused = false;
        this.frame = false;
        this.delay = false;
        this.count = 0;
        this._stop = null;
        this._loop = {
            arr: [],
            count: 0,
            max: 0
        };
        this.stop = function () {
            this.active = false;
            this.count = 0;
            this._state.arr = [];
            this._loop.count = 0;
            this._loop.max = 0;
            this._loop.arr = [];
            if (this._stop)
                this._stop();
            this._stop = null;
        };
    }
    /**
     * Start running a "sequence" of frames. Shoots a continuous sequence
     * of single frames with a delay in between each one.
     **/
    start(options, cb) {
        if (this._state.active) {
            return false;
        }
        this.active = true;
        this.count = 0;
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
        this._stop = cb;
        this.step();
        this.id = v4_1.default();
        return this.id;
    }
    setStop() {
        this.active = false;
    }
    pause() {
        this.paused = true;
    }
    resume() {
        this.paused = false;
        this.step();
    }
    step() {
        if (this.active && !this.paused) {
            if (this._state.arr.length > 0) {
                if (this.count > this._state.arr.length - 1) {
                    return this.stop();
                }
                log.info('step', { count: this.count, id: this._state.id });
                return this._state.arr[this.count](() => {
                    this.count++;
                    this.step();
                });
            }
            else if (this._loop.arr.length > 0) {
                if (this.count > this._loop.arr.length - 1) {
                    this.count = 0;
                    this._loop.count++;
                }
                if (this._loop.max > 0 && this._loop.count > this._loop.max) {
                    return this.stop();
                }
                log.info('step', { count: this.count, id: this.id });
                return this._loop.arr[this.count](() => {
                    this.count++;
                    this.step();
                });
            }
            else {
                return this.stop();
            }
        }
        else if (this.paused) {
            log.info('step', 'Sequence paused', { loop: this._loop.count, count: this.count });
        }
        else if (!this.active) {
            log.info('step', 'Sequence stopped', { loop: this._loop.count, count: this.count });
        }
    }
}
module.exports = new Sequence();
//# sourceMappingURL=index.js.map