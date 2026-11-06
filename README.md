# Causal Field Notes

An interactive field guide to the whole of
[*Causal Inference for the Brave and True*](https://matheusfacure.github.io/python-causality-handbook/landing-page.html):
25 chapters and 5 technical notes, rebuilt as stories you can read, labs you can break,
and arguments you can defend.

It is a local, static website: no backend, no build step, no tracking. Open `index.html`
for the landing page, or serve the folder over HTTP.

**Status: 11 of 30 pages live.** Chapters 01 (Introduction to causality), 02 (Randomised
experiments), 03 (Stats review), 04 (Graphical causal models), 05 (Linear regression),
06 (Grouped and dummy regression), 07 (Beyond confounders), 08 (Instrumental variables),
09 (Non-compliance and LATE), 10 (Matching), and 11 (Propensity score) are complete. The
other 19 pages are scaffolded in the course manifest and marked as planned; they are added
one at a time, with numbers checked against the book's notebooks.

---

## Live now

### 01 — Introduction to causality

The two roads: potential outcomes, the fundamental problem, and the bias decomposition.
The counterfactual lens starts with the observed table, then reveals the missing column.
Verified against the book's four-school table:

| Quantity | Value |
|---|---|
| ATE | −50 |
| ATT | −75 |
| Naive association | +125 |
| Bias | +200 |

### 02 — Randomised experiments

The online-classroom experiment: 323 students randomly assigned to face-to-face, blended,
or online classes. The page includes a dot-strip lab and a pre-treatment balance table.

| Quantity | Value |
|---|---|
| Face-to-face mean | 78.55 (n = 120) |
| Blended mean | 77.09 (n = 109) |
| Online mean | 73.64 (n = 94) |
| Online − face-to-face | −4.91 |
| Blended − face-to-face | −1.45 |

### 03 — Stats review

Standard errors, confidence intervals, and p-values, with two labs: a sample-size dial that
shows the sampling distribution narrowing as n grows, and an interval ruler that changes
width with the confidence level.

| Quantity | Value |
|---|---|
| Online SE | 1.5372 |
| Face-to-face SE | 0.8724 |
| Gap / SE | −4.9122 / 1.7674 |
| 95% CI on the gap | (−8.3764, −1.4480) |
| z | −2.7793 |
| One-sided p | 0.002724 |

### 04 — Graphical causal models

The language of DAGs: chains, forks, and colliders; confounding, selection bias, and
mediation. The workbench lets you condition on a node and watch the verdict change from
“backdoor closed” to “selection bias” to “mediator blocked.”

### 05 — Linear regression

Regression as a conditional expectation, a projection, and a control dial. The wage lab
uses 663 complete records and the book's control set. The education coefficient moves from
0.0536 with no controls to 0.0349 with IQ, 0.0490 with human capital, and 0.0411 with the
full specification. FWL makes the multivariate coefficient a simple slope again.

### 06 — Grouped and dummy regression

Ten education cells and 935 workers. The weighted cell regression gives 0.0529, matching
the individual regression; equal cell weights give 0.0481. A second bench makes the dummy
regression a staircase of cell means: baseline 18.56 at 9 years, +9.59 at 17 years. The
interaction section moves from a naive +4.90 hourly-wage gap to +3.16 at the same IQ.

### 07 — Beyond confounders

Good controls, treatment-only controls, and post-treatment controls. In the email
experiment, credit limit and risk score cut the payment variance from 10,808 to 5,652 and
move the email coefficient from −0.62 to +4.43. In the hospital experiment, adding severity
flips the treatment coefficient from +14.15 to −7.59; adding hospital then raises the
standard error from 2.27 to 3.49. Opened and agreement collapse the email effect to −1.61.
The chapter closes with the Bad COP.

### 08 — Instrumental variables

Quarter of birth as an instrument for schooling. The first stage is 0.1009, the reduced form
0.0086, and their ratio 0.0853. The page shows the 2SLS interval (0.0352, 0.1354), the
multiple-instrument estimate 0.1077, and the much tighter OLS estimate 0.0673. A second lab
uses the book's seed-12 simulation to show weak instruments: the strongest estimate is
1.946 against a true 2.0, and the standard error rises from 0.010 to 0.303 as the first
stage fades.

### 09 — Non-compliance and LATE

A push is assigned at random but only 71.8% of assigned users receive it. The compliance
matrix separates 3,547 compliers from 1,396 never takers; there are no always takers or
defiers. OLS with delivery gives 27.60, ITT is 2.36, and LATE is 3.29. The page makes the
estimand explicit: the effect is local to the compliers, who are likely richer, newer-phone
users.

### 10 — Matching

Seven sections, six experiments, and a full matching bench: severity bands, regression
weights, the cell atlas, exact twins, k-NN with caliper and correction, the bias
microscope, and the curse of dimensionality. This is the original demo, now at
`chapters/10-matching.html`.

### 11 — Propensity score

A growth-mindset intervention with 10,391 students. The naive difference is 0.4723; IPTW
gives 0.3885, PS regression 0.3930, and PS matching 0.389. The score distribution overlaps,
the treated pseudo-population sums to 10,388.6, and the bootstrap interval is (0.3545,
0.4199). The page is explicit that the score only balances measured covariates.

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
| Medicine, 1-NN matching | −0.9954 |
| Medicine, bias-corrected | −7.3627 |
| Trainees, naive | −4,297.49 |
| Trainees, exact match on age | +2,457.89 |
| Drug example, naive / cells / OLS | −1.1905 / −2.6000 / −2.4545 |

The medicine data is simulated in the book's companion notebook with a **constant −10-day
treatment effect**. The page uses that as a labelled "truth" line and includes an oracle
outcome model benchmark (about −10.05). The book's chapter does not reveal the truth; the
point here is to let you see estimator bias separately from confounding bias.

---

## A look inside

![The landing page](assets/img/screenshots/landing.png)

![Chapter 01, with the counterfactual lens open](assets/img/screenshots/ch01-lens.png)

![Chapter 02, the three classrooms](assets/img/screenshots/ch02-lab.png)

![Chapter 03, the sample-size dial](assets/img/screenshots/ch03-sampling.png)

![Chapter 04, the DAG workbench](assets/img/screenshots/ch04-workbench.png)

![Chapter 05, the control dial](assets/img/screenshots/ch05-control-dial.png)

![Chapter 06, the weighting bench](assets/img/screenshots/ch06-weights.png)

![Chapter 07, the email control diet](assets/img/screenshots/ch07-email.png)

![Chapter 08, the weak-instrument dial](assets/img/screenshots/ch08-weak.png)

![Chapter 09, the compliance matrix](assets/img/screenshots/ch09-matrix.png)

![Chapter 11, the score distribution](assets/img/screenshots/ch11-score.png)

![The Matching chapter](assets/img/screenshots/matching.png)

---

## Quick start

### Option 1: double-click

Open `index.html` in Chrome or Edge. It is the landing page. The live chapters are
`chapters/01-introduction.html`, `chapters/02-randomised-experiments.html`,
`chapters/03-stats-review.html`, `chapters/04-graphical-causal-models.html`,
`chapters/05-linear-regression.html`, `chapters/06-grouped-regression.html`,
`chapters/07-beyond-confounders.html`, `chapters/08-instrumental-variables.html`,
`chapters/09-non-compliance.html`, `chapters/10-matching.html`, and
`chapters/11-propensity-score.html`. Everything needed is local: CSS, JS, data, fonts, the
poster, and the rendered opener at `assets/video/matching-opener.mp4`.

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
sets the recovery function so the treatment effect is exactly −10 days.

`tools/build-data.py` reads the CSVs and regenerates:

- `assets/js/data.js` — the embedded typed-array payload;
- `assets/js/reference.js` — book numbers, k-curve, severity-band checkpoints, oracle;
- `data/drug_example.csv`.

Run it with the bundled Python:

```powershell
& "C:\Users\liuyu\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe" tools/build-data.py
```

It takes about 20–30 seconds because it computes the exact 20,000 × 20,000 nearest
neighbours for the reference values.

---

## Accuracy workflow

Before a page is marked `live` in `assets/js/chapters.js`:

1. `reference/chapter-briefs/<slug>.md` is generated from the book's notebook by
   `python tools/extract-briefs.py`. It records the headings, code cells, printed outputs,
   images, and data files that the page must agree with.
2. Every number that appears on the page is recomputed from the notebook/data. The four-school
   table in Chapter 01 is the worked example: ATE −50, ATT −75, naive +125, bias +200.
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
(ATE −50, ATT −75, naive +125, bias +200), the Chapter 02 group means and missing-data
balance, the Chapter 03 standard errors, interval, z, and p-values, the Chapter 04 DAG path logic, the Chapter 05 OLS/control path, the Chapter 06 weighted/dummy regression, the Chapter 07 control models, the Chapter 08 IV constants, the Chapter 09 compliance matrix, the Chapter 11 propensity score, and the site manifest
(30 pages, unique slugs, every live page exists, the shared reading scale is loaded).
63 tests in total.

Browser smoke tests use Chrome DevTools Protocol through Node's built-in WebSocket (no
Playwright/Puppeteer). Matching-specific scripts default to
`http://127.0.0.1:4173/chapters/10-matching.html`; pass another URL as the first argument
to test a different page.

