/* =====================================================================
   BIBTEX READER
   Turns the text of publications.bib into a list of paper objects.
   You don't need to edit this file to add papers.
   ===================================================================== */

const BibTeX = (() => {

  /* ---------- 1. Split the file into entries ---------- */

  function parse(text) {
    const entries = [];
    let pos = 0;

    while (pos < text.length) {
      const at = text.indexOf("@", pos);
      if (at === -1) break;

      const header = /^@\s*(\w+)\s*[{(]/.exec(text.slice(at));
      if (!header) { pos = at + 1; continue; }

      const type = header[1].toLowerCase();
      pos = at + header[0].length;

      // Skip @comment, @string and @preamble blocks
      if (["comment", "string", "preamble"].includes(type)) {
        pos = skipToClosingBrace(text, pos);
        continue;
      }

      const comma = text.indexOf(",", pos);
      const key = text.slice(pos, comma).trim();
      pos = comma + 1;

      const fields = {};
      while (pos < text.length) {
        while (/[\s,]/.test(text[pos])) pos++;           // skip spaces/commas
        if (text[pos] === "}" || text[pos] === ")") { pos++; break; }

        const name = /^([\w-]+)\s*=\s*/.exec(text.slice(pos));
        if (!name) { pos = skipToClosingBrace(text, pos); break; }
        pos += name[0].length;

        const { value, end } = readValue(text, pos);
        fields[name[1].toLowerCase()] = value.replace(/\s+/g, " ").trim();
        pos = end;
      }

      entries.push({ type, key, fields, raw: text.slice(at, pos).trim() });
    }
    return entries;
  }

  // A value is {in braces}, "in quotes", or a bare word/number.
  function readValue(text, pos) {
    if (text[pos] === "{") {
      let depth = 0, i = pos;
      for (; i < text.length; i++) {
        if (text[i] === "{") depth++;
        if (text[i] === "}" && --depth === 0) break;
      }
      return { value: text.slice(pos + 1, i), end: i + 1 };
    }
    if (text[pos] === '"') {
      let depth = 0, i = pos + 1;
      for (; i < text.length; i++) {
        if (text[i] === "{") depth++;
        if (text[i] === "}") depth--;
        if (text[i] === '"' && depth === 0) break;
      }
      return { value: text.slice(pos + 1, i), end: i + 1 };
    }
    const bare = /^[^,}\s]+/.exec(text.slice(pos));
    const value = bare ? bare[0] : "";
    return { value, end: pos + value.length };
  }

  function skipToClosingBrace(text, pos) {
    let depth = 1;
    for (; pos < text.length && depth > 0; pos++) {
      if ("{(".includes(text[pos])) depth++;
      if ("})".includes(text[pos])) depth--;
    }
    return pos;
  }

  /* ---------- 2. Clean up LaTeX for display ---------- */

  const ACCENTS = { "'": "́", "`": "̀", "^": "̂", '"': "̈", "~": "̃",
                    "=": "̄", ".": "̇", "c": "̧", "u": "̆", "v": "̌" };

  function cleanLatex(s = "") {
    return s
      .replace(/\\([`'^"~=.])\s*\{?([a-zA-Z])\}?/g, (_, a, c) => (c + ACCENTS[a]).normalize("NFC"))
      .replace(/\\([cuv])\{([a-zA-Z])\}/g,          (_, a, c) => (c + ACCENTS[a]).normalize("NFC"))
      .replace(/\\([&%_$#])/g, "$1")
      .replace(/---/g, "—").replace(/--/g, "–").replace(/~/g, " ")
      .replace(/\\(emph|textit|textbf|mathrm|text)\s*/g, "")
      .replace(/[{}]/g, "")
      .trim();
  }

  // "Last, First and First Last" → ["First Last", "First Last"]
  function splitAuthors(s = "") {
    return cleanLatex(s)
      .split(/\s+and\s+/i)
      .map(name => {
        if (!name.includes(",")) return name.trim();
        const [last, first] = name.split(",");
        return `${first.trim()} ${last.trim()}`;
      })
      .filter(Boolean);
  }

  /* ---------- 3. Decide the paper type ---------- */

  function paperType(entry) {
    const f = entry.fields;
    if (f.pubtype) return f.pubtype.toLowerCase();               // manual override

    const where = (f.journal || f.booktitle || f.howpublished || "").toLowerCase();
    if (/arxiv|corr|preprint/.test(where)) return "preprint";
    if (["misc", "unpublished", "techreport"].includes(entry.type)) return "preprint";
    if (entry.type === "article") return "journal";
    if (["inproceedings", "conference", "proceedings"].includes(entry.type)) return "conference";
    if (entry.type === "patent") return "patent";
    return "other";
  }

  /* ---------- 4. Build tidy paper objects ---------- */

  // Fields used only by the website; hidden from the "Copy BibTeX" box.
  const WEBSITE_FIELDS = ["pdf", "code", "slides", "project", "website", "video",
                          "award", "selected", "pubtype", "abstract"];

  function toPaper(entry) {
    const f = entry.fields;

    const extras = [];
    if (f.volume) extras.push(`vol. ${f.volume}`);
    if (f.number) extras.push(`no. ${f.number}`);
    if (f.pages && entry.type === "article") extras.push(cleanLatex(f.pages));

    const arxivFromDoi = (f.doi || "").match(/arXiv\.(\d{4}\.\d{4,5})/i);

    return {
      key:      entry.key,
      type:     paperType(entry),
      title:    cleanLatex(f.title),
      authors:  splitAuthors(f.author),
      venue:    cleanLatex(f.journal || f.booktitle || f.howpublished || f.publisher || ""),
      extras:   extras.join(", "),
      year:     parseInt(f.year, 10) || 0,
      doi:      (f.doi || "").replace(/^https?:\/\/(dx\.)?doi\.org\//, ""),
      url:      f.url || "",
      arxiv:    f.eprint || (arxivFromDoi ? arxivFromDoi[1] : ""),
      pdf:      f.pdf || "",
      code:     f.code || "",
      project:  f.project || f.website || "",
      slides:   f.slides || "",
      video:    f.video || "",
      abstract: cleanLatex(f.abstract || ""),
      award:    cleanLatex(f.award || ""),
      selected: /^(true|yes|1)$/i.test(f.selected || ""),
      bibtex:   entry.raw
                  .split("\n")
                  .filter(line => !new RegExp(`^\\s*(${WEBSITE_FIELDS.join("|")})\\s*=`, "i").test(line))
                  .join("\n")
                  .replace(/,(\s*\n\s*\})$/, "$1"),
    };
  }

  // Public: text → papers, newest first (order within a year follows the .bib file)
  function load(text) {
    return parse(text).map(toPaper).sort((a, b) => b.year - a.year);
  }

  return { load };
})();
