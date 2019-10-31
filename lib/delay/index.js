'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Delay in an async/await function
 *
 * @param {integer}  ms 	Milliseconds to delay for
 *
 * @returns {Promise} Promise to resolve after timeout
 **/
function delay(ms) {
    return new Promise((resolve) => {
        return setTimeout(resolve, ms);
    });
}
exports.delay = delay;
module.exports.delay = delay;
exports.default = delay;
//# sourceMappingURL=index.js.map