'use strict'

const onoffsim = {
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