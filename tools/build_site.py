"""Regenerate the wiki's derived files.

    python tools/build_site.py          update everything below
    python tools/build_site.py --check  report stale files and exit 1 (run by check_site.py)

1. Project metadata: when the sibling mod repositories are present (``../<slug>_repo``),
   copy each mod's source version and build targets (Minecraft version x loader) into
   assets/js/wiki-data.js, and rebuild its loader and Minecraft tags from those targets.
   Skipped for projects without a sibling repository, so it is safe on any checkout.
2. Heading ids: give every h2 and h3 on project pages a stable id, so section links,
   the page contents and search results keep working when headings move around.
3. assets/js/search-index.js: one entry per page section, loaded by the search box on demand.
4. feed.xml (Atom, from site.recentUpdates) and sitemap.xml, using site.url.

The site itself needs none of this at runtime beyond the generated files, which are committed.
"""

from __future__ import annotations

import html
import json
import re
import sys
import tomllib
from html.parser import HTMLParser
from pathlib import Path
from xml.sax.saxutils import escape as xml_escape

SITE = Path(__file__).resolve().parents[1]
WORKSPACE = SITE.parent
DATA_FILE = SITE / "assets/js/wiki-data.js"
SEARCH_FILE = SITE / "assets/js/search-index.js"
FEED_FILE = SITE / "feed.xml"
SITEMAP_FILE = SITE / "sitemap.xml"
DATA_PATTERN = re.compile(r"(window\.WIKI_DATA\s*=\s*)(\{.*\})(\s*;\s*window\.WIKI_PROJECTS)", re.S)

LOADER_TAGS = [("fabric", "Fabric", "tag--fabric"), ("neoforge", "NeoForge", "tag--neoforge"), ("forge", "Forge", "tag--forge"), ("quilt", "Quilt", "tag--quilt")]
LOADER_ORDER = {key: i for i, (key, _, _) in enumerate(LOADER_TAGS)}


def mc_key(version: str) -> tuple[int, ...]:
    return tuple(int(part) for part in re.findall(r"\d+", version))


# ---------------------------------------------------------------------------
# 1. Project metadata from sibling repositories
# ---------------------------------------------------------------------------
def read_repo(slug: str) -> tuple[str, list[str]] | None:
    repo = WORKSPACE / f"{slug}_repo"
    stonecutter = repo / "stonecutter.properties.toml"
    gradle = repo / "gradle.properties"
    if stonecutter.is_file():
        data = tomllib.loads(stonecutter.read_text(encoding="utf-8"))
        version = str(data.get("mod", {}).get("version", ""))
        targets = []
        for loader in LOADER_ORDER:
            for key, value in (data.get(loader) or {}).items():
                if isinstance(value, dict) and re.match(r"^\d+\.\d+", key):
                    targets.append(f"{key}-{loader}")
        return version, targets
    if gradle.is_file():
        text = gradle.read_text(encoding="utf-8")
        prop = lambda key: (re.search(rf"^{key}\s*=\s*(.+?)\s*$", text, re.M) or [None, ""])[1]
        loader = "neoforge" if prop("neo_version") else "forge" if prop("forge_version") else "fabric" if prop("loader_version") else ""
        minecraft = prop("minecraft_version")
        return prop("mod_version"), [f"{minecraft}-{loader}"] if minecraft and loader else []
    return None


def sort_targets(targets: list[str]) -> list[str]:
    def key(target: str):
        minecraft, loader = target.rsplit("-", 1)
        return mc_key(minecraft), LOADER_ORDER.get(loader, 99)
    return sorted(set(targets), key=key)


def minecraft_label(targets: list[str]) -> str:
    versions = sorted({target.rsplit("-", 1)[0] for target in targets}, key=mc_key)
    return f"{versions[0]}-{versions[-1]}" if len(versions) > 2 else ", ".join(versions)


def sync_projects(data: dict) -> list[str]:
    changes = []
    for project in data["projects"]:
        if project["type"] != "mod":
            continue
        found = read_repo(project["slug"])
        if not found:
            continue
        version, targets = found
        targets = sort_targets(targets)
        if version and project.get("version") != version:
            changes.append(f"{project['slug']}: version {project.get('version')} -> {version}")
            project["version"] = version
        if targets and project.get("targets") != targets:
            changes.append(f"{project['slug']}: targets -> {', '.join(targets)}")
            project["targets"] = targets
        if not targets:
            continue
        label = minecraft_label(targets)
        loaders = {target.rsplit("-", 1)[1] for target in targets}
        tags = [{"label": name, "class": css} for key, name, css in LOADER_TAGS if key in loaders]
        tags.append({"label": "MC " + label, "class": ""})
        known = {name for _, name, _ in LOADER_TAGS}
        tags += [tag for tag in project.get("tags", []) if tag["label"] not in known and not tag["label"].startswith("MC ")]
        if project.get("minecraftVersion") != label:
            project["minecraftVersion"] = label
        if project.get("tags") != tags:
            changes.append(f"{project['slug']}: tags -> {', '.join(tag['label'] for tag in tags)}")
            project["tags"] = tags
    return changes


