'use strict'

/** Object representing a fake onoff Gpio class */
const onoffsim = {
	/**
	* Gpio() - 
	* Returns a Gpio class in the case of running on a dev machine
	*
	* @param {integer}	no 			Number of the GPIO pin
	* @param {string} 	dir 		Dirction of the pin, 'input' or 'output'
	* @param {string} 	additional 	Additional instructions for the GPIO pin, for 'input' type
	* @returns {object} Fake Gpio object
	*/
	Gpio : function (no, dir = 'in', additional = 'none') {
		//
		return {
			no : no,
			dir : dir,
			additional : additional,
			val : null,
			watchFunc : null,
			set : function (val) {
				console.log(`onoffsim set ${this.no} to ${val}`)
			},
			get : function () {
				return this.val
			},
			watch : function (cb) {
				this.watchFunc = cb
			}
		}
	}
}

module.exports = onoffsim