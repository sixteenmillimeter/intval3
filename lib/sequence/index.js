'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v4_1 = __importDefault(require("uuid/v4"));
const log = require('../log')('seq');
const delay_1 = require("../delay");
const MAX_INTEGER = 2147483647;
/** Object sequence features */
class Sequence {
    /**
     * @constructor
     *
     * Create a sequencer object from class
     **/
    constructor(intval) {
        this.active = false;
        this.delay = 0;
        this.count = 0;
        /**
         * Stop a running sequence and reset counter and delay
         **/
        this._stop = function () {
            this.active = false;
            this.count = 0;
            this.delay = 0;
            this.intval._state.sequence = false;
            log.info('_stop', { id: this.id, stopped: true });
        };
        this.intval = intval;
        //push button callback
        this.intval.sequence = function () {
            if (this.active) {
                this.stop();
                return false;
            }
            else {
                this.start();
                return true;
            }
        };
    }
    /**
     * Start running a "sequence" of frames. Shoots a continuous sequence
     * of single frames with a delay in between each one.
     **/
    async start(options) {
        let len = typeof options.len !== 'undefined' ? options.len : MAX_INTEGER;
        let multiple = typeof options.multiple !== 'undefined' ? options.multiple : 1;
        this.id = v4_1.default();
        this.delay = typeof options.delay !== 'undefined' ? options.delay : this.intval._state.frame.delay;
        this.count = 0;
        this.active = true;
        log.info({ id: this.id, started: true });
        for (let i = 0; i < len; i++) {
            if (multiple > 1) {
                for (let x = 0; x < multiple; x++) {
                    await this.intval.frame();
                    log.info('frame', { id: this.id, count: this.count });
                    this.count++;
                }
            }
            else {
                await this.intval.frame();
                log.info('frame', { id: this.id, count: this.count });
                this.count++;
            }
            if (this.delay > 0 && i < len - 1) {
                await delay_1.delay(this.delay);
            }
            if (!this.active) {
                break;
            }
        }
        this._stop();
    }
    /**
     * Public method to stop a sequence from the web or ble interface
     **/
    stop() {
        this.active = false;
    }
}
exports.Sequence = Sequence;
module.exports = Sequence;
//# sourceMappingURL=index.js.map