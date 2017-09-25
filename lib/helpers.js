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

  static ensureMarkdownExtension(file) {
    if (file.endsWith(path.sep)) {
      file = file.slice(0, -1);
    }

    if (!Matcher.isMarkdown(file)) {
      file += '.md';
    }

    return file;
  }
}

module.exports = Helpers;
