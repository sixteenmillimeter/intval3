'use strict'

const winston = require('winston')

/**
* createLog() - Returns a winston logger configured to service
*
* @param {string} label Label appearing on logger
* @param {string} filename Optional file to write log to 
* @returns {object} Winston logger
*/
function createLog (label, filename = null) {
    const transports = [ new (winston.transports.Console)({ label : label }) ]
    if (filename !== null) {
        transports.push( new (winston.transports.File)({ label : label, filename : filename }) )
    }
    return new (winston.createLogger)({
        transports: transports
    })
}

module.exports = createLog