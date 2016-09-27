window.mdds = (function () {
  'use strict';

  var editor = null;
  var byId = document.getElementById.bind(document);

  window.onload = function () {
    var editorElem = byId('editor');
    if (editorElem) {
      editor = ace.edit('editor');
      editor.setTheme('ace/theme/clouds');
      editor.getSession().setMode('ace/mode/markdown');
    }

    document.addEventListener('click', function (e) {
      if (e.target.id === 'add-modal')
        window.mdds.closeAdd();
    }, false);
    document.addEventListener('keydown', function (e) {
      if (e.keyCode === 27)
        window.mdds.closeAdd();
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