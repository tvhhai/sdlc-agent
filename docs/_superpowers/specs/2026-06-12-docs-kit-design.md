# Docs Kit — Design Spec

**Date:** 2026-06-12  
**Status:** Approved  
**Scope:** docs/ folder architecture, root index viewer, manifest-driven nav

---

## Problem

Current `docs/` system has two pain points:

1. **Nav is hardcoded** in every HTML file — adding one doc requires editing all existing HTML files.
2. **No central entry point** — no root `index.html` to see and navigate all docs from one place.

---

## Goals

- Root `index.html` as the single viewer for all docs (3-column layout: sidebar, content, TOC)
- Sidebar auto-built from `docs-manifest.json` — adding a folder only requires one manifest update
- MD = source of truth; AI agent renders HTML on demand (no auto-convert tool)
- HTML files remain independently openable (backward compatible)
- Hide folders via `_prefix` or manifest config
- Toggle HTML ↔ MD view per doc
- Core kit reusable across any project; optional folders added per-project need

---

## Architecture Decision: Option C — SPA Shell + iframe embed

**index.html is the layout shell.** Individual HTML doc files keep their full layout but detect when running inside an iframe and hide their own sidebar/TOC. Both modes work:

- Via `index.html` → seamless 3-column experience, sidebar from manifest
- Direct file open → standalone page with its own sidebar/TOC intact

Rejected alternatives:
- **Option A (content fragments)**: cleaner but breaks direct-open and requires refactoring all existing HTML files
- **Option B (portal/link hub)**: preserves HTML files but no unified viewer, full reload on every doc switch

---

## Folder Structure

### Core kit — scaffolded in every project

```
docs/
├── index.html              ← SPA shell (root viewer)
├── docs-manifest.json      ← nav config: groups, ordering, hidden
├── style.css               ← shared design system
├── docs-core.js            ← web components
├── docs-layout.css         ← 3-column layout
├── docs-layout.js          ← layout manager (updated with iframe detection)
├── _template.html          ← AI agent render template
├── CLAUDE.md               ← docs rules (updated)
│
├── business/               [CORE] Business context, goals, stakeholders, business case
├── architecture/           [CORE] HLD, ADRs, C4 diagrams, system design decisions
├── guides/                 [CORE] Onboarding, runbooks, how-to guides
└── reference/              [CORE] API docs, contracts, codebase map, glossary
```

### Optional folders — add per project need

| Folder | Use |
|---|---|
| `requirements/` | Functional/non-functional requirements, product specs |
| `plan/` | Roadmap, milestones, release plans, sprint docs |
| `testing/` | Test strategy, test plans, QA process |
| `audit/` | Security audits, compliance reviews, code audit findings |
| `security/` | Threat models, pentest findings, security policies |
| `incidents/` | Postmortems, incident reports, RCAs |
| `changelog/` | Release notes, migration guides |
| `solutions/` | Solution designs for specific problems |
| `decisions/` | ADR list (if separated from architecture/) |

### AI-gen folders — for teams using AI agents

| Folder | Use |
|---|---|
| `work/` | Per-feature subfolder: PRD, plan, evaluation |
| `specs/` | Design specs from brainstorming sessions |
| `reviews/` | Code review reports |
| `reports/` | Agent evaluations, metrics |

### Hidden folders — never appear in sidebar

| Convention | Behavior |
|---|---|
| `_prefix` (e.g., `_drafts/`) | Auto-hidden by `autoHidePrefix` rule |
| `_archive/` | Old docs kept for reference |
| `_superpowers/` | Internal AI brainstorm session artifacts |

---

## docs-manifest.json

Single file that drives the entire sidebar. Lives at `docs/docs-manifest.json`.

```json
{
  "project": "sdlc-agent",
  "autoHidePrefix": "_",
  "groups": [
    {
      "label": "Core",
      "entries": [
        { "slug": "business",     "title": "Business",      "icon": "🏢", "file": "overview.html" },
        { "slug": "architecture", "title": "Architecture",  "icon": "🏗", "expandable": true },
        { "slug": "guides",       "title": "Guides",        "icon": "📖", "expandable": true },
        { "slug": "reference",    "title": "Reference",     "icon": "📚", "expandable": true }
      ]
    }
  ]
}
```

**Rules:**
- Each entry maps to `docs/<slug>/` folder
- `"file"`: which HTML file to load. Defaults to `<slug>.html` if omitted. Required when folder name ≠ file name.
- `"expandable": true` → folder has multiple docs; must have `docs/<slug>/_index.json` (AI agents manage this file, not root manifest)
- `"hidden": true` on an entry → omit from sidebar, still accessible via direct URL
- Groups are rendered in array order; add new groups freely