```powershell
& "...\node.exe" tools/cdp-smoke.mjs
& "...\node.exe" tools/cdp-interact.mjs
& "...\node.exe" tools/cdp-ch01.mjs   # Chapter 01: lens, course map, practice
& "...\node.exe" tools/cdp-ch02.mjs   # Chapter 02: three formats, balance
& "...\node.exe" tools/cdp-ch03.mjs   # Chapter 03: sample size, interval ruler
& "...\node.exe" tools/cdp-ch04.mjs   # Chapter 04: DAG scenarios and conditioning
& "...\node.exe" tools/cdp-ch05.mjs   # Chapter 05: control dial
& "...\node.exe" tools/cdp-ch06.mjs   # Chapter 06: cell weights, dummy stairs
& "...\node.exe" tools/cdp-ch07.mjs   # Chapter 07: email and hospital controls
& "...\node.exe" tools/cdp-ch08.mjs   # Chapter 08: IV ratio, weak instruments
& "...\node.exe" tools/cdp-ch09.mjs   # Chapter 09: compliance matrix, LATE
& "...\node.exe" tools/cdp-ch11.mjs   # Chapter 11: propensity score, estimators
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
`cdp-ch01.mjs` checks the observed table, the lens, the course map, and practice mode;
`cdp-ch02.mjs` checks all three format means, the gaps, and the balance table;
`cdp-ch03.mjs` checks the sample-size dial and the interval ruler;
`cdp-ch04.mjs` checks the confounding, collider, and mediator verdicts;
`cdp-ch05.mjs` checks the wage control paths;
`cdp-ch06.mjs` checks the weighting toggle and the dummy cell contrast;
`cdp-ch07.mjs` checks the email and hospital control models;
`cdp-ch08.mjs` checks the IV ratio and the weak-instrument dial;
`cdp-ch09.mjs` checks the compliance matrix and the three estimates;
`cdp-ch11.mjs` checks the score distribution and the four propensity estimates.
`cdp-a11y.mjs` checks button names, input labels, duplicate IDs, and heading structure;
`cdp-reduced.mjs` verifies that reduced motion lands on final states; `cdp-film.mjs`
checks the rendered video’s metadata and dialog; `cdp-persist.mjs` reloads after scoring
the quiz and completing the checklist to verify localStorage restoration.

---

## Architecture

```
index.html                 landing page + course map
chapters/
  01-introduction.html     live chapter: the two roads
  02-randomised-experiments.html  live chapter: the coin, three classrooms
  03-stats-review.html     live chapter: standard errors, intervals, p-values
  04-graphical-causal-models.html  live chapter: DAGs and the backdoor
  05-linear-regression.html live chapter: the control dial
  06-grouped-regression.html live chapter: weighted cells, dummy stairs
  07-beyond-confounders.html live chapter: good and bad controls
  08-instrumental-variables.html live chapter: quarter of birth and 2SLS
  09-non-compliance.html   live chapter: compliers and LATE
  10-matching.html         live chapter: the matching bench
  11-propensity-score.html live chapter: the score, weighting, matching
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
  ch02.css                 chapter 02 dot strip, tabs, balance table
  ch03.css                 chapter 03 sampling histogram and interval ruler
  ch04.css                 chapter 04 DAG grammar and workbench
  ch05.css                 chapter 05 control-dial coefficient rows
  ch06.css                 chapter 06 bubble weights and dummy staircase
  ch07.css                 chapter 07 control taxonomy and coefficient rows
  ch08.css                 chapter 08 seasonal panel and IV charts
  ch09.css                 chapter 09 compliance matrix and estimator rows
  ch11.css                 chapter 11 score histogram and estimator rows
  print.css                readable paper version
