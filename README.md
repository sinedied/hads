# Markdown Documentation Server (mdds)

Simple web server allowing to browse, search and edit project documentation written in
[Markdown](http://daringfireball.net/projects/markdown/).

> TODO: screenshot

Features:

- **No configuration needed**
- Automatic navigation menu generation, with possible manual override
- Github-like presentation
- GFM ([Github Flavoured Markdown](https://guides.github.com/features/mastering-markdown/)) support


## Usage

```bash
npm install -g mdds
mdds -o
```

Your browser will open `http://localhost:4040` and display your project documentation.

### Command-line options

```
Usage: mdds [root dir] [options]

Options:
  -p, --port  Port number to listen on       [default: 4040]
  -h, --host  Host address to bind to        [default: "localhost"]
  -o, --open  Open default browser on start
  --help      Show this help
```

If no root dir is specified, `./` will be used.

## Home page
 
The server will automatically search for a file named `index.md`, `readme.md` or `README.md` on the specified
documentation root and will use it as your home page.

## Navigation

> TODO

## License

[MIT](LICENSE)
