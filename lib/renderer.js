'use strict';

let Promise = require('bluebird');
let fs = Promise.promisifyAll(require('fs'));
let marked = require('marked');
let highlight = require('highlight.js');
let removeMd = require('remove-markdown');
let humanize = require('string-humanize');

const EXTRACT_LENGTH = 400;

class Renderer {

  static renderRaw(file) {
    return fs.readFileAsync(file, 'utf8');
  }

  static renderFile(file) {
    return Renderer.renderRaw(file).then((content) => Renderer.renderMarkdown(content));
  }

  static renderImageFile(file) {
    return Promise.resolve(`<div class="image"><span class="border-wrap"><img src="${file}?raw=1"></span></div>`);
  }

  static renderSourceCode(file, lang) {
    return Renderer.renderRaw(file).then((content) => Renderer.renderMarkdown(`\`\`\`${lang}\n${content}\n\`\`\``));
  }

  static renderSearch(indexer, search) {
    let results = indexer.search(search);
    let content = results.length ? '' : 'No results.';

    results.forEach((result) => {
      let extract = removeMd(indexer.getContent(result.ref));
      extract = extract.replace(/\s/g, ' ');

      if (extract.length > EXTRACT_LENGTH) {
        extract = extract.substr(0, EXTRACT_LENGTH) + ' [...]';
      }

      content += `[${result.ref}](${result.ref})\n> ${extract}\n\n`;
    });

    return Promise.resolve(Renderer.renderMarkdown(content));
  }

  static renderSidebar(indexer) {
    let files = index.getFiles();
    let nav = {};

    file.forEach((file) => {
      let dir = path.dirname(file);
    });
  }

  static renderMarkdown(content) {
    marked.setOptions({
      gfm: true,
      tables: true,
      smartLists: true,
      breaks: true,
      highlight: (code, lang) => lang && lang !== 'no-highlight' ? highlight.highlight(lang, code, true).value : code
    });

    return marked(content);
  }

}

module.exports = Renderer;