# ---------------------------------------------------------------------------
# 2. Heading ids
# ---------------------------------------------------------------------------
HEADING = re.compile(r"<(h[23])((?:\s[^>]*)?)>(.*?)</\1>", re.S)


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "section"


def plain(fragment: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", fragment)).split())


def add_heading_ids(page_html: str) -> str:
    used = set(re.findall(r'\sid="([^"]+)"', page_html))

    def replace(match: re.Match) -> str:
        tag, attrs, inner = match.groups()
        if " id=" in attrs or "data-project-name" in attrs:
            return match.group(0)
        base = slugify(plain(inner))
        slug, number = base, 2
        while slug in used:
            slug, number = f"{base}-{number}", number + 1
        used.add(slug)
        return f'<{tag}{attrs} id="{slug}">{inner}</{tag}>'

    return HEADING.sub(replace, page_html)


# ---------------------------------------------------------------------------
# 3. Search index
# ---------------------------------------------------------------------------
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
BLOCK = {"p", "li", "tr", "td", "th", "div", "pre", "h2", "h3", "h4", "table", "ul", "ol", "figure", "section"}


class SectionParser(HTMLParser):
    """Split a project page's <main> into (heading, id, text) sections."""

    def __init__(self, page_title: str):
        super().__init__(convert_charrefs=True)
        self.in_main = False
        self.skip: list[str] = []
        self.heading: list[str] | None = None
        self.heading_id = ""
        self.sections = [[page_title, "", []]]

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "main":
            self.in_main = True
            return
        if not self.in_main or tag in VOID:
            if tag in ("br", "wbr"):
                self.text(" ")
            return
        if self.skip:
            if tag == self.skip[0]:
                self.skip.append(tag)
            return
        classes = (attrs.get("class") or "").split()
        if tag in ("script", "style", "nav") or "mod-meta" in classes or "figure--todo" in classes or any(key.startswith(("data-site-", "data-page-")) for key in attrs):
            self.skip = [tag]
            return
        if tag in ("h2", "h3"):
            self.heading = []
            self.heading_id = attrs.get("id", "")
        elif tag in BLOCK:
            self.text(" ")

    def handle_endtag(self, tag):
        if tag == "main":
            self.in_main = False
            return
        if self.skip:
            if tag == self.skip[0]:
                self.skip.pop()
            return
        if tag in ("h2", "h3") and self.heading is not None:
            title = " ".join("".join(self.heading).split())
            self.heading = None
            if title:
                self.sections.append([title, self.heading_id, []])
        elif tag in BLOCK:
            self.text(" ")

    def handle_data(self, data):
        if self.in_main and not self.skip:
            self.text(data)

    def text(self, value: str):
        if self.heading is not None:
            self.heading.append(value)
        else:
            self.sections[-1][2].append(value)


def build_search_index(data: dict, pages: dict[Path, str]) -> str:
    sections_path = {s["type"]: s["path"] for s in data["sections"].values()}
    page_rows, section_rows = [], []
    for project in data["projects"]:
        folder = Path("projects") / sections_path[project["type"]] / project["slug"]
        for page in project["pages"]:
            path = SITE / folder / page["file"]
            if path not in pages:
                continue
            parser = SectionParser(page["title"])
            parser.feed(pages[path])
            index = len(page_rows)
            page_rows.append([(folder / page["file"]).as_posix(), project["slug"], page["title"]])
            for title, anchor, chunks in parser.sections:
                text = " ".join("".join(chunks).split())
                if text or anchor:
                    section_rows.append([index, title, anchor, text])
    payload = json.dumps({"pages": page_rows, "sections": section_rows}, ensure_ascii=False, separators=(",", ":"))
    return ("/* Generated by tools/build_site.py from the project pages. Do not edit by hand. */\n"
            f"window.WIKI_SEARCH = {payload};\n")


# ---------------------------------------------------------------------------
# 4. Feed and sitemap
# ---------------------------------------------------------------------------
def build_feed(data: dict) -> str:
    site = data["site"]
    base = site["url"]
    sections_path = {s["type"]: s["path"] for s in data["sections"].values()}
    projects = {p["slug"]: p for p in data["projects"]}
    updates = sorted((u for u in site.get("recentUpdates", []) if u["project"] in projects), key=lambda u: u["date"], reverse=True)
    entries = []
    for number, update in enumerate(updates):
        project = projects[update["project"]]
        page = next((p for p in project["pages"] if p["file"] == update["page"]), None)
        url = f"{base}projects/{sections_path[project['type']]}/{project['slug']}/{update['page']}"
        title = f"{project['name']}: {page['title'] if page else update['page']}"
        entries.append(
            "  <entry>\n"
            f"    <title>{xml_escape(title)}</title>\n"
            f'    <link href="{xml_escape(url)}"/>\n'
            f"    <id>{xml_escape(base)}#update-{update['date']}-{project['slug']}-{len(updates) - number}</id>\n"
            f"    <updated>{update['date']}T00:00:00Z</updated>\n"
            f"    <summary>{xml_escape(update['change'])}</summary>\n"
            "  </entry>\n")
    latest = updates[0]["date"] if updates else "2026-01-01"
    return ('<?xml version="1.0" encoding="utf-8"?>\n'
            '<feed xmlns="http://www.w3.org/2005/Atom">\n'
            f"  <title>{xml_escape(site['name'])}: updates</title>\n"
            f'  <link href="{xml_escape(base)}updates.html"/>\n'
            f'  <link rel="self" href="{xml_escape(base)}feed.xml"/>\n'
            f"  <id>{xml_escape(base)}</id>\n"
            f"  <updated>{latest}T00:00:00Z</updated>\n"
            f"  <author><name>{xml_escape(site['author']['name'])}</name></author>\n"
            + "".join(entries) + "</feed>\n")


def build_sitemap(data: dict, pages: dict[Path, str]) -> str:
    base = data["site"]["url"]
    sections_path = {s["type"]: s["path"] for s in data["sections"].values()}
    updated = {}
    for project in data["projects"]:
        for page in project["pages"]:
            updated[f"projects/{sections_path[project['type']]}/{project['slug']}/{page['file']}"] = page.get("updated", "")
    rows = []
    for path in sorted(pages):
        rel = path.relative_to(SITE).as_posix()
        if rel == "404.html":
            continue
        lastmod = f"<lastmod>{updated[rel]}</lastmod>" if updated.get(rel) else ""
        rows.append(f"  <url><loc>{xml_escape(base + rel)}</loc>{lastmod}</url>\n")
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(rows) + "</urlset>\n")


