'use strict';

let Promise = require('bluebird');
let path = require('path');
let fs = Promise.promisifyAll(require('fs'));
let marked = require('marked');
let highlight = require('highlight.js');
let removeMd = require('remove-markdown');
let humanize = require('string-humanize');

const SEARCH_EXTRACT_LENGTH = 400;
const SEARCH_RESULTS_MAX = 10;

class Renderer {

  constructor(indexer) {
    this.indexer = indexer;
    this.searchResults = null;
  }

  renderRaw(file) {
    return fs.readFileAsync(file, 'utf8');
  }

  renderFile(file) {
    return this.renderRaw(file).then((content) => {
      content = content.replace(/\[\[index]]/g, this.renderIndex());
      return Renderer.renderMarkdown(content);
    });
  }

  renderImageFile(file) {
    return Promise.resolve(`<div class="image"><span class="border-wrap"><img src="${file}?raw=1"></span></div>`);
  }

  renderSourceCode(file, lang) {
    return this.renderRaw(file).then((content) => Renderer.renderMarkdown(`\`\`\`${lang}\n${content}\n\`\`\``));
  }

  renderSearch(search) {
    let results = this.indexer.search(search);
    let total = results.length;
    let content = total ? '' : 'No results.';

    this.searchResults = 'Search results (';

    if (total > SEARCH_RESULTS_MAX) {
      results.splice(SEARCH_RESULTS_MAX);
      this.searchResults += `first ${SEARCH_RESULTS_MAX} of `;
    }

    this.searchResults += `${total})`;

    results.forEach((result) => {
      let extract = removeMd(this.indexer.getContent(result.ref));
      extract = extract.replace(/\s/g, ' ');

      if (extract.length > SEARCH_EXTRACT_LENGTH) {
        extract = extract.substr(0, SEARCH_EXTRACT_LENGTH) + ' [...]';
      }

      content += `[${result.ref}](${result.ref})\n> ${extract}\n\n`;
    });

    return Promise.resolve(Renderer.renderMarkdown(content));
  }

  renderIndex() {
    let files = this.indexer.getFiles();
    let nav = {};

    files.forEach((file) => {
      let dir = path.dirname(file);
      let components = dir.split(path.sep);
      let name = humanize(path.basename(file, path.extname(file)));
      let parent = nav;

      if (components[0] === '.') {
        components.splice(0, 1);
      }

      components.forEach((component) => {
        let humanKey = humanize(component);
        let current = parent[humanKey] || {};
        parent[humanKey] = current;
        parent = current;
      });

      parent[name] = file;
    });

    let content = Renderer.renderIndexLevel(nav, 0);
    return Renderer.renderMarkdown(content);
  }

  static renderMarkdown(content) {
    marked.setOptions({
      gfm: true,
      tables: true,
      smartLists: true,
      breaks: false,
      highlight: (code, lang) => lang && lang !== 'no-highlight' ? highlight.highlight(lang, code, true).value : code
    });

    return marked(content);
  }

  static renderIndexLevel(index, level) {
    let content = '';
    let indent = '  '.repeat(level);
    let keys = Object.keys(index).sort((a, b) => {
      let aType = typeof index[a];
      let bType = typeof index[b];
      if (aType === bType) {
        return a.localeCompare(b);
      } else if (aType === 'string') {
        // Display files before folders
        return -1;
      }
      return 1;
    });

    keys.forEach((key) => {
      let value = index[key];
      content += indent;

      if (typeof value === 'string') {
        content += `- [${key}](/${value})\n`;
      } else {
        content += `- ${key}\n`;
        content += Renderer.renderIndexLevel(value, level + 1);
      }
    });

    return content;
  }

}

module.exports = Renderer;
