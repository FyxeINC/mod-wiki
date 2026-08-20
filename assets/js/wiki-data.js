/*
 * =====================================================================
 * WIKI DATA — THE ONE PLACE TO EDIT YOUR WIKI
 * =====================================================================
 *
 * Almost everything repeated across the site belongs here.
 *
 * PROJECT TYPE OPTIONS:
 *   "mod"          = Mods
 *   "modpack"      = Modpacks
 *   "resourcepack" = Resource Packs
 *   "datapack"     = Datapacks
 *
 * STATUS OPTIONS:
 *   "active"   = green dot / pill
 *   "planning" = amber/yellow dot / pill
 *   "archived" = gray dot / pill
 *
 * TAG CLASS OPTIONS:
 *   "tag--blue"  = blue
 *   "tag--rust"  = orange/rust
 *   "tag--green" = green
 *   ""           = default tag color
 *
 * PROJECT SETUP:
 *   type            = mod / modpack / resourcepack / datapack. This decides
 *                     which wiki section and folder the project belongs to.
 *   slug            = project folder name and URL. Keep this URL-safe.
 *   name            = display name everywhere.
 *   modrinthSlug    = Modrinth project slug.
 *   status          = active / planning / archived.
 *   version         = current version shown in the wiki.
 *   minecraftVersion= supported Minecraft version(s) shown in the wiki.
 *   icon            = image URL or local project icon filename.
 *   links.github    = optional source repository. Leave "" to hide it.
 *   links.curseforge= optional CurseForge page. Leave "" to hide it.
 *   links.discord   = optional project Discord. Leave "" to hide it.
 *   tags            = loader/version/category labels shown on cards/pages.
 *
 * PAGE SETUP:
 *   Every physical HTML page in a project folder should have one entry in
 *   that project's `pages` array. This controls its sidebar, page title,
 *   search entry, description, and last-updated date.
 *
 * TO ADD A PROJECT MANUALLY:
 *   1. Create its folder under projects/<section>/ and copy an existing page.
 *   2. Set type to mod/modpack/resourcepack/datapack.
 *   3. Add one project object here.
 *   4. Add the physical pages to its `pages` array.
 *
 * The importer (`import-mod.bat` / `import-mod.sh`) can do all of this
 * automatically from a public Modrinth URL.
 */
