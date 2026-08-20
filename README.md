# Field Index — Minecraft Mod Wiki

A plain HTML/CSS/JavaScript wiki template designed for GitHub Pages.

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
{ label: "Stable", class: "tag--green" }
{ label: "MC 1.21", class: "" }
```

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

Then create `/projects/<section>/<slug>/changelog.html`.

`sub: true` indents the page in the project sidebar. Remove it for a top-level tab.

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

## Search

Search is generated automatically from the `pages` entries in `wiki-data.js`. There is no second list to maintain.


## GitHub Pages

There is no build step. Push the repository to GitHub and enable GitHub Pages for the repository/branch containing these files.


## Fyxe wiki setup

The wiki is currently configured for Fyxe's four public Modrinth mods, all under the **Mods** section:

- FFNutrition
- FFBandage
- FFCropEvaporation
- FCompat_VanillaPlus

Additional public projects can be imported into the appropriate section with the importer.

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

The importer uses Modrinth's public API, detects the project type, creates the correct section and project folders, downloads the icon, creates an Overview page, and adds the project to `assets/js/wiki-data.js`.

See `tools/IMPORTER.md` for the full workflow and requirements.
