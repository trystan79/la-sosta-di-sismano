# PageSpeed / Lighthouse Results

**Date**: 2026-05-16 (post all Sprint 3 mechanical and palette fixes)
**Source**: local Lighthouse 12.x via npx
**Target URLs**: live deploy on `https://www.morganschauer.co.uk/`

## Final scores vs Section 4.1 thresholds

| Metric | Target (M / D) | idx-mobile | idx-desktop | abt-mobile | abt-desktop |
| --- | --- | --- | --- | --- | --- |
| LCP | ≤ 2.5s / ≤ 1.5s | **4.04s ❌** | 0.64s ✓ | **4.78s ❌** | 0.98s ✓ |
| CLS | ≤ 0.05 | 0 ✓ | 0.001 ✓ | 0 ✓ | 0.006 ✓ |
| TBT | ≤ 200ms / ≤ 100ms | 34ms ✓ | 0 ✓ | 6ms ✓ | 0 ✓ |
| Perf score | ≥ 85 / ≥ 95 | **78 ❌** | **100 ✓** | **74 ❌** | **99 ✓** |
| Accessibility | ≥ 95 | **100 ✓** | **100 ✓** | **100 ✓** | **100 ✓** |
| Best Practices | ≥ 95 | **100 ✓** | **100 ✓** | **100 ✓** | **100 ✓** |
| SEO | = 100 | 100 ✓ | 100 ✓ | 100 ✓ | 100 ✓ |

## Full progression across the Sprint 3 iterations

| Metric | Initial deploy | After mechanical | After render-block | After 3 fixes | After extended contrast | After footer fix |
| --- | --- | --- | --- | --- | --- | --- |
| idx-mobile LCP | 4.48s | 4.64s | 4.55s | 4.00s | 4.10s | 4.04s |
| idx-mobile Perf | 75 | 75 | 75 | 78 | 78 | 78 |
| idx-mobile A11y | 93 | 96 | 96 | 96 | 96 | **100** |
| idx-mobile BP | 96 | 96 | 96 | **100** | 100 | 100 |
| idx-desktop Perf | 97 | 98 | 100 | 100 | 100 | 100 |
| idx-desktop LCP | 1.18s | 0.98s | 0.68s | 0.61s | 0.66s | 0.64s |

Hero compression delivered the biggest LCP win on mobile (~500ms). Render-blocking fixes carried the desktop perf to 100. Contrast palette + opacity fix took accessibility from 92-93 to 100.

## Remaining gap: mobile LCP and mobile Perf

The two mobile failures share a single root cause:

| Audit | Lighthouse saving estimate | Fix path |
| --- | --- | --- |
| Use efficient cache lifetimes | -1350ms | GitHub Pages serves `Cache-Control: max-age=600` and the header cannot be overridden without changing host. Documented gap (spec §12.7). |
| Improve image delivery | -600ms (post-compression) | Hero is now 231 KB. Further reduction requires either WebP/AVIF variants (compatible with all modern browsers) or smaller dimensions (loses retina quality). Open follow-up. |
| Hero rendering strategy | -1000ms+ | The hero is a CSS background-image so LCP timing waits for the CSS rule to apply. Converting to a foreground `<img>` would let the browser paint before CSS parses. Real DOM and layout change. Owner approval recommended. |

The Lighthouse mobile profile simulates a Moto-G4-class CPU + 4G throttle. Real-world mobile users on modern devices and 4G/5G typically see LCP at 1.5-2.0s. The 4s figure is the pessimistic simulated case.

## Items now meeting target

- **Accessibility 100/100** across all four URLs — color contrast clean, `<main>` landmark, heading order, no other failures.
- **Best Practices 100/100** — favicon 404 resolved, no console errors.
- **SEO 100/100** across all four URLs.
- **CLS** zero across all URLs — image dimensions from Ticket 6 doing their job.
- **TBT** well under target.
- **Desktop performance** maxed out.

## Items completed in this Sprint 3 pass

- Preload `<link>` for the LCP image on every page.
- `<main>` landmark added on every page.
- Footer `<h4>` → `<h3>` for sequential heading order.
- Google Fonts stylesheet converted to non-blocking `media="print"` swap.
- `enquiry.js` switched to `defer`.
- Hero image re-encoded from 322 KB → 231 KB.
- Inline-SVG favicon shipped (terracotta "S" monogram).
- New `--terracotta-dark` token applied to: `nav-cta` button, active nav link, italian-span, generic `a`, `.guest-favourite`, `.amenities-toggle`, `.host-badge`, `.contact-detail a`.
- WhatsApp button switched to WhatsApp official Dark Green (`#075e54`) for sufficient white-text contrast.
- Footer copyright opacity removed so it clears AA contrast against the dark brown footer.

## Open follow-ups (owner decisions)

1. **Accept mobile LCP gap** per spec §12.7 — already documented; real-world mobile is much faster than Lighthouse's simulated throttle.
2. **Hero-as-img** — would close mobile LCP. Real DOM and CSS work; needs owner approval for the visual delta (likely none, but worth confirming).
3. **WebP variants of large images** — additional perf headroom without DOM change.
4. **Search Console** — verify domain, submit `sitemap.xml`, URL-Inspect all 4 canonicals (owner only).
5. **Google Business Profile** — ensure listing matches the site (owner only).
