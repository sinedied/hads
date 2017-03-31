'use strict';

const debug = require('debug')('hads');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const mkdirpAsync = Promise.promisify(require('mkdirp'));
const os = require('os');
const path = require('path');
const optimist = require('optimist');
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const shortId = require('shortid');
const pkg = require('./package.json');
const Matcher = require('./lib/matcher.js');
const Renderer = require('./lib/renderer.js');
const Helpers = require('./lib/helpers.js');
const Indexer = require('./lib/indexer.js');

var args = optimist
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
  .alias('x', 'production')
  .boolean('x')
  .describe('x', 'Production Mode. No edition possible')
  .alias('o', 'open')
  .boolean('o')
  .describe('o', 'Open default browser on start')
  .describe('help', 'Show this help')
  .argv;

if (args.help || args._.length > 1) {
  optimist.showHelp(console.log);
  process.exit();
}

var docPath = args._[0] || './';
var rootPath = path.resolve(docPath);
var imagesPath = path.join(rootPath, Helpers.sanitizePath(args.i));
var indexer = new Indexer(rootPath);
var renderer = new Renderer(indexer);
var plugins = {};
var app = express();

// set express render engine to pug
app.set('view engine', 'pug', {options: {resolv: function() {}}});

// check whether rootPath contains __hads/views
try {
  fs.statSync(rootPath+'/__hads/views');
  var rootsView = [rootPath+'/__hads/views', __dirname+'/views'];
} catch(e) {
  // set default views
  var rootsView = [__dirname+'/views'];
}
app.set('views', rootsView);

// refound the internal puf resolver
var pugPlugin = {
  // hook pug resolver to lookup multiple view directories
  resolve: (filename, source, options) => {
    filename = filename.trim();
    if (filename[0] !== '/' && !source)
      throw new Error('the "filename" option is required to use includes and extends with "relative" paths');

    if (filename[0] === '/' && !options.basedir)
      throw new Error('the "basedir" option is required to use includes and extends with "absolute" paths');

    // check path with priority
    if(filename[0] === '/')
      filename = path.join(options.basedir, filename);
    else {
      var org = filename;
      for(var a=0; a<rootsView.length; a++) {
        filename = path.join(rootsView[a], org);
        try {
          fs.statSync(filename);
          break;
        } catch(e) { /* nothing here */ }
      }
    }
    return filename;
  }
};

// load rootPath __hads/public
try {
  fs.statSync(rootPath+'/__hads/public');
  app.use('/_hads/', express.static(rootPath+'/__hads/public'));
} catch(e) { /* error is useless */ }

// load default hads' static files
app.use('/_hads/', express.static(__dirname+'/public'));
app.use('/_hads/highlight/', express.static(__dirname+'/node_modules/highlight.js/styles'));
app.use('/_hads/octicons/', express.static(__dirname+'/node_modules/octicons/build/font'));
app.use('/_hads/ace/', express.static(__dirname+'/node_modules/ace-builds/src-min/'));
app.use('/_hads/mermaid/', express.static(__dirname+'/node_modules/mermaid/dist/'));
app.use('/_hads/dropzone/', express.static(__dirname+'/node_modules/dropzone/dist/min/'));

// client body request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// load application plugins in __hads/plugins
try {
  var pDir = rootPath+'/__hads/plugins';
  fs.statSync(pDir);
  var files = fs.readdirSync(pDir)
  for(var a in files) {
    var file = files[a];
    var dirName = pDir+'/'+file;
    var fss = fs.statSync(dirName);

    if(fss.isDirectory()) {
      var hadsFile = dirName+'/hads.js';
      fs.statSync(hadsFile);
      debug('Loading plugin '+file+' from '+hadsFile);
      try {
        (plugins[file] = require(hadsFile))(app);
      } catch(e) {
        console.log('Can not load '+file+' plugin: '+e.message)
      }
    }
  }
} catch(e) { /* error is useless */ }

// prevent local __hads installation to be public
app.use('/__hads', (req, res, next) => {
  res.status(403).send('Forbidden');
})

const ROOT_FILES = ['index.md', 'README.md', 'readme.md'];
const STYLESHEETS = ['/highlight/github.css', '/octicons/octicons.css', '/css/github.css', '/css/style.css',
  '/css/mermaid.neutral.css'];
const SCRIPTS = ['/ace/ace.js', '/mermaid/mermaid.min.js', '/dropzone/dropzone.min.js', '/js/client.js'];

