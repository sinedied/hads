'use strict';

let fs = require('fs');
let path = require('path');
let optimist = require('optimist');
let express = require('express');
let highlight = require('highlight.js');
let marked = require('marked');
let _ = require('lodash');
let pkg = require('./package.json');

let args = optimist
  .usage(`\n${pkg.name} ${pkg.version}\nUsage: $0 [root dir] [options]`)
  .alias('p', 'port')
  .describe('p', 'Port number to listen on')
  .default('p', 4040)
  .alias('h', 'host')
  .describe('h', 'Host address to bind to')
  .default('h', 'localhost')
  .alias('o', 'open')
  .boolean('o')
  .describe('o', 'Open default browser on start')
  .describe('help', 'Show this help')
  .argv;

if (args.help || args._.length > 1) {
  optimist.showHelp(console.log);
  process.exit();
}

let docPath = args._[0] || './';
let rootPath = path.resolve(docPath);
let app = express();

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, '/public')));
app.use('/css/highlight/', express.static(path.join(__dirname, 'node_modules/highlight.js/styles')));
app.use('/css/octicons/', express.static(path.join(__dirname, 'node_modules/octicons/build/font')));

const ROOT_FILES = ['index.md', 'README.md', 'readme.md'];
const MARKDOWN_EXTENSIONS = ['md', 'markdown'];
const IMAGES_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
const SOURCE_CODE_EXTENSIONS = ['js', 'json', 'ts', 'coffee', 'css', 'scss', 'sass', 'less', 'stylus', 'html', 'jade',
  'pug', 'sh', 'txt'];
const STYLESHEETS = ['/css/highlight/github.css', 'css/octicons/octicons.css', '/css/github.css', '/css/style.css'];

app.get('*', (req, res, next) => {
  let route = Helpers.extractRoute(req.path);
  let query = req.query || {};
  let content = null;
  let rootIndex = -1;
  let filePath, stat, icon;

  while(1) {
    try {
      filePath = path.join(rootPath, route);
      stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        // Try to find a root file
        ++rootIndex;
        throw 'Folder found';
      }
      break;
    } catch(e) {
      if (rootIndex !== -1 && rootIndex < ROOT_FILES.length) {
        route = ROOT_FILES[rootIndex++];
      } else {
        return next();
      }
    }
  }

  if (query.raw && JSON.parse(query.raw)) {
    // Access raw content: images, code, etc
    return res.sendFile(filePath);
  } else if (Matcher.isMarkdown(filePath)) {
    content = Renderer.renderFile(filePath);
    icon = 'octicon-file';
  } else if (Matcher.isImage(filePath)) {
    content = Renderer.renderImageFile(route);
    icon = 'octicon-file-media';
  } else if (Matcher.isSourceCode(filePath)) {
    content = Renderer.renderSourceCode(filePath, path.extname(filePath).replace('.', ''));
    icon = 'octicon-file-code';
  } else {
    return next();
  }

  if (content) {
    res.render('file', {
        title: path.basename(filePath),
        icon: icon,
        content: content,
        styles: STYLESHEETS,
        pkg: pkg
    });
  }
});

app.post('*', (req, res, next) => {
  let route = Helpers.extractRoute(req.path);
  let filePath = path.join(rootPath, route);
  let stat;

  try {
    stat = fs.statSync(filePath);
    if (stat.isFile()) {
      fs.writeFileSync(filePath, req.body);
      res.json({ success: true });
    }
  } catch(e) {
    return next();
  }
});

app.listen(args.port, args.host, () => {
  let serverUrl = `http://${args.host}:${args.port}`;
  console.log(`${pkg.name} ${pkg.version} serving at ${serverUrl} (press CTRL+C to exit)`);

  if (args.open) {
    require('open')(serverUrl);
  }
});

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

class Renderer {

  static renderFile(file) {
    let contents = fs.readFileSync(file, 'utf8');
    return Renderer.renderMarkdown(contents);
  }

  static renderImageFile(file) {
    return `<div class="image"><span class="border-wrap"><img src="${file}?raw=true"></span></div>`;
  }

  static renderSourceCode(file, lang) {
    let contents = `\`\`\`${lang}\n${fs.readFileSync(file, 'utf8')}\n\`\`\``;
    return Renderer.renderMarkdown(contents);
  }

  static renderMarkdown(contents) {
    marked.setOptions({
      gfm: true,
      tables: true,
      smartLists: true,
      breaks: true,
      highlight: (code, lang) => lang && lang !== 'no-highlight' ? highlight.highlight(lang, code, true).value : code
    });

    return marked(contents);
  }

}

class Helpers {

  static extractRoute(requestPath) {
    return path.normalize(decodeURI(requestPath)).replace(/^(\.\.[\/\\])+/, '');
  }

}
