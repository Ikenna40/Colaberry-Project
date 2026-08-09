/* Shared rendering, navigation, search, illustrations, copy buttons, and the Ask agent.
   Classic script — reads the global STACK identifier defined in stack.js.
   No ES modules, no fetch() of local files: everything here works from file://. */
(function () {
  "use strict";

  var SECTION_PAGES = {
    "index.html": "Command Center",
    "01-summary.html": "Summary",
    "02-recommendations.html": "Recommendations",
    "03-prompts.html": "Learn-More Prompts",
    "04-learning-order.html": "Learning Order",
    "05-alternatives.html": "Alternatives",
    "06-reversibility.html": "Reversibility",
    "07-not-covered.html": "Not Covered",
    "08-appendix.html": "Appendix"
  };

  function currentPage() {
    var p = location.pathname.split("/").pop();
    return p && SECTION_PAGES[p] ? p : "index.html";
  }

  function findRec(id) {
    return STACK.recommendations.filter(function (r) { return r.id === id; })[0];
  }

  /* ---------------- Theme ---------------- */
  function initTheme() {
    var saved = localStorage.getItem("stack-theme");
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
      localStorage.setItem("stack-theme", next);
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

    add("Summary", "01-summary.html", "fit-key", "Fit rating key", STACK.ratingLegend.map(function (l) { return l.icon + " " + l.label + " — " + l.meaning; }).join(" "));
    add("Summary", "01-summary.html", "headline", "Where this stack is most likely to break", STACK.headline);

    STACK.recommendations.forEach(function (r) {
      add("Recommendations", "02-recommendations.html", "rec-" + r.id, r.component + " → " + r.technology, r.why + " " + r.caveat);
    });

    STACK.recommendations.forEach(function (r) {
      add("Learn-More Prompts", "03-prompts.html", "prompt-" + r.id, r.component + " — learn-more prompt", r.prompt);
    });

    STACK.learningOrder.forEach(function (s) {
      var rec = findRec(s.id);
      add("Learning Order", "04-learning-order.html", "learn-" + s.id, "#" + s.rank + " " + (rec ? rec.component : s.id), s.reason);
    });

    STACK.alternatives.forEach(function (a) {
      var rec = findRec(a.id);
      add("Alternatives", "05-alternatives.html", "alt-" + a.id, (rec ? rec.component : a.id) + " — alternative: " + a.alternative, a.whyNot);
    });

    STACK.reversibility.forEach(function (rv) {
      var rec = findRec(rv.id);
      add("Reversibility", "06-reversibility.html", "rev-" + rv.id, (rec ? rec.component : rv.id) + " — " + rv.difficulty + " to undo", rv.reason);
    });

    STACK.notTold.forEach(function (n, i) {
      add("Not Covered", "07-not-covered.html", "notold-" + i, "Not covered", n);
    });

    STACK.topology.forEach(function (t) {
      var rec = findRec(t.id);
      add("Appendix", "08-appendix.html", "topo-" + t.id, (rec ? rec.component : t.id) + " — " + (t.location === "local" ? "runs on your infrastructure" : "runs on somebody else's servers"), t.note);
    });

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

  /* ---------------- Fullscreen expand (zoom / reset / Esc) ---------------- */
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
        if (svg) {
          stage.appendChild(svg.cloneNode(true));
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

  /* ---------------- Copy-ready prompt buttons ---------------- */
  function fallbackCopy(text, cb) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.left = "-9999px"; ta.style.top = "0";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand("copy"); cb(); } catch (e) { /* clipboard unavailable */ }
    document.body.removeChild(ta);
  }

  function initCopyButtons() {
    document.querySelectorAll(".copy-btn[data-copy-ref]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var rec = findRec(btn.getAttribute("data-copy-ref"));
        if (!rec) return;
        var text = rec.prompt;
        var original = btn.textContent;
        function confirmCopied() {
          btn.textContent = "✓ Copied";
          btn.classList.add("copied");
          setTimeout(function () { btn.textContent = original; btn.classList.remove("copied"); }, 1600);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(confirmCopied).catch(function () { fallbackCopy(text, confirmCopied); });
        } else {
          fallbackCopy(text, confirmCopied);
        }
      });
    });
  }

  /* ---------------- SVG illustrations, generated from STACK ---------------- */
  var SVG_NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function fitColor(fit) {
    var map = { green: "--good", yellow: "--warning", red: "--risk" };
    return cssVar(map[fit] || "--muted") || "#999";
  }
  function fitCounts() {
    var c = { green: 0, yellow: 0, red: 0 };
    STACK.recommendations.forEach(function (r) { c[r.fit]++; });
    return c;
  }
  function groupedRecs() {
    var byGroup = {};
    STACK.groupOrder.forEach(function (g) { byGroup[g.key] = []; });
    STACK.recommendations.forEach(function (r) { byGroup[r.group].push(r); });
    return byGroup;
  }

  /* Required illustration 1: proportional bar of fit ratings, reds called out */
  function renderFitBarSVG(container, small) {
    var counts = fitCounts();
    var total = STACK.recommendations.length;
    var w = small ? 260 : 720, h = small ? 60 : 150;
    var svg = svgEl("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": "Proportional bar of fit ratings across the whole stack, with technologies to consider carefully called out" });
    var barY = small ? h / 2 - 10 : 26;
    var barH = small ? 20 : 34;
    var pad = 6;
    var avail = w - pad * 2;
    var order = [["green", "--good"], ["yellow", "--warning"], ["red", "--risk"]];
    var x = pad;
    order.forEach(function (pair) {
      var count = counts[pair[0]];
      if (count === 0) return;
      var segW = (count / total) * avail;
      var color = cssVar(pair[1]) || "#999";
      svg.appendChild(svgEl("rect", { x: x, y: barY, width: Math.max(segW, 1), height: barH, fill: color, rx: 4 }));
      if (!small) {
        var t = svgEl("text", { x: x + segW / 2, y: barY + barH / 2, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": 12, "font-weight": "700", "font-family": "system-ui, sans-serif", fill: "#fff" });
        t.textContent = count;
        svg.appendChild(t);
      }
      x += segW;
    });
    if (!small) {
      var ink = cssVar("--text") || "#0f172a";
      var risk = cssVar("--risk") || "#dc2626";
      var legendY = barY + barH + 26;
      var legendItems = [["🟢 great fit", counts.green], ["🟡 good fit", counts.yellow], ["🔴 consider carefully", counts.red]];
      var lx = pad;
      legendItems.forEach(function (item) {
        var t = svgEl("text", { x: lx, y: legendY, "font-size": 11, "font-family": "system-ui, sans-serif", fill: ink });
        t.textContent = item[0] + " × " + item[1];
        svg.appendChild(t);
        lx += 200;
      });
      var reds = STACK.recommendations.filter(function (r) { return r.fit === "red"; }).map(function (r) { return r.component; });
      if (reds.length) {
        var callout = svgEl("text", { x: pad, y: legendY + 22, "font-size": 11, "font-weight": "700", "font-family": "system-ui, sans-serif", fill: risk });
        callout.textContent = "⚠ Consider carefully: " + reds.join(", ");
        svg.appendChild(callout);
      }
    }
    container.innerHTML = ""; container.appendChild(svg);
  }

  /* Required illustration 2: the whole stack as bands, one per category, coloured by fit */
  function renderStackBandsSVG(container, small) {
    var w = small ? 260 : 760;
    var rowH = small ? 26 : 56;
    var pad = small ? 4 : 12;
    var byGroup = groupedRecs();
    var h = STACK.groupOrder.length * (rowH + pad) + pad;
    var svg = svgEl("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": "The whole stack as bands, one per category, coloured by fit rating" });
    var card = cssVar("--card") || "#fff";
    var ink = cssVar("--text") || "#0f172a";
    var accent = cssVar("--accent") || "#0f766e";

    STACK.groupOrder.forEach(function (group, gi) {
      var y = pad + gi * (rowH + pad);
      svg.appendChild(svgEl("rect", { x: pad, y: y, width: w - pad * 2, height: rowH, rx: 8, fill: card, stroke: accent, "stroke-width": 1.2 }));
      var label = svgEl("text", { x: pad + 8, y: y + rowH / 2, "dominant-baseline": "middle", "font-size": small ? 7 : 10, "font-weight": "700", "font-family": "system-ui, sans-serif", fill: ink });
      label.textContent = small ? group.icon : (group.icon + " " + group.label.toUpperCase());
      svg.appendChild(label);

      var recs = byGroup[group.key];
      var startX = small ? pad + 30 : pad + 170;
      var avail = w - pad - startX - 6;
      var boxW = recs.length ? Math.min(avail / recs.length - 6, small ? 46 : 130) : 0;
      recs.forEach(function (r, ri) {
        var x = startX + ri * (boxW + 6);
        svg.appendChild(svgEl("rect", { x: x, y: y + 6, width: Math.max(boxW, 2), height: rowH - 12, rx: 5, fill: fitColor(r.fit), opacity: 0.85 }));
        if (!small) {
          var t = svgEl("text", { x: x + boxW / 2, y: y + rowH / 2, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": 8, "font-family": "system-ui, sans-serif", fill: "#fff" });
          t.textContent = r.short.length > 15 ? r.short.slice(0, 14) + "…" : r.short;
          svg.appendChild(t);
        }
      });
    });
    container.innerHTML = ""; container.appendChild(svg);
  }

  /* Required illustration 3: what runs on your infrastructure vs. somebody else's servers */
  function renderTopologySVG(container, small) {
    var w = small ? 260 : 720, h = small ? 90 : 230;
    var svg = svgEl("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": "What runs on Colaberry's own infrastructure versus somebody else's servers" });
    var local = STACK.topology.filter(function (t) { return t.location === "local"; });
    var hosted = STACK.topology.filter(function (t) { return t.location === "hosted"; });
    var colW = w / 2 - 12;
    var accent = cssVar("--accent") || "#0f766e";
    var warning = cssVar("--warning") || "#d97706";
    var card = cssVar("--card") || "#fff";
    var ink = cssVar("--text") || "#0f172a";

    svg.appendChild(svgEl("rect", { x: 4, y: 4, width: colW, height: h - 8, rx: 10, fill: card, stroke: accent, "stroke-width": 1.5 }));
    svg.appendChild(svgEl("rect", { x: w / 2 + 8, y: 4, width: colW, height: h - 8, rx: 10, fill: card, stroke: warning, "stroke-width": 1.5 }));

    var headerY = small ? 14 : 20;
    var h1 = svgEl("text", { x: 4 + colW / 2, y: headerY, "text-anchor": "middle", "font-size": small ? 7 : 11, "font-weight": "700", "font-family": "system-ui, sans-serif", fill: accent });
    h1.textContent = small ? "Your infra" : "Your own infrastructure";
    svg.appendChild(h1);
    var h2 = svgEl("text", { x: w / 2 + 8 + colW / 2, y: headerY, "text-anchor": "middle", "font-size": small ? 7 : 11, "font-weight": "700", "font-family": "system-ui, sans-serif", fill: warning });
    h2.textContent = small ? "Someone else's" : "Somebody else's servers";
    svg.appendChild(h2);

    function layoutList(items, colX) {
      var itemH = small ? 11 : 22;
      var startY = headerY + (small ? 8 : 16);
      items.forEach(function (item, i) {
        var rec = findRec(item.id);
        var y = startY + i * (itemH + 4);
        if (y + itemH > h - 6) return;
        svg.appendChild(svgEl("rect", { x: colX + 8, y: y, width: colW - 16, height: itemH, rx: 4, fill: fitColor(rec ? rec.fit : "green"), opacity: 0.22 }));
        if (!small) {
          var t = svgEl("text", { x: colX + 14, y: y + itemH / 2, "dominant-baseline": "middle", "font-size": 9, "font-family": "system-ui, sans-serif", fill: ink });
          t.textContent = rec ? rec.short : item.id;
          svg.appendChild(t);
        }
      });
    }
    layoutList(local, 4);
    layoutList(hosted, w / 2 + 8);

    container.innerHTML = ""; container.appendChild(svg);
  }

  /* Required illustration 4: learning ladder, ascending by rank */
  function renderLearningLadderSVG(container, small) {
    var steps = STACK.learningOrder.slice().sort(function (a, b) { return a.rank - b.rank; });
    var n = steps.length;
    var w = small ? 260 : 760, h = small ? 90 : 230;
    var svg = svgEl("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": "What to learn first, as an ascending ladder" });
    var pad = 6;
    var stepW = (w - pad * 2) / n;
    var accent = cssVar("--accent") || "#0f766e";
    var ink = cssVar("--text") || "#0f172a";
    var maxStepH = h - pad * 2 - (small ? 0 : 40);
    steps.forEach(function (s, i) {
      var rec = findRec(s.id);
      var stepH = ((i + 1) / n) * maxStepH;
      var x = pad + i * stepW;
      var y = h - pad - stepH - (small ? 0 : 30);
      svg.appendChild(svgEl("rect", { x: x, y: y, width: Math.max(stepW - 4, 2), height: stepH, rx: 3, fill: accent, opacity: 0.25 + (i / n) * 0.55 }));
      var numT = svgEl("text", { x: x + stepW / 2, y: y - 4, "text-anchor": "middle", "font-size": small ? 7 : 10, "font-weight": "700", "font-family": "system-ui, sans-serif", fill: accent });
      numT.textContent = s.rank;
      svg.appendChild(numT);
      if (!small) {
        var name = rec ? rec.short : s.id;
        var label = svgEl("text", { x: x + stepW / 2, y: h - pad - 6, "text-anchor": "end", "font-size": 7, "font-family": "system-ui, sans-serif", fill: ink });
        label.textContent = name.length > 13 ? name.slice(0, 12) + "…" : name;
        label.setAttribute("transform", "rotate(-38 " + (x + stepW / 2) + " " + (h - pad - 6) + ")");
        svg.appendChild(label);
      }
    });
    container.innerHTML = ""; container.appendChild(svg);
  }

  /* Required illustration 5: lock-in scale, easy to hard to undo */
  function renderLockInScaleSVG(container, small) {
    var w = small ? 260 : 760, h = small ? 60 : 210;
    var svg = svgEl("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": "How hard each decision is to undo, from easy to hard" });
    var pad = 24;
    var trackY = small ? h / 2 : 38;
    var ink = cssVar("--text") || "#0f172a";
    var good = cssVar("--good") || "#16a34a";
    var warn = cssVar("--warning") || "#d97706";
    var risk = cssVar("--risk") || "#dc2626";
    var border = cssVar("--border") || "#e2e8f0";
    svg.appendChild(svgEl("line", { x1: pad, y1: trackY, x2: w - pad, y2: trackY, stroke: border, "stroke-width": 3 }));

    var xFor = { easy: pad + (w - pad * 2) * 0.15, medium: pad + (w - pad * 2) * 0.5, hard: pad + (w - pad * 2) * 0.85 };
    var colorFor = { easy: good, medium: warn, hard: risk };

    if (!small) {
      [["Easy to undo", xFor.easy, good], ["Medium", xFor.medium, warn], ["Hard to undo", xFor.hard, risk]].forEach(function (item) {
        var t = svgEl("text", { x: item[1], y: trackY - 14, "text-anchor": "middle", "font-size": 9, "font-weight": "700", "font-family": "system-ui, sans-serif", fill: item[2] });
        t.textContent = item[0];
        svg.appendChild(t);
      });
    }

    var byDifficulty = { easy: 0, medium: 0, hard: 0 };
    STACK.reversibility.forEach(function (rev) {
      var rec = findRec(rev.id);
      var idx = byDifficulty[rev.difficulty]++;
      var cx = xFor[rev.difficulty];
      var cy = trackY + 14 + idx * (small ? 8 : 17);
      var r = small ? 3 : 6;
      svg.appendChild(svgEl("circle", { cx: cx, cy: cy, r: r, fill: colorFor[rev.difficulty] }));
      if (!small) {
        var lbl = svgEl("text", { x: cx + 10, y: cy + 3, "font-size": 8, "font-family": "system-ui, sans-serif", fill: ink });
        lbl.textContent = rec ? rec.short : rev.id;
        svg.appendChild(lbl);
      }
    });
    container.innerHTML = ""; container.appendChild(svg);
  }

  /* Supplementary tile illustration: one prompt marker per technology, coloured by fit */
  function renderPromptsRibbonSVG(container, small) {
    var recs = STACK.recommendations;
    var w = small ? 260 : 780, h = small ? 70 : 130;
    var svg = svgEl("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": "One copy-ready learning prompt per technology" });
    var r = small ? 7 : 13;
    var gap = (w - r * 2 * recs.length) / (recs.length + 1);
    var neutral = cssVar("--muted") || "#64748b";
    var cy = h / 2;
    var x = gap + r;
    var centers = [];
    recs.forEach(function () { centers.push(x); x += r * 2 + gap; });
    for (var i = 0; i < centers.length - 1; i++) {
      svg.appendChild(svgEl("line", { x1: centers[i] + r, y1: cy, x2: centers[i + 1] - r, y2: cy, stroke: neutral, "stroke-width": 1, opacity: 0.4 }));
    }
    recs.forEach(function (rec, i) {
      svg.appendChild(svgEl("circle", { cx: centers[i], cy: cy, r: r, fill: fitColor(rec.fit) }));
      if (!small) {
        var t = svgEl("text", { x: centers[i], y: cy, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": 9, "font-weight": "700", fill: "#fff", "font-family": "system-ui, sans-serif" });
        t.textContent = "✎";
        svg.appendChild(t);
      }
    });
    container.innerHTML = ""; container.appendChild(svg);
  }

  /* Supplementary tile illustration: chosen stack branching away from alternatives not picked */
  function renderAlternativesForkSVG(container, small) {
    var w = small ? 260 : 640, h = small ? 90 : 230;
    var svg = svgEl("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": "Alternatives considered and not chosen" });
    var accent = cssVar("--accent") || "#0f766e";
    var neutral = cssVar("--muted") || "#64748b";
    var ink = cssVar("--text") || "#0f172a";
    var chosenX = 10, chosenY = h / 2 - (small ? 8 : 14), chosenW = small ? 44 : 108, chosenH = small ? 18 : 30;
    svg.appendChild(svgEl("rect", { x: chosenX, y: chosenY, width: chosenW, height: chosenH, rx: 5, fill: accent }));
    if (!small) {
      var ct = svgEl("text", { x: chosenX + chosenW / 2, y: chosenY + chosenH / 2, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": 8, "font-weight": "700", fill: "#fff", "font-family": "system-ui, sans-serif" });
      ct.textContent = "Chosen stack";
      svg.appendChild(ct);
    }
    var n = STACK.alternatives.length;
    var altX = chosenX + chosenW + (small ? 36 : 96);
    var altW = small ? 40 : 100, altH = small ? 9 : 15;
    var stepY = (h - 16) / n;
    for (var i = 0; i < n; i++) {
      var y = 8 + i * stepY;
      svg.appendChild(svgEl("line", { x1: chosenX + chosenW, y1: chosenY + chosenH / 2, x2: altX, y2: y + altH / 2, stroke: neutral, "stroke-width": 1, opacity: 0.35 }));
      svg.appendChild(svgEl("rect", { x: altX, y: y, width: altW, height: altH, rx: 3, fill: neutral, opacity: 0.28 }));
    }
    if (!small) {
      var lbl = svgEl("text", { x: altX, y: h - 4, "font-size": 9, "font-family": "system-ui, sans-serif", fill: ink });
      lbl.textContent = n + " alternatives considered and not chosen";
      svg.appendChild(lbl);
    }
    container.innerHTML = ""; container.appendChild(svg);
  }

  /* Supplementary tile illustration: redacted lines representing what's not covered */
  function renderNotToldLinesSVG(container, small) {
    var items = STACK.notTold;
    var w = small ? 260 : 640, h = small ? 90 : 210;
    var svg = svgEl("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": "What this document does not tell you" });
    var muted = cssVar("--muted") || "#64748b";
    var ink = cssVar("--text") || "#0f172a";
    var rowH = (h - 16) / items.length;
    items.forEach(function (item, i) {
      var y = 8 + i * rowH + rowH / 2 - 4;
      var barW = w * (0.45 + (i % 3) * 0.16);
      svg.appendChild(svgEl("rect", { x: 10, y: y, width: Math.min(barW, w - 20), height: 8, rx: 4, fill: muted, opacity: 0.35 }));
    });
    if (!small) {
      var t = svgEl("text", { x: 10, y: h - 6, "font-size": 9, "font-family": "system-ui, sans-serif", fill: ink });
      t.textContent = items.length + " things this document does not cover";
      svg.appendChild(t);
    }
    container.innerHTML = ""; container.appendChild(svg);
  }

  function renderReversibilityGrid(container) {
    var labels = { easy: "Easy", medium: "Medium", hard: "Hard" };
    container.style.gridTemplateColumns = "170px 110px 1fr";
    var html = '<div class="rev-cell rev-head">Technology</div><div class="rev-cell rev-head">To undo</div><div class="rev-cell rev-head" style="text-align:left">Why</div>';
    STACK.reversibility.forEach(function (rv) {
      var rec = findRec(rv.id);
      html += '<div class="rev-cell rev-head" style="text-align:left">' + escapeHtml(rec ? rec.component : rv.id) + '</div>';
      html += '<div class="rev-cell ' + rv.difficulty + '">' + labels[rv.difficulty] + '</div>';
      html += '<div class="rev-cell" style="text-align:left">' + escapeHtml(rv.reason) + '</div>';
    });
    container.innerHTML = html;
  }

  function renderCounts() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var key = el.getAttribute("data-count");
      var fc = fitCounts();
      var revCounts = { easy: 0, medium: 0, hard: 0 };
      STACK.reversibility.forEach(function (rv) { revCounts[rv.difficulty]++; });
      var topoCounts = { local: 0, hosted: 0 };
      STACK.topology.forEach(function (t) { topoCounts[t.location]++; });
      var map = {
        fitBreakdown: fc.green + " great · " + fc.yellow + " good · " + fc.red + " to watch",
        recommendations: STACK.recommendations.length + " recommendations",
        prompts: STACK.recommendations.length + " copy-ready prompts",
        learningSteps: STACK.learningOrder.length + " things to learn, in order",
        alternatives: STACK.alternatives.length + " alternatives considered",
        reversibility: revCounts.hard + " hard · " + revCounts.medium + " medium · " + revCounts.easy + " easy to undo",
        notTold: STACK.notTold.length + " things this doc won't tell you",
        topology: topoCounts.hosted + " run elsewhere · " + topoCounts.local + " run on your infra"
      };
      el.textContent = map[key] || "";
    });
  }

  /* ---------------- Ask agent ---------------- */
  var ANTHROPIC_MODELS = ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"];

  function sectionSlice(sectionKey) {
    switch (sectionKey) {
      case "summary": return { ratingLegend: STACK.ratingLegend, headline: STACK.headline };
      case "recommendations": return { groupOrder: STACK.groupOrder, recommendations: STACK.recommendations };
      case "prompts": return { recommendations: STACK.recommendations.map(function (r) { return { component: r.component, technology: r.technology, prompt: r.prompt }; }) };
      case "learning-order": return { learningOrder: STACK.learningOrder, recommendations: STACK.recommendations };
      case "alternatives": return { alternatives: STACK.alternatives, recommendations: STACK.recommendations };
      case "reversibility": return { reversibility: STACK.reversibility, recommendations: STACK.recommendations };
      case "not-covered": return { notTold: STACK.notTold };
      case "appendix": return { topology: STACK.topology, recommendations: STACK.recommendations };
      default: return STACK;
    }
  }

  function initAgent() {
    var toggle = document.getElementById("agent-toggle");
    var panel = document.getElementById("agent-panel");
    if (!toggle || !panel) return;
    var body = document.getElementById("agent-body");
    var modeSearchBtn = document.getElementById("agent-mode-search");
    var modeClaudeBtn = document.getElementById("agent-mode-claude");
    var sectionKey = document.body.getAttribute("data-section") || "index";

    toggle.addEventListener("click", function () { panel.classList.toggle("open"); });
    document.getElementById("agent-close").addEventListener("click", function () { panel.classList.remove("open"); });

    function renderSearchMode() {
      body.innerHTML =
        '<label for="agent-q">Ask a question — searched locally, no key needed</label>'
        + '<input id="agent-q" type="text" placeholder="e.g. why is the survey tool rated red?">'
        + '<button class="agent-run" id="agent-run-search">Search</button>'
        + '<div class="agent-answer" id="agent-answer"></div>';
      document.getElementById("agent-run-search").addEventListener("click", function () {
        var q = document.getElementById("agent-q").value;
        var hits = search(q, { limit: 6 });
        var out = document.getElementById("agent-answer");
        if (!q.trim()) { out.innerHTML = ""; return; }
        if (hits.length === 0) {
          out.innerHTML = '<div class="agent-error">No matches found. That gap may itself be the answer — see <a href="07-not-covered.html#not-told">what this document does not tell you</a>.</div>';
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
      var savedKey = localStorage.getItem("stack-anthropic-key") || "";
      body.innerHTML =
        '<label for="agent-key">Your Anthropic API key (stored only in this browser)</label>'
        + '<input id="agent-key" type="password" value="' + escapeHtml(savedKey) + '" placeholder="sk-ant-...">'
        + '<label for="agent-model">Model</label>'
        + '<select id="agent-model">' + ANTHROPIC_MODELS.map(function (m) { return '<option value="' + m + '"' + (m === "claude-opus-5" ? " selected" : "") + ">" + m + "</option>"; }).join("") + '</select>'
        + '<label for="agent-scope">Scope</label>'
        + '<select id="agent-scope"><option value="section">This section only</option><option value="whole">Whole stack</option></select>'
        + '<label for="agent-q2">Question</label>'
        + '<textarea id="agent-q2" placeholder="Ask anything about this stack..."></textarea>'
        + '<button class="agent-run" id="agent-run-claude">Ask Claude</button>'
        + '<div class="agent-answer" id="agent-answer2"></div>'
        + '<div class="agent-hint">Requires internet + your own key. If this fails, switch to Search mode above — it works offline.</div>';

      document.getElementById("agent-key").addEventListener("change", function (e) {
        localStorage.setItem("stack-anthropic-key", e.target.value.trim());
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

      var data = scope === "whole" ? STACK : sectionSlice(sectionKey);
      var system = "You are answering questions about a technology stack recommendation called '" + STACK.meta.title
        + "'. Answer ONLY using the following stack data. If the answer isn't covered by this data, say so plainly instead of guessing. "
        + "Never argue the user out of a 🔴 'consider carefully' rating that appears in this data — if something is rated 🔴, treat that caution as settled: you may explain the reasoning behind it, but do not suggest the user ignore it or treat it as safe.\n\nSTACK:\n"
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
      modeSearchBtn.classList.add("active"); modeClaudeBtn.classList.remove("active");
      renderSearchMode();
    });
    modeClaudeBtn.addEventListener("click", function () {
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
    initExpandButtons();
    initCopyButtons();
    initAgent();
    renderCounts();

    var pairs = [
      ["illus-fitbar", renderFitBarSVG],
      ["illus-stackbands", renderStackBandsSVG],
      ["illus-prompts", renderPromptsRibbonSVG],
      ["illus-ladder", renderLearningLadderSVG],
      ["illus-fork", renderAlternativesForkSVG],
      ["illus-lockin", renderLockInScaleSVG],
      ["illus-notold", renderNotToldLinesSVG],
      ["illus-topology", renderTopologySVG]
    ];
    pairs.forEach(function (pair) {
      var full = document.getElementById(pair[0]);
      if (full) pair[1](full, false);
      var mini = document.getElementById(pair[0] + "-mini");
      if (mini) pair[1](mini, true);
    });

    var reversibilityEl = document.getElementById("reversibility-grid");
    if (reversibilityEl) renderReversibilityGrid(reversibilityEl);
  });
})();