window.WIKI_DATA = {
  site: {
    name: "Fyxe's Mod Wiki",
    mark: "FX",
    description: "Documentation for Fyxe's Minecraft mods.",
    author: {
      name: "Fyxe",
      modrinth: "https://modrinth.com/user/Fyxe",
      github: "https://github.com/FyxeINC",
      discord: "",
      koFi: "",
      patreon: ""
    },
    recentUpdates: [
      
    ]
  },

  sections: {
    mods: { type: "mod", label: "Mods", path: "mods" },
    modpacks: { type: "modpack", label: "Modpacks", path: "modpacks" },
    resourcepacks: { type: "resourcepack", label: "Resource Packs", path: "resource-packs" },
    datapacks: { type: "datapack", label: "Datapacks", path: "datapacks" }
  },

  projects: [
    

    {
        "slug": "ffnutrition",
        "type": "mod",
        "name": "FFNutrition",
        "index": "A",
        "status": "active",
        "description": "A lightweight and configurable food nutrition system that works differently from \"Spice of\" mods and effects max health. A Fyxe's Features mod.",
        "tagline": "A lightweight and configurable food nutrition system that works differently from \"Spice of\" mods and effects max health. A Fyxe's Features mod.",
        "version": "0.0.6",
        "minecraftVersion": "1.21.1",
        "modrinthSlug": "ffnutrition",
        "icon": "icon.png",
        "tags": [
            {
                "label": "NeoForge",
                "class": "tag--rust"
            },
            {
                "label": "MC 1.21.1",
                "class": ""
            }
        ],
        "links": {
            "github": "https://github.com/FyxeINC/ffnutrition",
            "curseforge": "",
            "discord": ""
        },
        "pages": [
            {
                "file": "index.html",
                "title": "Overview",
                "index": "01",
                "description": "FFNutrition overview, compatibility, features, and Modrinth information.",
                "updated": "2026-08-19",
                "searchExcerpt": "A lightweight and configurable food nutrition system that works differently from \"Spice of\" mods and effects max health. A Fyxe's Features mod."
            }
        ]
    },
    {
        "slug": "ffdata_cheaper_maps",
        "type": "datapack",
        "name": "FFCheaperMaps",
        "index": "E",
        "status": "active",
        "description": "Creates a new #inks tag and uses it as the center crafting ingredient for maps.",
        "tagline": "Creates a new #inks tag and uses it as the center crafting ingredient for maps.",
        "version": "0.0.1",
        "minecraftVersion": "1.21",
        "modrinthSlug": "ffdata_cheaper_maps",
        "icon": "icon.png",
        "tags": [
            {
                "label": "datapack",
                "class": ""
            },
            {
                "label": "MC 1.21.1–1.21",
                "class": ""
            }
        ],
        "links": {
            "github": "",
            "curseforge": "",
            "discord": ""
        },
        "pages": [
            {
                "file": "index.html",
                "title": "Overview",
                "index": "01",
                "description": "FFCheaperMaps overview, compatibility, features, and Modrinth information.",
                "updated": "2026-08-19",
                "searchExcerpt": "Creates a new #inks tag and uses it as the center crafting ingredient for maps."
            }
        ]
    },

    {
        "slug": "fyxes-pbr-addons",
        "type": "resourcepack",
        "name": "Fyxe's PBR Addons",
        "index": "E",
        "status": "active",
        "description": "A PBR Extension for various mod blocks and items that includes Normal and Specular maps for LabPBR shaders.",
        "tagline": "A PBR Extension for various mod blocks and items that includes Normal and Specular maps for LabPBR shaders.",
        "version": "0.3.0",
        "minecraftVersion": "1.20",
        "modrinthSlug": "fyxes-pbr-addons",
        "icon": "icon.png",
        "tags": [
            {
                "label": "Minecraft",
                "class": "tag--green"
            },
            {
                "label": "MC 1.20.1–1.20",
                "class": ""
            }
        ],
        "links": {
            "github": "",
            "curseforge": "",
            "discord": ""
        },
        "pages": [
            {
                "file": "index.html",
                "title": "Overview",
                "index": "01",
                "description": "Fyxe's PBR Addons overview, compatibility, features, and Modrinth information.",
                "updated": "2026-08-19",
                "searchExcerpt": "A PBR Extension for various mod blocks and items that includes Normal and Specular maps for LabPBR shaders."
            }
        ]
    },

    {
        "slug": "ffbandage",
        "type": "mod",
        "name": "FFBandage",
        "index": "A",
        "status": "active",
        "description": "Adds a simple healing bandage with configurable settings. A Fyxe's Features mod.",
        "tagline": "Adds a simple healing bandage with configurable settings. A Fyxe's Features mod.",
        "version": "0.0.2",
        "minecraftVersion": "1.21.1",
        "modrinthSlug": "ffbandage",
        "icon": "icon.png",
        "tags": [
            {
                "label": "NeoForge",
                "class": "tag--rust"
            },
            {
                "label": "MC 1.21.1",
                "class": ""
            }
        ],
        "links": {
            "github": "",
            "curseforge": "",
            "discord": ""
        },
        "pages": [
            {
                "file": "index.html",
                "title": "Overview",
                "index": "01",
                "description": "FFBandage overview, compatibility, features, and Modrinth information.",
                "updated": "2026-08-19",
                "searchExcerpt": "Adds a simple healing bandage with configurable settings. A Fyxe's Features mod."
            }
        ]
    },

    {
        "slug": "ffcropevaporation",
        "type": "mod",
        "name": "FFCropEvaporation",
        "index": "A",
        "status": "active",
        "description": "A mod that makes crops require water, and has a chance to replace nearby water with a block when growing. A Fyxe's Features mod.",
        "tagline": "A mod that makes crops require water, and has a chance to replace nearby water with a block when growing. A Fyxe's Features mod.",
        "version": "0.0.2",
        "minecraftVersion": "1.21.1",
        "modrinthSlug": "ffcropevaporation",
        "icon": "icon.png",
        "tags": [
            {
                "label": "NeoForge",
                "class": "tag--rust"
            },
            {
                "label": "MC 1.21.1",
                "class": ""
            }
        ],
        "links": {
            "github": "",
            "curseforge": "",
            "discord": ""
        },
        "pages": [
            {
                "file": "index.html",
                "title": "Overview",
                "index": "01",
                "description": "FFCropEvaporation overview, compatibility, features, and Modrinth information.",
                "updated": "2026-08-19",
                "searchExcerpt": "A mod that makes crops require water, and has a chance to replace nearby water with a block when growing. A Fyxe's Features mod."
            }
        ]
    },

    {
        "slug": "fyxes-vanilla-modpack",
        "type": "modpack",
        "name": "Fyxe's Vanilla+",
        "index": "A",
        "status": "archived",
        "description": "A Vanilla Plus modpack centered around QoL tweaks, performance, and fun additions. Vanilla+",
        "tagline": "A Vanilla Plus modpack centered around QoL tweaks, performance, and fun additions. Vanilla+",
        "version": "0.1.4",
        "minecraftVersion": "1.20.1",
        "modrinthSlug": "fyxes-vanilla-modpack",
        "icon": "icon.png",
        "tags": [
            {
                "label": "Fabric",
                "class": "tag--blue"
            },
            {
                "label": "MC 1.20.1",
                "class": ""
            }
        ],
        "links": {
            "github": "",
            "curseforge": "",
            "discord": ""
        },
        "pages": [
            {
                "file": "index.html",
                "title": "Overview",
                "index": "01",
                "description": "Fyxe's Vanilla+ overview, compatibility, features, and Modrinth information.",
                "updated": "2026-08-19",
                "searchExcerpt": "A Vanilla Plus modpack centered around QoL tweaks, performance, and fun additions. Vanilla+"
            }
        ]
    }
  ]
};

window.WIKI_PROJECTS = window.WIKI_DATA.projects;
