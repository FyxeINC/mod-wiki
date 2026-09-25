"""Check static wiki links and project metadata before publishing to GitHub Pages."""

from html.parser import HTMLParser
from pathlib import Path
import json
import re
import sys
from urllib.parse import urlsplit

SITE = Path(__file__).resolve().parents[1]
DATA_FILE = SITE / "assets/js/wiki-data.js"
text = DATA_FILE.read_text(encoding="utf-8")
match = re.search(r"window\.WIKI_DATA\s*=\s*(\{.*\})\s*;\s*window\.WIKI_PROJECTS", text, re.S)
if not match:
    raise SystemExit("Cannot read window.WIKI_DATA from assets/js/wiki-data.js")
data = json.loads(match.group(1))
errors = []


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ("href", "src"):
            if attrs.get(key):
                self.links.append(attrs[key])


projects = data["projects"]
slugs = [project["slug"] for project in projects]
if len(slugs) != len(set(slugs)):
    errors.append("Duplicate project slug")

sections = {section["type"]: section["path"] for section in data["sections"].values()}
for project in projects:
    folder = SITE / "projects" / sections[project["type"]] / project["slug"]
    if project.get("icon") and not (folder / project["icon"]).is_file():
        errors.append(f"Missing project icon: {folder / project['icon']}")
    for page in project["pages"]:
        if not (folder / page["file"]).is_file():
            errors.append(f"Missing page: {folder / page['file']}")

siblings = {path.name.removesuffix("_repo") for path in SITE.parent.glob("*_repo") if not path.name.startswith("MDK-")}
if siblings:
    documented = {project["slug"] for project in projects if project["type"] == "mod"}
    for slug in sorted(siblings - documented):
        errors.append(f"Mod missing from wiki-data.js: {slug}")

for page in SITE.rglob("*.html"):
    if ".git" in page.parts:
        continue
    if page.parent == SITE / "tools":
        continue  # Importer templates are not served from their source path.
    html = page.read_text(encoding="utf-8")
    parser = Links()
    parser.feed(html)
    for link in parser.links:
        if link.startswith(("https://", "http://", "mailto:", "#", "data:")):
            continue
        path = urlsplit(link).path
        if not path:
            continue
        if path.startswith("/"):
            errors.append(f"Root-relative link breaks project Pages: {page.relative_to(SITE)}: {link}")
            continue
        target = (page.parent / path).resolve()
        if not target.is_relative_to(SITE.resolve()) or not target.is_file():
            errors.append(f"Broken local link: {page.relative_to(SITE)}: {link}")
    if page.parent.parent == SITE / "projects/mods" and 'window.SITE_ROOT="../../../"' not in html:
        errors.append(f"Wrong SITE_ROOT: {page.relative_to(SITE)}")

if errors:
    print("\n".join(errors), file=sys.stderr)
    raise SystemExit(1)
print(f"Checked {len(projects)} projects and {len(list(SITE.rglob('*.html')))} HTML pages")
