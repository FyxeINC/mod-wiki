# Field Index — a wiki template for GitHub Pages

A plain HTML/CSS/JS wiki with no build step: a landing page, a project
directory, and a pattern for pages nested within a project. Every file can
be opened directly in a browser, and the whole thing deploys to GitHub
Pages as-is.

## Structure

```
.
├── index.html                          landing page
├── assets/
│   ├── css/style.css                   all styles (light + dark theme)
│   └── js/
│       ├── main.js                     theme toggle, tabs, search, copy buttons
│       └── search-index.js             search data — one entry per page
├── projects/
│   ├── index.html                      directory of all projects
│   ├── project-alpha/                  full example project
│   │   ├── index.html                  overview
│   │   ├── getting-started.html        subpage
│   │   └── architecture.html           subpage
│   └── project-beta/                   minimal single-page project
│       └── index.html
└── .nojekyll                           tells GitHub Pages to serve files as-is
```

## Deploy to GitHub Pages

1. Create a new repository on GitHub (or use an existing one).
2. Push this folder's contents to the repository's default branch:
   ```bash
   git init
   git add .
   git commit -m "Initial wiki"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
3. In the repository, go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`.
5. Save. GitHub gives you a URL like `https://<you>.github.io/<repo>/`
   within a minute or two.

The `.nojekyll` file is already included so GitHub Pages serves the files
directly instead of running them through Jekyll (which can trip over
folders that start with an underscore or files it tries to interpret as
templates).

## Adding a new project

1. Duplicate `projects/project-alpha/` (or the simpler `project-beta/` if
   you only need one page) and rename the folder.
2. Update the page titles, breadcrumb text, and sidebar links inside the
   copied files.
3. Add a card for it in `projects/index.html`.
4. Add a link to it from the sidebar of every other project page, under
   "Other Projects" (optional, but keeps cross-navigation consistent).
5. Add one entry per page to `assets/js/search-index.js` so it shows up in
   search.

## Adding a new page inside an existing project

1. Copy an existing subpage, e.g. `getting-started.html`, into the same
   project folder and rename it.
2. Add a `tab-link tab-link--sub` entry for it in the sidebar of every page
   in that project (including the overview page).
3. Update the `page-nav` previous/next links on the pages before and after
   it, and on the new page itself.
4. Add an entry to `assets/js/search-index.js`.

## Feature reference

Everything below is demonstrated somewhere in the template — view the
source of the relevant page to copy the markup.

| Feature | Where to find it |
|---|---|
| Light / dark theme toggle, persisted per visitor | Top bar, every page (`assets/js/main.js`) |
| Client-side search | Top bar search box, backed by `assets/js/search-index.js` |
| Binder-tab sidebar navigation | Every page except the landing page |
| Breadcrumbs | Below the top bar on every inner page |
| Callouts / admonitions (note, warning, danger) | `projects/project-alpha/getting-started.html` |
| Code blocks with a copy button | `projects/project-alpha/getting-started.html` |
| Tabbed content (e.g. npm/yarn/pnpm) | `projects/project-alpha/getting-started.html` |
| Collapsible sections (`<details>`) | `projects/project-alpha/index.html` and `getting-started.html` |
| Tables | `index.html`, `architecture.html` |
| Tags and status pills | `projects/index.html` |
| Right-hand table of contents | `getting-started.html`, `architecture.html` |
| Inline SVG diagram (no external library) | `projects/project-alpha/architecture.html` |
| Previous / next page navigation | Bottom of every project subpage |
| Responsive layout + mobile sidebar toggle | Resize any page below ~760px |

## Notes

- Fonts (Zilla Slab, IBM Plex Sans, IBM Plex Mono) are loaded from Google
  Fonts via a `<link>` tag. If you'd rather not depend on an external
  request, download the font files and self-host them, then update the
  `@font-face`/`<link>` references.
- There is no build step and no framework — every `.html` file is
  self-contained and links to the shared CSS/JS with a relative path. This
  keeps things simple, but it does mean the top bar and sidebar markup is
  duplicated across pages rather than pulled from one shared include.