### Expandable folder — `_index.json`

Used by AI-gen folders (`work/`, `specs/`) so AI agents manage their own index without touching the root manifest.

```json
{
  "title": "AI Work",
  "entries": [
    {
      "slug": "sdlc-list",
      "title": "SDLC List Command",
      "docs": [
        { "file": "prd.html",        "title": "PRD",        "md": "prd.md" },
        { "file": "plan.html",       "title": "Plan",       "md": "plan.md" },
        { "file": "evaluation.html", "title": "Evaluation", "md": "evaluation.md" }
      ]
    }
  ]
}
```

---

## index.html — SPA Shell

### Behavior

- **On load**: fetch `docs-manifest.json` → build sidebar
- **Hash routing**: `index.html#architecture/hld` loads `docs/architecture/hld.html` into iframe
- **Default route**: first entry of first group
- **Expandable folders**: fetch `<slug>/_index.json` on first expand, render sub-entries
- **TOC (right panel)**: receive `postMessage` from iframe with headings → build TOC
- **Toggle HTML/MD**: swap iframe src between `.html` and `.md`; MD mode renders inline with `marked.js` CDN (no iframe for MD)

### Toggle behavior

| Mode | How |
|---|---|
| HTML (default) | Load `.html` file in iframe |
| MD | Hide iframe, fetch `.md` file, render with `marked.js` in center panel |

The `.md` path is derived from the manifest entry or by swapping `.html` → `.md` in the current src.

---

## docs-layout.js — iframe detection

Add to the top of `DocLayout.init()`:

```js
if (window.parent !== window) {
  document.querySelector('.doc-nav-sidebar')?.remove();
  document.querySelector('.doc-toc-sidebar')?.remove();
  document.querySelector('.doc-nav-toggle')?.remove();
  document.querySelector('.doc-nav-backdrop')?.remove();
  const headings = document.querySelectorAll('h2[id], h3[id]');
  window.parent.postMessage({
    type: 'doc-headings',
    data: Array.from(headings).map(h => ({
      id: h.id,
      text: h.textContent.trim(),
      level: parseInt(h.tagName[1], 10)
    }))
  }, '*');
  return; // skip rest of init (markActiveDoc, buildToc, scrollSpy, mobileToggle)
}
```

This runs on every HTML doc when loaded in iframe. When opened directly the block is skipped entirely.

---

## Hide / Show Rules

### Priority order (highest wins)

1. `autoHidePrefix: "_"` in manifest → any folder starting with `_` is hidden
2. `"hidden": true` on a manifest entry → hidden from sidebar
3. `.docs-user.json` at `docs/` root → per-user overrides (can be gitignored)

### .docs-user.json (optional, per-user)

```json
{
  "hidden": ["audit", "security"],
  "groupOrder": ["Core", "Reference", "Work"]
}
```

Gitignore this file for personal preferences, or commit it for shared team config.

---

## Rules for AI Agents (CLAUDE.md updates)

When creating a new doc:

1. Write `.md` first (source of truth)
2. Render `.html` from MD using existing style/rules; base on `_template.html`
3. If the target folder already has a manifest entry → no manifest change needed
4. If it's a new top-level folder → add entry to `docs/docs-manifest.json`
5. If it's a subfolder of `work/` or `specs/` → update `<folder>/_index.json` (not root manifest)
6. Never edit `docs/index.html` directly

---

## Migration — current project (sdlc-agent)

| Current path | New path | Action |
|---|---|---|
| `docs/sa-design/` | `docs/architecture/` | Move + rename |
| `docs/codebase-guide/` | `docs/reference/` | Move (or keep slug, add to reference group) |
| `docs/adapter-contract/` | `docs/reference/` | Move (or keep slug, add to reference group) |
| `docs/work/` | `docs/work/` | Stay, add `_index.json` |
| `docs/superpowers/plans/` | `docs/_superpowers/plans/` | Rename to hide |

Existing HTML files require one change: `docs-layout.js` gains iframe detection (single edit, all files benefit automatically since they all `<script src="../docs-layout.js">`).

---

## Out of scope

- Auto-conversion of MD to HTML (human or AI agent does this on demand)
- Full-text search across docs
- Versioning / multi-version docs
- Server-side rendering or build step for the viewer itself
- Nested sidebar beyond 2 levels (group → doc → sub-doc is max)
