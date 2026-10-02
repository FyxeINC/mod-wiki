# Changelog

## 2026-10-02 (About page)

- The About page links to Fyxe's CurseForge profile and has a Buy Me a Coffee button under Support.

## 2026-10-02 (CurseForge)

- 15 mods now link to their CurseForge pages and use their CurseForge icons. Project headers also show a CurseForge download-count badge, driven by a new `curseforgeId` field in `wiki-data.js`.

## 2026-10-01 (navigation, search and tools)

- New sidebar: every project grouped by type with a filter box; the current project opens to show its pages. Replaces the separate page list and "Other mods" drawer.
- "On this page" is now a sticky contents rail on wide screens that follows your scroll, and a collapsible list on narrower screens, replacing the cloud of heading chips. Section headings have a `#` link that copies their address.
- Search covers the full text of every page section (config keys, tags, class names), opens with `/` or Ctrl+K, works with the arrow keys and Enter, and jumps straight to the matching section with the words highlighted.
- Code examples get syntax colors, a Wrap button next to Copy, and long examples fold behind "Show all lines".
- Long tables get a filter box, and option keys in the first column copy on click.
- The projects catalog has loader, Minecraft version and guide filters plus sorting, all kept in the address so a filtered view can be shared. Cards show when each project was last updated.
- New Compatibility page: every mod by Minecraft version and loader, with a picker for "what runs on this version and loader".
- New Updates page grouped by day with a project filter, an Atom feed, and a shorter "Recent updates" row on the home page.
- FFEntityDirt, FFEntityPainting and FFRandomQuests have a new Configuration page with their options and commands, so their Overviews read faster.
- Previous/next links between a project's pages, "Edit this page on GitHub", a back-to-top button, a grass-block favicon, print styles, a skip link, and a 404 page that works under the project subpath.
- Mod versions, build targets and loader tags now come from each mod's source through `tools/build_site.py`. This corrected FFEntityPainting (0.9.4) and added FFNutrition's missing Fabric tag. `tools/check_site.py` fails when generated files are stale.

## 2026-10-01 (look and identity)

- New grass-green color scheme in light and dark themes, replacing teal. Green is now kept for links, buttons and the current page; inline code, labels and Minecraft version tags are neutral, and every colored text passes 4.5:1 contrast.
- Project names no longer have spaces: FFCropEvaporation, FFEntityPainting, FFEntityDirt, FFExpandedBiomeTint and FFRandomQuests (was Random Quests).
- Every project has its own accent color and, when it has no icon, a two-letter monogram tile with an inventory-slot bevel, shown on its card, header and sidebar.
- Project cards show the icon, a three-line description, the extra guides the project has (Datapacks, Modding API and so on) and loader tags along the bottom. Only projects that aren't active show a status.
- Datapacks and API pages use a slim one-row project header so the content starts higher; the full header stays on the Overview. Empty badge and link rows are hidden.
- Forge tags are amber, so Fabric, NeoForge and Forge each have their own color.
- Each mod Overview has a screenshot slot describing its main picture. Slots only show on a local preview.

## 2026-10-01

- Mod pages now load the wiki fonts like the rest of the site, and the light or dark theme is applied before the page paints, so it no longer flashes light first.
- Every code example (Datapacks and Overview pages included) gets a labelled code bar (JSON, Java, Kotlin, TOML) with a copy button; code text is no longer tinted teal in dark mode.
- Fixed mod headers without an icon collapsing into a narrow column on phones.
- Raised contrast on faint labels, amber and rust text; NeoForge tags keep their rust color in dark mode; the primary button is no longer grey.
- Table columns keep identifiers like `weight_from` on one line instead of splitting them mid-word.
- The home page shows an "At a glance" card built from the wiki data instead of the stale index-card graphic, and Recent updates lists the newest 8 first with a "Show all" button.
- The About page uses the site mark instead of a placeholder image, and the profile card sits side by side again.
- `tools/check_site.py` reports pages missing the shared fonts or the early theme script.

## 2026-09-30

- Added Datapacks pages for FF Crop Evaporation, FF Entity Dirt, FF Expanded Biome Tint, FFFoodSpoilageAndPreservation, FFInjury, FFItemRarityModifiers, FFItemWeight and FF Nutrition, with the formats, paths and examples moved out of the mod descriptions.
- Moved the detailed configuration tables, commands, compatibility and loader notes from the shortened mod READMEs onto each mod's Overview page.
- Documented FFItemCreationTracker tooltip lang keys and Random Quests reward helpers on their API pages.

## 2026-09-25

- Reworked project navigation and catalog filtering, added in-page guides and API code copy controls, and fixed iconless mod pages collapsing into a narrow column on mobile.
- Rewrote the Food Spoilage and Preservation overview and reorganized its API guide for players, pack makers, and mod developers.
- Fixed project counts on section pages and expanded the GitHub Pages checker to validate project icons.

- Document FF Expanded Biome Tint 0.4.0 Java registration API and datapack override order.

- Document FF Expanded Biome Tint 0.3.3 block-breaking particle tinting.

- Document FF Expanded Biome Tint 0.3.2 vanilla deepslate block and ore defaults.

- Document FF Expanded Biome Tint 0.3.1 bundled regex patterns for common modded overworld ores.

- Documented FF Expanded Biome Tint 0.3.0 datapack rules, selectors, per-block channels, and tint strengths.

## 2026-09-24

- Document FFExhaustion 0.7.4 server-authoritative API queries and batched client HUD updates.

- Document FFFoodSpoilageAndPreservation 0.7.8 menu-based container context, synchronized tooltips, and unknown-position fallback.

- Document FFFoodSpoilageAndPreservation 0.7.6 default-on same-stage stacking, weighted freeze/thaw state, strict-mode config, and custom inventory integration.

- Document FFFoodSpoilageAndPreservation 0.7.5 exact-state stacking, component equality, and furnace output behavior.

- Document FFItemRarityModifiers 0.1.11 durable gear coverage and item-tag restrictions for modifier definitions.
- Document FFItemRarityModifiers 0.1.10 item category tags and their Minecraft 1.21.1 datapack paths.
- Document FFItemWeight 0.6.4 weight_from datapack references and matching copper variant weights.

## 2026-09-23

- Added overview pages for all 18 local Minecraft mod projects and Modding API guides for the nine mods with public integration surfaces.
- Updated source versions from each mod's `gradle.properties` and kept Modrinth links limited to configured projects.
- Fixed optional Modrinth buttons and icons so they remain hidden on projects without those assets.
- Added a static site checker for project pages and relative links used by GitHub Pages.
