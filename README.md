# Field Index — Minecraft Mod Wiki

A plain HTML/CSS/JavaScript wiki for GitHub Pages. The site has no runtime build step; a small Python tool regenerates the search index, heading ids, feed and sitemap before you commit.

## What readers get

- **Sidebar** with every project grouped by type and a quick filter. The current project opens to show its pages.
- **On this page**: a sticky contents rail on wide screens (it follows your scroll), or a collapsible list under the page title on narrower ones. Every section heading has a `#` link that copies its address.
- **Search** (`/` or Ctrl+K) across the full text of every page section, including config keys, tags and class names. Use the arrow keys and Enter to jump straight to the matching section.
- **Code examples** with syntax colors (Java, Kotlin, Groovy, JSON, TOML and command lists), Copy and Wrap buttons, and long examples folded behind "Show all lines".
- **Tables**: long tables get a filter box, and option keys in the first column copy on click.
- **Projects catalog** with search plus loader, Minecraft version and guide filters and sorting. Filters are kept in the address, so a filtered view can be shared.
- **Compatibility** page: every mod by Minecraft version and loader, with a "what runs on 1.20.1 Forge?" picker.
- **Updates** page grouped by day with a project filter, and an Atom feed (`feed.xml`).
- Previous/next links between a project's pages, "Edit this page on GitHub", back to top, light/dark theme, print styles and a 404 page that works under the project subpath.

## The important part: one source of truth

**Edit `assets/js/wiki-data.js` first.**

That file contains the site and project metadata used by the rest of the wiki:

- Site name / logo text
- Author name
- Author links
- Project folder/slug
- Project name
- Project sidebar index
- Project status
- Project description/tagline
- Modrinth / CurseForge / GitHub / Discord links
- Modrinth slug used by Shields.io badges
- Mod version and Minecraft version used in examples
- Project icon
- Platform/version tags
- Every page in each project's sidebar
- Page titles, descriptions, search text, and last-updated dates

### Status options

Set `status` to one of:

```js
status: "active"    // green dot / pill
status: "planning"  // amber dot / pill
status: "archived"  // gray dot / pill
```

The CSS classes are generated automatically from the value, so you do not need to edit HTML to change a project's status.

### Tag options

A tag has a label and optional CSS class:

```js
{ label: "Fabric", class: "tag--blue" }
{ label: "NeoForge", class: "tag--rust" }
{ label: "Forge", class: "tag--amber" }
{ label: "Stable", class: "tag--green" }
{ label: "MC 1.21", class: "" }
```

Loaders keep these colors everywhere; a tag with no class (Minecraft versions, for example) is neutral grey.

### Names, colors and icons

- Project names have no spaces: `FF` plus the words in CamelCase (`FFEntityDirt`, `FFRandomQuests`). Long names wrap between their words automatically.
- Each project gets a stable accent color from its slug, used for the stripe on its card and header and for its icon tile. To pick one yourself, add `accent: "#7A3FA0"` to the project; choose a mid-dark color, since the tile puts white letters on it.
- Projects without an `icon` show a two-letter monogram tile (`FFEntityDirt` shows `ED`).
- The site color is grass green. Green text is kept for links and "you are here" states; labels, inline code and plain tags stay neutral. Every colored text token is checked at 4.5:1 contrast in both themes, so add new colors as `*-ink` tokens in `style.css` rather than raw hex.

### Screenshot slots

Mark a picture that still needs taking with a placeholder figure:

```html
<figure class="figure figure--todo"><div class="figure__todo">What the screenshot should show.</div></figure>
```

It shows as a dashed "Screenshot needed" box on a local preview (`localhost`, `127.0.0.1` or a `file:` page) and is removed on the published site. When the picture exists, replace the `div` with `<img src="..." alt="...">`, keeping `class="figure"` and dropping `figure--todo`. Each mod Overview starts with a slot describing the main shot from that mod's README.

### Project links

Project links are defined once under `links`:

```js
links: {
  modrinth: "https://modrinth.com/mod/example",
  curseforge: "https://www.curseforge.com/minecraft/mc-mods/example",
  github: "https://github.com/you/example",
  modrinthVersions: "https://modrinth.com/mod/example/versions",
  discord: "https://discord.gg/example"
}
```

Leave a link as an empty string if that service does not exist. The corresponding button/link is automatically hidden.

## Adding a project

1. Choose a `type`: `mod`, `modpack`, `resourcepack`, or `datapack`.
2. Create the project folder under that type's section in `/projects/`.
3. Rename the folder. The folder name becomes the project's `slug` in `wiki-data.js`.
4. Add one project object to `assets/js/wiki-data.js`.
5. Add the pages that actually exist to that project's `pages` array.
6. Edit the copied HTML for the page content.

You **do not** need to edit:

- `/projects/index.html` or the section pages under `/projects/mods/`, `/projects/modpacks/`, `/projects/resource-packs/`, and `/projects/datapacks/`
- Existing project sidebars
- Other project pages' sidebars
- A separate search index
- Project titles in every HTML file
- Modrinth/CurseForge/GitHub buttons on every page

The project directory, sidebars, page titles, breadcrumbs, search index, and project metadata are generated from `wiki-data.js`.

## Adding a page

Add it to the project's `pages` array:

```js
{
  file: "changelog.html",
  title: "Changelog",
  index: "06",
  sub: true,
  description: "A version history for the mod.",
  searchExcerpt: "Version history and release notes.",
  updated: "2026-08-19"
}
```

