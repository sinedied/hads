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
    },
    uploadImage: function() {
      document.getElementsByClassName('dz-hidden-input')[0].click();
    }
  };

  function getUploadMessage(file) {
    return '![Uploading ' + file + '...]()';
  }

  window.onload = function () {
    var editorElem = byId('editor');
    if (editorElem) {
      editor = ace.edit('editor');
      editor.setOptions({
        useSoftTabs: true,
        tabSize: 2,
        mode: 'ace/mode/markdown',
        theme: 'ace/theme/clouds',
        highlightActiveLine: false,
        wrap: true
      });
      var session = editor.getSession();
      var count = session.getLength();
      editor.focus();
      editor.gotoLine(count, session.getLine(count - 1).length);
      editor.commands.addCommand({
        name: 'save',
        bindKey: {
          win: 'Ctrl-S',
          mac: 'Command-S'
        },
        exec: hads.save,
        readOnly: true
      });

      var route = byId('route').value;
      Dropzone.autoDiscover = false;
      new Dropzone('.ace_scroller', {
        url: '/_hads/upload?route=' + encodeURI(route),
        acceptedFiles: 'image/*',
        maxFilesize: 10,  // 10 MB
        addedfile: function() {},
        init: function () {
          this.on('processing', function (file) {
            var pos = session.getSelection().getCursor();
            session.insert(pos, getUploadMessage(file.name));
          });
          this.on('success', function (file, path) {
            editor.replace('![' + file.name + '](' + path + ')', {
              needle: getUploadMessage(file.name)
            });
          });
          this.on('error', function (file) {
            editor.replace('![Error!]()', {
              needle: getUploadMessage(file.name)
            });
          });
        }
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