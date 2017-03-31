# Hey it's Another Documentation Server! (hads)

[![NPM version](https://img.shields.io/npm/v/hads.svg)](https://www.npmjs.com/package/hads)
![Node version](https://img.shields.io/node/v/hads.svg)
![Downloads](https://img.shields.io/npm/dm/hads.svg)
[![License](https://img.shields.io/npm/l/hads.svg)](LICENSE)

### *The master of ~~hell~~ docs*

> **Hads** is a fast Node.js based web server allowing to browse, search and edit documentation written in
[Markdown](http://daringfireball.net/projects/markdown/).

![screenshot](https://cloud.githubusercontent.com/assets/593151/24351859/afb0b958-12e7-11e7-8ad4-8655e6b3c1c1.png)

**Features**:

- No configuration needed
- Github-like presentation
- GFM ([Github Flavoured Markdown](https://guides.github.com/features/mastering-markdown/))
- Automatic indexation and search
- In-browser editor
- Table of contents using Markdown extension `[[toc]]`
- Navigation index using Markdown extension `[[index]]`
- Diagrams and flowcharts using [Mermaid](http://knsv.github.io/mermaid/) syntax
- Drag'n drop images
- 100% offline
- Production Mode. No edition possible
- Possibility to hook Templates and Public files
- Load plugins from your local installation (useful to add contact form etc..)

## Usage

```bash
npm install -g hads
hads -o
```

Your browser will open `http://localhost:4040` and display your project documentation.

### Command-line options

```
Usage: hads [root dir] [options]

Options:
  -p, --port        Port number to listen on       [default: 4040]
  -h, --host        Host address to bind to        [default: "localhost"]
  -i, --images-dir  Directory to store images      [default: "images"]
  -x, --production  Production Mode. No edition possible
  -o, --open        Open default browser on start
  --help            Show this help
```

If no root dir is specified, `./` will be used.

## Extras

### Home page

The server will automatically search for a file named `index.md`, `readme.md` or `README.md` on the specified
documentation root and will use it as your home page.

### Table of contents

The special text `[[toc]]` will be replaced by the table of contents of the markdown document, based on headings.

### Navigation index

The special text `[[index]]` will be replaced by the full navigation index of all markdown files found under the
specified *root dir*. File and folder names will be *humanized* for better readability.

It is particularly useful on the home page to provide an overview of the available documentation for your project.

### Diagrams and flowcharts

You can use the [Mermaid](http://knsv.github.io/mermaid/) syntax to insert diagrams and flowcharts directly in your
markdown, but using code blocks with the `mermaid` language specified, like this:


    ```mermaid
    graph TD;
        A-->B;
        A-->C;
        B-->D;
        C-->D;
    ```

### Local Dynamic Hooking

You can set your own template by creating a **__hads/** directory in your root path.

* You can add your own public files in **__hads/public/** which is accecible from http://<domain>/_hads/ (w/ only one underscore)
* You can overload the **PUG** templates used internally in **__hads/views/** as following:
 * **add.pug**: Add template
 * **edit.pug**: Edit Template
 * **file.pug**: File Templater
 * **footer.pug**: Footer
 * **header.pug**: Header
 * **layout.pug**: General layout

### Creating a plugin

Create **__hads/plugins/myplugin** directory into your installation, create a file **__hads/plugins/myplugin/hads.js** and add the following lines in it:

```javascript
module.exports = function(app) {
	console.log('hello world!');
}
```

The **app** variable is the Express.js object where you can add new routes. You can add a **package.json** into your plugin directory if you need to add some dependencies.

## Updates

See changelog [here](CHANGELOG)