assets/js/
  chapters.js              the manifest: 25 chapters + 5 notes, live/planned
  site.js                  chapter shell: top bar, rail, course map, pager
  landing.js               landing course-map renderer + visit state
  data-ch02.js             online-classroom payload (323 students)
  data-ch05.js             wage payload (663 complete records)
  data-ch06.js             wage payload (935 rows, with hourly wage)
  data-ch07.js             email + hospital payload (5,000 + 80 rows)
  data-ch08.js             AK91 seasonal groups + weak-IV simulation
  data-ch09.js             push compliance counts and means
  data-ch11.js             learning-mindset PS and outcome payload
  iv.js                    the book's quarter-of-birth IV constants
  iv09.js                  the book's OLS/ITT/LATE constants
  iv11.js                  the book's propensity-score constants
  dag.js                   chapter 04 graph definitions + path verdicts
  regression.js            OLS/WLS engine + classical SEs
  labs/ch01.js             the counterfactual lens
  labs/ch02.js             the three-classroom dot strip + balance
  labs/ch03.js             the sample-size dial and the interval ruler
  labs/ch04.js             the DAG workbench renderer
  labs/ch05.js             the control-dial renderer
  labs/ch06.js             the weighting bench and dummy staircase
  labs/ch07.js             the email and hospital control labs
  labs/ch08.js             the seasonal, ratio, and weak-IV labs
  labs/ch09.js             the compliance matrix and estimator chart
  labs/ch11.js             the score histogram, rate strip, and estimators
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

