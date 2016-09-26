'use strict';

let Promise = require('bluebird');
let path = require('path');
let fs = Promise.promisifyAll(require('fs'));
let readdirAsync = Promise.promisify(require('recursive-readdir'));
let elasticlunr = require('elasticlunr');
let Matcher = require('./matcher');

class Indexer {

  constructor(basePath) {
    this.basePath = basePath;
    this.index = elasticlunr(function () {
      this.setRef('file');
      this.addField('filename');
      this.addField('content');
    });
  }

  indexFiles() {
    return readdirAsync(this.basePath).then((files) => {
      files = files.filter((file) => Matcher.isMarkdown(file));
      return Promise.all(files.map((file) => this.updateIndexForFile(file, true)));
    });
  }

  updateIndexForFile(file, newFile) {
    let filePath = path.relative(this.basePath, file);

    return fs.readFileAsync(path.join(this.basePath, filePath), 'utf8').then((content) => {
      this.index[newFile ? 'addDoc' : 'update']({
        file: filePath,
        filename: path.basename(filePath, path.extname(filePath)),
        content: content
      })
    });
  }

  getContent(file) {
    return this.index.documentStore.getDoc(file).content;
  }

  search(string) {
    return this.index.search(string, { expand: true });
  }

}

module.exports = Indexer;
