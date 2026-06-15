# docs/ — Conventions & Rules

## Folder structure

```
docs/
├── index.html              SPA shell — single entry point for all docs
├── docs-manifest.js        nav source of truth → window.__DOCS_MANIFEST__
├── marked.min.js           client-side markdown renderer (UMD build, local copy)
├── style.css               shared design system & layouts (consolidated)
├── docs.js                 custom web components, layout manager, and SPA logic
├── _template.html          reference template — copy when adding a new HTML doc
├── CLAUDE.md               this file
│
├── architecture/           Core architecture docs
│   ├── SA_DESIGN_Agentic_SDLC_Agents_Set.md   ← source of truth
│   └── sa-design.html
│
├── reference/              Reference docs
│   ├── CODEBASE_FOLDER_GUIDE.md               ← source of truth
│   ├── codebase-guide.html
│   ├── ADAPTER_CONTRACT.md                    ← source of truth
│   └── adapter-contract.html
│
├── work/                   AI-generated work artifacts (expandable in SPA)
│   └── _index.js           sub-nav registry → window.__DOCS_INDEX__['work']
│
└── _superpowers/           Internal plans & specs (hidden from SPA nav)
    ├── plans/
    └── specs/
```

## Source of truth rule

**MD files are source of truth. HTML files are rendered views created by an AI agent.**

When content changes:
1. Edit the `.md` file first.
2. Ask the AI agent to re-render the HTML from the MD using the existing styles and rules.
3. Never edit HTML content directly without a matching MD update.

## Navigation — manifest-driven

All navigation is driven by `docs-manifest.js`. **Never hardcode nav across HTML files.**

To add a doc to the SPA sidebar:
1. Add an entry to the correct group in `docs/docs-manifest.js`:
   ```js
   { slug: 'my-doc', title: 'My Doc', icon: '📄',
     file: 'architecture/my-doc.html',   // path relative to docs/
     md:   'architecture/my-doc.md' }
   ```
2. That's it — the sidebar auto-rebuilds on page load.

To add a doc under an expandable folder (e.g. `work/`):
1. Add an entry in the folder's `_index.js` (e.g. `docs/work/_index.js`).
2. Never edit `docs-manifest.js` for sub-entries.

Folders starting with `_` are auto-hidden from the SPA nav (`autoHidePrefix: '_'` in manifest).

## HTML doc layout — `page-doc`

Individual doc HTML files use `body.page-doc` + `.doc-shell` from `docs-layout.css`.
When loaded inside the SPA iframe, `docs-layout.js` auto-detects this and hides the
standalone sidebar/TOC, then posts heading data to the parent shell via `postMessage`.

### Required structure

```html
<body class="page-doc" data-doc="<slug>">

  <!-- mobile toggle (always include even though it hides in iframe) -->
  <button class="doc-nav-toggle" ...>☰</button>
  <div class="doc-nav-backdrop"></div>

  <div class="doc-shell">

    <!-- LEFT: standalone nav (hidden by docs-layout.js when in iframe) -->
    <aside class="doc-nav-sidebar">
      <a class="doc-nav-brand" href="../index.html">sdlc-agent</a>
      <nav class="doc-nav-group">
        <div class="doc-nav-group-label">Group label</div>
        <a class="doc-nav-link" href="..." data-doc="<slug>">
          <span class="doc-nav-link-icon">icon</span> Label
        </a>
      </nav>
    </aside>

    <!-- CENTER: main content -->
    <main class="doc-main">
      <div class="doc-badges">...</div>
      <h1>Title</h1>
      <p class="doc-subtitle">...</p>

      <section class="doc-section">
        <h2 class="doc-section-title" id="unique-slug">Section Title</h2>
        <h3 class="doc-section-subtitle" id="sub-slug">Subsection</h3>
      </section>
    </main>

    <!-- RIGHT: TOC (auto-populated; also sent to parent via postMessage) -->
    <aside class="doc-toc-sidebar">
      <div class="doc-toc-label">On this page</div>
      <nav id="doc-toc-nav"></nav>
    </aside>

  </div>

  <script src="../docs.js" defer></script>
</body>
```

### Key rules

- `body[data-doc]` must match `data-doc` on the nav link — drives standalone active-state.
- Every `<h2 class="doc-section-title">` **must have an `id`** for scroll spy and TOC.
- `h3[id]` headings appear in the TOC with indent (`.toc-depth-3`).
- Asset paths are relative from the doc's subfolder: `../style.css` and `../docs.js`.
- Brand `href` should point to `../index.html` (the SPA shell).

### Layout breakpoints

| Viewport | Layout |
|----------|--------|
| > 1200px | 3-column: left nav (240px) + main + right TOC (220px) |
| ≤ 1200px | 2-column: left nav + main (right TOC hidden) |
| ≤ 860px  | 1-column: main only; left nav slides in via hamburger |

## Shared assets

`style.css` and `docs.js` contain all the style systems, layouts, custom components, and SPA logics. 
Modify them locally as needed to improve typography, layouts, and interactive behaviors.

`marked.min.js` is copied from `node_modules/marked/lib/marked.umd.js` — refresh by
re-running `pnpm add -D marked -w` and copying the new UMD build.

## Adding a new document (full workflow)

1. Create `docs/<category>/<slug>.md` — write content first (source of truth).
2. Ask the AI agent to render `docs/<category>/<slug>.html` from the MD using
   `docs/_template.html` as the structural template and the existing HTML files as style reference.
3. Add an entry to `docs/docs-manifest.js` (or the relevant `_index.js` for expandable folders).
4. Verify via `docs/index.html` in a browser (served with `npx serve docs`).
