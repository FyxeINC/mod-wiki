/*
 * Shared behaviour for every page of the wiki.
 *
 * Each page sets `window.SITE_ROOT` (a relative path back to the site root:
 * "" for the landing page, "../" for /projects/index.html, "../../../" for
 * /projects/mods/<slug>/index.html) and loads wiki-data.js before this file.
 * Everything here builds on that data; there is no build step at runtime.
 * tools/build_site.py generates the heading ids and search-index.js it reads.
 */
(function () {
  "use strict";

  const DATA = window.WIKI_DATA || { site: {}, sections: {}, projects: [] };
  const SITE = DATA.site || {};
  const PROJECTS = DATA.projects || [];
  const SECTIONS = Object.values(DATA.sections || {});
  const ROOT = window.SITE_ROOT || "";
  const LOADERS = [
    { key: "fabric", label: "Fabric", css: "tag--blue" },
    { key: "neoforge", label: "NeoForge", css: "tag--rust" },
    { key: "forge", label: "Forge", css: "tag--amber" },
    { key: "quilt", label: "Quilt", css: "tag--purple" }
  ];

  /* ---------------------------------------------------------------------
   * Small helpers
   * ------------------------------------------------------------------- */
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
  }
  function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
  function byName(a, b) { return a.name.localeCompare(b.name, "en", { sensitivity: "base" }); }
  function compareVersions(a, b) {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
    }
    return 0;
  }
  function formatDate(iso) {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!parts) return iso || "";
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[Number(parts[2]) - 1] + " " + Number(parts[3]) + ", " + parts[1];
  }

  let toastTimer = 0;
  function toast(message) {
    let node = document.querySelector(".toast");
    if (!node) {
      node = document.createElement("div");
      node.className = "toast";
      node.setAttribute("role", "status");
      node.setAttribute("aria-live", "polite");
      document.body.append(node);
    }
    node.textContent = message;
    node.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { node.classList.remove("is-visible"); }, 1600);
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      area.remove();
    });
  }

  /* ---------------------------------------------------------------------
   * Where are we? Sections, projects and pages from wiki-data.js
   * ------------------------------------------------------------------- */
  const PATH = window.location.pathname.replace(/\\/g, "/");
  const FILE = PATH.substring(PATH.lastIndexOf("/") + 1) || "index.html";

  function getSectionForProject(project) {
    return SECTIONS.find(function (section) { return section.type === project.type; }) || null;
  }
  function getProjectPath(project) {
    const section = getSectionForProject(project);
    return "projects/" + (section ? section.path : project.type || "mods") + "/" + project.slug + "/";
  }
  function getSectionPath(section) { return "projects/" + section.path + "/"; }
  function projectHref(project, file) { return ROOT + getProjectPath(project) + (file || "index.html"); }

  const CURRENT_PROJECT = PROJECTS.find(function (project) { return PATH.indexOf("/" + getProjectPath(project)) !== -1; }) || null;
  const CURRENT_PAGE = CURRENT_PROJECT ? CURRENT_PROJECT.pages.find(function (page) { return page.file === FILE; }) || null : null;
  const CURRENT_SECTION = SECTIONS.find(function (section) { return PATH.indexOf("/projects/" + section.path + "/") !== -1; }) || null;
  const IS_PROJECTS_INDEX = !CURRENT_SECTION && /\/projects\/(index\.html)?$/.test(PATH);
  const ROOT_PAGE = !CURRENT_SECTION && !IS_PROJECTS_INDEX ? FILE : "";

  /** Path of this page from the site root, used for "Edit on GitHub". */
  function currentSourcePath() {
    if (CURRENT_PROJECT) return getProjectPath(CURRENT_PROJECT) + FILE;
    if (CURRENT_SECTION) return getSectionPath(CURRENT_SECTION) + "index.html";
    if (IS_PROJECTS_INDEX) return "projects/index.html";
    return ROOT_PAGE;
  }

  function projectLastUpdated(project) {
    return project.pages.reduce(function (latest, page) { return page.updated && page.updated > latest ? page.updated : latest; }, "");
  }
  /** Targets as {mc, loader} pairs; falls back to tags for projects without synced targets. */
  function projectTargets(project) {
    return (project.targets || []).map(function (target) {
      const cut = target.lastIndexOf("-");
      return { mc: target.slice(0, cut), loader: target.slice(cut + 1) };
    });
  }
  function projectLoaders(project) {
    const keys = new Set(projectTargets(project).map(function (t) { return t.loader; }));
    (project.tags || []).forEach(function (tag) {
      const loader = LOADERS.find(function (l) { return l.label === tag.label; });
      if (loader) keys.add(loader.key);
    });
    return keys;
  }
  function projectGuides(project) {
    return project.pages.filter(function (page) { return page.file !== "index.html"; });
  }

  /* ---------------------------------------------------------------------
   * Project identity: accent color, icon tile and wrappable names
   * ------------------------------------------------------------------- */
  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const k = function (n) { return (n + h / 30) % 12; };
    const a = s * Math.min(l, 1 - l);
    const f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    return "#" + [f(0), f(8), f(4)].map(function (x) { return Math.round(x * 255).toString(16).padStart(2, "0"); }).join("");
  }
  function contrastWithWhite(hex) {
    const channel = function (i) {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 1.05 / (0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5) + 0.05);
  }
  // Each project gets a stable color from its slug; an `accent` hex in
  // wiki-data.js overrides it. Accents are only used for fills and borders,
  // darkened until white monogram letters on them reach 4.5:1.
  const accentCache = {};
  function projectAccent(project) {
    if (project.accent) return project.accent;
    if (!accentCache[project.slug]) {
      let hash = 0;
      for (let i = 0; i < project.slug.length; i++) hash = (hash * 31 + project.slug.charCodeAt(i)) >>> 0;
      let lightness = 46;
      let hex = hslToHex(hash % 360, 50, lightness);
      while (contrastWithWhite(hex) < 4.5 && lightness > 18) hex = hslToHex(hash % 360, 50, --lightness);
      accentCache[project.slug] = hex;
    }
    return accentCache[project.slug];
  }
  // Two letters for an icon tile: the first two words after an "FF" or
  // "Fyxe's" prefix (FFCropEvaporation -> CE, FFBandage -> Ba).
  function projectMonogram(project) {
    const base = project.name.replace(/^FF(?=[A-Z])/, "").replace(/^Fyxe's\s+/i, "");
    const words = base.match(/[A-Z]+(?![a-z])|[A-Z]?[a-z]+|\d+/g) || [base];
    if (words.length > 1) return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    return words[0].charAt(0).toUpperCase() + words[0].charAt(1).toLowerCase();
  }
  // Names have no spaces, so offer line breaks between their words.
  function wrappableName(name) {
    return escapeHtml(name).replace(/([a-z])(?=[A-Z])/g, "$1<wbr>");
  }
  function projectIconHtml(project, size) {
    if (project.icon) {
      return '<img class="project-icon project-icon--' + size + '" src="' + escapeHtml(projectHref(project, project.icon)) + '" alt="" loading="lazy">';
    }
    return '<span class="project-icon project-icon--mono project-icon--' + size + '" style="--project-accent:' + projectAccent(project) + '" aria-hidden="true">' + escapeHtml(projectMonogram(project)) + '</span>';
  }
  function tagHtml(tag) {
    return '<span class="tag tag--platform' + (tag.class ? " " + escapeHtml(tag.class) : "") + '">' + escapeHtml(tag.label) + "</span>";
  }

  /* ---------------------------------------------------------------------
   * Page shell: skip link, top bar, breadcrumb and footers
   * ------------------------------------------------------------------- */
  const NAV = [
    { href: "projects/index.html", label: "Projects", active: function () { return Boolean(CURRENT_PROJECT || CURRENT_SECTION || IS_PROJECTS_INDEX); } },
    { href: "compatibility.html", label: "Compatibility", active: function () { return ROOT_PAGE === "compatibility.html"; } },
    { href: "updates.html", label: "Updates", active: function () { return ROOT_PAGE === "updates.html"; } },
    { href: "about.html", label: "About", active: function () { return ROOT_PAGE === "about.html"; } }
  ];
  function navLinks(className) {
    return NAV.map(function (item) {
      const active = item.active();
      return '<a class="' + className + (active ? " is-active" : "") + '" href="' + escapeHtml(ROOT + item.href) + '"' + (active ? ' aria-current="page"' : "") + ">" + item.label + "</a>";
    }).join("");
  }

  function renderShell() {
    const hasSidebar = Boolean(document.querySelector("[data-project-sidebar]"));
    const main = document.querySelector("main");
    if (main && !main.id) main.id = "main";
    document.body.insertAdjacentHTML("afterbegin", '<a class="skip-link" href="#main">Skip to content</a>');

    document.querySelectorAll("[data-site-header]").forEach(function (mount) {
      mount.outerHTML =
        '<header class="topbar">' +
          '<a class="topbar__brand" href="' + escapeHtml(ROOT + "index.html") + '">' +
            '<span class="topbar__mark">' + escapeHtml(SITE.mark || "") + "</span>" +
            '<span class="topbar__name">' + escapeHtml(SITE.name || "") + "</span>" +
          "</a>" +
          '<nav class="topbar__nav" aria-label="Site">' + navLinks("topbar__link") + "</nav>" +
          '<div class="topbar__spacer"></div>' +
          '<div class="search-box" data-search>' +
            '<svg class="search-box__icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4.5 4.5"/></svg>' +
            '<input type="search" placeholder="Search the wiki" aria-label="Search the wiki" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="false" aria-controls="search-results" aria-autocomplete="list">' +
            '<kbd class="search-box__key" aria-hidden="true">/</kbd>' +
            '<div class="search-box__results" id="search-results" role="listbox" aria-label="Search results"></div>' +
          "</div>" +
          '<button class="icon-button theme-toggle" data-theme-toggle type="button"></button>' +
          '<button class="icon-button menu-toggle" data-menu-toggle type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="' + (hasSidebar ? "wiki-sidebar" : "mobile-site-nav") + '">' +
            '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14"/></svg></button>' +
          (hasSidebar ? "" : '<nav class="mobile-site-nav" id="mobile-site-nav" aria-label="Site">' + navLinks("mobile-site-nav__link") + "</nav>") +
        "</header>";
    });

    document.querySelectorAll("[data-site-breadcrumb]").forEach(function (mount) {
      const parts = ['<a href="' + escapeHtml(ROOT + "index.html") + '">Home</a>'];
      const sep = '<span class="sep" aria-hidden="true">/</span>';
      if (CURRENT_PROJECT || CURRENT_SECTION) parts.push('<a href="' + escapeHtml(ROOT + "projects/index.html") + '">Projects</a>');
      const section = CURRENT_PROJECT ? getSectionForProject(CURRENT_PROJECT) : CURRENT_SECTION;
      if (CURRENT_PROJECT) {
        if (section) parts.push('<a href="' + escapeHtml(ROOT + getSectionPath(section) + "index.html") + '">' + escapeHtml(section.label) + "</a>");
        if (CURRENT_PAGE && CURRENT_PAGE.file !== "index.html") {
          parts.push('<a href="index.html">' + escapeHtml(CURRENT_PROJECT.name) + "</a>");
          parts.push('<span class="current" aria-current="page">' + escapeHtml(CURRENT_PAGE.title) + "</span>");
        } else {
          parts.push('<span class="current" aria-current="page">' + escapeHtml(CURRENT_PROJECT.name) + "</span>");
        }
      } else if (CURRENT_SECTION) {
        parts.push('<span class="current" aria-current="page">' + escapeHtml(CURRENT_SECTION.label) + "</span>");
      } else {
        const item = NAV.find(function (entry) { return entry.active(); });
        if (item) parts.push('<span class="current" aria-current="page">' + escapeHtml(item.label) + "</span>");
      }
      mount.outerHTML = '<nav class="breadcrumb" aria-label="Breadcrumb">' + parts.join(sep) + "</nav>";
    });

    document.querySelectorAll("[data-page-footer]").forEach(function (mount) {
      let updated = CURRENT_PAGE && CURRENT_PAGE.updated;
      if (!updated) updated = (SITE.recentUpdates || []).map(function (u) { return u.date; }).sort().reverse()[0] || "";
      const source = currentSourcePath();
      const edit = SITE.repository && source ? '<a href="' + escapeHtml(SITE.repository + "/edit/main/" + source) + '" target="_blank" rel="noopener">Edit this page on GitHub</a>' : "";
      mount.outerHTML = '<footer class="page-footer"><span>' + (updated ? "Last updated " + escapeHtml(formatDate(updated)) : "") + "</span>" + edit + "</footer>";
    });

    document.querySelectorAll("[data-site-footer]").forEach(function (mount) {
      const links = [
        '<a href="' + escapeHtml(ROOT + "updates.html") + '">Updates</a>',
        '<a href="' + escapeHtml(ROOT + "feed.xml") + '">Atom feed</a>',
        SITE.repository ? '<a href="' + escapeHtml(SITE.repository) + '" target="_blank" rel="noopener">Source on GitHub</a>' : "",
        SITE.author && SITE.author.modrinth ? '<a href="' + escapeHtml(SITE.author.modrinth) + '" target="_blank" rel="noopener">Modrinth</a>' : ""
      ].filter(Boolean).join('<span aria-hidden="true">·</span>');
      mount.outerHTML = '<footer class="site-footer"><div class="site-footer__inner"><span>' + escapeHtml(SITE.name || "") + " by " + escapeHtml((SITE.author && SITE.author.name) || "") + '</span><nav class="site-footer__links" aria-label="Footer">' + links + "</nav></div></footer>";
    });
  }

  /* ---------------------------------------------------------------------
   * Theme toggle (the <head> script already applied the saved theme)
   * ------------------------------------------------------------------- */
  const MOON = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 12.5A6.5 6.5 0 0 1 7.5 4a6.5 6.5 0 1 0 8.5 8.5Z"/></svg>';
  const SUN = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.5"/><path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6 16 16M4 16l1.4-1.4M14.6 5.4 16 4"/></svg>';
  function initTheme() {
    const btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    const paint = function () {
      const dark = document.documentElement.getAttribute("data-theme") === "dark";
      btn.innerHTML = dark ? SUN : MOON;
      btn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    };
    paint();
    btn.addEventListener("click", function () {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("wiki-theme", next); } catch (e) { /* private mode */ }
      paint();
    });
  }

  /* ---------------------------------------------------------------------
   * Site and project values filled into the HTML (data-* hooks)
   * ------------------------------------------------------------------- */
  function setHref(element, href) {
    if (href) {
      element.setAttribute("href", href);
      element.hidden = false;
    } else {
      element.removeAttribute("href");
      element.hidden = true;
    }
  }

  function fillSiteValues() {
    if (!CURRENT_PROJECT) {
      const description = document.querySelector('meta[name="description"]');
      if (description && SITE.description && ROOT_PAGE === "index.html") description.setAttribute("content", SITE.description);
    }
    document.querySelectorAll("[data-site-name]").forEach(function (el) { el.textContent = SITE.name; });
    document.querySelectorAll("[data-site-description]").forEach(function (el) { el.textContent = SITE.description; });
    document.querySelectorAll("[data-site-mark]").forEach(function (el) { el.textContent = SITE.mark; });
    document.querySelectorAll("[data-site-author-name]").forEach(function (el) { el.textContent = SITE.author.name; });
    document.querySelectorAll("[data-site-link]").forEach(function (el) { setHref(el, SITE.author[el.getAttribute("data-site-link")]); });
    document.querySelectorAll("[data-home-project-name]").forEach(function (el) {
      const project = PROJECTS.find(function (p) { return p.slug === el.getAttribute("data-home-project-name"); });
      if (project) el.textContent = project.name;
    });
    document.querySelectorAll("[data-project-href]").forEach(function (el) {
      const project = PROJECTS.find(function (p) { return p.slug === el.getAttribute("data-project-href"); });
      if (project) setHref(el, projectHref(project));
    });
    document.querySelectorAll("[data-project-count]").forEach(function (el) {
      const total = CURRENT_SECTION ? PROJECTS.filter(function (p) { return p.type === CURRENT_SECTION.type; }).length : PROJECTS.length;
      el.textContent = total + (total === 1 ? " project" : " projects");
    });
    document.querySelectorAll("[data-site-stats]").forEach(renderStats);
  }

  function renderStats(element) {
    const loaders = LOADERS.filter(function (loader) {
      return PROJECTS.some(function (project) { return projectLoaders(project).has(loader.key); });
    });
    const versions = new Set();
    PROJECTS.forEach(function (project) { projectTargets(project).forEach(function (t) { versions.add(t.mc); }); });
    const sorted = Array.from(versions).sort(compareVersions);
    const latest = (SITE.recentUpdates || []).map(function (u) { return u.date; }).sort().reverse()[0] || "";
    const stat = function (label, value, extra) {
      return "<div><dt>" + escapeHtml(label) + "</dt><dd" + (extra ? ' class="' + extra + '"' : "") + ">" + escapeHtml(String(value)) + "</dd></div>";
    };
    element.innerHTML = '<div class="hero-stats__label">At a glance</div>' +
      '<dl class="hero-stats__grid">' +
        stat("Mods", PROJECTS.filter(function (p) { return p.type === "mod"; }).length) +
        stat("Guide pages", PROJECTS.reduce(function (sum, p) { return sum + p.pages.length; }, 0)) +
        (sorted.length ? stat("Minecraft", sorted[0] + "–" + sorted[sorted.length - 1], "hero-stats__small") : "") +
        (latest ? stat("Last update", formatDate(latest), "hero-stats__small") : "") +
      "</dl>" +
      '<div class="hero-stats__loaders">' + loaders.map(function (l) { return tagHtml({ label: l.label, class: l.css }); }).join("") + "</div>";
  }

  function fillProjectValues() {
    const project = CURRENT_PROJECT;
    if (!project) return;
    if (CURRENT_PAGE) {
      document.title = CURRENT_PAGE.title + " · " + project.name + " · " + SITE.name;
      const description = document.querySelector('meta[name="description"]');
      if (description && CURRENT_PAGE.description) description.setAttribute("content", CURRENT_PAGE.description);
    }
    const marker = document.querySelector("[data-project-name]");
    const oldName = marker ? marker.textContent.trim() : "";
    document.querySelectorAll("[data-project-name]").forEach(function (el) { el.textContent = project.name; });
    document.querySelectorAll("[data-project-tagline]").forEach(function (el) { el.textContent = project.tagline || project.description; });
    document.querySelectorAll("[data-project-description]").forEach(function (el) { el.textContent = project.description; });
    document.querySelectorAll("[data-project-status]").forEach(function (el) {
      el.className = "status-pill status-pill--" + project.status;
      el.innerHTML = '<span class="dot"></span> ' + escapeHtml(capitalize(project.status));
    });
    document.querySelectorAll(".mod-meta").forEach(function (panel) { panel.style.setProperty("--project-accent", projectAccent(project)); });
    document.querySelectorAll("[data-project-icon]").forEach(function (el) {
      if (project.icon) {
        el.setAttribute("src", projectHref(project, project.icon));
        el.setAttribute("alt", project.name + " icon");
        el.hidden = false;
      } else {
        const tile = document.createElement("span");
        tile.className = "mod-meta__icon project-icon--mono";
        tile.style.setProperty("--project-accent", projectAccent(project));
        tile.setAttribute("aria-hidden", "true");
        tile.textContent = projectMonogram(project);
        el.replaceWith(tile);
      }
    });
    document.querySelectorAll("[data-project-link]").forEach(function (el) {
      const key = el.getAttribute("data-project-link");
      let href = (project.links || {})[key] || "";
      if (key === "modrinth" && project.modrinthSlug) href = "https://modrinth.com/" + (project.type || "mod") + "/" + project.modrinthSlug;
      if (key === "modrinth-versions" && project.modrinthSlug) href = "https://modrinth.com/" + (project.type || "mod") + "/" + project.modrinthSlug + "/versions";
      setHref(el, href);
    });
    document.querySelectorAll("[data-project-tag]").forEach(function (el) {
      const tag = (project.tags || []).find(function (item) { return item.label === el.getAttribute("data-project-tag"); });
      if (!tag) { el.remove(); return; }
      el.textContent = tag.label;
      el.className = "tag tag--platform" + (tag.class ? " " + tag.class : "");
    });
    document.querySelectorAll("[data-project-tags]").forEach(function (el) { el.innerHTML = (project.tags || []).map(tagHtml).join(""); });
    document.querySelectorAll("[data-project-loaders]").forEach(function (el) {
      const labels = LOADERS.filter(function (l) { return projectLoaders(project).has(l.key); }).map(function (l) { return l.label; });
      el.textContent = labels.join(", ") || "See Modrinth";
    });
    document.querySelectorAll("[data-project-code]").forEach(function (el) {
      const type = el.getAttribute("data-project-code");
      if (type === "modrinth-slug") el.textContent = project.modrinthSlug || "YOUR-MODRINTH-SLUG";
      if (type === "version") el.textContent = project.version || "YOUR-VERSION";
      if (type === "minecraft-version") el.textContent = project.minecraftVersion || "YOUR-MC-VERSION";
      if (type === "github-clone") el.textContent = project.links && project.links.github ? "git clone " + project.links.github + ".git" : "git clone YOUR-GITHUB-URL.git";
    });
    document.querySelectorAll("[data-project-badge]").forEach(function (el) {
      const type = el.getAttribute("data-project-badge");
      const slug = project.modrinthSlug;
      const urls = slug ? {
        downloads: "https://img.shields.io/modrinth/dt/" + slug + "?logo=modrinth&label=downloads&color=1bd96a",
        version: "https://img.shields.io/modrinth/v/" + slug + "?logo=modrinth&label=version&color=1bd96a",
        minecraft: "https://img.shields.io/modrinth/game-versions/" + slug + "?logo=modrinth&label=minecraft&color=1bd96a"
      } : {};
      if (!urls[type]) { el.remove(); return; }
      el.setAttribute("src", urls[type]);
      el.setAttribute("alt", "Modrinth " + type + " badge for " + project.name);
    });
    // CurseForge download count (shields.io needs the numeric project id, not the slug).
    if (project.curseforgeId) {
      document.querySelectorAll(".badge-row").forEach(function (row) {
        const img = document.createElement("img");
        img.setAttribute("src", "https://img.shields.io/curseforge/dt/" + project.curseforgeId + "?logo=curseforge&label=downloads&color=f16436");
        img.setAttribute("alt", "CurseForge downloads badge for " + project.name);
        row.appendChild(img);
      });
    }
    // Drop link and badge rows that ended up empty (no Modrinth slug, no source link).
    document.querySelectorAll(".mod-meta__actions, .badge-row").forEach(function (row) {
      row.hidden = !Array.from(row.children).some(function (child) { return !child.hidden; });
    });
    document.querySelectorAll("[data-page-updated]").forEach(function (el) {
      el.textContent = CURRENT_PAGE && CURRENT_PAGE.updated ? "Last updated " + CURRENT_PAGE.updated : "Last updated";
    });
    document.querySelectorAll("[data-project-page-title]").forEach(function (el) { if (CURRENT_PAGE) el.textContent = CURRENT_PAGE.title; });
    // Changing `name` in wiki-data.js also updates the name in page prose.
    if (oldName && oldName !== project.name) replaceText(oldName, project.name);
  }

  function replaceText(from, to) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.parentElement && !node.parentElement.closest("script, style, code, pre")) nodes.push(node);
    }
    nodes.forEach(function (node) { node.nodeValue = node.nodeValue.split(from).join(to); });
  }

  /* ---------------------------------------------------------------------
   * Project header: project name as the page's h1, slim on subpages
   * ------------------------------------------------------------------- */
  function initProjectHeader() {
    const content = document.querySelector(".content");
    const meta = content && content.querySelector(".mod-meta");
    if (!CURRENT_PROJECT || !CURRENT_PAGE || !meta) return;
    const projectHeading = meta.querySelector(".mod-meta__body h3");
    if (projectHeading) {
      const h1 = document.createElement("h1");
      h1.className = "mod-meta__title";
      h1.innerHTML = wrappableName(CURRENT_PROJECT.name);
      projectHeading.replaceWith(h1);
    }
    if (CURRENT_PAGE.file !== "index.html") meta.classList.add("mod-meta--compact");
    const intro = document.createElement("div");
    intro.className = "page-intro";
    intro.innerHTML = "<h2>" + escapeHtml(CURRENT_PAGE.title) + "</h2>";
    meta.after(intro);
    // The page title is now shown once; drop a first heading that repeats it.
    const next = intro.nextElementSibling;
    if (next && next.tagName === "H2" && next.textContent.trim() === CURRENT_PAGE.title) {
      if (next.id) intro.querySelector("h2").id = next.id;
      next.remove();
    }
    const repeated = Array.from(content.querySelectorAll("h2")).find(function (h) { return !intro.contains(h); });
    if (CURRENT_PAGE.file === "api.html" && repeated && repeated.textContent.indexOf(CURRENT_PROJECT.name) !== -1 && /Modding API/i.test(repeated.textContent)) repeated.remove();
  }

  /* ---------------------------------------------------------------------
   * Sidebar: every project, grouped by type, the current one expanded
   * ------------------------------------------------------------------- */
  function initSidebar() {
    const sidebar = document.querySelector("[data-project-sidebar]");
    if (!sidebar) return;
    sidebar.id = "wiki-sidebar";
    sidebar.setAttribute("aria-label", "Projects");
    let html = '<nav class="sidebar__site-nav" aria-label="Site">' + navLinks("sidebar__site-link") + "</nav>" +
      '<div class="sidebar__filter"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4.5 4.5"/></svg>' +
      '<input type="search" placeholder="Filter projects" aria-label="Filter projects" autocomplete="off"></div>' +
      '<div class="sidebar__tree">';
    SECTIONS.forEach(function (section) {
      const items = PROJECTS.filter(function (p) { return p.type === section.type; }).sort(byName);
      if (!items.length) return;
      const containsCurrent = CURRENT_PROJECT && CURRENT_PROJECT.type === section.type;
      const open = containsCurrent || (CURRENT_SECTION && CURRENT_SECTION.type === section.type && !CURRENT_PROJECT) || (!CURRENT_PROJECT && !CURRENT_SECTION);
      html += '<details class="tree-group"' + (open ? " open" : "") + ' data-tree-group><summary><span>' + escapeHtml(section.label) + '</span><span class="tree-group__count">' + items.length + "</span></summary><ul>";
      items.forEach(function (project) {
        const current = CURRENT_PROJECT && CURRENT_PROJECT.slug === project.slug;
        html += '<li class="tree-project' + (current ? " is-current" : "") + '" data-tree-project="' + escapeHtml((project.name + " " + project.slug).toLowerCase()) + '">' +
          '<a class="tree-project__link" href="' + escapeHtml(projectHref(project)) + '"' + (current && FILE === "index.html" ? ' aria-current="page"' : "") + ">" +
          projectIconHtml(project, "sm") + "<span>" + wrappableName(project.name) + "</span></a>";
        if (current && project.pages.length > 1) {
          html += '<ul class="tree-pages">' + project.pages.map(function (page) {
            const active = page.file === FILE;
            return '<li><a class="tree-page' + (active ? " is-active" : "") + '" href="' + escapeHtml(page.file) + '"' + (active ? ' aria-current="page"' : "") + ">" + escapeHtml(page.title) + "</a></li>";
          }).join("") + "</ul>";
        }
        html += "</li>";
      });
      html += '</ul><a class="tree-group__all" href="' + escapeHtml(ROOT + getSectionPath(section) + "index.html") + '">All ' + escapeHtml(section.label.toLowerCase()) + " →</a></details>";
    });
    html += '</div><p class="sidebar__empty" hidden>No projects match.</p>';
    sidebar.innerHTML = html;

    const input = sidebar.querySelector(".sidebar__filter input");
    const groups = Array.from(sidebar.querySelectorAll("[data-tree-group]"));
    const initiallyOpen = groups.map(function (g) { return g.open; });
    input.addEventListener("input", function () {
      const query = input.value.trim().toLowerCase();
      let any = false;
      groups.forEach(function (group, i) {
        let visible = 0;
        group.querySelectorAll("[data-tree-project]").forEach(function (item) {
          item.hidden = Boolean(query) && item.getAttribute("data-tree-project").indexOf(query) === -1;
          if (!item.hidden) visible++;
        });
        group.hidden = visible === 0;
        group.open = query ? visible > 0 : initiallyOpen[i];
        any = any || visible > 0;
      });
      sidebar.querySelector(".sidebar__empty").hidden = any;
    });
    const current = sidebar.querySelector(".tree-project.is-current");
    if (current) {
      requestAnimationFrame(function () {
        const offset = current.offsetTop - sidebar.clientHeight / 3;
        if (offset > 0) sidebar.scrollTop = offset;
      });
    }
  }

  /* ---------------------------------------------------------------------
   * "On this page": a sticky right rail on wide screens, a collapsible
   * list under the page title otherwise, with the current section marked
   * ------------------------------------------------------------------- */
  function pageHeadings(content) {
    return Array.from(content.querySelectorAll("h2, h3")).filter(function (h) {
      return !h.closest(".mod-meta, .page-intro, .hero, .project-card, .section-heading, .toc-inline") && h.textContent.trim();
    });
  }

  function ensureIds(headings) {
    const used = new Set(Array.from(document.querySelectorAll("[id]")).map(function (el) { return el.id; }));
    headings.forEach(function (h) {
      if (h.id) return;
      const base = slugify(h.textContent);
      let id = base;
      for (let n = 2; used.has(id); n++) id = base + "-" + n;
      h.id = id;
      used.add(id);
    });
  }

  function initHeadingAnchors(headings) {
    headings.forEach(function (h) {
      if (h.querySelector(".heading-anchor")) return;
      const link = document.createElement("a");
      link.className = "heading-anchor";
      link.href = "#" + h.id;
      link.setAttribute("aria-label", "Copy link to “" + h.textContent.trim() + "”");
      link.textContent = "#";
      link.addEventListener("click", function (event) {
        event.preventDefault();
        history.replaceState(null, "", "#" + h.id);
        h.scrollIntoView({ behavior: "smooth", block: "start" });
        copyText(window.location.href).then(function () { toast("Link copied"); }, function () { /* no clipboard */ });
      });
      h.append(link);
    });
  }

  function initToc() {
    const content = document.querySelector(".layout .content");
    if (!content) return;
    const headings = pageHeadings(content);
    ensureIds(headings);
    initHeadingAnchors(headings);
    if (headings.length < 2 || !document.querySelector("[data-project-sidebar]")) return;

    const list = function () {
      return "<ol>" + headings.map(function (h) {
        const label = h.cloneNode(true);
        label.querySelectorAll(".heading-anchor").forEach(function (a) { a.remove(); });
        return '<li class="toc__item toc__item--' + h.tagName.toLowerCase() + '"><a href="#' + escapeHtml(h.id) + '" data-toc-link="' + escapeHtml(h.id) + '">' + escapeHtml(label.textContent.trim()) + "</a></li>";
      }).join("") + "</ol>";
    };
    const rail = document.createElement("aside");
    rail.className = "toc";
    rail.setAttribute("aria-label", "On this page");
    rail.innerHTML = '<div class="toc__inner"><div class="toc__label">On this page</div>' + list() + '<a class="toc__top" href="#top">Back to top ↑</a></div>';
    content.closest(".layout").append(rail);
    content.closest(".layout").classList.add("layout--toc");

    const inline = document.createElement("details");
    inline.className = "toc-inline";
    inline.innerHTML = "<summary>On this page <span>" + headings.length + " sections</span></summary>" + list();
    const anchor = content.querySelector(".page-intro") || content.querySelector("h1") || content.firstElementChild;
    if (anchor) anchor.after(inline);
    inline.addEventListener("click", function (event) { if (event.target.closest("a")) inline.open = false; });
    rail.querySelector(".toc__top").addEventListener("click", function (event) {
      event.preventDefault();
      history.replaceState(null, "", window.location.pathname + window.location.search);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const links = Array.from(document.querySelectorAll("[data-toc-link]"));
    let ticking = false;
    const update = function () {
      ticking = false;
      const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 80;
      let active = headings[0];
      headings.forEach(function (h) { if (h.getBoundingClientRect().top - offset <= 24) active = h; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) active = headings[headings.length - 1];
      links.forEach(function (link) {
        const on = link.getAttribute("data-toc-link") === active.id;
        link.classList.toggle("is-active", on);
        if (on && rail.contains(link)) {
          const box = rail.querySelector(".toc__inner");
          const top = link.offsetTop - box.offsetTop;
          if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 40) box.scrollTop = top - box.clientHeight / 3;
        }
      });
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
    if (window.location.hash) {
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (target) requestAnimationFrame(function () { target.scrollIntoView(); });
    }
  }

  /* ---------------------------------------------------------------------
   * Previous / next page within a project
   * ------------------------------------------------------------------- */
  function initPageNav() {
    if (!CURRENT_PROJECT || !CURRENT_PAGE) return;
    const pages = CURRENT_PROJECT.pages;
    const index = pages.indexOf(CURRENT_PAGE);
    const prev = pages[index - 1];
    const next = pages[index + 1];
    if (!prev && !next) return;
    const nav = document.createElement("nav");
    nav.className = "page-nav";
    nav.setAttribute("aria-label", "Pages in " + CURRENT_PROJECT.name);
    nav.innerHTML =
      (prev ? '<a class="page-nav__prev" href="' + escapeHtml(prev.file) + '" rel="prev"><span class="page-nav__dir">← Previous</span>' + escapeHtml(prev.title) + "</a>" : "<span></span>") +
      (next ? '<a class="page-nav__next" href="' + escapeHtml(next.file) + '" rel="next"><span class="page-nav__dir">Next →</span>' + escapeHtml(next.title) + "</a>" : "");
    const footer = document.querySelector(".content .page-footer");
    if (footer) footer.before(nav);
    else document.querySelector(".content").append(nav);
  }

  /* ---------------------------------------------------------------------
   * Code examples: language bar, syntax colors, copy, wrap, long blocks
   * ------------------------------------------------------------------- */
  const CODE_LANGUAGES = { java: "Java", json: "JSON", kotlin: "Kotlin", groovy: "Groovy", toml: "TOML", text: "Text", mcfunction: "Function", properties: "Properties", gradle: "Gradle" };
  const KEYWORDS = new Set(("abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import " +
    "instanceof int interface long native new package private protected public return short static super switch synchronized this throw throws transient try void volatile while " +
    "var record sealed permits yield true false null val fun object companion when is in as override open data internal lateinit by init def it suspend").split(" "));

  function wrapToken(css, text) { return '<span class="tok-' + css + '">' + escapeHtml(text) + "</span>"; }

  function highlight(source, language) {
    let pattern;
    let classify;
    if (language === "json") {
      pattern = /("(?:[^"\\\n]|\\.)*")(\s*:)?|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|\b(true|false|null)\b/g;
      classify = function (m) {
        if (m[1]) return wrapToken(m[2] ? "key" : "str", m[1]) + (m[2] ? escapeHtml(m[2]) : "");
        if (m[3]) return wrapToken("num", m[3]);
        return wrapToken("lit", m[4]);
      };
    } else if (language === "java" || language === "kotlin" || language === "groovy" || language === "gradle") {
      pattern = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("""[\s\S]*?"""|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(@[A-Za-z_][\w.]*)|(\b\d[\d_]*(?:\.\d+)?[fFdDlL]?\b)|(\b[A-Za-z_]\w*\b)/g;
      classify = function (m) {
        if (m[1]) return wrapToken("com", m[1]);
        if (m[2]) return wrapToken("str", m[2]);
        if (m[3]) return wrapToken("ann", m[3]);
        if (m[4]) return wrapToken("num", m[4]);
        if (KEYWORDS.has(m[5])) return wrapToken(m[5] === "true" || m[5] === "false" || m[5] === "null" ? "lit" : "kw", m[5]);
        if (/^[A-Z]/.test(m[5])) return wrapToken("type", m[5]);
        return escapeHtml(m[5]);
      };
    } else if (language === "toml" || language === "properties") {
      pattern = /(#[^\n]*)|(^[ \t]*\[\[?[^\]\n]*\]\]?)|(^[ \t]*[\w.\-"]+(?=[ \t]*=))|("(?:[^"\\\n]|\\.)*"|'[^'\n]*')|(\b-?\d+(?:\.\d+)?\b)|\b(true|false)\b/gm;
      classify = function (m) {
        if (m[1]) return wrapToken("com", m[1]);
        if (m[2]) return wrapToken("type", m[2]);
        if (m[3]) return wrapToken("key", m[3]);
        if (m[4]) return wrapToken("str", m[4]);
        if (m[5]) return wrapToken("num", m[5]);
        return wrapToken("lit", m[6]);
      };
    } else if (language === "text" || language === "mcfunction") {
      // Command listings: color the command and its <placeholders>.
      pattern = /(^[ \t]*\/[\w:.-]+)|(<[^<>\n]{1,40}>)|(^[ \t]*#[^\n]*)/gm;
      classify = function (m) {
        if (m[1]) return wrapToken("kw", m[1]);
        if (m[2]) return wrapToken("type", m[2]);
        return wrapToken("com", m[3]);
      };
    } else {
      return null;
    }
    let out = "";
    let last = 0;
    let match;
    while ((match = pattern.exec(source))) {
      if (match[0] === "") { pattern.lastIndex++; continue; }
      out += escapeHtml(source.slice(last, match.index)) + classify(match);
      last = match.index + match[0].length;
    }
    return out + escapeHtml(source.slice(last));
  }

  const LONG_CODE_LINES = 26;
  function initCodeBlocks() {
    document.querySelectorAll(".content pre").forEach(function (pre) {
      if (pre.closest(".code-block")) return;
      const code = pre.querySelector("code") || pre;
      const match = /\blanguage-([\w-]+)/.exec(code.className);
      const language = match ? match[1] : "";
      const label = language ? CODE_LANGUAGES[language] || language.toUpperCase() : "Code";
      const text = code.textContent.replace(/\n$/, "");
      const colored = highlight(text, language);
      if (colored !== null && code.children.length === 0) code.innerHTML = colored;

      const block = document.createElement("div");
      block.className = "code-block";
      const lines = text.split("\n").length;
      block.innerHTML = '<div class="code-block__bar"><span class="code-block__lang">' + escapeHtml(label) + '</span><span class="code-block__tools">' +
        '<button class="code-block__btn" type="button" data-code-wrap aria-pressed="false">Wrap</button>' +
        '<button class="code-block__btn" type="button" data-code-copy>Copy</button></span></div>';
      pre.before(block);
      block.append(pre);
      pre.tabIndex = 0;
      pre.setAttribute("aria-label", label + " example");

      if (lines > LONG_CODE_LINES) {
        block.classList.add("is-collapsed");
        const more = document.createElement("button");
        more.type = "button";
        more.className = "code-block__more";
        more.textContent = "Show all " + lines + " lines";
        more.addEventListener("click", function () {
          const collapsed = block.classList.toggle("is-collapsed");
          more.textContent = collapsed ? "Show all " + lines + " lines" : "Show fewer lines";
          if (collapsed) block.scrollIntoView({ block: "nearest" });
        });
        block.append(more);
      }

      block.querySelector("[data-code-wrap]").addEventListener("click", function (event) {
        const on = block.classList.toggle("is-wrapped");
        event.currentTarget.setAttribute("aria-pressed", String(on));
      });
      const copy = block.querySelector("[data-code-copy]");
      copy.addEventListener("click", function () {
        copyText(text).then(function () {
          copy.textContent = "Copied";
          copy.classList.add("is-done");
          setTimeout(function () { copy.textContent = "Copy"; copy.classList.remove("is-done"); }, 1400);
        }, function () { copy.textContent = "Copy failed"; });
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Tables: scroll wrapper, a filter on long tables, click-to-copy keys
   * ------------------------------------------------------------------- */
  const FILTER_MIN_ROWS = 8;
  function initTables() {
    document.querySelectorAll(".content table").forEach(function (table) {
      if (table.closest(".compat")) return;
      let wrap = table.parentElement;
      if (!wrap.classList.contains("table-wrap")) {
        wrap = document.createElement("div");
        wrap.className = "table-wrap";
        table.before(wrap);
        wrap.append(table);
      }
      const head = table.querySelector("thead th");
      const keyColumn = head && /option|key|field|setting|tag|command|property|name|path|class|method/i.test(head.textContent);
      if (keyColumn) {
        table.querySelectorAll("tbody tr > td:first-child code").forEach(function (code) {
          code.classList.add("is-copyable");
          code.setAttribute("title", "Click to copy");
          code.tabIndex = 0;
          const copy = function () { copyText(code.textContent).then(function () { toast("Copied " + code.textContent); }, function () {}); };
          code.addEventListener("click", copy);
          code.addEventListener("keydown", function (event) { if (event.key === "Enter") { event.preventDefault(); copy(); } });
        });
      }
      const rows = Array.from(table.querySelectorAll("tbody tr"));
      if (rows.length < FILTER_MIN_ROWS) return;
      const tools = document.createElement("div");
      tools.className = "table-tools";
      tools.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4.5 4.5"/></svg>' +
        '<input type="search" placeholder="Filter ' + rows.length + ' rows" aria-label="Filter this table" autocomplete="off"><span class="table-tools__count" aria-live="polite"></span>';
      wrap.before(tools);
      const empty = document.createElement("tr");
      empty.className = "table-empty";
      empty.hidden = true;
      empty.innerHTML = '<td colspan="' + (rows[0] ? rows[0].children.length : 1) + '">No rows match.</td>';
      table.querySelector("tbody").append(empty);
      const input = tools.querySelector("input");
      const count = tools.querySelector(".table-tools__count");
      input.addEventListener("input", function () {
        const terms = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
        let shown = 0;
        rows.forEach(function (row) {
          const text = row.textContent.toLowerCase();
          row.hidden = !terms.every(function (t) { return text.indexOf(t) !== -1; });
          if (!row.hidden) shown++;
        });
        empty.hidden = shown > 0;
        count.textContent = terms.length ? shown + " of " + rows.length : "";
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Project catalog: search, loader / version / guide filters and sorting
   * ------------------------------------------------------------------- */
  function cardHtml(project) {
    const guides = projectGuides(project);
    const chips = guides.length ? '<div class="project-card__guides">' + guides.map(function (page) { return '<span class="guide-chip">' + escapeHtml(page.title) + "</span>"; }).join("") + "</div>" : "";
    const status = project.status === "active" ? "" : '<span class="status-pill status-pill--' + escapeHtml(project.status) + '"><span class="dot"></span> ' + escapeHtml(capitalize(project.status)) + "</span>";
    const updated = projectLastUpdated(project);
    return '<a class="card project-card" style="--project-accent:' + projectAccent(project) + '" href="' + escapeHtml(projectHref(project)) + '" data-slug="' + escapeHtml(project.slug) + '">' +
      '<div class="project-card__head">' + projectIconHtml(project, "md") + '<div class="project-card__heading"><h3 class="card__title">' + wrappableName(project.name) + "</h3>" + status + "</div></div>" +
      '<p class="card__desc">' + escapeHtml(project.description) + "</p>" + chips +
      '<div class="card__meta">' + (project.tags || []).map(tagHtml).join("") + "</div>" +
      (updated ? '<div class="project-card__updated">Updated ' + escapeHtml(formatDate(updated)) + "</div>" : "") + "</a>";
  }

  function initCatalog() {
    const grid = document.querySelector("[data-project-grid]");
    if (!grid) return;
    const sections = CURRENT_SECTION ? [CURRENT_SECTION] : SECTIONS;
    const pool = PROJECTS.filter(function (p) { return sections.indexOf(getSectionForProject(p)) !== -1; });
    const versions = new Set();
    pool.forEach(function (p) { projectTargets(p).forEach(function (t) { versions.add(t.mc); }); });
    const loaders = LOADERS.filter(function (l) { return pool.some(function (p) { return projectLoaders(p).has(l.key); }); });
    const guideTitles = [];
    pool.forEach(function (p) { projectGuides(p).forEach(function (g) { if (guideTitles.indexOf(g.title) === -1) guideTitles.push(g.title); }); });
    const preferred = ["Configuration", "Datapacks", "Modding API"];
    const guides = preferred.filter(function (t) { return guideTitles.indexOf(t) !== -1; });

    const toolbar = document.createElement("div");
    toolbar.className = "catalog-toolbar";
    toolbar.innerHTML =
      '<div class="catalog-toolbar__search"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4.5 4.5"/></svg>' +
        '<input type="search" placeholder="Search by name or feature" aria-label="Search projects" autocomplete="off" data-filter="q"></div>' +
      '<div class="catalog-toolbar__row">' +
        (loaders.length > 1 ? '<div class="chip-group" role="group" aria-label="Loader">' + loaders.map(function (l) { return '<button type="button" class="filter-chip" data-filter="loader" data-value="' + l.key + '" aria-pressed="false">' + l.label + "</button>"; }).join("") + "</div>" : "") +
        (versions.size ? '<label class="select"><span class="sr-only">Minecraft version</span><select data-filter="mc"><option value="">Any Minecraft version</option>' +
          Array.from(versions).sort(compareVersions).reverse().map(function (v) { return '<option value="' + v + '">Minecraft ' + v + "</option>"; }).join("") + "</select></label>" : "") +
        (guides.length ? '<div class="chip-group" role="group" aria-label="Has guide">' + guides.map(function (g) { return '<button type="button" class="filter-chip" data-filter="has" data-value="' + escapeHtml(g) + '" aria-pressed="false">' + escapeHtml(g) + "</button>"; }).join("") + "</div>" : "") +
        '<label class="select select--sort"><span class="sr-only">Sort</span><select data-filter="sort"><option value="name">Name A–Z</option><option value="updated">Recently updated</option></select></label>' +
      "</div>" +
      '<div class="catalog-toolbar__status"><span aria-live="polite" data-catalog-count></span><button type="button" class="link-button" data-catalog-reset hidden>Clear filters</button></div>';
    grid.before(toolbar);

    const state = { q: "", loader: [], mc: "", has: [], sort: "name" };
    const params = new URLSearchParams(window.location.search);
    state.q = params.get("q") || "";
    state.loader = (params.get("loader") || "").split(",").filter(Boolean);
    state.mc = params.get("mc") || "";
    state.has = (params.get("has") || "").split(",").filter(Boolean);
    state.sort = params.get("sort") === "updated" ? "updated" : "name";

    const searchText = {};
    pool.forEach(function (p) {
      // Name, description, tags and every page's search keywords, so a feature
      // word ("wounds", "encumbrance") finds the mod that documents it.
      searchText[p.slug] = [p.name, p.slug, p.description, p.tagline || ""].concat(
        p.pages.map(function (g) { return g.title + " " + (g.searchExcerpt || ""); }),
        (p.tags || []).map(function (t) { return t.label; })).join(" ").toLowerCase();
    });

    function matches(project) {
      const terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.every(function (t) { return searchText[project.slug].indexOf(t) !== -1; })) return false;
      const targets = projectTargets(project);
      if (state.mc || state.loader.length) {
        const ok = targets.length ? targets.some(function (t) {
          return (!state.mc || t.mc === state.mc) && (!state.loader.length || state.loader.indexOf(t.loader) !== -1);
        }) : (!state.mc && state.loader.some(function (l) { return projectLoaders(project).has(l); }));
        if (!ok) return false;
      }
      const titles = projectGuides(project).map(function (g) { return g.title; });
      return state.has.every(function (h) { return titles.indexOf(h) !== -1; });
    }

    function render() {
      const sorter = state.sort === "updated"
        ? function (a, b) { return projectLastUpdated(b).localeCompare(projectLastUpdated(a)) || byName(a, b); }
        : byName;
      let shown = 0;
      grid.innerHTML = sections.map(function (section) {
        const list = pool.filter(function (p) { return p.type === section.type && matches(p); }).sort(sorter);
        shown += list.length;
        if (!list.length) return "";
        const heading = CURRENT_SECTION ? "" : '<div class="section-heading"><h2>' + escapeHtml(section.label) + ' <span class="section-heading__count">' + list.length + '</span></h2><a class="text-link" href="' + escapeHtml(ROOT + getSectionPath(section) + "index.html") + '">All ' + escapeHtml(section.label.toLowerCase()) + " →</a></div>";
        return '<section class="project-section">' + heading + '<div class="grid">' + list.map(cardHtml).join("") + "</div></section>";
      }).join("") || '<div class="empty-state"><p>No projects match these filters.</p><button type="button" class="btn btn--ghost" data-catalog-reset>Clear filters</button></div>';
      const filtered = state.q || state.loader.length || state.mc || state.has.length;
      toolbar.querySelector("[data-catalog-count]").textContent = filtered ? shown + " of " + pool.length + " projects" : pool.length + " projects";
      toolbar.querySelector("[data-catalog-reset]").hidden = !filtered;
      toolbar.querySelectorAll(".filter-chip").forEach(function (chip) {
        const list = state[chip.getAttribute("data-filter")];
        chip.setAttribute("aria-pressed", String(list.indexOf(chip.getAttribute("data-value")) !== -1));
      });
      const query = new URLSearchParams();
      if (state.q) query.set("q", state.q);
      if (state.loader.length) query.set("loader", state.loader.join(","));
      if (state.mc) query.set("mc", state.mc);
      if (state.has.length) query.set("has", state.has.join(","));
      if (state.sort !== "name") query.set("sort", state.sort);
      const search = query.toString();
      history.replaceState(null, "", window.location.pathname + (search ? "?" + search : "") + window.location.hash);
    }

    toolbar.querySelector('[data-filter="q"]').value = state.q;
    const mcSelect = toolbar.querySelector('[data-filter="mc"]');
    if (mcSelect) mcSelect.value = state.mc;
    toolbar.querySelector('[data-filter="sort"]').value = state.sort;
    toolbar.addEventListener("input", function (event) {
      const key = event.target.getAttribute("data-filter");
      if (key === "q" || key === "mc" || key === "sort") { state[key] = event.target.value; render(); }
    });
    toolbar.addEventListener("click", function (event) {
      const chip = event.target.closest(".filter-chip");
      if (!chip) return;
      const list = state[chip.getAttribute("data-filter")];
      const value = chip.getAttribute("data-value");
      const at = list.indexOf(value);
      if (at === -1) list.push(value); else list.splice(at, 1);
      render();
    });
    document.addEventListener("click", function (event) {
      if (!event.target.closest("[data-catalog-reset]")) return;
      state.q = ""; state.loader = []; state.mc = ""; state.has = [];
      toolbar.querySelector('[data-filter="q"]').value = "";
      if (mcSelect) mcSelect.value = "";
      render();
    });
    render();
  }

  /* ---------------------------------------------------------------------
   * Updates: the latest few on the home page, all of them on updates.html
   * ------------------------------------------------------------------- */
  function sortedUpdates() {
    return (SITE.recentUpdates || []).filter(function (u) {
      return PROJECTS.some(function (p) { return p.slug === u.project; });
    }).slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  }
  function updateItemHtml(update, showDate) {
    const project = PROJECTS.find(function (p) { return p.slug === update.project; });
    const page = project.pages.find(function (p) { return p.file === update.page; });
    return '<li class="update-item">' +
      (showDate ? '<time class="update-item__date" datetime="' + escapeHtml(update.date) + '">' + escapeHtml(formatDate(update.date)) + "</time>" : "") +
      '<div class="update-item__body"><a class="update-item__where" href="' + escapeHtml(projectHref(project, update.page)) + '">' + projectIconHtml(project, "sm") +
      "<span><strong>" + wrappableName(project.name) + "</strong> · " + escapeHtml(page ? page.title : update.page) + "</span></a>" +
      '<p class="update-item__change">' + escapeHtml(update.change) + "</p></div></li>";
  }

  function initUpdates() {
    document.querySelectorAll("[data-recent-updates]").forEach(function (list) {
      const limit = Number(list.getAttribute("data-limit")) || 6;
      list.innerHTML = sortedUpdates().slice(0, limit).map(function (u) { return updateItemHtml(u, true); }).join("");
    });
    const page = document.querySelector("[data-updates-page]");
    if (!page) return;
    const all = sortedUpdates();
    const projects = PROJECTS.filter(function (p) { return all.some(function (u) { return u.project === p.slug; }); }).sort(byName);
    const controls = document.createElement("div");
    controls.className = "updates-toolbar";
    controls.innerHTML = '<label class="select"><span class="sr-only">Project</span><select><option value="">All projects</option>' +
      projects.map(function (p) { return '<option value="' + escapeHtml(p.slug) + '">' + escapeHtml(p.name) + "</option>"; }).join("") +
      '</select></label><span class="updates-toolbar__count" aria-live="polite"></span>';
    page.before(controls);
    const select = controls.querySelector("select");
    select.value = new URLSearchParams(window.location.search).get("project") || "";
    const render = function () {
      const list = all.filter(function (u) { return !select.value || u.project === select.value; });
      const days = [];
      list.forEach(function (u) {
        if (!days.length || days[days.length - 1].date !== u.date) days.push({ date: u.date, items: [] });
        days[days.length - 1].items.push(u);
      });
      page.innerHTML = days.map(function (day) {
        return '<section class="update-day"><h2 id="d-' + day.date + '">' + escapeHtml(formatDate(day.date)) + '</h2><ol class="update-list">' +
          day.items.map(function (u) { return updateItemHtml(u, false); }).join("") + "</ol></section>";
      }).join("") || '<p class="empty-state">No updates yet.</p>';
      controls.querySelector(".updates-toolbar__count").textContent = list.length + (list.length === 1 ? " update" : " updates");
      history.replaceState(null, "", window.location.pathname + (select.value ? "?project=" + encodeURIComponent(select.value) : ""));
    };
    select.addEventListener("change", render);
    render();
  }

  /* ---------------------------------------------------------------------
   * Compatibility matrix: every mod x Minecraft version, with loaders
   * ------------------------------------------------------------------- */
  function initCompatibility() {
    const mount = document.querySelector("[data-compatibility]");
    if (!mount) return;
    const rows = PROJECTS.filter(function (p) { return projectTargets(p).length; }).sort(byName);
    const missing = PROJECTS.filter(function (p) { return p.type === "mod" && !projectTargets(p).length; }).sort(byName);
    const versions = new Set();
    rows.forEach(function (p) { projectTargets(p).forEach(function (t) { versions.add(t.mc); }); });
    const columns = Array.from(versions).sort(compareVersions);
    const loaders = LOADERS.filter(function (l) { return rows.some(function (p) { return projectLoaders(p).has(l.key); }); });

    const controls = document.createElement("div");
    controls.className = "compat-toolbar";
    controls.innerHTML = '<span class="compat-toolbar__label">Show mods for</span>' +
      '<label class="select"><span class="sr-only">Minecraft version</span><select data-compat="mc"><option value="">Any Minecraft version</option>' +
      columns.slice().reverse().map(function (v) { return '<option value="' + v + '">Minecraft ' + v + "</option>"; }).join("") + "</select></label>" +
      '<label class="select"><span class="sr-only">Loader</span><select data-compat="loader"><option value="">Any loader</option>' +
      loaders.map(function (l) { return '<option value="' + l.key + '">' + l.label + "</option>"; }).join("") + "</select></label>" +
      '<span class="compat-toolbar__count" aria-live="polite"></span>';
    mount.before(controls);

    const cell = function (project, mc) {
      const here = projectTargets(project).filter(function (t) { return t.mc === mc; }).map(function (t) { return t.loader; });
      if (!here.length) return '<td class="compat__none" data-mc="' + mc + '"><span aria-label="Not available">–</span></td>';
      return '<td data-mc="' + mc + '" data-loaders="' + here.join(" ") + '">' + LOADERS.filter(function (l) { return here.indexOf(l.key) !== -1; }).map(function (l) {
        return '<span class="tag tag--platform ' + l.css + '" data-loader="' + l.key + '">' + l.label + "</span>";
      }).join("") + "</td>";
    };
    mount.innerHTML = '<div class="table-wrap compat"><table><thead><tr><th scope="col">Project</th>' +
      columns.map(function (v) { return '<th scope="col" data-mc="' + v + '">' + v + "</th>"; }).join("") + '<th scope="col">Version</th></tr></thead><tbody>' +
      rows.map(function (p) {
        return '<tr data-slug="' + escapeHtml(p.slug) + '"><th scope="row"><a href="' + escapeHtml(projectHref(p)) + '">' + projectIconHtml(p, "sm") + "<span>" + wrappableName(p.name) + "</span></a></th>" +
          columns.map(function (v) { return cell(p, v); }).join("") + '<td class="compat__version">' + escapeHtml(p.version || "") + "</td></tr>";
      }).join("") + "</tbody></table></div>" +
      (missing.length ? '<p class="compat__note">Not listed because their build targets are not recorded yet: ' + missing.map(function (p) { return '<a href="' + escapeHtml(projectHref(p)) + '">' + escapeHtml(p.name) + "</a>"; }).join(", ") + ".</p>" : "");

    const mcSelect = controls.querySelector('[data-compat="mc"]');
    const loaderSelect = controls.querySelector('[data-compat="loader"]');
    const params = new URLSearchParams(window.location.search);
    mcSelect.value = params.get("mc") || "";
    loaderSelect.value = params.get("loader") || "";
    const render = function () {
      const mc = mcSelect.value;
      const loader = loaderSelect.value;
      let count = 0;
      mount.querySelectorAll("tbody tr").forEach(function (row) {
        const project = PROJECTS.find(function (p) { return p.slug === row.getAttribute("data-slug"); });
        const ok = projectTargets(project).some(function (t) { return (!mc || t.mc === mc) && (!loader || t.loader === loader); });
        row.classList.toggle("is-dim", Boolean(mc || loader) && !ok);
        if (ok) count++;
      });
      mount.querySelectorAll("[data-mc]").forEach(function (el) { el.classList.toggle("is-focus", Boolean(mc) && el.getAttribute("data-mc") === mc); });
      mount.querySelectorAll("[data-loader]").forEach(function (el) { el.classList.toggle("is-faded", Boolean(loader) && el.getAttribute("data-loader") !== loader); });
      const label = (loader ? LOADERS.find(function (l) { return l.key === loader; }).label + " " : "") + (mc ? "on Minecraft " + mc : "");
      controls.querySelector(".compat-toolbar__count").textContent = mc || loader ? count + " of " + rows.length + " projects run " + label.trim() : rows.length + " projects";
      const query = new URLSearchParams();
      if (mc) query.set("mc", mc);
      if (loader) query.set("loader", loader);
      history.replaceState(null, "", window.location.pathname + (query.toString() ? "?" + query : ""));
    };
    controls.addEventListener("change", render);
    render();
  }

  /* ---------------------------------------------------------------------
   * Search: full-text over every section, loaded on first use
   * ------------------------------------------------------------------- */
  let searchIndexPromise = null;
  function loadSearchIndex() {
    if (!searchIndexPromise) {
      searchIndexPromise = new Promise(function (resolve) {
        if (window.WIKI_SEARCH) { resolve(window.WIKI_SEARCH); return; }
        const script = document.createElement("script");
        script.src = ROOT + "assets/js/search-index.js";
        script.onload = function () { resolve(window.WIKI_SEARCH || null); };
        script.onerror = function () { resolve(null); };
        document.head.append(script);
      }).then(function (index) {
        const entries = [];
        if (index) {
          index.sections.forEach(function (row) {
            const pageRow = index.pages[row[0]];
            const project = PROJECTS.find(function (p) { return p.slug === pageRow[1]; });
            if (!project) return;
            entries.push({
              href: ROOT + pageRow[0] + (row[2] ? "#" + row[2] : ""), page: pageRow[0],
              project: project, pageTitle: pageRow[2], heading: row[1], text: row[3],
              hay: { heading: row[1].toLowerCase(), project: (project.name + " " + project.slug).toLowerCase(), page: pageRow[2].toLowerCase(), text: row[3].toLowerCase() }
            });
          });
        } else {
          // No generated index (opened before running build_site.py): titles only.
          PROJECTS.forEach(function (project) {
            project.pages.forEach(function (page) {
              const text = page.searchExcerpt || page.description || "";
              entries.push({ href: projectHref(project, page.file), page: getProjectPath(project) + page.file, project: project, pageTitle: page.title, heading: page.title, text: text,
                hay: { heading: page.title.toLowerCase(), project: (project.name + " " + project.slug).toLowerCase(), page: page.title.toLowerCase(), text: text.toLowerCase() } });
            });
          });
        }
        return entries;
      });
    }
    return searchIndexPromise;
  }

  function searchEntries(entries, query) {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    const phrase = terms.join(" ");
    const scored = [];
    entries.forEach(function (entry) {
      const h = entry.hay;
      let score = 0;
      for (let i = 0; i < terms.length; i++) {
        const t = terms[i];
        const inHeading = h.heading.indexOf(t) !== -1;
        const inProject = h.project.indexOf(t) !== -1;
        const inPage = h.page.indexOf(t) !== -1;
        const inText = h.text.indexOf(t) !== -1;
        if (!inHeading && !inProject && !inPage && !inText) return;
        if (inHeading) score += new RegExp("(^|[^a-z0-9])" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(h.heading) ? 10 : 6;
        if (inProject) score += 5;
        if (inPage) score += 2;
        if (inText) score += 1 + Math.min(h.text.split(t).length - 1, 6) * 0.25;
      }
      if (h.heading.indexOf(phrase) !== -1) score += 8;
      else if (terms.length > 1 && h.text.indexOf(phrase) !== -1) score += 3;
      if (h.heading === phrase) score += 6;
      scored.push({ entry: entry, score: score });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    const perPage = {};
    const out = [];
    for (let i = 0; i < scored.length && out.length < 12; i++) {
      const key = scored[i].entry.page;
      perPage[key] = (perPage[key] || 0) + 1;
      if (perPage[key] <= 3) out.push(scored[i].entry);
    }
    return { results: out, terms: terms, total: scored.length };
  }

  function markTerms(text, terms) {
    let html = escapeHtml(text);
    terms.slice().sort(function (a, b) { return b.length - a.length; }).forEach(function (t) {
      const safe = escapeHtml(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      html = html.replace(new RegExp("(" + safe + ")(?![^<]*>)", "gi"), "<mark>$1</mark>");
    });
    return html;
  }
  function snippet(text, terms) {
    if (!text) return "";
    const lower = text.toLowerCase();
    let at = -1;
    terms.forEach(function (t) { const i = lower.indexOf(t); if (i !== -1 && (at === -1 || i < at)) at = i; });
    if (at === -1) return text.length > 150 ? text.slice(0, 150) + "…" : text;
    const start = Math.max(0, at - 60);
    const end = Math.min(text.length, at + 110);
    return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
  }

  function initSearch() {
    const box = document.querySelector("[data-search]");
    if (!box) return;
    const input = box.querySelector("input");
    const results = box.querySelector(".search-box__results");
    let selected = -1;
    let current = [];

    const close = function () {
      results.classList.remove("is-open");
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      selected = -1;
    };
    const select = function (index) {
      const items = results.querySelectorAll(".search-result");
      if (!items.length) return;
      selected = (index + items.length) % items.length;
      items.forEach(function (item, i) { item.setAttribute("aria-selected", String(i === selected)); });
      input.setAttribute("aria-activedescendant", items[selected].id);
      items[selected].scrollIntoView({ block: "nearest" });
    };
    const render = function () {
      const query = input.value.trim();
      if (!query) { results.innerHTML = ""; close(); return; }
      results.innerHTML = '<div class="search-box__note">Searching…</div>';
      results.classList.add("is-open");
      input.setAttribute("aria-expanded", "true");
      loadSearchIndex().then(function (entries) {
        if (input.value.trim() !== query) return;
        const found = searchEntries(entries, query);
        current = found.results || [];
        selected = -1;
        if (!current.length) {
          results.innerHTML = '<div class="search-box__note">No results for “' + escapeHtml(query) + "”. Try fewer or different words.</div>";
          return;
        }
        results.innerHTML = current.map(function (entry, i) {
          const sameAsPage = entry.heading === entry.pageTitle;
          return '<a class="search-result" role="option" aria-selected="false" id="search-result-' + i + '" href="' + escapeHtml(entry.href) + '">' +
            '<span class="search-result__where">' + projectIconHtml(entry.project, "xs") + escapeHtml(entry.project.name) + " › " + escapeHtml(entry.pageTitle) + "</span>" +
            '<span class="search-result__title">' + markTerms(sameAsPage ? entry.pageTitle : entry.heading, found.terms) + "</span>" +
            (entry.text ? '<span class="search-result__snippet">' + markTerms(snippet(entry.text, found.terms), found.terms) + "</span>" : "") + "</a>";
        }).join("") + '<div class="search-box__foot"><span><kbd>↑</kbd><kbd>↓</kbd> to move</span><span><kbd>Enter</kbd> to open</span><span><kbd>Esc</kbd> to close</span></div>';
      });
    };
    let timer = 0;
    input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(render, 80); });
    input.addEventListener("focus", function () { loadSearchIndex(); if (input.value.trim()) render(); });
    input.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown") { event.preventDefault(); select(selected + 1); }
      else if (event.key === "ArrowUp") { event.preventDefault(); select(selected - 1); }
      else if (event.key === "Enter") {
        const items = results.querySelectorAll(".search-result");
        const target = items[selected >= 0 ? selected : 0];
        if (target) { event.preventDefault(); close(); window.location.href = target.href; }
      } else if (event.key === "Escape") {
        if (input.value) { input.value = ""; render(); } else { input.blur(); close(); }
      }
    });
    results.addEventListener("click", function (event) { if (event.target.closest(".search-result")) close(); });
    document.addEventListener("click", function (event) { if (!box.contains(event.target)) close(); });
    document.addEventListener("keydown", function (event) {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if ((event.key === "/" && !typing) || (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey))) {
        event.preventDefault();
        input.focus();
        input.select();
      }
    });
  }

  /* ---------------------------------------------------------------------
   * Mobile navigation, back-to-top, tabs, screenshot placeholders
   * ------------------------------------------------------------------- */
  function initMobileNav() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const panel = document.querySelector(".sidebar") || document.querySelector(".mobile-site-nav");
    if (!toggle || !panel) return;
    const set = function (open) {
      panel.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    };
    toggle.addEventListener("click", function () { set(!panel.classList.contains("is-open")); });
    document.addEventListener("click", function (event) {
      if (panel.classList.contains("is-open") && !panel.contains(event.target) && !toggle.contains(event.target)) set(false);
    });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape" && panel.classList.contains("is-open")) { set(false); toggle.focus(); } });
    panel.addEventListener("click", function (event) { if (event.target.closest("a")) set(false); });
  }

  function initBackToTop() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "back-to-top";
    button.setAttribute("aria-label", "Back to top");
    button.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16V4M4.5 9.5 10 4l5.5 5.5"/></svg>';
    button.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    document.body.append(button);
    let ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; button.classList.toggle("is-visible", window.scrollY > 900); });
    }, { passive: true });
  }

  function initTabs() {
    document.querySelectorAll(".tabs").forEach(function (tabs) {
      const buttons = tabs.querySelectorAll(".tabs__btn");
      const panels = tabs.querySelectorAll(".tabs__panel");
      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          const target = btn.getAttribute("data-tab");
          buttons.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
          panels.forEach(function (p) { p.classList.toggle("is-active", p.getAttribute("data-tab-panel") === target); });
        });
      });
    });
  }

  // <figure class="figure figure--todo"> marks a picture still to take. It
  // shows on a local preview and is removed on the published site.
  function initFigurePlaceholders() {
    const local = window.location.protocol === "file:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
    if (!local) document.querySelectorAll(".figure--todo").forEach(function (figure) { figure.remove(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const steps = [initFigurePlaceholders, renderShell, fillSiteValues, fillProjectValues, initProjectHeader, initTheme, initSidebar,
      initCodeBlocks, initTables, initToc, initPageNav, initCatalog, initUpdates, initCompatibility, initSearch, initMobileNav, initBackToTop, initTabs];
    // One failing step must not leave the rest of the page unbuilt.
    steps.forEach(function (step) {
      try { step(); } catch (error) { if (window.console) console.error("[wiki] " + step.name + " failed", error); }
    });
  });
})();
