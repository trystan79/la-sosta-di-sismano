# PageSpeed / Lighthouse Results

**Date**: 2026-05-16
**Source**: local Lighthouse 12.x via npx (Google PSI API daily quota exhausted)
**Target URLs**: live deploy on `https://www.morganschauer.co.uk/`

## Results vs Section 4.1 thresholds

| Metric | Target (M / D) | idx-mobile | idx-desktop | abt-mobile | abt-desktop |
| --- | --- | --- | --- | --- | --- |
| LCP | ≤ 2.5s / ≤ 1.5s | **4.48s ❌** | 1.18s ✓ | **4.61s ❌** | 0.93s ✓ |
| CLS | ≤ 0.05 / ≤ 0.05 | 0 ✓ | 0.001 ✓ | 0 ✓ | 0.006 ✓ |
| TBT | ≤ 200ms / ≤ 100ms | 0 ✓ | 0 ✓ | 0 ✓ | 0 ✓ |
| Perf score | ≥ 85 / ≥ 95 | **75 ❌** | 97 ✓ | **76 ❌** | 98 ✓ |
| Accessibility | ≥ 95 | **93 ❌** | **93 ❌** | **92 ❌** | **92 ❌** |
| Best Practices | ≥ 95 | 96 ✓ | 96 ✓ | 96 ✓ | 96 ✓ |
| SEO | = 100 | 100 ✓ | 100 ✓ | 100 ✓ | 100 ✓ |

## Gaps

### Gap 1 — Mobile LCP (4.5s on both pages, target 2.5s)

Driver: the hero image (`images/hero.jpg`, 1200×800, 322 KB) is loaded as a CSS background of `.hero.has-image`, so the browser does not discover it until after CSS is parsed. On 4G mobile this delays LCP by ~3s.

**Proposed remediation (no build step required):**

1. Add `<link rel="preload" as="image" href="images/hero.jpg" fetchpriority="high">` to the home page `<head>`. Starts the hero fetch in parallel with CSS, eliminating discovery delay. Expected LCP improvement: ~1.5–2s.
2. (Optional, larger impact) re-encode `hero.jpg` to ~150 KB at the same dimensions. Current 322 KB is a fairly conservative compression; a modern encoder can halve it without visible quality loss.

If both are applied, mobile LCP should land at or below 2.5s.

### Gap 2 — Accessibility 92–93 (target 95)

Three audit failures, all on both pages:

**a) Color contrast** — three elements fail WCAG AA contrast (4.5:1):
- `a.nav-links a.active` (active nav link)
- `a.nav-cta` (the Enquire button)
- `span.italian` (the Italian-language phrase styled in terracotta within the intro paragraph)

These are visual design changes. They require darkening the foreground or background of those elements; the exact ratio adjustment depends on the brand palette and is not a mechanical fix.

**b) Missing `<main>` landmark** — page has `<nav>`, sections, `<footer>` but no `<main>` wrapping the primary content. Trivial fix: add `<main>` around the body sections between `</nav>` and `<footer>`.

**c) Heading order** — page goes h1 → h2 → h3 throughout the body, then jumps to h4 in the footer. Trivial fix: change footer `<h4>` to `<h3>`, or add a visually-hidden h2 inside the footer.

### Gap 3 — Mobile Performance score 75–76 (target 85)

This is driven entirely by Gap 1 (LCP). Fixing the hero loading strategy should pull Perf above 85 on mobile.

## Items already meeting target

- All CLS, TBT, Best Practices, SEO scores pass on every URL.
- Desktop LCP and Perf already comfortable.
- Image hygiene (width/height/lazy) from Ticket 6 is working — zero layout shift on all four runs.

## Proposed next action

Mechanical, zero-design-risk fixes (preload hero, add `<main>`, footer h4→h3) can ship immediately and should resolve Gap 1 and 2/3 of Gap 2. Color contrast (Gap 2a) is a visual design call and is held for owner approval before the palette is touched.

Re-run Lighthouse after the mechanical fixes ship to confirm Mobile LCP < 2.5s and Accessibility ≥ 95.
