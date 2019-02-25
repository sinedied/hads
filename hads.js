'use strict';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const mkdirpAsync = Promise.promisify(require('mkdirp'));
const path = require('path');
const optimist = require('optimist');
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const shortId = require('shortid');
const moment = require('moment');
const pkg = require('./package.json');
const Matcher = require('./lib/matcher.js');
const Renderer = require('./lib/renderer.js');
const Helpers = require('./lib/helpers.js');
const Indexer = require('./lib/indexer.js');

const args = optimist
  .usage(`\n${pkg.name} ${pkg.version}\nUsage: $0 [root dir] [options]`)
  .alias('p', 'port')
  .describe('p', 'Port number to listen on')
  .default('p', 4040)
  .alias('h', 'host')
  .describe('h', 'Host address to bind to')
  .default('h', 'localhost')
  .alias('i', 'images-dir')
  .describe('i', 'Directory to store images')
  .default('i', 'images')
  .alias('o', 'open')
  .boolean('o')
  .describe('o', 'Open default browser on start')
  .alias('r', 'readonly')
  .boolean('r')
  .describe('r', 'Read-only mode (no add or edit feature)')
  .describe('help', 'Show this help')
  .argv;

if (args.help || args._.length > 1) {
  optimist.showHelp(console.log);
  process.exit();
}

const docPath = args._[0] || './';
const rootPath = path.resolve(docPath);
const imagesPath = path.join(rootPath, Helpers.sanitizePath(args.i));
const customCssFile = 'custom.css';
const customStylePath = path.join(rootPath, customCssFile);
const hasCustomCss = fs.existsSync(customStylePath);
const indexer = new Indexer(rootPath);
const renderer = new Renderer(indexer);
const app = express();

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/_hads/', express.static(path.join(__dirname, '/public')));

const staticDirs = {
  highlight: ['highlight.js', 'styles'],
  octicons: ['octicons', 'build/font'],
  'font-awesome': ['font-awesome', ''],
  ace: ['ace-builds', 'src-min'],
  mermaid: ['mermaid', 'dist'],
  dropzone: ['dropzone', 'dist/min']
};

Object.keys(staticDirs).forEach(key => {
  const [modName, subDir] = staticDirs[key];
  let basePath = require.resolve(`${modName}/package.json`);
  basePath = basePath.substr(0, basePath.lastIndexOf('package.json'));
  app.use('/_hads/' + key + '/', express.static(path.join(basePath, subDir)));
});

if (hasCustomCss) {
  app.use(`/_hads/${customCssFile}`, express.static(customStylePath));
}

const ROOT_FILES = [
  'index.md',
  'README.md',
  'readme.md'
];
const SCRIPTS = [
  '/ace/ace.js',
  '/mermaid/mermaid.min.js',
  '/dropzone/dropzone.min.js',
  '/js/client.js'
];
const STYLESHEETS = [
  '/highlight/github.css',
  '/octicons/octicons.css',
  '/css/github.css',
  '/css/style.css',
  '/font-awesome/css/font-awesome.css'
].concat(hasCustomCss ? [`/${customCssFile}`] : []);

