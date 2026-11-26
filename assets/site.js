/* =====================================================================
   SITE SCRIPT
   Reads content.yml and publications.bib and fills in the page.
   To change CONTENT, edit content.yml / publications.bib — not this file.
   Sections below:  1 settings · 2 helpers · 3 homepage · 4 publications
                    · 5 publications page · 6 start-up
   ===================================================================== */

(() => {

  /* ---------- 1. Settings ---------- */

  const CONTENT_FILE      = "content.yml";
  const PUBLICATIONS_FILE = "publications.bib";
  const NEWS_SHOWN        = 6;   // news items visible before "Older news"
  const RECENT_PAPERS     = 5;   // papers on the homepage (if none are marked selected)

  const TYPE_LABELS = { journal: "Journal", conference: "Conference", preprint: "Preprint",
                        patent: "Patent", other: "Other" };


  /* ---------- 2. Helpers ---------- */

  const byId = id => document.getElementById(id);

  // Put HTML into an element (if it exists on this page)
  function fill(id, html) {
    const el = byId(id);
    if (el) el.innerHTML = html;
    return el;
  }

  function hide(id) {
    const el = byId(id);
    if (el) el.hidden = true;
  }

  // Make text safe to put inside HTML
  function escapeHtml(text) {
    return String(text ?? "").replace(/[&<>"']/g, ch =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  // Tiny Markdown: [text](url), **bold**, *italic*
  function markdown(text) {
    return escapeHtml(text)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) =>
        /^https?:/.test(url)
          ? `<a href="${url}" target="_blank" rel="noopener">${label}</a>`
          : `<a href="${url}">${label}</a>`)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  }

  // Blank-line-separated text → paragraphs
  function paragraphs(text = "") {
    return text.trim().split(/\n\s*\n/).map(p => `<p>${markdown(p.trim())}</p>`).join("");
  }

  function externalLink(label, url) {
    return url
      ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`
      : escapeHtml(label);
  }

  // Icons come from assets/icons.js
  function icon(name) {
    const svg = window.ICONS?.[name];
    if (!svg) return "";
    const [viewBox, path] = svg;
    return `<svg class="icon" viewBox="${viewBox}" aria-hidden="true"><path fill="currentColor" d="${path}"/></svg>`;
  }

  // The email is stored reversed + base64 (see README). It is decoded only
  // when someone clicks the button, so it never sits in the page for bots.
  function decodeEmail(code) {
    try { return atob(code).split("").reverse().join(""); }
    catch { return ""; }
  }

  async function download(url) {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) throw new Error(`${url} (${response.status})`);
    return { text: await response.text(), modified: response.headers.get("Last-Modified") };
  }


  /* ---------- 3. Homepage sections ---------- */

  function renderIntro(c) {
    const photo = byId("photo");
    if (photo && c.photo) { photo.src = c.photo; photo.alt = `Photo of ${c.name}`; }

    fill("name", escapeHtml(`${c.prefix ? c.prefix + " " : ""}${c.name}`));
    fill("tagline", markdown(c.tagline || "") +
      (c.location ? ` <span aria-hidden="true">·</span> ${escapeHtml(c.location)}` : ""));

    const items = [];
    if (c.email_code) items.push(`<li><button type="button" class="primary" id="email-button">${icon("email")}<span>Email me</span></button></li>`);
    if (c.cv)         items.push(`<li><a href="${escapeHtml(c.cv)}" target="_blank" rel="noopener">${icon("cv")}<span>CV</span></a></li>`);
    for (const link of c.links || []) {
      items.push(`<li><a href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${icon(link.icon)}<span>${escapeHtml(link.label)}</span></a></li>`);
    }
    fill("links", items.join(""));

    byId("email-button")?.addEventListener("click", event => {
      const address = decodeEmail(c.email_code);
      if (!address) return;
      const shown = document.createElement("a");
      shown.href = `mailto:${address}`;
      shown.innerHTML = icon("email");
      shown.append(` ${address}`);
      event.currentTarget.replaceWith(shown);
      window.location.href = shown.href;
    });

    fill("bio", paragraphs(c.bio));
    if (c.interests?.length) {
      fill("interests", c.interests.map(i => `<li>${escapeHtml(i)}</li>`).join(""));
    }
  }

  // One row of a date-on-the-left list
  function datedRow(date, body) {
    const isNew = String(date).toLowerCase() === "new";
    return `<li><div class="date${isNew ? " new" : ""}">${escapeHtml(date || "")}</div><div>${body}</div></li>`;
  }

  function renderNews(news = []) {
    if (!news.length) return hide("news");
    const row = n => datedRow(n.date, markdown(n.text));
    fill("news-list", news.slice(0, NEWS_SHOWN).map(row).join(""));
    const older = news.slice(NEWS_SHOWN);
    if (older.length) {
      fill("news-older", `<details class="more"><summary>Older news (${older.length})</summary>
        <ul class="dated">${older.map(row).join("")}</ul></details>`);
    }
  }

  function renderPositions(id, list = []) {
    if (!list.length) return hide(id);
    fill(`${id}-list`, list.map(x => datedRow(x.dates,
      `<div class="title">${escapeHtml(x.role || x.degree)}</div>
       <div class="where">${externalLink(x.org, x.url)}</div>
       ${x.details ? `<div class="detail">${markdown(x.details)}</div>` : ""}`)).join(""));
  }

  function bulletGroup(group) {
    return `<h3>${markdown(group.heading)}</h3>
      <ul class="bullets">${(group.items || []).map(i => `<li>${markdown(i)}</li>`).join("")}</ul>`;
  }

  function renderTeaching(teaching = [], mentoring) {
    if (teaching.length) fill("teaching-body", teaching.map(bulletGroup).join(""));
    else hide("teaching");

    if (!mentoring) return hide("mentoring");
    const groups = mentoring.groups || [];
    // Count people: each link is one person; items without links count as one
    const count = groups.flatMap(g => g.items || [])
                        .reduce((n, item) => n + ((item.match(/\]\(/g) || []).length || 1), 0);
    fill("mentoring-body", `${mentoring.intro ? `<p>${markdown(mentoring.intro)}</p>` : ""}
      <details class="more"><summary>Show students (${count})</summary>
      ${groups.map(bulletGroup).join("")}</details>`);
  }

  function renderTalks(talks = []) {
    if (!talks.length) return hide("talks");
    fill("talks-list", talks.map(t => datedRow(t.date,
      `<div class="title">${t.kind ? escapeHtml(t.kind) + ": " : ""}“${t.slides ? externalLink(t.title, t.slides) : escapeHtml(t.title)}”</div>
       <div class="where">${escapeHtml(t.event || "")}${t.place ? ", " + escapeHtml(t.place) : ""}</div>`)).join(""));
  }

  function renderHonors(c) {
    if (c.honors?.length)  fill("honors-list",  c.honors.map(h => datedRow(h.date, markdown(h.text))).join(""));
    else hide("honors");
    if (c.patents?.length) fill("patents-list", c.patents.map(p => `<li>${markdown(p.text)}</li>`).join(""));
    else hide("patents");
    if (c.service?.length) fill("service-list", c.service.map(s => datedRow(s.heading, markdown(s.text))).join(""));
    else hide("service");
  }


  /* ---------- 4. Publications (used on both pages) ---------- */

  function paperHtml(paper, index, myNames) {
    const mine = myNames.map(n => n.toLowerCase());
    const authors = paper.authors
      .map(a => mine.includes(a.toLowerCase()) ? `<span class="me">${escapeHtml(a)}</span>` : escapeHtml(a))
      .join(", ");

    const mainLink = paper.doi ? `https://doi.org/${paper.doi}`
                   : paper.url || (paper.arxiv ? `https://arxiv.org/abs/${paper.arxiv}` : "");
    const title = mainLink ? externalLink(paper.title, mainLink) : escapeHtml(paper.title);

    const buttons = [
      paper.pdf     && externalLink("PDF", paper.pdf),
      paper.arxiv   && externalLink("arXiv", `https://arxiv.org/abs/${paper.arxiv}`),
      paper.doi     ? externalLink("DOI", `https://doi.org/${paper.doi}`) : (paper.url && externalLink("Link", paper.url)),
      paper.code    && externalLink("Code", paper.code),
      paper.project && externalLink("Project", paper.project),
      paper.slides  && externalLink("Slides", paper.slides),
      paper.video   && externalLink("Video", paper.video),
      paper.abstract && `<button type="button" data-opens="paper${index}-abstract" aria-expanded="false">Abstract</button>`,
      `<button type="button" data-opens="paper${index}-bibtex" aria-expanded="false">BibTeX</button>`,
    ].filter(Boolean).join("");

    const venue = [paper.venue, paper.extras, paper.year || ""].filter(Boolean).map(escapeHtml).join(", ");
    const searchText = `${paper.title} ${paper.authors.join(" ")} ${paper.venue} ${paper.year}`.toLowerCase();

    return `<li class="pub" data-type="${paper.type}" data-search="${escapeHtml(searchText)}">
      <div class="pub-title">${title}</div>
      <div class="pub-authors">${authors}</div>
      <div class="pub-venue"><span class="pub-type">${TYPE_LABELS[paper.type] || "Other"}</span>${venue}</div>
      ${paper.award ? `<div class="pub-award">${escapeHtml(paper.award)}</div>` : ""}
      <div class="pub-buttons">${buttons}</div>
      ${paper.abstract ? `<div class="pub-panel abstract" id="paper${index}-abstract" hidden>${escapeHtml(paper.abstract)}</div>` : ""}
      <div class="pub-panel" id="paper${index}-bibtex" hidden><pre><button type="button" class="copy">Copy</button><code>${escapeHtml(paper.bibtex)}</code></pre></div>
    </li>`;
  }

  // Abstract / BibTeX toggles and the Copy button
  function enablePaperButtons(container) {
    container.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button) return;

      if (button.dataset.opens) {
        const panel = byId(button.dataset.opens);
        const opening = panel.hidden;
        for (const other of button.parentNode.querySelectorAll("[data-opens]")) {
          other.setAttribute("aria-expanded", "false");
          byId(other.dataset.opens).hidden = true;
        }
        panel.hidden = !opening;
        button.setAttribute("aria-expanded", String(opening));
      }

      if (button.classList.contains("copy")) {
        const text = button.parentNode.querySelector("code").textContent;
        navigator.clipboard?.writeText(text).then(() => {
          button.textContent = "Copied";
          setTimeout(() => (button.textContent = "Copy"), 1500);
        }).catch(() => {});
      }
    });
  }

  function renderHomePapers(papers, myNames) {
    if (!papers.length) return hide("publications");
    const selected = papers.filter(p => p.selected);
    const shown = selected.length ? selected : papers.slice(0, RECENT_PAPERS);
    if (selected.length) fill("publications-heading", "Selected Publications");
    enablePaperButtons(fill("publications-list", shown.map((p, i) => paperHtml(p, i, myNames)).join("")));
    fill("publications-all", `<a href="publications.html">All ${papers.length} publications →</a>`);
  }


  /* ---------- 5. Publications page (filters + search) ---------- */

  function renderPublicationsPage(papers, myNames) {
    const list = byId("paper-list");
    const search = byId("paper-search");
    let currentType = "all";

    // Filter buttons, only for types that exist
    const types = ["all", ...Object.keys(TYPE_LABELS).filter(t => papers.some(p => p.type === t))];
    fill("paper-filters", types.map(t => {
      const n = t === "all" ? papers.length : papers.filter(p => p.type === t).length;
      return `<button type="button" data-type="${t}" aria-pressed="${t === "all"}">${t === "all" ? "All" : TYPE_LABELS[t]} (${n})</button>`;
    }).join(""));

    // Papers grouped by year
    const years = [...new Set(papers.map(p => p.year))];
    list.innerHTML = years.map(year => `
      <div class="year-group">
        <h2 class="year">${year || "Undated"}</h2>
        <ul class="pubs">${papers.map((p, i) => p.year === year ? paperHtml(p, i, myNames) : "").join("")}</ul>
      </div>`).join("");
    enablePaperButtons(list);

    function applyFilters() {
      const words = search.value.toLowerCase().split(/\s+/).filter(Boolean);
      let shown = 0;
      for (const item of list.querySelectorAll(".pub")) {
        const visible = (currentType === "all" || item.dataset.type === currentType)
                     && words.every(w => item.dataset.search.includes(w));
        item.hidden = !visible;
        if (visible) shown++;
      }
      for (const group of list.querySelectorAll(".year-group")) {
        group.hidden = !group.querySelector(".pub:not([hidden])");
      }
      byId("paper-count").textContent = shown === papers.length
        ? `${papers.length} publications` : `Showing ${shown} of ${papers.length}`;
    }

    byId("paper-filters").addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button) return;
      currentType = button.dataset.type;
      for (const b of byId("paper-filters").children) b.setAttribute("aria-pressed", String(b === button));
      applyFilters();
    });
    search.addEventListener("input", applyFilters);
    applyFilters();
  }


  /* ---------- 6. Start-up ---------- */

  // Dark-mode button
  document.querySelector(".theme-toggle")?.addEventListener("click", () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
  });

  // Underline the menu item for the section currently on screen
  function highlightMenuOnScroll() {
    const links = [...document.querySelectorAll('.menu a[href^="#"]')];
    const watcher = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach(a => { const s = byId(a.getAttribute("href").slice(1)); if (s) watcher.observe(s); });
  }

  function renderFooter(c, lastModified) {
    fill("year", new Date().getFullYear());
    fill("footer-icons", (c.links || []).map(l =>
      `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener" title="${escapeHtml(l.label)}" aria-label="${escapeHtml(l.label)}">${icon(l.icon)}</a>`).join(""));
    if (lastModified) {
      const date = new Date(lastModified);
      fill("updated", `Updated ${date.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`);
    }
  }

  async function start() {
    try {
      const [contentFile, bibFile] = await Promise.all([
        download(CONTENT_FILE),
        download(PUBLICATIONS_FILE).catch(() => ({ text: "" })),
      ]);
      const content = jsyaml.load(contentFile.text) || {};
      const papers = BibTeX.load(bibFile.text);
      const myNames = content.my_names || [content.name];

      for (const el of document.querySelectorAll("[data-cv]")) el.href = content.cv;
      renderFooter(content, contentFile.modified);

      if (document.body.dataset.page === "home") {
        renderIntro(content);
        renderNews(content.news);
        renderHomePapers(papers, myNames);
        renderPositions("experience", content.experience);
        renderPositions("education", content.education);
        renderTeaching(content.teaching, content.mentoring);
        renderTalks(content.talks);
        renderHonors(content);
        highlightMenuOnScroll();
      } else {
        renderPublicationsPage(papers, myNames);
      }

      if (location.hash) byId(location.hash.slice(1))?.scrollIntoView();
    } catch (error) {
      console.error(error);
      document.querySelector("main").insertAdjacentHTML("afterbegin",
        `<p class="load-error">Could not load the site content: ${escapeHtml(error.message)}.
         If this happened after an edit, check content.yml for a typo (see README).</p>`);
    }
  }

  start();
})();
