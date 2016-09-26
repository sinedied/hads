'use strict';

let path = require('path');

class Helpers {

  static extractRoute(requestPath) {
    return path.normalize(decodeURI(requestPath)).replace(/^(\.\.[\/\\])+/, '');
  }

}

module.exports = Helpers;
