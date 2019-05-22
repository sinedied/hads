'use strict';

const Promise = require('bluebird');
const path = require('path');
const fs = Promise.promisifyAll(require('fs'));
const marked = require('marked');
const highlight = require('highlight.js');
const removeMd = require('remove-markdown');
const humanize = require('string-humanize');

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
    return this.renderRaw(file).then(content => this.renderMarkdown(content));
  }

  renderSourceCode(file, lang) {
    return this.renderRaw(file).then(content => this.renderMarkdown(`\`\`\`${lang}\n${content}\n\`\`\``));
  }

  renderSearch(search) {
    const results = this.indexer.search(search);
    const total = results.length;
    let content = total ? '' : 'No results.';

    this.searchResults = 'Search results (';

    if (total > SEARCH_RESULTS_MAX) {
      results.splice(SEARCH_RESULTS_MAX);
      this.searchResults += `first ${SEARCH_RESULTS_MAX} of `;
    }

    this.searchResults += `${total})`;

    results.forEach(result => {
      let extract = removeMd(this.indexer.getContent(result.ref));
      extract = extract.replace(/\s/g, ' ').replace(/`/g, '');
      extract = extract.replace(/\[\[index]]/g, '&#91;&#91;index]]');

      if (extract.length > SEARCH_EXTRACT_LENGTH) {
        extract = extract.substr(0, SEARCH_EXTRACT_LENGTH) + ' [...]';
      }

      content += `[${result.ref}](${result.ref})\n> ${extract}\n\n`;
    });

    return Promise.resolve(this.renderMarkdown(content));
  }

  renderIndex() {
    const files = this.indexer.getFiles();
    const nav = {};

    files.forEach(file => {
      const dir = path.dirname(file);
      const components = dir.split(path.sep);
      const name = path.basename(file);
      let parent = nav;

      if (components[0] === '.') {
        components.splice(0, 1);
      }

      components.forEach(component => {
        const current = parent[component] || {};
        parent[component] = current;
        parent = current;
      });

      parent[name] = file;
    });

    const content = Renderer.renderIndexLevel(nav, 0);
    return this.renderMarkdown(content);
  }

  renderTableOfContents(content) {
    let toc = '';
    const renderer = new marked.Renderer();
    renderer.heading = (text, level, raw) => {
      text = Renderer.removeLinks(text);
      const slug = raw.toLowerCase().replace(/[^\w]+/g, '-');
      toc += '  '.repeat(level) + `- [${text}](#${slug})\n`;
    };

    marked(content, {renderer});
    return this.renderMarkdown(toc);
  }

  renderMarkdown(content) {
    const renderer = new marked.Renderer();
    renderer.code = (code, language) => {
      if (language === 'mermaid') {
        return `<p class="mermaid">${code}</p>`;
      }

      return marked.Renderer.prototype.code.call(renderer, code, language);
    };

    renderer.paragraph = text => {
      text = text.replace(/^\[\[toc]]/img, () => this.renderTableOfContents(content));
      text = text.replace(/^\[\[index]]/img, () => this.renderIndex());
      return marked.Renderer.prototype.paragraph.call(renderer, text);
    };

    renderer.link = (href, title, text) => {
      text = Renderer.removeLinks(text);
      return marked.Renderer.prototype.link.call(renderer, href, title, text);
    };

    renderer.image = (href, title, text) => {
      let out = marked.Renderer.prototype.image.call(renderer, href, title, text);
      out = `<a href="${href}" target="_new">${out}</a>`;
      return out;
    };

    return marked(content, {
      renderer,
      gfm: true,
      tables: true,
      smartLists: true,
      breaks: false,
      smartypants: true,
      highlight: (code, lang) => {
        try {
          code = lang && lang !== 'no-highlight' ? highlight.highlight(lang, code, true).value : code;
        } catch (_err) {
          console.error(`Unsupported language for highlighting: ${lang}`);
        }

        return code;
      }
    });
  }

  static removeLinks(text) {
    return text.replace(/<a\b[^>]*>/gi, '')
      .replace(/<\/a>/gi, '');
  }

  static renderIndexLevel(index, level) {
    let content = '';
    const indent = '  '.repeat(level);
    const keys = Object.keys(index).sort((a, b) => {
      const aType = typeof index[a];
      const bType = typeof index[b];
      if (aType === bType) {
        return a.localeCompare(b);
      }

      if (aType === 'string') {
        // Display files before folders
        return -1;
      }

      return 1;
    });

    keys.forEach(key => {
      const value = index[key];
      content += indent;

      if (typeof value === 'string') {
        const link = value.split('/')
          .map(part => encodeURIComponent(part))
          .join('/');
        key = path.basename(key, path.extname(key));
        content += `- [${humanize(key)}](/${link})\n`;
      } else {
        content += `- ${humanize(key)}\n`;
        content += Renderer.renderIndexLevel(value, level + 1);
      }
    });

    return content;
  }
}

module.exports = Renderer;
