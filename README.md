# anupkumargupta.github.io

A plain HTML/CSS site (no Jekyll, no build step). GitHub Pages serves the files as they are.

## What to edit

| To change…                                   | Edit                         |
|----------------------------------------------|------------------------------|
| Bio, news, experience, teaching, talks, honors | `content.yml`              |
| Publications                                 | `publications.bib`           |
| CV                                           | replace `files/Anup_Kumar_Gupta_CV.pdf` |
| Photo                                        | replace `images/profile.jpg` (square, ~400×400) |

You can edit everything in GitHub's web editor (press `.` on the repo page, or click the pencil icon on a file). Commit, and the site updates within a minute or two.

### Add a news item
Put it at the **top** of the `news:` list in `content.yml`:
```yaml
news:
  - date: Dec 2026
    text: Paper accepted at **CVPR 2027**! [Preprint](https://arxiv.org/abs/xxxx)
```

### Add a publication
Paste its BibTeX (from Google Scholar → Cite → BibTeX, or DBLP) into `publications.bib`. Entries are sorted by year automatically.

Optional extra fields the website understands (they are hidden from the "Copy BibTeX" button):
```bibtex
  pdf      = {files/papers/radiant.pdf},
  code     = {https://github.com/AnupKumarGupta/RADIANT},
  project  = {https://...},
  slides   = {https://...},
  video    = {https://...},
  abstract = {We propose ...},
  award    = {Best Student Paper Award},
  selected = {true},         % show on the homepage (otherwise the 5 newest are shown)
  pubtype  = {journal},      % override: journal | conference | preprint | patent | other
```
Type is detected automatically: `@article` = Journal, `@inproceedings` = Conference, `@misc` / arXiv = Preprint.

### Formatting in content.yml
- `[text](https://link)` for links, `**bold**`, `*italic*`
- Indent with 2 spaces. If a line contains `: ` (a colon followed by a space), wrap the text in quotes.
- If the page shows "Could not load the site content", there is a YAML typo. Paste the file into <https://www.yamllint.com/> to find it.

### Change the email address
The address is never written in plain text. It is stored reversed and base64-encoded as `email_code` in `content.yml`, and decoded only when a visitor clicks **Email me**. To make a new code, open any browser tab, press F12 → Console, and run:
```js
btoa("you@example.com".split("").reverse().join(""))
```
Paste the result as `email_code:`.

### Change the colours
Open `assets/theme.css` and change the four values at the top:
```css
--main:   #9e3223;   /* links, buttons, highlights */
--accent: #386c94;   /* award badges, small details */
--paper:  #fbf8f4;   /* background */
--ink:    #1f1b1a;   /* text */
```
There is a second block for dark mode just below it. Every other shade is mixed automatically from these.
Ready-made alternatives (blue, teal, clay) are listed in the same file.

### Change fonts or spacing
The top of `assets/style.css` has the font and page-width settings. The rest of that file is grouped by page section (header, intro, news, publications, footer).

## Preview locally (optional)
```bash
python3 -m http.server
# open http://localhost:8000
```
(Opening `index.html` by double-clicking won't work, because browsers block loading the data files from disk.)

## Files
```
content.yml            ← your text (bio, news, jobs, teaching, talks, honors)
publications.bib       ← your papers
assets/theme.css       ← colours
assets/style.css       layout and fonts
assets/site.js         fills the pages from content.yml (settings at the top)
assets/bibtex.js       reads publications.bib
assets/icons.js        link icons (Font Awesome Free, CC BY 4.0; Simple Icons, CC0)
assets/js-yaml.min.js  YAML reader (MIT licence, don't edit)
index.html             homepage layout (the menu is here)
publications.html      publications page layout
files/, images/        CV, photo, favicons
publications/, cv/, teaching/, talks/, about/, resume/   redirects from old URLs
sitemap.xml, robots.txt  help search engines find the pages
```

### Add a new section to the homepage
1. Add the data to `content.yml`.
2. Add an empty `<section id="...">` in `index.html` and a menu link to it.
3. Add a small render function in `assets/site.js` (copy `renderTalks` as a template) and call it in `start()`.
