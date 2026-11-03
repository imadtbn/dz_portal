# Home page Speed Index and desktop CLS follow-up (2026-10-13)

## Comparable Lighthouse baseline (supplied user reports, 09:30 local)
- Desktop: Performance **79**, Speed Index **3.4s**, CLS **0.173**, LCP **1.2s**.
- Mobile: Performance **78**, Speed Index **8.3s**, CLS **0.038**, LCP **3.1s**.
- Both reports were collected from `index.html#google_vignette`, so automatically inserted ads and dynamic network conditions can affect results.

## Verified source-level changes
1. Home page Font Awesome 6.4 stylesheet loads via `preload/as=style` and becomes a stylesheet on load; `noscript` restores the blocking link if scripts are disabled. Tajawal font, weights, and existing preloads are untouched.
2. Reserve compact icon boxes to limit text movement while the icon font appears.
3. Nine large, off-screen sector image URLs move to `data-dz-src` with a transparent placeholder, original image kept in `noscript` fallback. A small IntersectionObserver loader requests images only near the viewport (800px ahead), preserves intrinsic widths/heights and original files, and falls back to immediate image loads on unsupported browsers.
4. Homepage statistics use at most six concurrent, low-priority requests to count the **same real sector pages**. No fake stats or removed sectors.
5. The opt-in `?cls-debug=1` diagnostic now records layout-shift sessions, source selectors, font loads, style mutations (including `height: auto !important`), ad insertions and resize events affecting `#sectors` and ad containers.
6. PWA cache bumped to v2 and precaches the new image loader and main home performance stylesheet.
7. Existing AdSense IDs, slots, formats, automatic ads, card presentation, navigation and share interactions were not changed as part of this follow-up.

**Note:** Files have passed static and functional checks. No after-deployment Lighthouse score has been independently measured from this environment. Deferring image downloads is not the same as reducing the byte size of the original files; the larger logos should still be encoded as WebP/AVIF thumbnails once actual image binaries are safely available, keeping the original assets for high-resolution use.

## Acceptance test
1. Wait for GitHub Pages deployment and refresh without cached files or extensions.
2. Run **three desktop** Lighthouse measurements with `node tools/lighthouse-desktop-3x.cjs`, inspect each raw JSON and aim for **CLS < 0.10** in all three.
3. Run **three mobile** Lighthouse tests; preserve **CLS < 0.10** and compare median Speed Index to the baseline 8.3s.
4. Test at widths 360, 494, 768 and >=1280px. On every size verify navbar, hero, search, sector cards, the image icons on scrolling, in-content AdSense centering and non-overlapping ad overlays.
5. Disable JavaScript temporarily: the `noscript` card images must still render and HTML sector links must work.
6. Test PWA update and offline navigation.
7. Open `index.html?cls-debug=1`; scroll through the sector cards, then run `window.__dzCLSReport()` in DevTools. Examine `adOrLayoutMutations` and `resizes` together with large shift entries to locate the **actual source** of the remaining desktop `#sectors` movement. Do not blame the `height:auto!important` attribute without a captured mutation or call stack.

Do not mark desktop CLS or a 90+ score as achieved until post-deployment measurements confirm it.