app.get('*', (req, res, next) => {
  // NOTE: you don't need 'let' there, vars' scope are preserved
  var route = Helpers.extractRoute(req.path);
  var query = req.query || {};
  var rootIndex = -1, mdIndex = -1;
  var create = Helpers.hasQueryOption(query, 'create');
  var edit = Helpers.hasQueryOption(query, 'edit') || create;
  var filePath, icon, search, error, title, contentPromise;

  // check whether hads is in produdction mode then
  // force edit and create to false
  if(args.production == true) {
    edit = false;
    create = false;
  }

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
      return contentPromise.then((content) => {
        res.render(edit ? 'edit' : 'file', {
          title: title,
          route: route,
          args: args,
          icon: icon,
          plugins: [pugPlugin],
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
  }

  function tryProcessFile() {
    contentPromise = null;
    filePath = path.join(rootPath, route);

    return fs.statAsync(filePath)
      .then((stat) => {
        search = query.search && query.search.length > 0 ? query.search.trim() : null;

        if (stat.isDirectory() && !search && !error) {
          if (!create) {
            // Try to find a root file
            route = path.join(route, ROOT_FILES[++rootIndex]);
            return tryProcessFile();
          } else {
            route = '/';
            title = 'Error';
            error = `Cannot create file \`${filePath}\``;
          }
        }

        return renderPage();
      })
      .catch(() => {
        if (create) {
          var fixedRoute = Helpers.ensureMarkdownExtension(route);
          if (fixedRoute !== route) {
            return res.redirect(fixedRoute + '?create=1');
          }

          return mkdirpAsync(path.dirname(filePath))
            .then(() => fs.writeFileAsync(filePath, ''))
            .then(() => indexer.updateIndexForFile(filePath))
            .then(tryProcessFile)
            .catch((e) => {
              console.error(e);
              title = 'Error';
              error = `Cannot create file \`${filePath}\``;
              route = '/';
              return renderPage();
            });
        } else if (rootIndex !== -1 && rootIndex < ROOT_FILES.length - 1) {
          route = path.join(path.dirname(route), ROOT_FILES[++rootIndex]);
          return tryProcessFile();
        } else if (rootIndex === -1 && path.basename(route) !== '' && (path.extname(route) === '' || mdIndex > -1) &&
            mdIndex < Matcher.MARKDOWN_EXTENSIONS.length - 1) {
          // Maybe it's a github-style link without extension, let's try adding one
          var extension = Matcher.MARKDOWN_EXTENSIONS[++mdIndex];
          route = path.join(path.dirname(route), `${path.basename(route, path.extname(route))}.${extension}`);
          return tryProcessFile();
        } else {
          if (path.dirname(route) === path.sep && rootIndex === ROOT_FILES.length - 1) {
            error = '## No home page (╥﹏╥)\nDo you want to create an [index.md](/index.md?create=1) or ' +
              '[readme.md](/readme.md?create=1) file perhaps?'
          } else {
            error = '## File not found ¯\\\\\\_(◕\\_\\_◕)_/¯\n> *There\'s a glitch in the matrix...*';
          }
          title = '404 Error';
          route = '/';

          return renderPage();
        }
      });
  }

  tryProcessFile();
});


if(args.production == false) {
  app.post('*', (req, res, next) => {
    var route = Helpers.extractRoute(req.path);
    var filePath = path.join(rootPath, route);

    fs.statAsync(filePath)
      .then((stat) => {
        var fileContent = req.body.content;
        if (stat.isFile() && fileContent) {
          if (process.platform !== 'win32') {
            // www-form-urlencoded data always use CRLF line endings, so this is a quick fix
            fileContent = fileContent.replace(/\r\n/g, '\n');
          }
          return fs.writeFileAsync(filePath, fileContent);
        }
      })
      .then(() => {
        indexer.updateIndexForFile(filePath);
        return renderer.renderFile(filePath);
      })
      .then((content) => {
        res.render('file', {
          title: path.basename(filePath),
          route: route,
          icon: 'octicon-file',
          content: content,
          plugins: [pugPlugin],
          args: args,
          styles: STYLESHEETS,
          scripts: SCRIPTS,
          pkg: pkg
        });
      })
      .catch(() => {
        next();
      })
  });

  app.post('/_hads/upload', [multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => { cb(null, imagesPath); },
      filename: (req, file, cb) => {
        mkdirpAsync(imagesPath).then(() => {
          cb(null, shortId.generate() + path.extname(file.originalname))
        });
      }
    }),
    onFileUploadStart: (file) => !file.mimetype.match(/^image\//),
    limits: {
      fileSize: 1024 * 1024 * 10   // 10 MB
    }
  }).single('file'), (req, res) => {
    res.json(path.sep + path.relative(rootPath, req.file.path));
  }]);
}

indexer.indexFiles().then(() => {
  app.listen(args.port, args.host, () => {
    var serverUrl = `http://${args.host}:${args.port}`;
    console.log(`${pkg.name} ${pkg.version} serving at ${serverUrl} (press CTRL+C to exit)`);

    if (args.open) {
      require('open')(serverUrl);
    }
  });
});

exports = app;
