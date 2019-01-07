# Test cases for extra features

## Table of contents

A TOC should be inserted below:
[[toc]]

But not here: `[[toc]]`

And here:
```
[[toc]]
```
And here: [[toc]]

## Index generation

An index should be inserted below:
[[index]]

But not here: `[[index]]`

And here:
```
[[index]]
```
And here: [[index]]


## Mermaid graphs

### Flowchart

```mermaid
graph TD
  subgraph Sub
    A[Hard edge] -->|Link text| B(Round edge)
    B --> C{Decision}
  end
  C -->|One| D[Result one]
  C -->|Two| E[Result two]
```

Source:
```
graph TD
  subgraph Sub
    A[Hard edge] -->|Link text| B(Round edge)
    B --> C{Decision}
  end
  C -->|One| D[Result one]
  C -->|Two| E[Result two]
```

### Sequence diagram
```mermaid
sequenceDiagram
  participant Alice
  participant Bob
  Alice->John: Hello John, how are you?
  loop Healthcheck
    John->John: Fight against hypochondria
  end
  Note right of John: Rational thoughts prevail...
  John-->Alice: Great!
  John->Bob: How about you?
  Bob-->John: Jolly good!
```

Source:
```
sequenceDiagram
  participant Alice
  participant Bob
  Alice->John: Hello John, how are you?
  loop Healthcheck
    John->John: Fight against hypochondria
  end
  Note right of John: Rational thoughts prevail...
  John-->Alice: Great!
  John->Bob: How about you?
  Bob-->John: Jolly good!
```

### Gantt
```mermaid
gantt
    dateFormat  YYYY-MM-DD
    title Adding GANTT diagram functionality to mermaid
    section A section
    Completed task            :done,    des1, 2014-01-06,2014-01-08
    Active task               :active,  des2, 2014-01-09, 3d
    Future task               :         des3, after des2, 5d
    Future task2               :         des4, after des3, 5d
    section Critical tasks
    Completed task in the critical line :crit, done, 2014-01-06,24h
    Implement parser and jison          :crit, done, after des1, 2d
    Create tests for parser             :crit, active, 3d
    Future task in critical line        :crit, 5d
    Create tests for renderer           :2d
    Add to mermaid                      :1d
```

Source:
```
gantt
    dateFormat  YYYY-MM-DD
    title Adding GANTT diagram functionality to mermaid
    section A section
    Completed task            :done,    des1, 2014-01-06,2014-01-08
    Active task               :active,  des2, 2014-01-09, 3d
    Future task               :         des3, after des2, 5d
    Future task2               :         des4, after des3, 5d
    section Critical tasks
    Completed task in the critical line :crit, done, 2014-01-06,24h
    Implement parser and jison          :crit, done, after des1, 2d
    Create tests for parser             :crit, active, 3d
    Future task in critical line        :crit, 5d
    Create tests for renderer           :2d
    Add to mermaid                      :1d
```

### With [Font-Awesome](http://fontawesome.io) icons
```mermaid
graph TD;
    A((A))-->B(B);
    A-->C[click me];
    B-->D[fa:fa-chrome test icon];
    C-->D;
click C "https://mermaidjs.github.io/demos.html" "Mermaid demos"
```

Source:
```
graph TD;
    A((A))-->B(B);
    A-->C[click me];
    B-->D[fa:fa-chrome test icon];
    C-->D;
click C "https://mermaidjs.github.io/demos.html" "Mermaid demos"
```

### Images

Basic images, can be opened in new tab:

![md](md.png)

Image with link:

[![md](md.png)](http://google.com)
