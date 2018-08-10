'use strict';

const path = require('path');
const _ = require('lodash');

const MARKDOWN_EXTENSIONS = ['md', 'mkdn', 'mdown', 'markdown'];
const IMAGES_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
const SOURCE_CODE_EXTENSIONS = [
  'js',
  'json',
  'ts',
  'coffee',
  'css',
  'scss',
  'sass',
  'less',
  'stylus',
  'html',
  'jade',
  'pug',
  'sh',
  'txt'
];

class Matcher {
  static isMarkdown(file) {
    return Matcher._hasExtension(file, MARKDOWN_EXTENSIONS);
  }

  static isImage(file) {
    return Matcher._hasExtension(file, IMAGES_EXTENSIONS);
  }

  static isSourceCode(file) {
    return Matcher._hasExtension(file, SOURCE_CODE_EXTENSIONS);
  }

  static _hasExtension(file, extensions) {
    return _.includes(extensions, path.extname(file).replace('.', ''));
  }
}

Matcher.MARKDOWN_EXTENSIONS = MARKDOWN_EXTENSIONS;

module.exports = Matcher;
