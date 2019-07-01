'use strict';

const path = require('path');
const Matcher = require('./matcher');

class Helpers {
  static extractRoute(requestPath) {
    return Helpers.sanitizePath(path.normalize(decodeURI(requestPath)));
  }

  static sanitizePath(path) {
    return path.replace(/^(\.\.[/\\])+/, '');
  }

  static hasQueryOption(query, option) {
    return query[option] && JSON.parse(query[option]);
  }

  static processPackages(callback) {
    return Object.entries({
      highlight: ['highlight.js', 'styles'],
      octicons: ['octicons', 'build/font'],
      'font-awesome': ['font-awesome', ''],
      ace: ['ace-builds', 'src-min'],
      mermaid: ['mermaid', 'dist'],
      dropzone: ['dropzone', 'dist/min']
    }).map(([alias, [pkg, sub]]) => {
      const one = require.resolve(`${pkg}/package.json`);
      const two = path.dirname(one);
      const three = path.join(two, sub);
      return callback(alias, three);
    });
  }

  static ensureMarkdownExtension(file) {
    if (file.endsWith(path.sep)) {
      file = file.slice(0, -1);
    }

    if (!Matcher.isMarkdown(file)) {
      file += '.md';
    }

    return file;
  }

  static async readCode() {
    return Matcher.getCode();
  }
}

module.exports = Helpers;
