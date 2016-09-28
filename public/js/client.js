window.hads = (function () {
  'use strict';

  var editor = null;
  var byId = document.getElementById.bind(document);

  window.onload = function () {
    var editorElem = byId('editor');
    if (editorElem) {
      editor = ace.edit('editor');
      editor.setTheme('ace/theme/clouds');
      let session = editor.getSession();
      let count = session.getLength();
      session.setMode('ace/mode/markdown');
      editor.focus();
      editor.gotoLine(count, session.getLine(count-1).length);
    }

    document.addEventListener('click', function (e) {
      if (e.target.id === 'add-modal')
        window.hads.closeAdd();
    }, false);
    document.addEventListener('keydown', function (e) {
      if (e.keyCode === 27)
        window.hads.closeAdd();
    }, false);
  };

  return {
    save: function () {
      if (editor) {
        byId('content').value = editor.getValue();
        byId('form').submit();
      }
    },
    showAdd: function () {
      byId('add-modal').className = '';
      byId('add').focus();
    },
    closeAdd: function () {
      byId('add-modal').className = 'hidden';
    },
    add: function (file) {
      this.closeAdd();
      window.location = '/' + file + '?create=1';
    }
  }
})();