app.get('*', (req, res, next) => {
  let route = Helpers.extractRoute(req.path);
  const query = req.query || {};
  let rootIndex = -1;
  let mdIndex = -1;
  const create = Helpers.hasQueryOption(query, 'create');
  let edit = Helpers.hasQueryOption(query, 'edit') || create;
  let statusCode = 200;
  let lastModified = '';
  let filePath, icon, search, error, title, contentPromise;

  function renderPage() {
    if (error) {
      edit = false;
      contentPromise = Promise.resolve(renderer.renderMarkdown(error));
      icon = 'octicon-alert';
    } else if (search) {
      contentPromise = renderer.renderSearch(query.search);
      icon = 'octicon-search';
    } else if (Helpers.hasQueryOption(query, 'raw') || Matcher.isImage(filePath)) {
      return res.sendFile(filePath);
    } else if (Matcher.isMarkdown(filePath)) {
      contentPromise = edit ? renderer.renderRaw(filePath) : renderer.renderFile(filePath);
      icon = 'octicon-file';
    } else if (Matcher.isSourceCode(filePath)) {
      contentPromise = renderer.renderSourceCode(filePath, path.extname(filePath).replace('.', ''));
      icon = 'octicon-file-code';
    }

    if (!title) {
      title = search ? renderer.searchResults : path.basename(filePath);
    }

    if (contentPromise) {
      return fs.statAsync(filePath)
        .then(stat => {
          if (stat.isFile()) {
            lastModified = moment(stat.mtime).fromNow();
          }

          return contentPromise;
        })
        .then(content => {
          res.status(statusCode);
          res.render(edit ? 'edit' : 'file', {
            title,
            lastModified,
            readonly: args.readonly,
            route,
            icon,
            search,
            content,
            styles: STYLESHEETS,
            scripts: SCRIPTS,
            pkg
          });
        })
        .catch(err => {
          console.error(`Error while retrieving file stats: ${err.code}`);
          next();
        });
    }

    return next();
  }

  function tryProcessFile() {
    contentPromise = null;
    filePath = path.join(rootPath, route);

    return fs.statAsync(filePath)
      .then(stat => {
        search = query.search && query.search.length > 0 ? query.search.trim() : null;

        if (stat.isDirectory() && !search && !error) {
          if (!create) {
            // Try to find a root file
            route = path.join(route, ROOT_FILES[++rootIndex]);
            return tryProcessFile();
          }

          route = '/';
          title = 'Error';
          error = `Cannot create file \`${filePath}\``;
          statusCode = 400;
        }

        return renderPage();
      })
      .catch(() => {
        if (create) {
          const fixedRoute = Helpers.ensureMarkdownExtension(route);
          if (fixedRoute !== route) {
            return res.redirect(fixedRoute + '?create=1');
          }

          return mkdirpAsync(path.dirname(filePath))
            .then(() => fs.writeFileAsync(filePath, ''))
            .then(() => indexer.updateIndexForFile(filePath))
            .then(tryProcessFile)
            .catch(e => {
              console.error(e);
              title = 'Error';
              error = `Cannot create file \`${filePath}\``;
              route = '/';
              statusCode = 400;
              return renderPage();
            });
        }

        if (rootIndex !== -1 && rootIndex < ROOT_FILES.length - 1) {
          route = path.join(path.dirname(route), ROOT_FILES[++rootIndex]);
          return tryProcessFile();
        }

        if (rootIndex === -1 && path.basename(route) !== '' && (path.extname(route) === '' || mdIndex > -1) &&
            mdIndex < Matcher.MARKDOWN_EXTENSIONS.length - 1) {
          // Maybe it's a github-style link without extension, let's try adding one
          const extension = Matcher.MARKDOWN_EXTENSIONS[++mdIndex];
          route = path.join(path.dirname(route), `${path.basename(route, path.extname(route))}.${extension}`);
          return tryProcessFile();
        }

        if (path.dirname(route) === path.sep && rootIndex === ROOT_FILES.length - 1) {
          error = '## No home page (╥﹏╥)\nDo you want to create an [index.md](/index.md?create=1) or ' +
              '[readme.md](/readme.md?create=1) file perhaps?';
        } else {
          error = '## File not found ¯\\\\\\_(◕\\_\\_◕)_/¯\n> *There\'s a glitch in the matrix...*';
        }

        title = '404 Error';
        route = '/';
        statusCode = 404;

        return renderPage();
      });
  }

  tryProcessFile();
});

if (!args.readonly) {
  app.post('*', (req, res, next) => {
    const route = Helpers.extractRoute(req.path);
    const filePath = path.join(rootPath, route);
    let lastModified = '';

    fs.statAsync(filePath)
      .then(stat => {
        let fileContent = req.body.content;
        if (stat.isFile() && fileContent) {
          lastModified = moment(stat.mtime).fromNow();
          if (process.platform !== 'win32') {
            // Www-form-urlencoded data always use CRLF line endings, so this is a quick fix
            fileContent = fileContent.replace(/\r\n/g, '\n');
          }

          return fs.writeFileAsync(filePath, fileContent);
        }
      })
      .then(() => {
        indexer.updateIndexForFile(filePath);
        return renderer.renderFile(filePath);
      })
      .then(content => res.render('file', {
        title: path.basename(filePath),
        lastModified,
        readonly: args.readonly,
        route,
        icon: 'octicon-file',
        content,
        styles: STYLESHEETS,
        scripts: SCRIPTS,
        pkg
      }))
      .catch(() => {
        next();
      });
  });

  app.post('/_hads/upload', [multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, imagesPath);
      },
      filename: (req, file, cb) => {
        mkdirpAsync(imagesPath).then(() => {
          cb(null, shortId.generate() + path.extname(file.originalname));
        });
      }
    }),
    onFileUploadStart: file => !file.mimetype.match(/^image\//),
    limits: {
      fileSize: 1024 * 1024 * 10   // 10 MB
    }
  }).single('file'), (req, res) => {
    res.json(path.sep + path.relative(rootPath, req.file.path));
  }]);
}

indexer.indexFiles().then(() => {
  app.listen(args.port, args.host, () => {
    const serverUrl = `http://${args.host}:${args.port}`;
    console.log(`${pkg.name} ${pkg.version} serving at ${serverUrl} (press CTRL+C to exit)`);

    if (args.open) {
      require('opn')(serverUrl);
    }
  });
});

exports = app;
