window.hads = (function () {
  'use strict';

  var editor = null;
  var byId = document.getElementById.bind(document);
  var hads = {
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
  };

  window.onload = function () {
    var editorElem = byId('editor');
    if (editorElem) {
      editor = ace.edit('editor');
      editor.setOptions({
        useSoftTabs: true,
        tabSize: 2,
        mode: 'ace/mode/markdown',
        theme: 'ace/theme/clouds',
        useWrapMode: true
      });
      var session = editor.getSession();
      var count = session.getLength();
      editor.focus();
      editor.gotoLine(count, session.getLine(count-1).length);
      editor.commands.addCommand({
        name: 'save',
        bindKey: {
          win: 'Ctrl-S',
          mac: 'Command-S'
        },
        exec: hads.save,
        readOnly: true
      });
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

  return hads;
})();