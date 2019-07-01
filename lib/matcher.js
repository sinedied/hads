'use strict';

const path = require('path');
const _ = require('lodash');

const MARKDOWN_EXTENSIONS = ['md', 'mkdn', 'mdown', 'markdown'];
const IMAGES_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
const CODE_EXTENSIONS = [
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
    return Matcher.hasExtension(file, MARKDOWN_EXTENSIONS);
  }

  static isImage(file) {
    return Matcher.hasExtension(file, IMAGES_EXTENSIONS);
  }

  static getImages() {
    return IMAGES_EXTENSIONS;
  }

  static isCode(file) {
    return Matcher.hasExtension(file, CODE_EXTENSIONS);
  }

  static getCode() {
    return CODE_EXTENSIONS;
  }

  static hasExtension(file, extensions) {
    return _.includes(extensions, path.extname(file).replace('.', ''));
  }
}

Matcher.MARKDOWN_EXTENSIONS = MARKDOWN_EXTENSIONS;

module.exports = Matcher;
