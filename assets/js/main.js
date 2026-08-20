/*
 * Shared behaviour for every page of the wiki.
 * Each page must set `window.SITE_ROOT` (a relative path prefix back to the
 * site root, e.g. "" for the landing page, "../" for /projects/index.html,
 * "../../../" for /projects/mods/project-alpha/index.html) before this file runs.
 */
(function () {
  "use strict";

  const ROOT = window.SITE_ROOT || "";


  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }


  /* ---------------------------------------------------------------------
   * Shared layout components
   * ------------------------------------------------------------------- */
  function renderSharedLayout() {
    if (!window.WIKI_DATA) return;

    const data = window.WIKI_DATA;
    const site = data.site || {};
    const root = window.SITE_ROOT || "";
    const projects = data.projects || [];
    const currentProject = getCurrentProject(projects);
    const currentSection = getCurrentSection();
    const currentPage = getCurrentPage(currentProject);
    const pathname = window.location.pathname.replace(/\\/g, "/");
    const isAbout = /\/about(?:\.html)?$/.test(pathname);
    const homeHref = root + "index.html";
    const projectsHref = root + "projects/index.html";
    const aboutHref = root + "about.html";

    document.querySelectorAll("[data-site-header]").forEach(function (mount) {
      mount.outerHTML =
        '<header class="topbar">' +
          '<a class="topbar__brand" href="' + escapeHtml(homeHref) + '">' +
            '<span class="topbar__mark" data-site-mark>' + escapeHtml(site.mark || "") + '</span>' +
            '<span data-site-name>' + escapeHtml(site.name || "") + '</span>' +
          '</a>' +
          '<nav class="topbar__nav">' +
            '<a href="' + escapeHtml(homeHref) + '" class="' + (!currentProject && !currentSection && !isAbout ? 'is-active' : '') + '">Home</a>' +
            '<a href="' + escapeHtml(projectsHref) + '" class="' + (currentProject || currentSection ? 'is-active' : '') + '">Projects</a>' +
            '<a href="' + escapeHtml(aboutHref) + '" class="' + (isAbout ? 'is-active' : '') + '">About</a>' +
          '</nav>' +
          '<div class="topbar__spacer"></div>' +
          '<div class="search-box">' +
            '<input type="text" placeholder="Search the wiki…" aria-label="Search the wiki" data-search-input autocomplete="off">' +
            '<div class="search-box__results" data-search-results></div>' +
          '</div>' +
          '<button class="theme-toggle" data-theme-toggle type="button">☾</button>' +
          '<button class="menu-toggle" data-menu-toggle type="button" aria-label="Toggle navigation">☰</button>' +
        '</header>';
    });

    document.querySelectorAll("[data-site-breadcrumb]").forEach(function (mount) {
      const parts = ['<nav class="breadcrumb" aria-label="Breadcrumb">'];
      parts.push('<a href="' + escapeHtml(homeHref) + '">Home</a>');

      if (currentProject) {
        parts.push('<span class="sep">/</span><a href="' + escapeHtml(projectsHref) + '">Projects</a>');
        const section = getSectionForProject(currentProject);
        if (section) {
          parts.push('<span class="sep">/</span><a href="' + escapeHtml(root + getSectionPath(section) + "index.html") + '">' + escapeHtml(section.label) + '</a>');
        }
        parts.push('<span class="sep">/</span><span class="current" data-project-name>' + escapeHtml(currentProject.name) + '</span>');
      } else if (currentSection) {
        parts.push('<span class="sep">/</span><a href="' + escapeHtml(projectsHref) + '">Projects</a>');
        parts.push('<span class="sep">/</span><span class="current">' + escapeHtml(currentSection.label) + '</span>');
      } else if (isAbout) {
        parts.push('<span class="sep">/</span><span class="current">About</span>');
      }

      parts.push('</nav>');
      mount.outerHTML = parts.join("");
    });

    document.querySelectorAll("[data-page-footer]").forEach(function (mount) {
      let label = "Wiki";
      if (currentProject) {
        label = currentProject.name + (currentPage ? " / " + currentPage.title : "");
      } else if (currentSection) {
        label = "Section: " + currentSection.label;
      } else if (isAbout) {
        label = "About";
      } else {
        label = "Home";
      }

      let updated = "";
      if (currentPage && currentPage.updated) updated = currentPage.updated;
      else if (site.recentUpdates && site.recentUpdates.length) {
        updated = site.recentUpdates.map(function (item) { return item.date; }).sort().reverse()[0] || "";
      }

      mount.outerHTML = '<footer class="page-footer"><span>' + escapeHtml(label) + '</span><span>' +
        escapeHtml(updated ? "Last updated " + updated : "Last updated") + '</span></footer>';
    });

    document.querySelectorAll("[data-site-footer]").forEach(function (mount) {
      mount.outerHTML = '<footer class="site-footer"><span data-site-name>' + escapeHtml(site.name || "") +
        '</span> — built with plain HTML/CSS/JS for <a href="https://pages.github.com/" target="_blank" rel="noopener">GitHub Pages</a>.</footer>';
    });
  }

  /* ---------------------------------------------------------------------
   * Theme toggle (light / dark), persisted in localStorage
   * ------------------------------------------------------------------- */
  function initTheme() {
    let stored = null;
    try { stored = localStorage.getItem("wiki-theme"); } catch (e) { /* ignore */ }
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);

    const btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    updateThemeIcon(btn, theme);

    btn.addEventListener("click", function () {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      updateThemeIcon(btn, next);
      try { localStorage.setItem("wiki-theme", next); } catch (e) { /* ignore */ }
    });
  }

  function updateThemeIcon(btn, theme) {
    btn.textContent = theme === "dark" ? "☀" : "☾";
    btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }

  /* ---------------------------------------------------------------------
   * Mobile sidebar toggle
   * ------------------------------------------------------------------- */
  function initMobileNav() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const sidebar = document.querySelector(".sidebar");
    if (!toggle || !sidebar) return;
    toggle.addEventListener("click", function () {
      sidebar.classList.toggle("is-open");
    });
    document.addEventListener("click", function (evt) {
      if (!sidebar.classList.contains("is-open")) return;
      if (sidebar.contains(evt.target) || toggle.contains(evt.target)) return;
      sidebar.classList.remove("is-open");
    });
  }

  /* ---------------------------------------------------------------------
   * Copy-to-clipboard buttons on code blocks
   * ------------------------------------------------------------------- */
  function initCodeCopy() {
    document.querySelectorAll(".code-block__copy").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const block = btn.closest(".code-block");
        const codeEl = block && block.querySelector("code");
        if (!codeEl) return;
        const text = codeEl.textContent;
        const done = function () {
          const original = btn.textContent;
          btn.textContent = "Copied";
          setTimeout(function () { btn.textContent = original; }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(done);
        } else {
          done();
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Tabs component (e.g. multi-language examples)
   * ------------------------------------------------------------------- */
  function initTabs() {
    document.querySelectorAll(".tabs").forEach(function (tabs) {
      const buttons = tabs.querySelectorAll(".tabs__btn");
      const panels = tabs.querySelectorAll(".tabs__panel");
      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          const target = btn.getAttribute("data-tab");
          buttons.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
          panels.forEach(function (p) {
            p.classList.toggle("is-active", p.getAttribute("data-tab-panel") === target);
          });
        });
      });
    });
  }


  /* ---------------------------------------------------------------------
   * Shared site/project data
   * ------------------------------------------------------------------- */
  function getSectionForProject(project) {
    const sections = Object.values(window.WIKI_DATA.sections || {});
    return sections.find(function (section) { return section.type === project.type; }) || null;
  }
  function getProjectPath(project) {
    const section = getSectionForProject(project);
    return "projects/" + (section ? section.path : (project.type || "mods")) + "/" + project.slug + "/";
  }
  function getSectionPath(section) { return "projects/" + section.path + "/"; }
  function getCurrentProject(projects) {
    const currentPath = window.location.pathname.replace(/\\/g, "/");
    return projects.find(function (project) { return currentPath.indexOf("/" + getProjectPath(project)) !== -1; }) || null;
  }
  function getCurrentSection() {
    const sections = Object.values(window.WIKI_DATA.sections || {});
    const currentPath = window.location.pathname.replace(/\\/g, "/");
    return sections.find(function (section) { return currentPath.indexOf("/projects/" + section.path + "/") !== -1; }) || null;
  }
  function getCurrentPage(project) {
    if (!project) return null;
    const currentPath = window.location.pathname.replace(/\\/g, "/");
    const pageFile = currentPath.substring(currentPath.lastIndexOf("/") + 1) || "index.html";
    return project.pages.find(function (page) { return page.file === pageFile; }) || null;
  }

  function setHref(element, href) {
    if (href) {
      element.setAttribute("href", href);
      element.removeAttribute("aria-disabled");
      element.classList.remove("is-disabled");
      element.hidden = false;
      return;
    }

    element.removeAttribute("href");
    element.setAttribute("aria-disabled", "true");
    element.classList.add("is-disabled");
    element.hidden = true;
  }

  function initSharedData() {
    if (!window.WIKI_DATA) return;

    const data = window.WIKI_DATA;
    const site = data.site;
    const projects = data.projects;
    const currentProject = getCurrentProject(projects);
    const currentPage = getCurrentPage(currentProject);

    // Site-wide values.
    document.title = site.name + (currentProject && currentPage ? "" : " — Wiki");
    const siteDescription = document.querySelector('meta[name="description"]');
    if (siteDescription && site.description) {
      siteDescription.setAttribute("content", site.description);
    }
    document.querySelectorAll("[data-site-name]").forEach(function (element) {
      element.textContent = site.name;
    });
    document.querySelectorAll("[data-site-description]").forEach(function (element) {
      element.textContent = site.description;
    });
    document.querySelectorAll("[data-site-mark]").forEach(function (element) {
      element.textContent = site.mark;
    });
    document.querySelectorAll("[data-site-author-name]").forEach(function (element) {
      element.textContent = site.author.name;
    });
    document.querySelectorAll("[data-site-link]").forEach(function (element) {
      const key = element.getAttribute("data-site-link");
      setHref(element, site.author[key]);
    });
    document.querySelectorAll("[data-home-project-name]").forEach(function (element) {
      const slug = element.getAttribute("data-home-project-name");
      const project = projects.find(function (item) { return item.slug === slug; });
      if (project) element.textContent = project.name;
    });
    document.querySelectorAll("[data-project-href]").forEach(function (element) {
      const slug = element.getAttribute("data-project-href");
      const project = projects.find(function (item) { return item.slug === slug; });
      if (!project) return;
      const currentRoot = window.SITE_ROOT || "";
      setHref(element, currentRoot + getProjectPath(project) + "index.html");
    });
    document.querySelectorAll("[data-project-list]").forEach(function (element) {
      element.innerHTML = projects.map(function (project) {
        return '<a class="card" href="' + (window.SITE_ROOT || "") + getProjectPath(project) + 'index.html">' +
          '<div class="card__eyebrow">' + escapeHtml(project.status) + '</div>' +
          '<h3 class="card__title">' + escapeHtml(project.name) + '</h3>' +
          '<p class="card__desc">' + escapeHtml(project.description) + '</p>' +
        '</a>';
      }).join("");
    });
    document.querySelectorAll("[data-recent-updates]").forEach(function (element) {
      element.innerHTML = (site.recentUpdates || []).map(function (update) {
        const project = projects.find(function (item) { return item.slug === update.project; });
        if (!project) return "";
        const page = project.pages.find(function (item) { return item.file === update.page; });
        const pageTitle = page ? page.title : update.page;
        return '<tr><td>' + escapeHtml(update.date) + '</td>' +
          '<td><a href="' + (window.SITE_ROOT || "") + getProjectPath(project) + escapeHtml(update.page) + '">' +
          escapeHtml(project.name + " — " + pageTitle) +
          '</a></td><td>' + escapeHtml(update.change) + '</td></tr>';
      }).join("");
    });

    // Project pages get their <title>, description, breadcrumb, footer and
    // all project metadata from the same object in wiki-data.js.
    if (currentProject) {
      if (currentPage) {
        document.title = currentPage.title + " — " + currentProject.name + " — " + site.name;
        const description = document.querySelector('meta[name="description"]');
        if (description && currentPage.description) {
          description.setAttribute("content", currentPage.description);
        }
      }

      const projectNameMarker = document.querySelector("[data-project-name]");
      const oldProjectName = projectNameMarker ? projectNameMarker.textContent.trim() : "";
      if (projectNameMarker) projectNameMarker.setAttribute("data-original-project-name", oldProjectName);
      document.querySelectorAll("[data-project-name]").forEach(function (element) {
        element.textContent = currentProject.name;
      });
      document.querySelectorAll("[data-project-tagline]").forEach(function (element) {
        element.textContent = currentProject.tagline || currentProject.description;
      });
      document.querySelectorAll("[data-project-description]").forEach(function (element) {
        element.textContent = currentProject.description;
      });
      document.querySelectorAll("[data-project-status]").forEach(function (element) {
        const label = currentProject.status.charAt(0).toUpperCase() + currentProject.status.slice(1);
        element.className = "status-pill status-pill--" + currentProject.status;
        element.innerHTML = '<span class="dot"></span> ' + escapeHtml(label);
      });
      document.querySelectorAll("[data-project-icon]").forEach(function (element) {
        if (currentProject.icon) element.setAttribute("src", currentProject.icon);
        element.setAttribute("alt", currentProject.name + " icon");
      });
      document.querySelectorAll("[data-project-link]").forEach(function (element) {
        const key = element.getAttribute("data-project-link");
        let href = currentProject.links[key] || "";
        if (key === "modrinth" && currentProject.modrinthSlug) {
          href = "https://modrinth.com/" + (currentProject.type || "mod") + "/" + currentProject.modrinthSlug;
        } else if (key === "modrinth-versions" && currentProject.modrinthSlug) {
          href = "https://modrinth.com/" + (currentProject.type || "mod") + "/" + currentProject.modrinthSlug + "/versions";
        }
        setHref(element, href);
      });
      document.querySelectorAll("[data-project-tag]").forEach(function (element) {
        const label = element.getAttribute("data-project-tag");
        const tag = currentProject.tags.find(function (item) { return item.label === label; });
        if (!tag) {
          element.remove();
          return;
        }
        element.textContent = tag.label;
        element.className = "tag tag--platform" + (tag.class ? " " + tag.class : "");
      });
      document.querySelectorAll("[data-project-tags]").forEach(function (element) {
        element.innerHTML = (currentProject.tags || []).map(function (tag) {
          return '<span class="tag tag--platform' + (tag.class ? ' ' + escapeHtml(tag.class) : '') + '">' +
            escapeHtml(tag.label) + '</span>';
        }).join("");
      });
      document.querySelectorAll("[data-project-loaders]").forEach(function (element) {
        const loaders = (currentProject.tags || []).map(function (tag) { return tag.label; }).filter(function (label) {
          return !["Client & Server", "Client-side", "Server-side"].includes(label) && !label.startsWith("MC ");
        });
        element.textContent = loaders.join(", ") || "See Modrinth";
      });
      document.querySelectorAll("[data-project-code]").forEach(function (element) {
        const type = element.getAttribute("data-project-code");
        if (type === "modrinth-slug") element.textContent = currentProject.modrinthSlug || "YOUR-MODRINTH-SLUG";
        if (type === "version") element.textContent = currentProject.version || "YOUR-VERSION";
        if (type === "minecraft-version") element.textContent = currentProject.minecraftVersion || "YOUR-MC-VERSION";
        if (type === "github-clone") element.textContent = currentProject.links.github ? "git clone " + currentProject.links.github + ".git" : "git clone YOUR-GITHUB-URL.git";
      });

      document.querySelectorAll("[data-project-badge]").forEach(function (element) {
        const type = element.getAttribute("data-project-badge");
        if (!currentProject.modrinthSlug) {
          element.remove();
          return;
        }
        const badgeUrls = {
          downloads: "https://img.shields.io/modrinth/dt/" + currentProject.modrinthSlug + "?logo=modrinth&label=downloads&color=1bd96a",
          version: "https://img.shields.io/modrinth/v/" + currentProject.modrinthSlug + "?logo=modrinth&label=version&color=1bd96a",
          minecraft: "https://img.shields.io/modrinth/game-versions/" + currentProject.modrinthSlug + "?logo=modrinth&label=minecraft&color=1bd96a"
        };
        if (!badgeUrls[type]) {
          element.remove();
          return;
        }
        element.setAttribute("src", badgeUrls[type]);
        element.setAttribute("alt", "Modrinth " + type + " badge for " + currentProject.name);
      });
      document.querySelectorAll("[data-page-updated]").forEach(function (element) {
        const date = currentPage && currentPage.updated;
        element.textContent = date ? "Last updated " + date : "Last updated";
      });

      // Replace project names in normal page text too. This means changing
      // `name` in wiki-data.js updates prose, headings and labels without
      // requiring a search through every HTML file.
      replaceProjectText(currentProject);
    }

    document.querySelectorAll("[data-project-page-title]").forEach(function (element) {
      if (currentPage) element.textContent = currentPage.title;
    });

    // Search is generated from the same project/page definitions. No second
    // search index needs to be maintained.
    window.WIKI_INDEX = [];
    projects.forEach(function (project) {
      project.pages.forEach(function (page) {
        window.WIKI_INDEX.push({
          title: page.title + " — " + project.name,
          section: project.name,
          excerpt: page.searchExcerpt || page.description || "",
          tags: project.tags.map(function (tag) { return tag.label; }),
          path: getProjectPath(project) + page.file
        });
      });
    });
  }

  function replaceProjectText(project) {
    const marker = document.querySelector("[data-project-name]");
    if (!marker) return;
    const oldProjectName = marker.getAttribute("data-original-project-name") || "";
    if (!oldProjectName || oldProjectName === project.name) return;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node = walker.nextNode();
    while (node) {
      const parent = node.parentElement;
      if (parent && !["SCRIPT", "STYLE", "CODE", "PRE"].includes(parent.tagName)) {
        nodes.push(node);
      }
      node = walker.nextNode();
    }
    nodes.forEach(function (textNode) {
      textNode.nodeValue = textNode.nodeValue.split(oldProjectName).join(project.name);
    });
  }


  /* ---------------------------------------------------------------------
   * Wiki search
   * ------------------------------------------------------------------- */
  function initSearch() {
    const inputs = document.querySelectorAll("[data-search-input]");
    if (!inputs.length || !window.WIKI_INDEX) return;

    inputs.forEach(function (input) {
      const results = input.parentElement.querySelector("[data-search-results]");
      if (!results) return;

      function render(query) {
        const normalized = query.trim().toLowerCase();
        if (!normalized) {
          results.innerHTML = "";
          results.classList.remove("is-open");
          return;
        }

        const matches = window.WIKI_INDEX.filter(function (item) {
          const haystack = [item.title, item.section, item.excerpt].concat(item.tags || []).join(" ").toLowerCase();
          return haystack.indexOf(normalized) !== -1;
        }).slice(0, 8);

        if (!matches.length) {
          results.innerHTML = '<div class="search-box__empty">No matching pages.</div>';
          results.classList.add("is-open");
          return;
        }

        const root = window.SITE_ROOT || "";
        results.innerHTML = matches.map(function (item) {
          return '<a class="search-box__result" href="' + escapeHtml(root + item.path) + '">' +
            '<div class="search-box__result-title">' + escapeHtml(item.title) + '</div>' +
            '<div class="search-box__result-path">' + escapeHtml(item.section) + '</div>' +
          '</a>';
        }).join("");
        results.classList.add("is-open");
      }

      input.addEventListener("input", function () { render(input.value); });
      input.addEventListener("focus", function () { if (input.value.trim()) render(input.value); });
      input.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          input.value = "";
          render("");
          input.blur();
        }
      });

      document.addEventListener("click", function (event) {
        if (!input.parentElement.contains(event.target)) results.classList.remove("is-open");
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Project navigation and directory
   * ------------------------------------------------------------------- */
  function initProjectNavigation() {
    if (!window.WIKI_DATA) return;
    const data = window.WIKI_DATA;
    const projects = data.projects || [];
    const sections = Object.values(data.sections || {});
    const currentProject = getCurrentProject(projects);
    const currentSection = getCurrentSection();
    const currentPath = window.location.pathname.replace(/\\/g, "/");
    const sidebar = document.querySelector("[data-project-sidebar]");

    if (sidebar) {
      const root = window.SITE_ROOT || "";
      let html = '<a class="tab-link sidebar__all-projects" href="' + root + 'projects/index.html"><span class="tab-index">◆</span> All Projects</a>';
      if (currentProject) {
        const pagePath = currentPath.substring(currentPath.lastIndexOf("/") + 1) || "index.html";
        html += '<div class="sidebar__section"><div class="sidebar__label">' + escapeHtml(currentProject.name) + '</div>';
        currentProject.pages.forEach(function (page) {
          const active = page.file === pagePath;
          html += '<a class="tab-link' + (page.sub ? ' tab-link--sub' : '') + (active ? ' is-active' : '') + '" href="' + escapeHtml(page.file) + '"><span class="tab-index">' + escapeHtml(page.index) + '</span> ' + escapeHtml(page.title) + '</a>';
        });
        html += '</div>';
      }
      sections.forEach(function (section) {
        const sectionProjects = projects.filter(function (project) { return project.type === section.type; });
        if (!sectionProjects.length) return;
        const activeSection = currentSection && currentSection.type === section.type;
        html += '<div class="sidebar__section"><div class="sidebar__label"><a href="' + root + getSectionPath(section) + 'index.html">' + escapeHtml(section.label) + '</a></div>';
        sectionProjects.forEach(function (project) {
          html += '<a class="tab-link' + (currentProject && currentProject.slug === project.slug ? ' is-active' : '') + '" href="' + root + getProjectPath(project) + 'index.html"><span class="tab-index">' + escapeHtml(project.index) + '</span> ' + escapeHtml(project.name) + '</a>';
        });
        html += '</div>';
      });
      sidebar.innerHTML = html;
    }

    const grid = document.querySelector("[data-project-grid]");
    if (grid) {
      const visibleSections = currentSection && !currentProject ? sections.filter(function (section) { return section.type === currentSection.type; }) : sections;
      grid.innerHTML = visibleSections.map(function (section) {
        const sectionProjects = projects.filter(function (project) { return project.type === section.type; });
        if (!sectionProjects.length) return "";
        const cards = sectionProjects.map(function (project) {
          const tags = (project.tags || []).map(function (tag) { return '<span class="tag ' + escapeHtml(tag.class || "") + ' tag--platform">' + escapeHtml(tag.label) + '</span>'; }).join("");
          return '<a class="card" href="' + escapeHtml((window.SITE_ROOT || "") + getProjectPath(project) + 'index.html') + '"><span class="status-pill status-pill--' + escapeHtml(project.status) + '"><span class="dot"></span> ' + escapeHtml(project.status.charAt(0).toUpperCase() + project.status.slice(1)) + '</span><h3 class="card__title">' + escapeHtml(project.name) + '</h3><p class="card__desc">' + escapeHtml(project.description) + '</p><div class="card__meta">' + tags + '</div></a>';
        }).join("");
        return '<section class="project-section"><div class="section-heading"><div><div class="sidebar__label">' + escapeHtml(section.label) + '</div><h2>' + escapeHtml(section.label) + '</h2></div><a class="btn btn--ghost" href="' + escapeHtml((window.SITE_ROOT || "") + getSectionPath(section) + 'index.html') + '">View ' + escapeHtml(section.label) + ' ↗</a></div><div class="grid">' + cards + '</div></section>';
      }).join("");
    }

    const projectCount = document.querySelector("[data-project-count]");
    if (projectCount) projectCount.textContent = projects.length + (projects.length === 1 ? " project" : " projects");
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderSharedLayout();
    initSharedData();
    initTheme();
    initMobileNav();
    initCodeCopy();
    initTabs();
    initSearch();
    initProjectNavigation();
  });
})();