The next build is **Chapter 12 — Doubly robust estimation**: combine the outcome model and
the propensity model so one can rescue the other. After that, the plan is 13–16, then Part
II 17–25, then the five technical notes.

---

## HyperFrames opener

`motion/` contains a 1920×1080, 24 fps, 12-second composition using the same trainee story:
the naive gap, the same-age match lines, and the flip to +2,458. The rendered MP4 is
included at `assets/video/matching-opener.mp4`; the page shows it in the “Watch the 12s
primer” dialog with a poster and transcript.

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
  their card, so labels stay legible instead of shrinking to 4 px. A “swipe →” hint marks
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
  chapters 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, and 11, MIT-licensed repository. Chapter
  01's four-school table and its arithmetic are the book's example; Chapter 02's
  online-classroom data comes from Alpert, Couch & Harmon (2016) via the book repository.
  Chapter 03's sampling simulation uses the book's true mean 74 and standard deviation 2.
  Chapter 04's graph structures and verdicts follow the book's DAG examples. Chapters 05 and
  06 use the book's `wage.csv`; Chapter 07 uses the book's collections-email and
  hospital-treatment data; Chapter 08 uses the book's `ak91.csv` and its seed-12 IV
  simulation; Chapter 09 uses the book's push-engagement data; Chapter 11 uses the book's
  `learning_mindset.csv`. The prose is adapted and shortened, and the counterfactual lens,
  three-classroom dot strip, sample-size dial, interval ruler, DAG workbench, control dial,
  weighting bench, dummy staircase, control labs, seasonal panel, IV ratio, weak-instrument
  dial, compliance matrix, estimator chart, score histogram, and rate strip are new.
- **Visual language:** adapted from the **Data Storytelling** style in
  [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) by Lemomo (MIT). The charts,
  copy, and motion here are original; no demo assets or story are reused.
- **Motion tooling:** [HyperFrames](https://github.com/heygen-com/hyperframes) by HeyGen
  (Apache 2.0) for the optional opener.
- **Type:** Newsreader, IBM Plex Mono, Caveat (SIL Open Font License).

See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and
[`assets/fonts/OFL.txt`](assets/fonts/OFL.txt).

