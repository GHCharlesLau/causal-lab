# Causal Field Notes

An interactive field guide to the whole of
[*Causal Inference for the Brave and True*](https://matheusfacure.github.io/python-causality-handbook/landing-page.html):
25 chapters and 5 technical notes, rebuilt as stories you can read, labs you can break,
and arguments you can defend.

It is a local, static website: no backend, no build step, no tracking. Open `index.html`
for the landing page, or serve the folder over HTTP.

**Status: 2 of 30 pages live.** Chapter 01 (Introduction to causality) and Chapter 10
(Matching) are complete. The other 28 pages are scaffolded in the course manifest and
marked as planned; they are added one at a time, with numbers checked against the book's
notebooks.

---

## Live now

### 01 â€” Introduction to causality

The two roads: potential outcomes, the fundamental problem, and the bias decomposition.
The counterfactual lens starts with the observed table, then reveals the missing column.
Verified against the book's four-school table:

| Quantity | Value |
|---|---|
| ATE | âˆ’50 |
| ATT | âˆ’75 |
| Naive association | +125 |
| Bias | +200 |

### 10 â€” Matching

Seven sections, six experiments, and a full matching bench: severity bands, regression
weights, the cell atlas, exact twins, k-NN with caliper and correction, the bias
microscope, and the curse of dimensionality. This is the original demo, now at
`chapters/10-matching.html`.

### What is in each chapter

- A story with the decision, the failure of the naive comparison, and the identification
  idea.
- At least one lab you can manipulate, not a static screenshot.
- A formula you can read and a "what to notice" caption.
- A short defense, a source link, and a path to the next chapter.
- Matching also has the 8-question quiz, code mirror, checklist, and practice notebook.

### The numbers

The Matching page reproduces the book's values:

| Check | Value |
|---|---|
| Medicine, naive | +16.90 |
| Medicine, 1-NN matching | âˆ’0.9954 |
| Medicine, bias-corrected | âˆ’7.3627 |
| Trainees, naive | âˆ’4,297.49 |
| Trainees, exact match on age | +2,457.89 |
| Drug example, naive / cells / OLS | âˆ’1.1905 / âˆ’2.6000 / âˆ’2.4545 |

The medicine data is simulated in the book's companion notebook with a **constant âˆ’10-day
treatment effect**. The page uses that as a labelled "truth" line and includes an oracle
outcome model benchmark (about âˆ’10.05). The book's chapter does not reveal the truth; the
point here is to let you see estimator bias separately from confounding bias.

---

## A look inside

![The landing page](assets/img/screenshots/landing.png)

![Chapter 01, with the counterfactual lens open](assets/img/screenshots/ch01-lens.png)

![The Matching chapter](assets/img/screenshots/matching.png)

---

## Quick start

### Option 1: double-click

Open `index.html` in Chrome or Edge. It is the landing page. The live chapters are
`chapters/01-introduction.html` and `chapters/10-matching.html`. Everything needed is
local: CSS, JS, data, fonts, the poster, and the rendered opener at
`assets/video/matching-opener.mp4`.

### Option 2: local server

From this folder:

```bash
python -m http.server 4173 --bind 127.0.0.1
```

Then open <http://127.0.0.1:4173/> for the landing, or
<http://127.0.0.1:4173/chapters/01-introduction.html> for Chapter 01.

### Deploying

The site is static. Copy the whole folder to any static host (GitHub Pages, Netlify,
Cloudflare Pages, S3, nginx). `index.html` is the entry point; no build or environment
variables are required. All internal links are relative, so the site also works from a
subdirectory such as `https://example.com/causal-notes/`.

The only server-side concern is the file name: keep `index.html` at the root. The
`chapters/` folder and `assets/` folder must travel with it. The film is optional; if
`assets/video/matching-opener.mp4` is missing, the Matching page's film dialog shows a
fallback and the rest of the page works.

On this machine the bundled runtimes are at:

```text
C:\Users\liuyu\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe
C:\Users\liuyu\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe
```

---

## Controls

- **Top bar:** course map, sound (off by default), practice mode, progress.
- **Practice mode** hides the guided hints, the truth line, and the benchmark note. Use it
  for a cold attempt, then turn it off to check your reasoning.
- **Every lab** has a "what to notice" caption and a predict-first prompt.
- **KNN bench:** hover a dot for a tooltip, click to pin it, or use the **Inspect a unit**
  dropdown for keyboard access. The select lists a sample of treated and control patients.
- **Exact matching:** press **Play pairs**, drag the scrubber, click a dot, or **Shuffle ties**.
- **Keyboard:** all sliders, switches, buttons, and dialogs are keyboard operable. Use
  Tab/Shift+Tab and arrow keys on sliders.

---

## Data

| File | Rows | Source |
|---|---|---|
| `data/medicine_impact_recovery.csv` | 20,000 | Book repository, simulated with `np.random.seed(1234)` |
| `data/trainees.csv` | 40 | Book repository, contrived chapter example |
| `data/drug_example.csv` | 10 | The chapter's six-men/four-women toy table |

Columns for the medicine data: `sex`, `age`, `severity`, `medication`, `recovery`.
6,924 of the 20,000 patients are treated. The companion notebook
[`Simulated-Data.ipynb`](https://github.com/matheusfacure/python-causality-handbook/blob/master/Simulated-Data.ipynb)
sets the recovery function so the treatment effect is exactly âˆ’10 days.

`tools/build-data.py` reads the CSVs and regenerates:

- `assets/js/data.js` â€” the embedded typed-array payload;
- `assets/js/reference.js` â€” book numbers, k-curve, severity-band checkpoints, oracle;
- `data/drug_example.csv`.

Run it with the bundled Python:

```powershell
& "C:\Users\liuyu\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe" tools/build-data.py
```

It takes about 20â€“30 seconds because it computes the exact 20,000 Ã— 20,000 nearest
neighbours for the reference values.

---

## Accuracy workflow

Before a page is marked `live` in `assets/js/chapters.js`:

1. `reference/chapter-briefs/<slug>.md` is generated from the book's notebook by
   `python tools/extract-briefs.py`. It records the headings, code cells, printed outputs,
   images, and data files that the page must agree with.
2. Every number that appears on the page is recomputed from the notebook/data. The four-school
   table in Chapter 01 is the worked example: ATE âˆ’50, ATT âˆ’75, naive +125, bias +200.
3. A Node test guards the arithmetic (`tests/*.test.mjs`).
4. A CDP test exercises the actual interaction and checks the DOM (`tools/cdp-ch01.mjs`).
5. Only then does the manifest status change to `live`. Planned pages are never linked as
   finished content.

The 30 briefs live in `reference/chapter-briefs/`; the index lists the code-cell and data
counts for every chapter, which is also the roadmap for the remaining pages.

## Tests

Reference, chapter, and manifest tests (Node 24, no packages):

```powershell
& "...\node.exe" --test tests/*.test.mjs
```

The suite checks the Matching book numbers, the k-curve, severity-band checkpoints, the
oracle, the k-d tree, the OLS toy regression, the Chapter 01 potential-outcomes arithmetic
(ATE âˆ’50, ATT âˆ’75, naive +125, bias +200), and the site manifest (30 pages, unique slugs,
every live page exists, the shared reading scale is loaded). 20 tests in total.

Browser smoke tests use Chrome DevTools Protocol through Node's built-in WebSocket (no
Playwright/Puppeteer). Matching-specific scripts default to
`http://127.0.0.1:4173/chapters/10-matching.html`; pass another URL as the first argument
to test a different page.

```powershell
& "...\node.exe" tools/cdp-smoke.mjs
& "...\node.exe" tools/cdp-interact.mjs
& "...\node.exe" tools/cdp-ch01.mjs   # Chapter 01: lens, course map, practice
& "...\node.exe" tools/cdp-a11y.mjs
& "...\node.exe" tools/cdp-reduced.mjs
& "...\node.exe" tools/cdp-film.mjs
& "...\node.exe" tools/cdp-persist.mjs
& "...\node.exe" tools/cdp-review.mjs   # writes screenshots to assets/img/_shots
& "...\node.exe" tools/cdp-page.mjs "http://127.0.0.1:4173/" landing 1440 1000
```

`cdp-interact.mjs` drives the band, regression, exact-match play, k, bias correction,
omitting sex, unit inspection, bias cycling, the dimension slider, the quiz, the checklist,
practice mode, and the course map. It prints the observed values and any console errors.
`cdp-ch01.mjs` checks the observed table, the lens, the course map, and practice mode.
`cdp-a11y.mjs` checks button names, input labels, duplicate IDs, and heading structure;
`cdp-reduced.mjs` verifies that reduced motion lands on final states; `cdp-film.mjs`
checks the rendered videoâ€™s metadata and dialog; `cdp-persist.mjs` reloads after scoring
the quiz and completing the checklist to verify localStorage restoration.

---

## Architecture

```
index.html                 landing page + course map
chapters/
  01-introduction.html     live chapter: the two roads
  10-matching.html         live chapter: the matching bench
assets/css/
  tokens.css               paper/ink/pencil tokens, type scale
  base.css                 reset, type, focus, grain, toast
  layout.css               top bar, rail, hero, sections, footer, breakpoints
  components.css           buttons, labs, tables, quiz, dialogs, checklist, print hooks
  charts.css               SVG chart grammar, ruler, sparkline, waterfall, cell atlas
  type.css                 the larger reading scale (18px root, 21px body)
  site.css                 reading progress, course map, chapter pager
  landing.css              landing page
  ch01.css                 chapter 01 lab and bias equation
  print.css                readable paper version
assets/js/
  chapters.js              the manifest: 25 chapters + 5 notes, live/planned
  site.js                  chapter shell: top bar, rail, course map, pager
  landing.js               landing course-map renderer + visit state
  labs/ch01.js             the counterfactual lens
  data.js                  matching payload (20k patients)
  reference.js             generated book numbers
  stats.js                 mean/sd/OLS, k-d tree, k-NN matching, correction
  timeline.js              seekable rAF timeline + reduced motion + visibility
  pencil.js                jittered paths, write-on, tip tracking
  charts.js                SVG scales, ticks, markers, formatting
  sound.js                 optional WebAudio plucks/ticks
  progress.js              matching localStorage state
  quiz.js                  matching quiz
  scenes/*.js              matching experiments
  app.js                   matching shell, dialogs, scrollspy, quiz/checklist
data/                      source CSVs
practice/                  matching notebook
motion/                    HyperFrames composition + render output
reference/chapter-briefs/  generated accuracy briefs for all 30 source notebooks
tools/                     data build, notebook build, brief extractor, CDP tests
tests/                     Node reference, chapter, and manifest tests
```

The site uses classic `<script defer>` files and global namespaces. No fetch at runtime,
no module/CORS requirements, so `file://` works. `stats.js` and `data.js` also export to
`module.exports` so Node tests can load them.

The **chapter shell** (`site.js`) is shared by generated chapters: a page defines
`window.CHAPTER` with its title and section list, loads `chapters.js`, and lets the shell
build the top bar, rail, course map, reading progress, practice toggle, and previous/next
pager. The landing page reads the same manifest, so a chapter is never linked before it
exists.

### Stats engine

`stats.matching(data, {features, k, standardize, caliper, replace})` builds two k-d trees,
finds the 10 nearest opposite-group neighbours for every unit, applies an optional caliper,
and computes:

- raw ATE/ATT/ATC with the book's signed formula;
- bias-corrected ATE/ATT/ATC by fitting `mu0` on the untreated and `mu1` on the treated;
- the k=1..10 curve, nearest-match distance quantiles, per-unit matches, and dropped counts.

Changing `k` reuses the precomputed matches (`result.estimateAt`), so the slider stays
responsive. Changing features, scaling, replacement, or caliper rebuilds the trees.

---

## Extending the chapter series

The site is built to grow by one chapter at a time. To add one:

1. Read the source notebook and write down the exact numbers or table you will reproduce.
2. Add the chapter to `assets/js/chapters.js` and set its status to `live` only when the
   page is accurate and tested.
3. Create `chapters/<slug>.html` with `window.CHAPTER` and the shared
   `tokens/base/layout/components/charts/type/site` stylesheets.
4. Add a small lab module under `assets/js/labs/` and a page-specific stylesheet if needed.
5. Add a browser test (the `tools/cdp-ch01.mjs` pattern) and a Node arithmetic test.
6. Update this README's live list and screenshots.

The next chapter is **02 â€” Randomised experiments**: the coin, the standard error, and
the difference between "no effect" and "not enough evidence." After that, the plan is
03â€“09 in order, then 11â€“16, then Part II 17â€“25, then the five technical notes.

---

## HyperFrames opener

`motion/` contains a 1920Ã—1080, 24 fps, 12-second composition using the same trainee story:
the naive gap, the same-age match lines, and the flip to +2,458. The rendered MP4 is
included at `assets/video/matching-opener.mp4`; the page shows it in the â€œWatch the 12s
primerâ€ dialog with a poster and transcript.

To re-render:

```powershell
cd motion
pnpm install
npm run render
```

`npm run render` writes `../assets/video/matching-opener.mp4` and takes about 25 seconds on
this machine. See `motion/README.md` for the check results and composition notes.

The page looks for `assets/video/matching-opener.mp4`. If the file is absent, the film
dialog shows a fallback note and the rest of the chapter is unaffected. The composition
source is still valid and can be rendered later.

---

## Accessibility, performance, and limitations

- Semantic headings, skip link, visible focus, native dialogs, `aria-live` estimate updates,
  colour + shape encoding, figcaption summaries, and a keyboard-accessible unit dropdown.
- `prefers-reduced-motion` jumps timelines to their final state; no autoplay.
- The 20,000-point cloud is drawn on Canvas from a cached offscreen layer; the k-d tree is
  rebuilt only when the matching design changes. Estimates use all 20,000 rows.
- Mobile SVG charts below 720 px keep a 600 px wide drawing and scroll horizontally inside
  their card, so labels stay legible instead of shrinking to 4 px. A â€œswipe â†’â€ hint marks
  the cards that scroll.
- The reading scale is deliberately larger than the first demo: 18px root, about 21px
  body text at desktop, and 10px+ micro-labels. It is a reading site, not a dashboard.
- English-only in this version.
- The medicine data is simulated; the truth line is a teaching device.
- The whole-book build is in progress. Only pages marked **live** in the course manifest
  claim to be complete; planned pages are labelled and never linked as finished content.
- The page is an independent learning project, not affiliated with the book's author,
  Lemomo, or HeyGen.
- Matching estimates are design-dependent. The page shows the design choices; it does not
  claim to produce production-ready effect estimates.

---

## Credits

- **Book & data:** Matheus Facure Alves, *Causal Inference for the Brave and True*,
  chapters 01 and 10, MIT-licensed repository. Chapter 01's four-school table and its
  arithmetic are the book's example; the prose is adapted and shortened, and the
  counterfactual lens is new.
- **Visual language:** adapted from the **Data Storytelling** style in
  [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) by Lemomo (MIT). The charts,
  copy, and motion here are original; no demo assets or story are reused.
- **Motion tooling:** [HyperFrames](https://github.com/heygen-com/hyperframes) by HeyGen
  (Apache 2.0) for the optional opener.
- **Type:** Newsreader, IBM Plex Mono, Caveat (SIL Open Font License).

See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and
[`assets/fonts/OFL.txt`](assets/fonts/OFL.txt).