Then create `/projects/<section>/<slug>/changelog.html`. Copy the `<head>` of an existing page in the same folder: every page needs the shared Google Fonts link, the stylesheet, the favicon link, and the small inline theme script that sets light or dark mode before the page paints. `tools/check_site.py` reports pages missing any of them.

Pages appear in the sidebar, the previous/next links and the catalog's guide chips in `pages` order. For mods, use: Overview, Configuration (when the options are too long for the Overview), Datapacks, Modding API.

Write sections as `h2` and `h3` headings: they become the page contents, search results and section links. `tools/build_site.py` gives each one a stable `id`; keep an existing id when you reword a heading so old links keep working.

## Metadata inside HTML

Project HTML uses small `data-*` markers for values that need to appear inside page content. Examples:

```html
<span data-project-name>Project Name</span>
<a data-project-link="modrinth">Modrinth</a>
<img data-project-icon>
<span data-project-status></span>
<span data-project-tag="Fabric">Fabric</span>
<img data-project-badge="downloads">
```

These are populated from `assets/js/wiki-data.js` when the page loads.

For code examples, the following are available:

```html
<span data-project-code="modrinth-slug"></span>
<span data-project-code="version"></span>
<span data-project-code="minecraft-version"></span>
<span data-project-code="github-clone"></span>
```

## Code examples

Write examples as `<pre><code class="language-...">`. Supported labels and colors: `language-java`, `language-kotlin`, `language-groovy`, `language-json`, `language-toml`, `language-properties` and `language-text` (command listings: lines starting with `/` and `<placeholders>` are colored). Other languages get a label but no colors. Examples longer than 26 lines are folded until the reader expands them.

## Before you commit: build and check

```text
python tools/build_site.py
python tools/check_site.py
```

`build_site.py` regenerates everything derived from the pages and `wiki-data.js`:

- **Project versions and targets.** For each mod with a sibling `../<slug>_repo`, it copies `mod.version` and the build targets (`[<loader>."<minecraft>"]` tables) from `stonecutter.properties.toml` (or `mod_version`/`minecraft_version` from `gradle.properties`) into `wiki-data.js`. It also rebuilds that mod's loader and `MC` tags. Mods without a sibling repo keep their hand-written values.
- **Heading ids** on every project page.
- `assets/js/search-index.js`: the full-text search index, loaded only when someone searches.
- `feed.xml` and `sitemap.xml`, from `site.recentUpdates` and `site.url`.

`check_site.py` fails when any of those are out of date. It also checks that every page and icon listed in `wiki-data.js` exists, that every page has the shared `<head>` pieces, that local links resolve, and that project pages use relative paths that work under a GitHub Pages project subpath.

The published site needs only the static files; both tools are maintainer steps. Preview under a repository path such as `/mod-wiki/` (for example `python -m http.server` from the parent folder) to catch URL mistakes.


## Fyxe wiki setup

The **Mods** section covers every Minecraft mod project in the sibling workspace. Each has an Overview page with the full details that the mod READMEs (the Modrinth and CurseForge descriptions) leave out: configuration options and defaults, commands, compatibility and loader notes. Mods with long option lists (FFEntityDirt, FFEntityPainting, FFRandomQuests) keep them on a separate Configuration page instead, with a short pointer on the Overview. Mods with datapack support have a Datapacks page (formats, paths and examples), and mods with a public integration API have a Modding API page. Versions and targets come from each mod's source through `tools/build_site.py`, so they can be newer than a published release.

Only projects with a configured Modrinth slug show a Modrinth button or badge. Leave `modrinthSlug` empty for projects still awaiting publication. `status` describes project development, not publication.

When a mod's API changes, update its API page and `assets/js/wiki-data.js` page metadata in the same change. When its datapack support changes, update its `datapacks.html` the same way (create one, with a `Datapacks` entry after the Overview, or after the Configuration page when there is one, in `pages`, when a mod gains datapack support). Options and commands go on the mod's Configuration page when it has one, otherwise on the Overview. Keep examples aligned with the current Java source and test local links under a GitHub Pages project path. Additional public projects can still be imported with the importer.

### Where to edit things

`assets/js/wiki-data.js` is the single source of truth for site identity, profile links, project types, project names, Modrinth slugs, status, versions, compatibility tags, external links, and project pages. Empty optional links are hidden automatically.

Project types are `mod`, `modpack`, `resourcepack`, and `datapack`. The type controls which section and folder the project belongs to.

### Import a project from Modrinth automatically

Double-click `import-project.bat` on Windows and paste any supported Modrinth project URL. The existing `import-mod.bat` remains as a backwards-compatible alias. On macOS/Linux, use `./import-project.sh`.

Examples:

```text
py tools/import_mod.py https://modrinth.com/mod/your-mod
py tools/import_mod.py https://modrinth.com/modpack/your-pack
py tools/import_mod.py https://modrinth.com/resourcepack/your-pack
py tools/import_mod.py https://modrinth.com/datapack/your-pack
```

The importer uses Modrinth's public API, detects the project type, creates the correct section and project folders, downloads the icon, creates an Overview page, and adds the project to `assets/js/wiki-data.js`. Run `python tools/build_site.py` afterwards to index the new page.

See `tools/IMPORTER.md` for the full workflow and requirements.
