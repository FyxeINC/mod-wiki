# Mod wiki: task entry

Static HTML/CSS/JavaScript documentation for the workspace's mods and other projects. The [workspace rules](../../AGENTS.md) apply; read only relevant sections of the [maintainer README](../README.md).

## Essential context

- [wiki-data.js](../assets/js/wiki-data.js) owns project/page metadata and navigation. Edit project content under [projects](../projects/); common behavior/style lives in [assets](../assets/).
- [build_site.py](../tools/build_site.py) derives versions/targets from sibling build configuration and regenerates headings, search, feed and sitemap. Do not hand-edit generated output.
- Preserve existing heading IDs and relative URLs; pages must work under a GitHub Pages project subpath. Leave unavailable publication links empty.

## Choose by task

| Task | Read |
| --- | --- |
| Add a project/page or change metadata | [README](../README.md): one source of truth; Adding a project; Adding a page |
| Update mod behavior, config, datapacks or APIs | [Workspace wiki rules](../../.AI_CONTEXT/WIKI.md) and the affected mod's context entry/source |
| Edit HTML examples, screenshots or styling | [README](../README.md): Screenshot slots; Metadata inside HTML; Code examples |
| Import a public project | [Importer guide](../tools/IMPORTER.md) |
| Build, check or preview | [README](../README.md): Before you commit: build and check |

## Verification

For site changes, run `python tools/build_site.py`, then `python tools/check_site.py` from this project. Preview pages under `/mod-wiki/` when checking links or behavior. For agent-note-only edits, check documentation links and routing; site regeneration is unnecessary.
