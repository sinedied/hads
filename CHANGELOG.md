# 1.7.3
- Fix crashing on highlighting an unsupported language (PR #43) - by @igorskh
- Fix unescaped characters in TOC links
- Updated dependencies

# 1.7.2
- FIx install issue with `highlight.js` package (#41)
- Updated dependencies

# 1.7.1
- Fixed wrong cursor position in editor (PR #33) - by @jamerson

# 1.7.0
- Updated dependencies
- Updated `marked` renderer to latest version, rendering may be slightly affected
- Fixed "Last updated" text on search page
- Replaced `open` module to remove critical vulnerability

# 1.6.1
- Updated dependencies

# 1.6.0
- Added read-only mode (PR #26) - by @fabala

# 1.5.1
- Added last modified date (PR #25) - by @fabala

# 1.5.0
- Added support for Mermaid config customization
- Added proper HTTP status codes on error
- Updated dropzone dependency

# 1.4.1
- Added link opening in a new tab for images (PR #19) - by @fabala
- Fixed link inside link

# 1.4.0
- Added support for Font-Awesome icons in Mermaid graphs (PR #13) - by @thomasleveil
- Added custom.css file support (PR #14) - by @thomasleveil
- Bumped Node.js requirement to `node >= 6`
- Fixed display on mobile devices (#11)
- Removed neutral theme as it's now integrated in Mermaid directly
- Updated dependencies

# 1.3.4
- Fixed mermaid loop text color (PR #9)

# 1.3.3
- Added filter for files/folders starting with a dot
- Updated Github CSS

# 1.3.2
- Added module export to allow server integration and extension

# 1.3.1
- Added new mermaid neutral theme
- Fixed issue with dependencies path when installed as a local module

# 1.3.0
- Added support for github-style markdown links (without extension)

# 1.2.2
- Added image file selector button
- Fixed line endings on edited documents for unix platforms
- Fixed shape rendering for Mermaid graphs
- Fixed unwanted file dialog display
- Removed unwanted uploaded file previews

# 1.2.1
- Fixed edition of markdown files containing HTML tags

# 1.2.0
- Added [[toc]] table of contents markdown extension
- Added images drag'n drop support to editor
- Added save (CTRL+S/CMD+S) keyboard shortcut to editor
- Mermaid diagram code is now hidden during processing
- Removed specific rendering for images
- Small fixes and performance improvements

# 1.1.2
- Fixed issue on Windows

# 1.1.1
- Added print-friendly styling
- Fixed issue when no home page was present

# 1.1.0
- Added mermaid syntax support to generate diagrams
- Fixed [[index]] in code blocks
- Fixed search extracts

# 1.0.1
- Adding new markdown files support
- Renamed project to "hads"
