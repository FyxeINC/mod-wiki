/*
 * Search index for the wiki's client-side search box.
 * Every path is relative to the SITE ROOT (not to the page it's linked from).
 * When you add a new page, add one entry here.
 */
window.WIKI_INDEX = [
  {
    title: "Welcome",
    path: "index.html",
    section: "Home",
    tags: ["overview"],
    excerpt: "Landing page and orientation for the wiki."
  },
  {
    title: "All Projects",
    path: "projects/index.html",
    section: "Projects",
    tags: ["index"],
    excerpt: "Directory of every project tracked in this wiki."
  },
  {
    title: "Project Alpha — Overview",
    path: "projects/project-alpha/index.html",
    section: "Project Alpha",
    tags: ["overview", "active"],
    excerpt: "Purpose, status, and key links for Project Alpha."
  },
  {
    title: "Project Alpha — Getting Started",
    path: "projects/project-alpha/getting-started.html",
    section: "Project Alpha",
    tags: ["setup", "onboarding"],
    excerpt: "Environment setup and first run instructions."
  },
  {
    title: "Project Alpha — Architecture",
    path: "projects/project-alpha/architecture.html",
    section: "Project Alpha",
    tags: ["architecture", "diagram"],
    excerpt: "System diagram, components, and data flow."
  },
  {
    title: "Project Beta — Overview",
    path: "projects/project-beta/index.html",
    section: "Project Beta",
    tags: ["overview", "planning"],
    excerpt: "A second, lighter-weight project page to copy from."
  }
];
