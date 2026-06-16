# Performance Checklist

Quick reference for reviewing the performance of the code under review. Flag a
hit as **Warning** by default; **Critical** when it degrades a hot path or scales
with data/users (N+1, unbounded queries, main-thread blocking).

> Apply the sections relevant to the change. A backend-only diff does not need
> the font checklist; a CLI tool does not need Core Web Vitals.

## Core Web Vitals Targets (web UIs)

| Metric | Good | Needs Work | Poor |
|--------|------|------------|------|
| LCP (Largest Contentful Paint) | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| INP (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms | > 500ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |

## TTFB Diagnosis (slow first byte, > 800ms)

- [ ] **DNS resolution** slow → `dns-prefetch` / `preconnect` for known origins
- [ ] **TCP/TLS handshake** slow → enable HTTP/2, keep-alive, consider edge
- [ ] **Server processing** slow → profile backend, check slow queries, add caching

## Frontend

### Images
- [ ] Modern formats (WebP, AVIF)
- [ ] Responsively sized (`srcset` / `sizes`)
- [ ] Explicit `width`/`height` to prevent CLS
- [ ] Below-the-fold uses `loading="lazy"` + `decoding="async"`
- [ ] Hero/LCP image uses `fetchpriority="high"`, no lazy loading

### JavaScript
- [ ] Initial bundle under ~200KB gzipped
- [ ] Route/feature code splitting with dynamic `import()`
- [ ] Tree shaking enabled (dependency ships ESM, `sideEffects: false`)
- [ ] No blocking JS in `<head>` (`defer`/`async`)
- [ ] Long tasks (> 50ms) broken up to keep the main thread free — the main INP lever
- [ ] Memoisation (`React.memo`/`useMemo`/`useCallback`) only where profiling shows benefit
- [ ] Non-critical work (analytics, logging) deferred out of event handlers
- [ ] Heavy third-party scripts `async`/`defer` and fronted by a facade

### CSS & Fonts
- [ ] Critical CSS inlined/preloaded; no render-blocking non-critical CSS
- [ ] No CSS-in-JS runtime cost in production (use extraction)
- [ ] 2–3 font families max, WOFF2 only, `font-display: swap`
- [ ] LCP-critical fonts preloaded; consider system font stack first

### Network & Rendering
- [ ] Static assets cached with long `max-age` + content hashing
- [ ] HTTP/2 or HTTP/3 enabled; `preconnect` for known origins
- [ ] No layout thrashing (batch DOM reads then writes)
- [ ] Animations use `transform`/`opacity` (GPU-accelerated)
- [ ] Long lists virtualized; off-screen sections use `content-visibility: auto`

## Backend

### Database
- [ ] No N+1 query patterns (eager loading / joins)
- [ ] Queries have appropriate indexes for filtered/sorted columns
- [ ] List endpoints paginated — never `SELECT *` over an unbounded table
- [ ] Connection pooling configured; slow query logging enabled

### API & Services
- [ ] p95 response time within target (< 200ms for interactive APIs)
- [ ] No synchronous heavy computation in request handlers
- [ ] Bulk operations instead of loops of individual calls
- [ ] Response compression (gzip/brotli); appropriate caching (in-memory/Redis/CDN)

## Measurement

- Field data first (RUM / CrUX) before optimising; test on mid-range hardware.
- Lighthouse: `npx lighthouse <url> --output json --output-path ./report.json`
- Bundle analysis: `npx vite-bundle-visualizer` or `webpack-bundle-analyzer`
- In code: `web-vitals` (`onLCP`, `onINP`, `onCLS`); use the attribution build to
  break INP into input delay / processing / presentation.

## Common Anti-Patterns

| Anti-Pattern | Impact | Fix |
|---|---|---|
| N+1 queries | Linear DB load growth | Joins, includes, batch loading |
| Unbounded queries | Memory exhaustion, timeouts | Paginate, add LIMIT |
| Missing indexes | Slow reads as data grows | Index filtered/sorted columns |
| Layout thrashing | Jank, dropped frames | Batch DOM reads, then writes |
| Unoptimized images | Slow LCP, wasted bandwidth | WebP, responsive sizes, lazy load |
| Large bundles | Slow Time to Interactive | Code split, tree shake, audit deps |
| Blocking main thread | Poor INP, unresponsive UI | Chunk long tasks, offload to workers |
| Memory leaks | Growing memory, eventual crash | Clean up listeners, intervals, refs |
