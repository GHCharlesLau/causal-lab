# Matching — 12-second opener

A silent 1920×1080, 24 fps HyperFrames composition that sets up the chapter: the naive
trainee gap, the same-age match lines, and the flip to +2,458.

- Source: `index.html`
- Rendered: `../assets/video/matching-opener.mp4` (12.0 s, ~1.0 MB)
- Poster: `../assets/img/matching-opener-poster.jpg`

The web page plays the MP4 in the “Watch the 12s primer” dialog. If the file is missing,
the dialog falls back to a note and the interactive chapter is unaffected.

## Re-render

Requirements: Node.js ≥ 22, pnpm, FFmpeg, and a Chrome/Chromium build (HyperFrames can
install a headless shell on first use).

```powershell
cd motion
pnpm install
npm run render
```

`npm run render` writes to `../assets/video/matching-opener.mp4`. The composition is
deterministic: it uses a paused GSAP timeline, local fonts, and a local GSAP copy, with no
network fetches.

## Preview and check

```powershell
npm run preview
npx hyperframes check .
```

The last check on this composition reported: 0 lint errors, 0 runtime errors, 0 layout
issues, 0 motion errors, all 133 text checks passing WCAG AA. The only remaining craft
warning is the deliberately small chart tick labels.

## Contract notes

- Root: `data-composition-id="matching-opener"`, `data-start="0"`, `data-duration="12"`,
  `data-width="1920"`, `data-height="1080"`.
- One paused root timeline: `window.__timelines["matching-opener"]`.
- All animation is deterministic; no `Date.now()` or `Math.random()` in the timeline.
- Fonts are local woff2 files in `assets/fonts`; GSAP is `assets/gsap.min.js`.
- The film is silent; the page provides a transcript.

## License

The composition and render are part of this demo. HyperFrames is Apache 2.0; GSAP is
distributed under the GreenSock Standard License; the fonts are OFL. See
`../THIRD_PARTY_NOTICES.md`.