# ---------------------------------------------------------------------------
def served_pages() -> list[Path]:
    return sorted(p for p in SITE.rglob("*.html") if ".git" not in p.parts and p.parent != SITE / "tools")


def read(path: Path) -> str:
    return path.read_bytes().decode("utf-8") if path.is_file() else ""


def build() -> dict[Path, str]:
    """Return {path: new content} for every derived file."""
    text = read(DATA_FILE)
    match = DATA_PATTERN.search(text)
    if not match:
        raise SystemExit("Cannot read window.WIKI_DATA from assets/js/wiki-data.js")
    data = json.loads(match.group(2))
    for change in sync_projects(data):
        print("  " + change)
    outputs = {DATA_FILE: text[:match.start(2)] + json.dumps(data, indent=2, ensure_ascii=False) + text[match.end(2):]}

    pages = {}
    for path in served_pages():
        original = read(path)
        is_project_page = path.parent.parent.parent == SITE / "projects"
        pages[path] = add_heading_ids(original) if is_project_page else original
        if pages[path] != original:
            outputs[path] = pages[path]

    outputs[SEARCH_FILE] = build_search_index(data, pages)
    outputs[FEED_FILE] = build_feed(data)
    outputs[SITEMAP_FILE] = build_sitemap(data, pages)
    return outputs


def stale_files() -> list[Path]:
    return [path for path, content in build().items() if read(path) != content]


def main() -> None:
    if "--check" in sys.argv:
        stale = stale_files()
        for path in stale:
            print(f"Out of date: {path.relative_to(SITE).as_posix()} (run python tools/build_site.py)", file=sys.stderr)
        raise SystemExit(1 if stale else 0)
    written = 0
    for path, content in build().items():
        if read(path) != content:
            path.write_bytes(content.encode("utf-8"))
            written += 1
            print(f"Wrote {path.relative_to(SITE).as_posix()}")
    print(f"{written} file(s) updated")


if __name__ == "__main__":
    main()
