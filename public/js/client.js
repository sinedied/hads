window.hads = (function () {
    'use strict';

  var editor = null;
  var byId = document.getElementById.bind(document);
  var module = {
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
        exec: module.save,
        readOnly: true
      });
    }

    var textarea = document.getElementsByTagName('textarea')[0];
    var init = function () {
      var caretPos = 0;
      this.on('drop', function (e) {
        caretPos = textarea.selectionStart;
      });
      this.on('success', function (file, path) {
        console.log(file);
        console.log(path);
        session.insert(session.getSelection().getCursor(), '![](' + path + ')');
        // var text = textarea.value;
        // console.log(text);
        // textarea.value = text.substring(0, caretPos) + '\n![description](' + path + ')\n' + text.substring(caretPos);
      });
      this.on('error', function (file, error, xhr) {
        console.log('Error:', error);
      });
    };
    var myDropzone = new Dropzone('#editor', {url: '/_hads/upload', init: init});

    document.addEventListener('click', function (e) {
          if (e.target.id === 'add-modal')
            window.hads.closeAdd();
        }, false);
        document.addEventListener('keydown', function (e) {
          if (e.keyCode === 27)
            window.hads.closeAdd();
        }, false);
      }
    };

  return module;
})();