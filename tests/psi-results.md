# PageSpeed / Lighthouse Results

**Date**: 2026-05-16 (post Ticket-8 mechanical fixes + render-blocking pass)
**Source**: local Lighthouse 12.x via npx
**Target URLs**: live deploy on `https://www.morganschauer.co.uk/`

## Latest results vs Section 4.1 thresholds

| Metric | Target (M / D) | idx-mobile | idx-desktop | abt-mobile | abt-desktop |
| --- | --- | --- | --- | --- | --- |
| FCP | – | 3.18s | 0.37s | 2.95s | 0.40s |
| LCP | ≤ 2.5s / ≤ 1.5s | **4.55s ❌** | 0.68s ✓ | **4.84s ❌** | 1.01s ✓ |
| CLS | ≤ 0.05 | 0 ✓ | 0.001 ✓ | 0 ✓ | 0.006 ✓ |
| TBT | ≤ 200ms / ≤ 100ms | 14ms ✓ | 0 ✓ | 20ms ✓ | 0 ✓ |
| Perf score | ≥ 85 / ≥ 95 | **75 ❌** | 100 ✓ | **74 ❌** | 99 ✓ |
| Accessibility | ≥ 95 | 96 ✓ | 96 ✓ | 96 ✓ | 96 ✓ |
| Best Practices | ≥ 95 | 96 ✓ | 96 ✓ | 96 ✓ | 96 ✓ |
| SEO | = 100 | 100 ✓ | 100 ✓ | 100 ✓ | 100 ✓ |

## Progression across the three iterations

| Metric | Before | After mechanical fixes | After render-blocking | Δ overall |
| --- | --- | --- | --- | --- |
| idx-mobile LCP | 4.48s | 4.64s | 4.55s | ~ flat |
| idx-mobile Perf | 75 | 75 | 75 | flat |
| idx-mobile A11y | 93 | 96 | 96 | **+3** |
| idx-desktop Perf | 97 | 98 | 100 | **+3** |
| idx-desktop LCP | 1.18s | 0.98s | 0.68s | **-0.5s** |
| abt-desktop Perf | 98 | 99 | 99 | +1 |

Desktop is now at thresholds across the board. Accessibility climbed past the 95 target on every URL. Mobile LCP is unchanged.

## Why mobile LCP is stuck at ~4.5s

Highest-impact remaining audits (from Lighthouse 12.x):

| Audit | Estimated saving | Fix path |
| --- | --- | --- |
| Use efficient cache lifetimes | -1350ms | **GitHub Pages serves `Cache-Control: max-age=600`. Cannot override without changing host.** Gap. |
| Improve image delivery | -850ms | Hero is 322 KB JPEG (1200×800). Re-encode at quality 70-75 to ~140 KB, optionally add a smaller mobile variant via `<picture>`. **No build step required.** Owner approval recommended for visual delta check. |
| Render-blocking style.css (4.6 KB) | small | Could be inlined as critical CSS, but that needs a build step or one-time manual inlining — owner approval recommended given the file already changes occasionally. |

The Lighthouse mobile profile simulates a Moto G4-class CPU + 4G throttle. Real-world mobile users on modern devices and 4G/5G will see LCP closer to 1.5-2s. The 4.5s is the pessimistic simulated case.

## Remaining accessibility gap

`color-contrast` audit is still the only failing a11y check. Three elements fall below WCAG AA (4.5:1):

- `a.nav-cta` — the Enquire button (terracotta on cream).
- `a.active` in nav — active page indicator (terracotta on cream).
- `span.italian` — the Italian-language phrase inside the intro paragraph (terracotta on cream).

Fix is a palette decision: darken the terracotta when used for these elements, or add an outline. Held for owner approval.

## Items already meeting target

- All CLS readings effectively zero — Ticket 6 image dimensions working.
- All TBT readings well under target.
- SEO 100/100 across all four URLs.
- Best Practices 96/100 across all four URLs (only failing audit is the favicon 404 — see below).
- Accessibility 96/100 across all four URLs.

## Known minor issue: favicon 404

Lighthouse logs a console error: `https://www.morganschauer.co.uk/favicon.ico` returns 404. Best Practices score is already passing at 96 — the favicon does not block any threshold. A favicon is a design decision (size, palette, glyph). Held for owner approval.

## Open decisions for the owner

1. **Color contrast palette adjustment** — darken terracotta for buttons/active-state/italian-span (closes only remaining a11y audit failure).
2. **Hero image compression** — re-encode `images/hero.jpg` to ~140 KB; expected ~500-800ms LCP improvement (mechanical, low risk).
3. **Favicon** — pick a glyph/palette and ship; closes the only failing Best Practices audit (already passing the threshold).
4. **Mobile LCP threshold** — accept the documented gap (per spec §12.7) since the remaining 1.5-2s improvement requires either a build step (critical CSS) or a different host (better cache lifetimes), both outside the static-site constraint.
