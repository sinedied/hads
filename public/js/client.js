window.mdds = (function(){
  'use strict';

  var editor = null;

  function init() {
    var editorElem = document.getElementById('editor');
    if (editorElem) {
      editor = ace.edit('editor');
      editor.setTheme("ace/theme/clouds");
      editor.getSession().setMode("ace/mode/markdown");
    }
  }

  function save() {
    if (editor) {
      document.getElementById('content').value = editor.getValue();
      document.getElementById('form').submit();
    }
  }

  window.onload = init;

  return {
    save: save
  }
})();