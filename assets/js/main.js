/*
 * Shared behaviour for every page of the wiki.
 * Each page must set `window.SITE_ROOT` (a relative path prefix back to the
 * site root, e.g. "" for the landing page, "../" for /projects/index.html,
 * "../../" for /projects/project-alpha/index.html) before this file runs.
 */
(function () {
  "use strict";

  var ROOT = window.SITE_ROOT || "";

  /* ---------------------------------------------------------------------
   * Theme toggle (light / dark), persisted in localStorage
   * ------------------------------------------------------------------- */
  function initTheme() {
    var stored = null;
    try { stored = localStorage.getItem("wiki-theme"); } catch (e) { /* ignore */ }
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = stored || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);

    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    updateThemeIcon(btn, theme);

    btn.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme");
      var next = current === "dark" ? "light" : "dark";
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
    var toggle = document.querySelector("[data-menu-toggle]");
    var sidebar = document.querySelector(".sidebar");
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
        var block = btn.closest(".code-block");
        var codeEl = block && block.querySelector("code");
        if (!codeEl) return;
        var text = codeEl.textContent;
        var done = function () {
          var original = btn.textContent;
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
      var buttons = tabs.querySelectorAll(".tabs__btn");
      var panels = tabs.querySelectorAll(".tabs__panel");
      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var target = btn.getAttribute("data-tab");
          buttons.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
          panels.forEach(function (p) {
            p.classList.toggle("is-active", p.getAttribute("data-tab-panel") === target);
          });
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Search box, backed by window.WIKI_INDEX (see search-index.js)
   * ------------------------------------------------------------------- */
  function initSearch() {
    var input = document.querySelector("[data-search-input]");
    var results = document.querySelector("[data-search-results]");
    if (!input || !results || !window.WIKI_INDEX) return;

    function render(query) {
      var q = query.trim().toLowerCase();
      if (!q) {
        results.classList.remove("is-open");
        results.innerHTML = "";
        return;
      }
      var matches = window.WIKI_INDEX.filter(function (item) {
        var haystack = (item.title + " " + item.section + " " + item.excerpt + " " + item.tags.join(" ")).toLowerCase();
        return haystack.indexOf(q) !== -1;
      }).slice(0, 8);

      if (matches.length === 0) {
        results.innerHTML = '<div class="search-box__empty">No pages match &ldquo;' + escapeHtml(query) + '&rdquo;</div>';
      } else {
        results.innerHTML = matches.map(function (item) {
          return (
            '<a class="search-box__result" href="' + ROOT + item.path + '">' +
              '<div class="search-box__result-title">' + escapeHtml(item.title) + "</div>" +
              '<div class="search-box__result-path">' + escapeHtml(item.section) + "</div>" +
            "</a>"
          );
        }).join("");
      }
      results.classList.add("is-open");
    }

    function escapeHtml(str) {
      var div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }

    input.addEventListener("input", function () { render(input.value); });
    input.addEventListener("focus", function () { if (input.value) render(input.value); });
    document.addEventListener("click", function (evt) {
      if (!results.contains(evt.target) && evt.target !== input) {
        results.classList.remove("is-open");
      }
    });
    input.addEventListener("keydown", function (evt) {
      if (evt.key === "Escape") { results.classList.remove("is-open"); input.blur(); }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initMobileNav();
    initCodeCopy();
    initTabs();
    initSearch();
  });
})();
