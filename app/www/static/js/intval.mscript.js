'use strict'
const editor = {}

editor.init = function () {
	const elem = document.getElementById('mscript_editor');
	editor.cm = CodeMirror.fromTextArea(elem, {
		lineNumbers: true,
		theme : 'monokai',
		gutters: ['CodeMirror-linenumbers']
	});
	setTimeout(() => {
		editor.cm.setValue('CF');
		editor.cm.refresh();
	}, 10);
};

document.addEventListener('DOMContentLoaded', event => {
	editor.init();
});