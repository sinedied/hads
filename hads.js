'use strict';

const fs = require('fs-extra');
const path = require('path');
const optimist = require('optimist');
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const shortId = require('shortid');
const moment = require('moment');
const pkg = require('./package.json');
const pug = require('pug');
const globby = require('globby');
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
  .alias('e', 'export')
  .describe('e', 'Export static html')
  .describe('help', 'Show this help')
  .argv;

if (args.help || args._.length > 1) {
  optimist.showHelp(console.log);
  process.exit();
}

const INDEXES = [
  'index.md',
  'README.md',
  'readme.md'
];
const ICONS = {
  alert: 'octicon-alert',
  file: 'octicon-file',
  search: 'octicon-search',
  fileCode: 'octicon-file-code'
};
const STYLESHEET = 'custom.css';
const PATHS = {
  documentation: args._[0] || './',
  public: path.join(__dirname, 'public'),
  views: path.join(__dirname, 'views'),
  /* eslint-disable no-return-assign */
  get code() {
    delete this.code;
    return this.code = path.join(this.root, '**', `*.{${Matcher.getCode().join(',')}}`);
  },
  get customStylesheet() {
    delete this.customStylesheet;
    return this.customStylesheet = path.join(this.root, STYLESHEET);
  },
  get export() {
    delete this.export;
    return this.export = path.join(process.cwd(), args.export === true ? 'public' : args.export);
  },
  get hads() {
    delete this.hads;
    return this.hads = path.join(this.export, '_hads');
  },
  get images() {
    delete this.images;
    return this.images = path.join(this.root, Helpers.sanitizePath(args.i));
  },
  get root() {
    delete this.root;
    return this.root = path.resolve(this.documentation);
  }
  /* eslint-enable no-return-assign */
};
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
].concat(fs.existsSync(PATHS.customStylesheet) ? [`/${STYLESHEET}`] : []);

const indexer = new Indexer(PATHS.root);
const renderer = new Renderer(indexer, {
  isExport: args.export
});

if (args.export) {
  args.export = args.export === true ? './public' : args.export;

  (async () => {
    await fs.emptyDir(PATHS.export);

    globby(path.join(PATHS.root, '**', `*.{${Matcher.getImages().join(',')}}`))
      .then(images => {
        images.map(file => {
          const dest = file.replace(PATHS.root, '');
          return fs.copy(file, path.join(PATHS.export, dest));
        });
      });

    const [documentation, code] = await Promise.all([
      indexer.indexFiles().then(files => files.map(file => file.file)),
      globby(PATHS.code).then(paths => paths.map(path => path.replace(PATHS.root, '')))
    ]);

    documentation
      .concat(code)
      .forEach(async file => {
        const dir = path.dirname(file);
        const ext = path.extname(file);
        const base = path.basename(file, ext);
        const src = path.join(PATHS.documentation, file);
        const content = Matcher.isMarkdown(file) ?
          await renderer.renderFile(src) :
          await renderer.renderCode(src);
        const template = path.join(PATHS.views, 'file.pug');
        const html = pug.renderFile(template, {
          content,
          pkg,
          route: Helpers.extractRoute(file),
          icon: ICONS.file,
          readonly: true,
          scripts: SCRIPTS,
          static: true,
          styles: STYLESHEETS,
          title: path.basename(src)
        });
        const buffer = Buffer.from(html);
        const array = new Uint8Array(buffer);
        const dest = path.join(dir, `${base}.html`);
        const isIndex = INDEXES.find(filename => filename.startsWith(base));
        await fs.mkdirp(path.join(PATHS.export, dir));
        fs.writeFile(path.join(PATHS.export, dest), array);

        if (isIndex) {
          const dest = path.join(dir, 'index.html');
          fs.writeFile(path.join(PATHS.export, dest), array);
        }
      });

    // We `await` because we'll get EEXIST if this and the copy to
    // the same directory in Helpers.processPackages are unresolved.
    await fs.copy(PATHS.public, PATHS.hads);

    if (await fs.exists(PATHS.customStylesheet)) {
      fs.copy(path.join(PATHS.root, STYLESHEET), path.join(PATHS.hads, STYLESHEET));
    }

    Helpers.processPackages((alias, path$) => {
      const dest = path.join(PATHS.hads, alias);
      fs.copy(path$, dest);
    });
  })();

  return;
}

