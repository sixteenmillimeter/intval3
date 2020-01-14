'use strict'

const { transports, format, createLogger } = require('winston')

/**
* createLog() - Returns a winston logger configured to service
*
* @param {string} label Label appearing on logger
* @param {string} filename Optional file to write log to 
* @returns {object} Winston logger
*/
function createLog (label, filename = null) {
    const transportsArr = [ new (transports.Console)({ label : label }) ]
    if (filename !== null) {
        transportsArr.push( new (transports.File)({ label : label, filename : filename }) )
    }
    return new (createLogger)({
    	format: format.combine(
    		format.label({ label : arg.label || 'intval3' }),
			format.timestamp({
				format: 'YYYY-MM-DD HH:mm:ss'
			}),
			format.printf((info) => `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`+(info.splat!==undefined?`${info.splat}`:" "))
  		),
        transports: transportsArr
    })
}

module.exports = createLog