(function navShellModule() {
  "use strict";

  if (window.__CS_NAV_SHELL_READY__) return;
  window.__CS_NAV_SHELL_READY__ = true;

  function normalizePage(pathname) {
    var raw = String(pathname || "").split("/").pop() || "index.html";
    if (!raw || raw === "/") return "index.html";
    return raw.toLowerCase();
  }

  function appBasePath() {
    var path = String((window.location && window.location.pathname) || "");
    var marker = "/WordQuest/";
    var idx = path.indexOf(marker);
    if (idx >= 0) return path.slice(0, idx + marker.length - 1);
    try {
      var baseEl = document.querySelector("base[href]");
      if (baseEl) {
        var baseUrl = new URL(baseEl.getAttribute("href"), window.location.href);
        var basePath = String(baseUrl.pathname || "").replace(/\/+$/, "");
        if (basePath && basePath !== "/") return basePath;
      }
    } catch (_e) {}
    return "";
  }

  function withBase(path) {
    var clean = String(path || "").replace(/^\.?\//, "");
    return appBasePath() + "/" + clean;
  }

  function buildLinks() {
    var links = [
      { href: withBase("index.html"), label: "Home", icon: "⌂", pages: ["", "/", "index.html"] },
      { href: withBase("specialist-hub.html"), label: "Hub", icon: "◫", pages: ["specialist-hub.html", "teacher-hub-v2.html"] },
      { href: withBase("my-students.html"), label: "My Students", icon: "◌", pages: ["my-students.html", "case-management.html", "student-profile.html"] },
      {
        href: withBase("my-activities.html"),
        label: "My Activities",
        icon: "✦",
        pages: [
          "my-activities.html",
          "game-platform.html",
          "word-quest.html",
          "reading-lab.html",
          "sentence-studio.html",
          "sentence-surgery.html",
          "writing-studio.html",
          "number-lab.html",
          "numeracy.html",
          "precision-play.html",
          "decoding-diagnostic.html"
        ]
      },
      { href: withBase("my-workspace.html"), label: "My Workspace", icon: "▣", pages: ["teacher-dashboard.html", "reports.html", "my-workspace.html"] }
    ];
    return links;
  }

  function pageMeta(page) {
    var map = {
      "index.html": { eyebrow: "Platform", title: "Cornerstone MTSS" },
      "specialist-hub.html": { eyebrow: "Daily Command", title: "Specialist Hub" },
      "teacher-hub-v2.html": { eyebrow: "Daily Command", title: "Specialist Hub" },
      "my-students.html": { eyebrow: "Students", title: "My Students" },
      "case-management.html": { eyebrow: "Students", title: "My Students" },
      "student-profile.html": { eyebrow: "Students", title: "Student Profile" },
      "my-workspace.html": { eyebrow: "Workspace", title: "My Workspace" },
      "reports.html": { eyebrow: "Workspace", title: "My Workspace" },
      "my-activities.html": { eyebrow: "Activities", title: "My Activities" },
      "game-platform.html": { eyebrow: "Activities", title: "My Activities" },
      "word-quest.html": { eyebrow: "Practice", title: "Word Quest" },
      "reading-lab.html": { eyebrow: "Practice", title: "Reading Lab" },
      "sentence-studio.html": { eyebrow: "Practice", title: "Sentence Studio" },
      "sentence-surgery.html": { eyebrow: "Practice", title: "Sentence Studio" },
      "writing-studio.html": { eyebrow: "Practice", title: "Writing Studio" },
      "number-lab.html": { eyebrow: "Practice", title: "Number Lab" },
      "numeracy.html": { eyebrow: "Practice", title: "Number Lab" },
      "precision-play.html": { eyebrow: "Practice", title: "Precision Play" },
      "decoding-diagnostic.html": { eyebrow: "Assessment", title: "Decoding Diagnostic" }
    };
    return map[page] || { eyebrow: "Platform", title: "Cornerstone MTSS" };
  }

  function init() {
    if (!document.body || document.getElementById("cs-nav-shell")) return;
    var current = normalizePage(window.location.pathname);
    var meta = pageMeta(current);
    var nav = document.createElement("nav");
    nav.id = "cs-nav-shell";
    nav.className = "cs-nav-shell";
    nav.setAttribute("aria-label", "Global");

    var brand = document.createElement("a");
    brand.className = "cs-nav-brand";
    brand.href = withBase("index.html");
    brand.innerHTML = [
      '<span class="cs-nav-brand-mark" aria-hidden="true"></span>',
      '<span class="cs-nav-brand-copy">',
      '  <span class="cs-nav-brand-eyebrow">' + meta.eyebrow + '</span>',
      '  <strong class="cs-nav-brand-title">' + meta.title + '</strong>',
      '</span>'
    ].join("");
    nav.appendChild(brand);

    var linksWrap = document.createElement("div");
    linksWrap.className = "cs-nav-links";

    buildLinks().forEach(function (item) {
      var link = document.createElement("a");
      link.className = "cs-nav-link";
      link.href = item.href;
      link.innerHTML = '<span class="cs-nav-link-icon" aria-hidden="true">' + item.icon + '</span><span class="cs-nav-link-label">' + item.label + '</span>';
      if (item.pages.indexOf(current) >= 0 || (current === "index.html" && item.label === "Home")) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
      linksWrap.appendChild(link);
    });

    nav.appendChild(linksWrap);
    var glow = document.createElement("div");
    glow.className = "cs-nav-shell-glow";
    glow.setAttribute("aria-hidden", "true");
    nav.appendChild(glow);
    document.body.insertBefore(nav, document.body.firstChild);
    document.body.classList.add("cs-has-nav-shell");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