const app = express();
app.set('views', PATHS.views);
app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use('/_hads/', express.static(path.join(__dirname, '/public')));

Helpers.processPackages((alias, path$) => {
  app.use('/_hads/' + alias + '/', express.static(path$));
});

if (fs.existsSync(PATHS.customStylesheet)) {
  app.use(`/_hads/${STYLESHEET}`, express.static(PATHS.customStylesheet));
}

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
      icon = ICONS.alert;
    } else if (search) {
      contentPromise = renderer.renderSearch(query.search);
      icon = ICONS.search;
    } else if (Helpers.hasQueryOption(query, 'raw') || Matcher.isImage(filePath)) {
      return res.sendFile(filePath);
    } else if (Matcher.isMarkdown(filePath)) {
      contentPromise = edit ? renderer.renderRaw(filePath) : renderer.renderFile(filePath);
      icon = ICONS.file;
    } else if (Matcher.isCode(filePath)) {
      contentPromise = renderer.renderCode(filePath);
      icon = ICONS.fileCode;
    }

    if (!title) {
      title = search ? renderer.searchResults : path.basename(filePath);
    }

    if (contentPromise) {
      return fs.stat(filePath)
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
    filePath = path.join(PATHS.root, route);

    return fs.stat(filePath)
      .then(stat => {
        search = query.search && query.search.length > 0 ? query.search.trim() : null;

        if (stat.isDirectory() && !search && !error) {
          if (!create) {
            // Try to find a root file
            route = path.join(route, INDEXES[++rootIndex]);
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

          return fs.mkdirp(path.dirname(filePath))
            .then(() => fs.writeFile(filePath, ''))
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

        if (rootIndex !== -1 && rootIndex < INDEXES.length - 1) {
          route = path.join(path.dirname(route), INDEXES[++rootIndex]);
          return tryProcessFile();
        }

        if (rootIndex === -1 && path.basename(route) !== '' && (path.extname(route) === '' || mdIndex > -1) &&
            mdIndex < Matcher.MARKDOWN_EXTENSIONS.length - 1) {
          // Maybe it's a github-style link without extension, let's try adding one
          const extension = Matcher.MARKDOWN_EXTENSIONS[++mdIndex];
          route = path.join(path.dirname(route), `${path.basename(route, path.extname(route))}.${extension}`);
          return tryProcessFile();
        }

        if (path.dirname(route) === path.sep && rootIndex === INDEXES.length - 1) {
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
    const filePath = path.join(PATHS.root, route);
    let lastModified = '';

    fs.stat(filePath)
      .then(stat => {
        let fileContent = req.body.content;
        if (stat.isFile() && fileContent) {
          lastModified = moment(stat.mtime).fromNow();
          if (process.platform !== 'win32') {
            // Www-form-urlencoded data always use CRLF line endings, so this is a quick fix
            fileContent = fileContent.replace(/\r\n/g, '\n');
          }

          return fs.writeFile(filePath, fileContent);
        }

        return null;
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
        cb(null, PATHS.images);
      },
      filename: (req, file, cb) => {
        fs.mkdirp(PATHS.images).then(() => {
          cb(null, shortId.generate() + path.extname(file.originalname));
        });
      }
    }),
    onFileUploadStart: file => !file.mimetype.match(/^image\//),
    limits: {
      fileSize: 1024 * 1024 * 10   // 10 MB
    }
  }).single('file'), (req, res) => {
    res.json(path.sep + path.relative(PATHS.root, req.file.path));
  }]);
}

indexer.indexFiles().then(() => {
  app.listen(args.port, args.host, () => {
    const serverUrl = `http://${args.host}:${args.port}`;
    console.log(`${pkg.name} ${pkg.version} serving at ${serverUrl} (press CTRL+C to exit)`);

    if (args.open) {
      require('open')(serverUrl, {url: true});
    }
  });
});

exports = app;
