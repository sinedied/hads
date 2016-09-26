'use strict';

let Promise = require('bluebird');
let fs = Promise.promisifyAll(require('fs'));
let path = require('path');
let optimist = require('optimist');
let express = require('express');
let bodyParser = require('body-parser');
let pkg = require('./package.json');
let Matcher = require('./lib/matcher.js');
let Renderer = require('./lib/renderer.js');
let Helpers = require('./lib/helpers.js');
let Indexer = require('./lib/indexer.js');

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
let indexer = new Indexer(rootPath);
let app = express();

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/_mdds/', express.static(path.join(__dirname, '/public')));
app.use('/_mdds/highlight/', express.static(path.join(__dirname, 'node_modules/highlight.js/styles')));
app.use('/_mdds/octicons/', express.static(path.join(__dirname, 'node_modules/octicons/build/font')));
app.use('/_mdds/ace/', express.static(path.join(__dirname, 'node_modules/ace-builds/src-min/')));

const ROOT_FILES = ['index.md', 'README.md', 'readme.md'];
const STYLESHEETS = ['/_mdds/highlight/github.css', '/_mdds/octicons/octicons.css', '/_mdds/css/github.css',
  '/_mdds/css/style.css'];
const SCRIPTS = ['/_mdds/ace/ace.js', '/_mdds/js/client.js'];

app.get('*', (req, res, next) => {
  let route = Helpers.extractRoute(req.path);
  let query = req.query || {};
  let rootIndex = -1;
  let edit = query.edit && JSON.parse(query.edit);
  let filePath, icon, search;

  function tryProcessFile() {
    let contentPromise = null;
    filePath = path.join(rootPath, route);

    return fs.statAsync(filePath)
      .then((stat) => {
        search = query.search && query.search.length > 0 ? query.search : null;

        if (stat.isDirectory() && !search) {
          // Try to find a root file
          route = path.join(route, ROOT_FILES[++rootIndex]);
          return tryProcessFile();
        }

        if (query.raw && JSON.parse(query.raw)) {
          // Access raw content: images, code, etc
          return res.sendFile(filePath);
        } else if (search) {
          contentPromise = Renderer.renderSearch(indexer, query.search);
          icon = 'octicon-search';
        } else if (Matcher.isMarkdown(filePath)) {
          contentPromise = edit ? Renderer.renderRaw(filePath) : Renderer.renderFile(filePath);
          icon = 'octicon-file';
        } else if (Matcher.isImage(filePath)) {
          contentPromise = Renderer.renderImageFile(route);
          icon = 'octicon-file-media';
        } else if (Matcher.isSourceCode(filePath)) {
          contentPromise = Renderer.renderSourceCode(filePath, path.extname(filePath).replace('.', ''));
          icon = 'octicon-file-code';
        }

        if (contentPromise) {
          return contentPromise.then((content) => {
            res.render(edit ? 'edit' : 'file', {
              title: search ? 'Search results' : path.basename(filePath),
              route: route,
              icon: icon,
              search: search,
              content: content,
              styles: STYLESHEETS,
              scripts: SCRIPTS,
              pkg: pkg
            });
          });
        } else {
          next();
        }
      })
      .catch(() => {
        if (rootIndex !== -1 && rootIndex < ROOT_FILES.length) {
          route = path.join(path.dirname(route), ROOT_FILES[rootIndex++]);
          return tryProcessFile();
        }
        next();
      });
  }

  tryProcessFile();
});

app.post('*', (req, res, next) => {
  let route = Helpers.extractRoute(req.path);
  let filePath = path.join(rootPath, route);

  fs.statAsync(filePath)
    .then((stat) => {
      if (stat.isFile() && req.body.content) {
        return fs.writeFileAsync(filePath, req.body.content);
      }
    })
    .then(() => {
      return Renderer.renderFile(filePath);
    })
    .then((content) => {
      res.render('file', {
        title: path.basename(filePath),
        route: route,
        icon: 'octicon-file',
        content: content,
        styles: STYLESHEETS,
        scripts: SCRIPTS,
        pkg: pkg
      });
    })
    .catch(() => {
      next();
    })
});

indexer.indexFiles().then(() => {
  app.listen(args.port, args.host, () => {
    let serverUrl = `http://${args.host}:${args.port}`;
    console.log(`${pkg.name} ${pkg.version} serving at ${serverUrl} (press CTRL+C to exit)`);

    if (args.open) {
      require('open')(serverUrl);
    }
  });
});
