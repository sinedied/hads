'use strict';

let Promise = require('bluebird');
let path = require('path');
let fs = Promise.promisifyAll(require('fs'));
let readdirAsync = Promise.promisify(require('recursive-readdir'));
let elasticlunr = require('elasticlunr');
let Matcher = require('./matcher');

const EXCLUSIONS = ['node_modules'];

class Indexer {

  constructor(basePath) {
    this.basePath = basePath;
    this.index = elasticlunr(function () {
      this.setRef('file');
      this.addField('filename');
      this.addField('content');
    });
    this.files = [];
  }

  indexFiles() {
    return readdirAsync(this.basePath, EXCLUSIONS).then(files => {
      files = files.filter((file) => Matcher.isMarkdown(file));
      files = files.filter((file) => {
        // Filter files/folder starting with a "."
        file = path.relative(this.basePath, file);
        let pathComponents = file.split(path.sep);
        return !pathComponents.some(c => c.length && c[0] === '.')
      });
      return Promise.all(files.map(this.updateIndexForFile.bind(this)));
    });
  }

  updateIndexForFile(file) {
    let filePath = path.relative(this.basePath, file);
    this.files.push(filePath);

    return fs.readFileAsync(path.join(this.basePath, filePath), 'utf8').then((content) => {
      this.index[this.index.documentStore.hasDoc(filePath) ? 'updateDoc' : 'addDoc']({
        file: filePath,
        filename: path.basename(filePath, path.extname(filePath)),
        content: content
      })
    });
  }

  getContent(file) {
    return this.index.documentStore.getDoc(file).content;
  }

  getFiles() {
    return this.files;
  }

  search(string) {
    return this.index.search(string, { expand: true });
  }

}

module.exports = Indexer;
