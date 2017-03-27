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
    
## Updates

See changelog [here](CHANGELOG)
