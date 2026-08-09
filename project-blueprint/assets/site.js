/* Shared rendering, navigation, search, illustrations, and the Ask agent.
   Classic script — reads the global BLUEPRINT identifier defined in blueprint.js.
   No ES modules, no fetch() of local files: everything here works from file://. */
(function () {
  "use strict";

  var SECTION_PAGES = {
    "index.html": "Command Center",
    "01-summary.html": "Summary",
    "02-components.html": "Components",
    "03-architecture.html": "How It Fits Together",
    "04-data-flow.html": "Data Flow",
    "05-build-order.html": "Build Order",
    "06-assumptions.html": "Assumptions & Gaps"
  };

  function currentPage() {
    var p = location.pathname.split("/").pop();
    return p && SECTION_PAGES[p] ? p : "index.html";
  }

  /* ---------------- Theme ---------------- */
  function initTheme() {
    var saved = localStorage.getItem("bp-theme");
    if (saved === "dark" || saved === "light") {
      document.documentElement.setAttribute("data-theme", saved);
    }
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    updateThemeLabel(btn);
    btn.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme");
      var isDark = current ? current === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
      var next = isDark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("bp-theme", next);
      updateThemeLabel(btn);
    });
  }
  function updateThemeLabel(btn) {
    var current = document.documentElement.getAttribute("data-theme");
    var isDark = current ? current === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    btn.textContent = isDark ? "☀ Light" : "🌙 Dark";
  }

  /* ---------------- Scroll progress + back to top ---------------- */
  function initScrollChrome() {
    var bar = document.getElementById("scroll-progress");
    var top = document.getElementById("back-to-top");
    function onScroll() {
      var h = document.documentElement;
      var scrolled = h.scrollTop;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (scrolled / max) * 100 : 0;
      if (bar) bar.style.width = pct + "%";
      if (top) top.classList.toggle("show", scrolled > 400);
    }
    document.addEventListener("scroll", onScroll, { passive: true });
    if (top) top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    onScroll();
  }

  /* ---------------- Print ---------------- */
  function initPrint() {
    var btn = document.getElementById("print-btn");
    if (btn) btn.addEventListener("click", function () { window.print(); });
  }

  /* ---------------- Search: tokenizing, stemming, index ---------------- */
  var STOPWORDS = ("a an the and or of to in on for with is are this that it as by from be was were "
    + "at into its it's each every one every's within will would should can could into onto vs").split(" ");

  function stem(word) {
    word = word.toLowerCase();
    if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
    if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
    if (word.length > 4 && word.endsWith("es")) return word.slice(0, -2);
    if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
    return word;
  }

  function tokenize(text) {
    var raw = (text || "").toLowerCase().match(/[a-z0-9']+/g) || [];
    return raw.filter(function (w) { return w.length > 1 && STOPWORDS.indexOf(w) === -1; }).map(stem);
  }

  function buildIndex() {
    var idx = [];
    function add(section, page, anchor, title, text) {
      idx.push({ section: section, page: page, anchor: anchor, title: title, text: text, tokens: tokenize(title + " " + text) });
    }

    add("Summary", "01-summary.html", "idea", "The idea", BLUEPRINT.idea.paragraph);
    add("Summary", "01-summary.html", "must-do-well", "Must do well on day one", BLUEPRINT.idea.mustDoWell);

    BLUEPRINT.components.forEach(function (c) {
      add("Components", "02-components.html", "comp-" + c.id, c.name, c.description + " " + c.why);
    });

    add("How It Fits Together", "03-architecture.html", "flowchart", "How It Fits Together", "System flowchart showing every component and connection: " + BLUEPRINT.components.map(function (c) { return c.name; }).join(", "));

    BLUEPRINT.dataFlowSteps.forEach(function (s) {
      add("Data Flow", "04-data-flow.html", "step-" + s.n, "Step " + s.n, s.text);
    });

    BLUEPRINT.phases.forEach(function (p) {
      add("Build Order", "05-build-order.html", "phase-" + p.id, p.name, p.proves);
    });

    BLUEPRINT.assumptions.forEach(function (a, i) {
      add("Assumptions & Gaps", "06-assumptions.html", "assumption-" + i, "Assumption", a.text + " " + a.impact);
    });
    BLUEPRINT.notCovered.forEach(function (n, i) {
      add("Assumptions & Gaps", "06-assumptions.html", "notcovered-" + i, "Not covered", n);
    });
    add("Assumptions & Gaps", "06-assumptions.html", "open-question", "Open question", BLUEPRINT.openQuestion.text + " " + BLUEPRINT.openQuestion.branchA.detail + " " + BLUEPRINT.openQuestion.branchB.detail);

    return idx;
  }

  var SEARCH_INDEX = buildIndex();

  function search(query, opts) {
    opts = opts || {};
    var qTokens = tokenize(query);
    if (qTokens.length === 0) return [];
    var qLower = query.trim().toLowerCase();
    var scored = SEARCH_INDEX.map(function (entry) {
      var score = 0;
      var titleTokens = tokenize(entry.title);
      qTokens.forEach(function (qt) {
        entry.tokens.forEach(function (t) { if (t === qt) score += 1; });
        titleTokens.forEach(function (t) { if (t === qt) score += 3; });
      });
      if (qLower.length > 2 && (entry.title.toLowerCase().indexOf(qLower) !== -1 || entry.text.toLowerCase().indexOf(qLower) !== -1)) {
        score += 4;
      }
      return { entry: entry, score: score };
    }).filter(function (r) { return r.score > 0; });
    scored.sort(function (a, b) { return b.score - a.score; });
    if (opts.excludePage) scored = scored.filter(function (r) { return r.entry.page !== opts.excludePage; });
    return scored.slice(0, opts.limit || 8).map(function (r) { return r.entry; });
  }

  function snippet(text, query) {
    var idx = text.toLowerCase().indexOf(query.trim().toLowerCase());
    var start = idx > 20 ? idx - 20 : 0;
    var out = (start > 0 ? "…" : "") + text.slice(start, start + 140) + (text.length > start + 140 ? "…" : "");
    return highlight(out, query);
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function highlight(text, query) {
    var escaped = escapeHtml(text);
    var terms = tokenize(query);
    if (terms.length === 0) return escaped;
    var pattern = terms.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|");
    try {
      return escaped.replace(new RegExp("(" + pattern + ")\\w*", "gi"), "<mark>$&</mark>");
    } catch (e) { return escaped; }
  }

  /* ---------------- Nav search box + dropdown + on-page narrowing ---------------- */
  function initSearchBox() {
    var input = document.getElementById("nav-search");
    var results = document.getElementById("nav-search-results");
    if (!input || !results) return;
    var page = currentPage();

    input.addEventListener("input", function () {
      var q = input.value;
      narrowCurrentPage(q);
      if (q.trim().length < 2) { results.classList.remove("open"); results.innerHTML = ""; return; }
      var hits = search(q, { excludePage: page, limit: 8 });
      if (hits.length === 0) {
        results.innerHTML = '<div class="search-empty">No matches in other sections.</div>';
      } else {
        results.innerHTML = hits.map(function (h) {
          return '<a class="search-result" href="' + h.page + "#" + h.anchor + '">'
            + '<div class="sr-section">' + escapeHtml(h.section) + '</div>'
            + '<div class="sr-title">' + escapeHtml(h.title) + '</div>'
            + '<div class="sr-snippet">' + snippet(h.text, q) + '</div>'
            + '</a>';
        }).join("");
      }
      results.classList.add("open");
    });
    document.addEventListener("click", function (e) {
      if (!results.contains(e.target) && e.target !== input) results.classList.remove("open");
    });
    input.addEventListener("keydown", function (e) { if (e.key === "Escape") { results.classList.remove("open"); input.blur(); } });
  }

  function narrowCurrentPage(query) {
    var items = document.querySelectorAll("[data-search-item]");
    if (items.length === 0) return;
    var tokens = tokenize(query);
    items.forEach(function (el) {
      if (tokens.length === 0) { el.classList.remove("search-hidden"); return; }
      var haystack = tokenize(el.getAttribute("data-search-text") || el.textContent);
      var hit = tokens.some(function (t) { return haystack.indexOf(t) !== -1; });
      el.classList.toggle("search-hidden", !hit);
    });
  }

  /* ---------------- Mermaid / Chart.js init + fullscreen expand ---------------- */
  function initDiagrams() {
    var nodes = document.querySelectorAll("[data-diagram]");
    if (nodes.length && window.mermaid) {
      var isDark = (document.documentElement.getAttribute("data-theme") === "dark")
        || (!document.documentElement.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
      mermaid.initialize({ startOnLoad: false, theme: isDark ? "dark" : "default", securityLevel: "strict" });
      nodes.forEach(function (el) {
        var key = el.getAttribute("data-diagram");
        var src = BLUEPRINT.diagrams[key];
        if (src) el.textContent = src;
      });
      try { mermaid.init(undefined, nodes); } catch (e) { nodes.forEach(function (el) { el.textContent = "Diagram failed to render: " + e.message; }); }
    }

    var chartCanvas = document.getElementById("phase-duration-chart");
    if (chartCanvas && window.Chart) {
      var isDark2 = document.documentElement.getAttribute("data-theme") === "dark"
        || (!document.documentElement.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
      var ink = isDark2 ? "#e6edf5" : "#0f172a";
      var accent = isDark2 ? "#2dd4bf" : "#0f766e";
      new Chart(chartCanvas.getContext("2d"), {
        type: "bar",
        data: {
          labels: BLUEPRINT.phases.map(function (p) { return p.name; }),
          datasets: [{ label: "Weeks", data: BLUEPRINT.phases.map(function (p) { return p.weeks; }), backgroundColor: accent }]
        },
        options: {
          indexAxis: "y",
          plugins: { legend: { display: false }, title: { display: true, text: "Phase duration (weeks)", color: ink } },
          scales: {
            x: { ticks: { color: ink, precision: 0 }, grid: { color: isDark2 ? "#223148" : "#e2e8f0" } },
            y: { ticks: { color: ink }, grid: { display: false } }
          }
        }
      });
    }

    initExpandButtons();
  }

  function initExpandButtons() {
    var overlay = document.getElementById("fs-overlay");
    var stage = document.getElementById("fs-stage");
    if (!overlay || !stage) return;
    var scale = 1;
    function applyScale() { stage.style.transform = "scale(" + scale + ")"; }
    function close() { overlay.classList.remove("open"); stage.innerHTML = ""; scale = 1; }

    document.querySelectorAll(".expand-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = document.querySelector(btn.getAttribute("data-target"));
        if (!target) return;
        stage.innerHTML = "";
        scale = 1; applyScale();
        var svg = target.querySelector("svg");
        var canvas = target.tagName === "CANVAS" ? target : target.querySelector("canvas");
        if (svg) {
          stage.appendChild(svg.cloneNode(true));
        } else if (canvas) {
          var img = document.createElement("img");
          img.src = canvas.toDataURL();
          img.alt = "Expanded chart";
          stage.appendChild(img);
        } else {
          stage.appendChild(target.cloneNode(true));
        }
        overlay.classList.add("open");
      });
    });

    document.getElementById("fs-zoom-in").addEventListener("click", function () { scale = Math.min(scale * 1.25, 6); applyScale(); });
    document.getElementById("fs-zoom-out").addEventListener("click", function () { scale = Math.max(scale / 1.25, 0.3); applyScale(); });
    document.getElementById("fs-reset").addEventListener("click", function () { scale = 1; applyScale(); });
    document.getElementById("fs-close").addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && overlay.classList.contains("open")) close(); });
  }

  /* ---------------- SVG illustrations, generated from BLUEPRINT ---------------- */
  var SVG_NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  function renderPipelineSVG(container, small) {
    var w = small ? 260 : 720, h = small ? 90 : 160;
    var svg = svgEl("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": "Three data sources feed a nightly pipeline that produces a ranked list each morning" });
    var boxW = w * 0.26, boxH = h * 0.5, y = (h - boxH) / 2;
    var labels = ["3 outside signals", "Nightly pipeline + AI", "Ranked list each morning"];
    var xs = [w * 0.02, w * 0.37, w * 0.72];
    var accent = cssVar("--accent") || "#0f766e";
    var card = cssVar("--card") || "#fff";
    var border = cssVar("--border") || "#e2e8f0";
    var ink = cssVar("--text") || "#0f172a";
    for (var i = 0; i < 3; i++) {
      svg.appendChild(svgEl("rect", { x: xs[i], y: y, width: boxW, height: boxH, rx: 10, fill: i === 1 ? accent : card, stroke: border }));
      var t = svgEl("text", { x: xs[i] + boxW / 2, y: y + boxH / 2, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": small ? 8 : 13, "font-family": "system-ui, sans-serif", fill: i === 1 ? "#ffffff" : ink });
      t.textContent = labels[i];
      svg.appendChild(t);
      if (i < 2) {
        var ax = xs[i] + boxW, bx = xs[i + 1];
        svg.appendChild(svgEl("line", { x1: ax + 4, y1: h / 2, x2: bx - 4, y2: h / 2, stroke: accent, "stroke-width": 2, "marker-end": "url(#arrow-" + (small ? "s" : "l") + ")" }));
      }
    }
    var defs = svgEl("defs", {});
    var marker = svgEl("marker", { id: "arrow-" + (small ? "s" : "l"), viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" });
    var path = svgEl("path", { d: "M0,0 L10,5 L0,10 z", fill: accent });
    marker.appendChild(path); defs.appendChild(marker); svg.insertBefore(defs, svg.firstChild);
    container.innerHTML = ""; container.appendChild(svg);
  }

  function renderLayeredSVG(container, small) {
    var w = small ? 260 : 760;
    var layerH = small ? 26 : 58;
    var pad = small ? 4 : 12;
    var byLayer = {};
    BLUEPRINT.layerOrder.forEach(function (l) { byLayer[l] = []; });
    BLUEPRINT.components.forEach(function (c) { byLayer[c.layer].push(c); });
    var h = BLUEPRINT.layerOrder.length * (layerH + pad) + pad;
    var svg = svgEl("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": "Components grouped into layers" });
    var colors = { "Frontend": "#2563eb", "Backend": "#64748b", "AI": "#0f766e", "Data & Sources": "#16a34a" };
    var card = cssVar("--card") || "#fff";
    var ink = cssVar("--text") || "#0f172a";

    BLUEPRINT.layerOrder.forEach(function (layer, li) {
      var y = pad + li * (layerH + pad);
      svg.appendChild(svgEl("rect", { x: pad, y: y, width: w - pad * 2, height: layerH, rx: 8, fill: card, stroke: colors[layer] || "#999", "stroke-width": 1.5 }));
      var label = svgEl("text", { x: pad + 8, y: y + layerH / 2, "dominant-baseline": "middle", "font-size": small ? 7 : 10, "font-weight": "700", "font-family": "system-ui, sans-serif", fill: colors[layer] || ink });
      label.textContent = small ? layer : layer.toUpperCase();
      svg.appendChild(label);

      var comps = byLayer[layer];
      var startX = small ? pad + 46 : pad + 130;
      var avail = w - pad - startX - 6;
      var boxW = Math.min(avail / comps.length - 6, small ? 60 : 150);
      comps.forEach(function (c, ci) {
        var x = startX + ci * (boxW + 6);
        svg.appendChild(svgEl("rect", { x: x, y: y + 6, width: boxW, height: layerH - 12, rx: 5, fill: colors[layer] || "#999", opacity: 0.16 }));
        var t = svgEl("text", { x: x + boxW / 2, y: y + layerH / 2, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": small ? 6 : 9, "font-family": "system-ui, sans-serif", fill: ink });
        t.textContent = small ? (c.name.length > 12 ? c.name.slice(0, 11) + "…" : c.name) : c.name;
        svg.appendChild(t);
      });
    });
    container.innerHTML = ""; container.appendChild(svg);
  }

  function renderRibbonSVG(container, small) {
    var steps = BLUEPRINT.dataFlowSteps;
    var w = small ? 260 : 780, h = small ? 70 : 130;
    var svg = svgEl("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": "Data flow steps, highlighting which ones the AI layer touches" });
    var r = small ? 8 : 16;
    var gap = (w - r * 2 * steps.length) / (steps.length + 1);
    var accent = cssVar("--accent") || "#0f766e";
    var neutral = cssVar("--muted") || "#64748b";
    var ink = cssVar("--text") || "#0f172a";
    var cy = h / 2;
    var x = gap + r;
    var centers = [];
    steps.forEach(function () { centers.push(x); x += r * 2 + gap; });
    for (var i = 0; i < centers.length - 1; i++) {
      svg.appendChild(svgEl("line", { x1: centers[i] + r, y1: cy, x2: centers[i + 1] - r, y2: cy, stroke: neutral, "stroke-width": 2, opacity: 0.5 }));
    }
    steps.forEach(function (s, i) {
      var color = s.aiTouch ? accent : neutral;
      svg.appendChild(svgEl("circle", { cx: centers[i], cy: cy, r: r, fill: color }));
      var t = svgEl("text", { x: centers[i], y: cy, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": small ? 7 : 12, "font-weight": "700", fill: "#fff", "font-family": "system-ui, sans-serif" });
      t.textContent = s.n;
      svg.appendChild(t);
      if (!small) {
        var lbl = svgEl("text", { x: centers[i], y: cy + r + 16, "text-anchor": "middle", "font-size": 8, fill: ink, "font-family": "system-ui, sans-serif" });
        lbl.textContent = s.aiTouch ? "AI step" : "";
        svg.appendChild(lbl);
      }
    });
    container.innerHTML = ""; container.appendChild(svg);
  }

  function renderTimelineSVG(container, small) {
    var phases = BLUEPRINT.phases;
    var totalWeeks = Math.max.apply(null, phases.map(function (p) { return p.startWeek + p.weeks; }));
    var w = small ? 260 : 760, h = small ? 70 : 140;
    var svg = svgEl("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": "Build phases as a proportional timeline, with the make-or-break phase highlighted" });
    var rowH = (h - 10) / phases.length;
    var accent = cssVar("--accent") || "#0f766e";
    var neutral = cssVar("--border") || "#e2e8f0";
    var ink = cssVar("--text") || "#0f172a";
    phases.forEach(function (p, i) {
      var y = 5 + i * rowH;
      var x = (p.startWeek / totalWeeks) * (w - 10) + 5;
      var barW = (p.weeks / totalWeeks) * (w - 10);
      svg.appendChild(svgEl("rect", { x: x, y: y + 2, width: Math.max(barW, 2), height: rowH - 8, rx: 4, fill: p.makeOrBreak ? accent : neutral }));
      if (!small) {
        var t = svgEl("text", { x: x + 4, y: y + rowH / 2 - 2, "dominant-baseline": "middle", "font-size": 9, "font-family": "system-ui, sans-serif", fill: p.makeOrBreak ? "#fff" : ink });
        t.textContent = p.name + (p.makeOrBreak ? "  ★ make-or-break" : "");
        svg.appendChild(t);
      }
    });
    container.innerHTML = ""; container.appendChild(svg);
  }

  function renderNodeGraphMini(container) {
    var ids = [];
    BLUEPRINT.edges.forEach(function (e) { e.forEach(function (id) { if (ids.indexOf(id) === -1) ids.push(id); }); });
    var w = 260, h = 90, cx = w / 2, cy = h / 2, r = 34;
    var pos = {};
    ids.forEach(function (id, i) {
      var angle = (i / ids.length) * Math.PI * 2 - Math.PI / 2;
      pos[id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) * 0.75 };
    });
    var svg = svgEl("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": "How the system's components connect" });
    var accent = cssVar("--accent") || "#0f766e";
    var neutral = cssVar("--muted") || "#64748b";
    BLUEPRINT.edges.forEach(function (e) {
      var a = pos[e[0]], b = pos[e[1]];
      svg.appendChild(svgEl("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: accent, "stroke-width": 1, opacity: 0.45 }));
    });
    ids.forEach(function (id) {
      var comp = BLUEPRINT.components.filter(function (c) { return c.id === id; })[0];
      svg.appendChild(svgEl("circle", { cx: pos[id].x, cy: pos[id].y, r: comp ? 5 : 6, fill: comp ? accent : neutral }));
    });
    container.innerHTML = ""; container.appendChild(svg);
  }

  function computeCoverage() {
    var rows = BLUEPRINT.components.map(function (c) {
      var introducedAt = -1;
      BLUEPRINT.phases.forEach(function (p, i) { if (p.introduces.indexOf(c.id) !== -1) introducedAt = i; });
      var cells = BLUEPRINT.phases.map(function (p, i) {
        if (introducedAt === -1) return "deferred";
        if (i < introducedAt) return "deferred";
        if (i === introducedAt) return "built";
        return "active";
      });
      return { component: c, cells: cells };
    });
    return rows;
  }

  function renderCoverageGrid(container) {
    var rows = computeCoverage();
    var cols = BLUEPRINT.phases.length;
    container.style.gridTemplateColumns = "170px repeat(" + cols + ", 1fr)";
    var html = '<div class="cov-cell cov-head">Component</div>' + BLUEPRINT.phases.map(function (p) { return '<div class="cov-cell cov-head">' + escapeHtml(p.name) + "</div>"; }).join("");
    rows.forEach(function (r) {
      html += '<div class="cov-cell cov-head" style="text-align:left">' + escapeHtml(r.component.name) + "</div>";
      html += r.cells.map(function (state) {
        var label = state === "built" ? "Built" : state === "active" ? "Active" : "—";
        return '<div class="cov-cell ' + state + '">' + label + "</div>";
      }).join("");
    });
    container.innerHTML = html;
  }

  function renderCounts() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var key = el.getAttribute("data-count");
      var map = {
        components: BLUEPRINT.components.length + " components",
        connections: 13 + " connections",
        steps: BLUEPRINT.dataFlowSteps.length + " steps",
        phases: BLUEPRINT.phases.length + " phases · " + BLUEPRINT.phases.reduce(function (s, p) { return s + p.weeks; }, 0) + " weeks",
        gaps: BLUEPRINT.assumptions.length + " assumptions · " + BLUEPRINT.notCovered.length + " gaps",
        idea: "1 must-win requirement"
      };
      el.textContent = map[key] || "";
    });
  }

  /* ---------------- Ask agent ---------------- */
  var ANTHROPIC_MODELS = ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"];

  function sectionSlice(sectionKey) {
    switch (sectionKey) {
      case "summary": return { idea: BLUEPRINT.idea };
      case "components": return { components: BLUEPRINT.components };
      case "architecture": return { components: BLUEPRINT.components, flowchart: BLUEPRINT.diagrams.flowchart };
      case "data-flow": return { dataFlowSteps: BLUEPRINT.dataFlowSteps, sequence: BLUEPRINT.diagrams.sequence };
      case "build-order": return { phases: BLUEPRINT.phases, gantt: BLUEPRINT.diagrams.gantt };
      case "assumptions": return { assumptions: BLUEPRINT.assumptions, notCovered: BLUEPRINT.notCovered, openQuestion: BLUEPRINT.openQuestion };
      default: return BLUEPRINT;
    }
  }

  function initAgent() {
    var toggle = document.getElementById("agent-toggle");
    var panel = document.getElementById("agent-panel");
    if (!toggle || !panel) return;
    var body = document.getElementById("agent-body");
    var modeSearchBtn = document.getElementById("agent-mode-search");
    var modeClaudeBtn = document.getElementById("agent-mode-claude");
    var mode = "search";
    var sectionKey = document.body.getAttribute("data-section") || "index";

    toggle.addEventListener("click", function () { panel.classList.toggle("open"); });
    document.getElementById("agent-close").addEventListener("click", function () { panel.classList.remove("open"); });

    function renderSearchMode() {
      body.innerHTML =
        '<label for="agent-q">Ask a question — searched locally, no key needed</label>'
        + '<input id="agent-q" type="text" placeholder="e.g. what happens if a client spans two Basecamp projects?">'
        + '<button class="agent-run" id="agent-run-search">Search</button>'
        + '<div class="agent-answer" id="agent-answer"></div>';
      document.getElementById("agent-run-search").addEventListener("click", function () {
        var q = document.getElementById("agent-q").value;
        var hits = search(q, { limit: 6 });
        var out = document.getElementById("agent-answer");
        if (!q.trim()) { out.innerHTML = ""; return; }
        if (hits.length === 0) {
          out.innerHTML = '<div class="agent-error">No matches found. That gap may itself be the answer — see the <a href="06-assumptions.html#not-covered">What This Design Does Not Cover</a> section.</div>';
        } else {
          out.innerHTML = hits.map(function (h) {
            return '<a class="agent-result-card search-result" href="' + h.page + "#" + h.anchor + '" style="display:block;text-decoration:none;color:inherit;">'
              + '<div class="sr-section">' + escapeHtml(h.section) + '</div>'
              + '<div class="sr-title">' + escapeHtml(h.title) + '</div>'
              + '<div class="sr-snippet">' + snippet(h.text, q) + '</div>'
              + '</a>';
          }).join("");
        }
      });
      document.getElementById("agent-q").addEventListener("keydown", function (e) { if (e.key === "Enter") document.getElementById("agent-run-search").click(); });
    }

    function renderClaudeMode() {
      var savedKey = localStorage.getItem("bp-anthropic-key") || "";
      body.innerHTML =
        '<label for="agent-key">Your Anthropic API key (stored only in this browser)</label>'
        + '<input id="agent-key" type="password" value="' + escapeHtml(savedKey) + '" placeholder="sk-ant-...">'
        + '<label for="agent-model">Model</label>'
        + '<select id="agent-model">' + ANTHROPIC_MODELS.map(function (m) { return '<option value="' + m + '"' + (m === "claude-opus-5" ? " selected" : "") + ">" + m + "</option>"; }).join("") + '</select>'
        + '<label for="agent-scope">Scope</label>'
        + '<select id="agent-scope"><option value="section">This section only</option><option value="whole">Whole blueprint</option></select>'
        + '<label for="agent-q2">Question</label>'
        + '<textarea id="agent-q2" placeholder="Ask anything about this design..."></textarea>'
        + '<button class="agent-run" id="agent-run-claude">Ask Claude</button>'
        + '<div class="agent-answer" id="agent-answer2"></div>'
        + '<div class="agent-hint">Requires internet + your own key. If this fails, switch to Search mode above — it works offline.</div>';

      document.getElementById("agent-key").addEventListener("change", function (e) {
        localStorage.setItem("bp-anthropic-key", e.target.value.trim());
      });

      document.getElementById("agent-run-claude").addEventListener("click", function () {
        runClaude(sectionKey);
      });
    }

    function runClaude(sectionKey) {
      var out = document.getElementById("agent-answer2");
      var key = document.getElementById("agent-key").value.trim();
      var model = document.getElementById("agent-model").value;
      var scope = document.getElementById("agent-scope").value;
      var question = document.getElementById("agent-q2").value.trim();
      if (!key) { out.innerHTML = '<div class="agent-error">Paste your Anthropic API key above first.</div>'; return; }
      if (!question) { out.innerHTML = '<div class="agent-error">Type a question first.</div>'; return; }

      var data = scope === "whole" ? BLUEPRINT : sectionSlice(sectionKey);
      var system = "You are answering questions about a system architecture blueprint called '" + BLUEPRINT.meta.title
        + "'. Answer ONLY using the following blueprint data. If the answer isn't covered by this data, say so plainly instead of guessing.\n\nBLUEPRINT:\n"
        + JSON.stringify(data, null, 2);

      out.innerHTML = '<div class="agent-hint">Asking Claude…</div>';
      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, 30000);

      var payload = { model: model, max_tokens: 16000, system: system, messages: [{ role: "user", content: question }] };
      if (model === "claude-opus-5" || model === "claude-sonnet-5") payload.output_config = { effort: "low" };

      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify(payload)
      }).then(function (res) {
        clearTimeout(timeout);
        if (!res.ok) {
          return res.text().then(function () {
            var msg = res.status === 401 ? "Invalid API key — check the key you pasted."
              : res.status === 429 ? "Rate limited by Anthropic — wait a moment and try again."
              : "Request failed (HTTP " + res.status + ").";
            throw new Error(msg);
          });
        }
        return res.json();
      }).then(function (data) {
        if (data.stop_reason === "refusal") {
          out.innerHTML = '<div class="agent-error">Claude declined to answer this request. Try Search mode instead.</div>';
          return;
        }
        var text = (data.content || []).filter(function (b) { return b.type === "text"; }).map(function (b) { return b.text; }).join("\n\n");
        out.innerHTML = '<div class="agent-answer-text">' + escapeHtml(text).replace(/\n/g, "<br>") + "</div>";
      }).catch(function (err) {
        clearTimeout(timeout);
        var msg = err.name === "AbortError" ? "Request timed out after 30 seconds." : err.message;
        out.innerHTML = '<div class="agent-error">' + escapeHtml(msg) + ' You can switch to Search mode, which works with no key and no network.</div>';
      });
    }

    modeSearchBtn.addEventListener("click", function () {
      mode = "search";
      modeSearchBtn.classList.add("active"); modeClaudeBtn.classList.remove("active");
      renderSearchMode();
    });
    modeClaudeBtn.addEventListener("click", function () {
      mode = "claude";
      modeClaudeBtn.classList.add("active"); modeSearchBtn.classList.remove("active");
      renderClaudeMode();
    });
    renderSearchMode();
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initScrollChrome();
    initPrint();
    initSearchBox();
    initDiagrams();
    initAgent();
    renderCounts();

    var pipelineEl = document.getElementById("illus-pipeline");
    if (pipelineEl) renderPipelineSVG(pipelineEl, false);
    var pipelineMiniEl = document.getElementById("illus-pipeline-mini");
    if (pipelineMiniEl) renderPipelineSVG(pipelineMiniEl, true);

    var layeredEl = document.getElementById("illus-layered");
    if (layeredEl) renderLayeredSVG(layeredEl, false);
    var layeredMiniEl = document.getElementById("illus-layered-mini");
    if (layeredMiniEl) renderLayeredSVG(layeredMiniEl, true);

    var ribbonEl = document.getElementById("illus-ribbon");
    if (ribbonEl) renderRibbonSVG(ribbonEl, false);
    var ribbonMiniEl = document.getElementById("illus-ribbon-mini");
    if (ribbonMiniEl) renderRibbonSVG(ribbonMiniEl, true);

    var timelineEl = document.getElementById("illus-timeline");
    if (timelineEl) renderTimelineSVG(timelineEl, false);
    var timelineMiniEl = document.getElementById("illus-timeline-mini");
    if (timelineMiniEl) renderTimelineSVG(timelineMiniEl, true);

    var graphMiniEl = document.getElementById("illus-graph-mini");
    if (graphMiniEl) renderNodeGraphMini(graphMiniEl);

    var coverageEl = document.getElementById("coverage-grid");
    if (coverageEl) renderCoverageGrid(coverageEl);
    var coverageMiniEl = document.getElementById("illus-coverage-mini");
    if (coverageMiniEl) renderCoverageMini(coverageMiniEl);
  });

  function renderCoverageMini(container) {
    var rows = computeCoverage();
    var w = 260, h = 70;
    var svg = svgEl("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": "Coverage grid preview" });
    var cols = BLUEPRINT.phases.length, rowsN = rows.length;
    var cw = w / cols, ch = h / rowsN;
    var colors = { built: "#16a34a", active: "#2563eb", deferred: "#cbd5e1" };
    rows.forEach(function (r, ri) {
      r.cells.forEach(function (state, ci) {
        svg.appendChild(svgEl("rect", { x: ci * cw + 1, y: ri * ch + 1, width: cw - 2, height: ch - 2, rx: 2, fill: colors[state] }));
      });
    });
    container.innerHTML = ""; container.appendChild(svg);
  }
})();
