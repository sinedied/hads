# 2.1.0
- Add ordering in [[index]] (#58)
- Fix search links with files containing spaces
- Update dependencies

# 2.0.2
- Update dependencies
- Fix extra \r character on bin file 

# 2.0.1
- Fix export links on Windows
- Update dependencies (fix #51)

# 2.0.0
- Add static HTML export option (PR #45) - by @rhucle
- Replace Bluebird and mkdirp with fs-extra
- Update dependencies
- Fix linter issues

### Breaking changes:
- Bump Node.js requirement to `node >= 8`

# 1.7.3
- Fix crashing on highlighting an unsupported language (PR #43) - by @igorskh
- Fix unescaped characters in TOC links
- Update dependencies

# 1.7.2
- Fix install issue with `highlight.js` package (#41)
- Update dependencies

# 1.7.1
- Fix wrong cursor position in editor (PR #33) - by @jamerson

# 1.7.0
- Update dependencies
- Update `marked` renderer to latest version, rendering may be slightly affected
- Fix "Last updated" text on search page
- Replace `open` module to remove critical vulnerability

# 1.6.1
- Update dependencies

# 1.6.0
- Add read-only mode (PR #26) - by @fabala

# 1.5.1
- Add last modified date (PR #25) - by @fabala

# 1.5.0
- Add support for Mermaid config customization
- Add proper HTTP status codes on error
- Update dropzone dependency

# 1.4.1
- Add link opening in a new tab for images (PR #19) - by @fabala
- Fix link inside link

# 1.4.0
- Add support for Font-Awesome icons in Mermaid graphs (PR #13) - by @thomasleveil
- Add custom.css file support (PR #14) - by @thomasleveil
- Bump Node.js requirement to `node >= 6`
- Fix display on mobile devices (#11)
- Remove neutral theme as it's now integrated in Mermaid directly
- Update dependencies

# 1.3.4
- Fix mermaid loop text color (PR #9)

# 1.3.3
- Add filter for files/folders starting with a dot
- Update Github CSS

# 1.3.2
- Add module export to allow server integration and extension

# 1.3.1
- Add new mermaid neutral theme
- Fix issue with dependencies path when installed as a local module

# 1.3.0
- Add support for github-style markdown links (without extension)

# 1.2.2
- Add image file selector button
- Fix line endings on edited documents for unix platforms
- Fix shape rendering for Mermaid graphs
- Fix unwanted file dialog display
- Remove unwanted uploaded file previews

# 1.2.1
- Fix edition of markdown files containing HTML tags

# 1.2.0
- Add [[toc]] table of contents markdown extension
- Add images drag'n drop support to editor
- Add save (CTRL+S/CMD+S) keyboard shortcut to editor
- Mermaid diagram code is now hidden during processing
- Remov specific rendering for images
- Small fixes and performance improvements

# 1.1.2
- Fix issue on Windows

# 1.1.1
- Add print-friendly styling
- Fix issue when no home page was present

# 1.1.0
- Add mermaid syntax support to generate diagrams
- Fix [[index]] in code blocks
- Fix search extracts

# 1.0.1
- Add new markdown files support
- Rename project to "hads"
