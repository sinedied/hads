# Hey it's Another Documentation Server! (hads)

Fast local web server to browse, search and edit project documentation written in
[Markdown](http://daringfireball.net/projects/markdown/).


![screenshot](https://cloud.githubusercontent.com/assets/593151/18916305/4dcdf5ba-8594-11e6-8eff-831153b784fb.png)

**Features**:

- No configuration needed
- Github-like presentation
- GFM ([Github Flavoured Markdown](https://guides.github.com/features/mastering-markdown/))
- Automatic indexation and search
- Navigation index generation using Markdown extension `[[index]]`
- In-browser editor
- Works 100% offline


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
  -p, --port  Port number to listen on       [default: 4040]
  -h, --host  Host address to bind to        [default: "localhost"]
  -o, --open  Open default browser on start
  --help      Show this help
```

If no root dir is specified, `./` will be used.

## Extras

### Home page
 
The server will automatically search for a file named `index.md`, `readme.md` or `README.md` on the specified
documentation root and will use it as your home page.

### Navigation index

If you insert the text `[[index]]` in any of your markdown files, it will be replaced by the full navigation index of
the markdown files found under the specified *root dir*. File and folder names will be automatically *humanized* for
better readability.

It is particularly useful on home page to provide an overview of the available documentation for your project.

## License

[MIT](LICENSE)
