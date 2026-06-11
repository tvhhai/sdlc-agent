# docs/ — Conventions & Rules

## Folder structure

Each document lives in its own subfolder alongside its HTML viewer:

```
docs/
├── style.css              shared dark-mode design system (expense_tracker pattern)
├── docs-core.js           custom web components: <doc-tabs>, <doc-card>, <doc-alert>, <doc-accordion>
├── docs-layout.css        3-column sidebar layout: body.page-doc + .doc-shell grid
├── docs-layout.js         DocLayoutManager: active-doc marking, auto TOC, scroll spy, mobile toggle
├── _template.html         reference template — copy this when adding a new doc
├── CLAUDE.md              this file
├── sa-design/
│   ├── SA_DESIGN_Agentic_SDLC_Agents_Set.md   ← source of truth
│   └── sa-design.html
├── codebase-guide/
│   ├── CODEBASE_FOLDER_GUIDE.md               ← source of truth
│   └── codebase-guide.html
└── adapter-contract/
    ├── ADAPTER_CONTRACT.md                    ← source of truth
    └── adapter-contract.html
```

## Source of truth rule

**MD files are source of truth. HTML files are rendered views.**

When content changes:
1. Edit the `.md` file first.
2. Reflect the change in the `.html` file — do not let them drift.
3. Never change HTML content without a matching MD update.

## HTML layout — `page-doc` (3-column sidebar)

All doc HTML files use `body.page-doc` + `.doc-shell` from `docs-layout.css`.

### Required structure

```html
<body class="page-doc" data-doc="<slug>">

  <!-- mobile toggle (always include) -->
  <button class="doc-nav-toggle" ...>☰</button>
  <div class="doc-nav-backdrop"></div>

  <div class="doc-shell">

    <!-- LEFT: navigation sidebar (same across all docs) -->
    <aside class="doc-nav-sidebar">
      <a class="doc-nav-brand" href="...">...</a>
      <nav class="doc-nav-group">
        <div class="doc-nav-group-label">Group label</div>
        <a class="doc-nav-link" href="..." data-doc="<slug>">
          <span class="doc-nav-link-icon">icon</span> Label
        </a>
      </nav>
    </aside>

    <!-- CENTER: main content -->
    <main class="doc-main">
      <!-- hero: badges + h1 + subtitle -->
      <div class="doc-badges">...</div>
      <h1>Title</h1>
      <p class="doc-subtitle">...</p>

      <!-- sections — h2[id] drives right TOC + scroll spy -->
      <section class="doc-section">
        <h2 class="doc-section-title" id="unique-slug">Section Title</h2>
        <!-- h3[id] also appears in TOC with indent -->
        <h3 class="doc-section-subtitle" id="sub-slug">Subsection</h3>
      </section>
    </main>

    <!-- RIGHT: TOC sidebar (auto-populated by docs-layout.js) -->
    <aside class="doc-toc-sidebar">
      <div class="doc-toc-label">On this page</div>
      <nav id="doc-toc-nav"></nav>
    </aside>

  </div>

  <script src="../docs-core.js"></script>
  <script src="../docs-layout.js" defer></script>
</body>
```

### Key rules

- `body[data-doc]` must match the `data-doc` on the corresponding `.doc-nav-link` — this is how the left sidebar highlights the current doc.
- Every `<h2 class="doc-section-title">` **must have an `id`** for scroll spy and anchor links.
- `h3[id]` headings appear in the right TOC with an indent (`.toc-depth-3`).
- Asset paths are relative: `../style.css`, `../docs-layout.css`, `../docs-core.js`, `../docs-layout.js`.
- Inline `<style>` blocks are for **doc-specific** classes only (e.g. `.rule-row`, `.phase-group`). Layout and typography are owned by `docs-layout.css`.

### Layout breakpoints

| Viewport | Layout |
|----------|--------|
| > 1200px | 3-column: left nav (240px) + main + right TOC (220px) |
| ≤ 1200px | 2-column: left nav + main (right TOC hidden) |
| ≤ 860px  | 1-column: main only; left nav slides in via hamburger button |

## Shared assets

`style.css` and `docs-core.js` come from the expense_tracker docs system.
`docs-layout.css` and `docs-layout.js` are local to sdlc-agent.

Update `style.css` / `docs-core.js` together when the upstream design system is refreshed — do not modify them locally to avoid drift.

## Adding a new document

1. Create `docs/<slug>/` subfolder.
2. Write `<slug>.md` (content first — source of truth).
3. Copy `docs/_template.html` → `docs/<slug>/<slug>.html`.
4. Set `body[data-doc]="<slug>"` and `data-doc="<slug>"` on the nav link.
5. Add a nav link for the new doc in the `<aside class="doc-nav-sidebar">` of **all** existing HTML files.
6. Add links in `README.md`.
