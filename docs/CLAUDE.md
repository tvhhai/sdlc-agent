# docs/ — Conventions & Rules

## Folder structure

```
docs/
├── index.html              Nav hub — lists all docs with direct links (no iframe)
├── docs-manifest.js        nav source of truth → window.__DOCS_MANIFEST__
├── marked.min.js           client-side markdown renderer (UMD build, local copy)
├── style.css               shared design system & layouts (consolidated)
├── docs.js                 layout manager for individual HTML doc pages
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
├── release/                Release & product evolution log
│   ├── RELEASE_NOTES.md                       ← source of truth
│   └── release-notes.html
│
├── work/                   AI-generated work artifacts
│   └── _index.js           sub-nav registry → window.__DOCS_INDEX__['work']
│
└── _superpowers/           Internal plans & specs (hidden from nav)
    ├── plans/
    └── specs/
```

## How index.html works

`index.html` is a **simple navigation hub** — it reads `docs-manifest.js` (and folder `_index.js` files) and renders clickable cards for each doc. Clicking a card navigates directly to the HTML file (full-page, same tab). No iframe, no SPA routing.

This works with `file://` (open locally) and any HTTP server.

## Source of truth rule

**MD files are source of truth. HTML files are rendered views created by an AI agent.**

When content changes:
1. Edit the `.md` file first.
2. Ask the AI agent to re-render the HTML from the MD using `_template.html` as structure reference.
3. Never edit HTML content directly without a matching MD update.

## Language convention

**MD is English; HTML is Vietnamese.** The Markdown source is written in **English** because agents (and other AI tools) read it as context — English keeps it consistent with the codebase and the YAML/policy sources. The rendered **HTML is Vietnamese** for human readers. So a render is also a translation: take the English MD and produce a Vietnamese HTML view that keeps the same structure, ids, and code/identifiers (code, paths, command names stay verbatim — do not translate them).

Applies to new docs (e.g. `release/RELEASE_NOTES.md`). Some older docs (`SA_DESIGN…`, `CODEBASE_FOLDER_GUIDE`) still have Vietnamese MD — convert them only when explicitly asked; don't mass-rewrite.

## Navigation — manifest-driven

All top-level navigation is driven by `docs-manifest.js`. Never hardcode links in `index.html`.

To add a doc:
1. Add an entry to the correct group in `docs/docs-manifest.js`:
   ```js
   { slug: 'my-doc', title: 'My Doc', icon: '📄',
     file: 'architecture/my-doc.html',   // path relative to docs/
     md:   'architecture/my-doc.md' }
   ```
2. That's it — `index.html` auto-generates the card on next load.

If only `md` is set (no `file`), the card links to the MD file and shows a `MD` badge.

To add a doc under an expandable folder (e.g. `work/`):
1. Add an entry in the folder's `_index.js` (e.g. `docs/work/_index.js`).
2. Never edit `docs-manifest.js` for sub-entries.

Folders starting with `_` are auto-hidden (`autoHidePrefix: '_'` in manifest).

## HTML doc layout — `page-doc`

Individual doc HTML files use `body.page-doc` + `.doc-shell`. When opened directly in the browser, they show a 3-column layout (left nav + main content + right TOC). The left nav includes a brand link back to `../index.html`.

### Required structure

```html
<body class="page-doc" data-doc="<slug>">

  <!-- mobile toggle -->
  <button class="doc-nav-toggle" ...>☰</button>
  <div class="doc-nav-backdrop"></div>

  <div class="doc-shell">

    <!-- LEFT: standalone nav -->
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

    <!-- RIGHT: TOC (auto-populated by docs.js) -->
    <aside class="doc-toc-sidebar">
      <div class="doc-toc-label">On this page</div>
      <nav id="doc-toc-nav"></nav>
    </aside>

  </div>

  <script src="../docs.js" defer></script>
</body>
```

### Key rules

- `body[data-doc]` must match `data-doc` on the nav link — drives active-state highlighting.
- Every `<h2 class="doc-section-title">` **must have an `id`** for scroll spy and TOC.
- `h3[id]` headings appear in the TOC with indent (`.toc-depth-3`).
- Asset paths are relative from the doc's subfolder: `../style.css` and `../docs.js`.

### Layout breakpoints

| Viewport | Layout |
|----------|--------|
| > 1200px | 3-column: left nav (240px) + main + right TOC (220px) |
| ≤ 1200px | 2-column: left nav + main (right TOC hidden) |
| ≤ 860px  | 1-column: main only; left nav slides in via hamburger |

## Shared assets

`style.css` and `docs.js` contain all styles and layout logic.

`marked.min.js` is copied from `node_modules/marked/lib/marked.umd.js` — refresh by
re-running `pnpm add -D marked -w` and copying the new UMD build.

## Release Notes — `release/RELEASE_NOTES.md` (special rules)

This is a **living changelog**, not a write-once doc. It records the product baseline plus one entry per meaningful fix / audit / addition, so a reader grasps the project's evolution **without reading git log**.

- **Source of truth is the MD.** `release-notes.html` is a rendered view — never hand-edit it. Edit the MD, then re-render.
- **Newest-on-top, append-only.** Insert each new entry at the **head** of the "Nhật ký cải tiến" section (right under the `## Nhật ký cải tiến` heading), above the previous newest entry. Never reorder or rewrite old entries — they are a historical record.
- **Token-cheap update.** Because entries go on top, you only need to read the **first ~40 lines** of the MD to insert a new one — don't read the whole file. Re-render only the changelog portion of the HTML; keep the baseline section untouched unless the product baseline itself changed.
- **Entry format.** Heading: `### YYYY-MM-DD · <short title> · \`<type>\`` where `type ∈ {feature | fix | audit | refactor | docs | chore}`. Body covers **Đã làm / Vì sao / Tác động** (audit entries add **Kết quả kiểm chứng**). In HTML, map `type` to the matching `.rn-tag.<type>` colour class.
- **Detail level is medium.** Deep architecture lives in SA Design; deep folder/code detail lives in Codebase Guide. Link to them rather than duplicating.
- **When to add an entry.** A version bump, a new capability, an audit/review with verified findings, or a structural refactor — not routine commits.

## Adding a new document (full workflow)

1. Create `docs/<category>/<slug>.md` — write content first (source of truth).
2. Ask the AI agent to render `docs/<category>/<slug>.html` from the MD using
   `docs/_template.html` as the structural template and the existing HTML files as style reference.
3. Add an entry to `docs/docs-manifest.js` (or the relevant `_index.js` for expandable folders).
4. Open `docs/index.html` in a browser to verify the card appears and the link works.
