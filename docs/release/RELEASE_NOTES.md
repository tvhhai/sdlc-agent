# Release Notes — sdlc-agent Product Journal

> **Purpose.** Record the product at its baseline (what parts it has, what it does) and a **log of every fix / audit / addition**, so a reader can grasp the project's evolution **without reading git log**.
>
> **Language convention.** This MD is the **source of truth, written in English** (agents read it). The rendered `release-notes.html` is **Vietnamese** for human readers. See [docs/CLAUDE.md](../CLAUDE.md).
>
> **Relation to other docs.** Detail here is kept medium — for full architecture see [SA Design](../architecture/SA_DESIGN_Agentic_SDLC_Agents_Set.md), for folder/code detail see [Codebase Guide](../reference/CODEBASE_FOLDER_GUIDE.md), for the adapter contract see [Adapter Contract](../reference/ADAPTER_CONTRACT.md).
>
> **How to read.** The *Baseline* section describes the stable starting state. The *Changelog* is **newest-first** — each entry is one meaningful change with: type, what was done, why, and impact.
>
> **Update rule.** Insert each new entry at the **head** of the changelog, then re-render the HTML. Never hand-edit the HTML. Full rules in [docs/CLAUDE.md](../CLAUDE.md).

---

## Baseline

`sdlc-agent` is a **build engine**: it turns one canonical set of agent definitions (`agents/*.yaml`) into AI-tool-specific formats. One source of truth, many deterministic render targets.

### Parts

| Part | Role |
|---|---|
| `agents/*.yaml` | **Source of truth.** 6 agents covering the SDLC lifecycle: `requirement-analyst`, `planner`, `solution-architect`, `coder`, `test-generator`, `code-reviewer`. Each file = role + workflow + inputs + policy references + output template. |
| `policies/*.md` | Domain checklists (security, performance, testing-patterns, debugging-and-recovery, conventions…), loaded by agents via the `policies:` field. Reusable across agents. |
| `templates/*.md` | Output artifact templates (PRD, plan, ADR/HLD, test plan, review report…). |
| `packages/core` | Zod schema (strict: kebab-case id, semver, phase enum), YAML loader, `{{var}}` resolver, config merger, shared types. |
| `packages/cli` | The `sdlc init / validate / build / list` commands. |
| `packages/adapters/*` | Each adapter (universal, claude-code, copilot) is a pure & deterministic `ToolAdapter` that renders output for one tool. |
| Output (generated) | `AGENTS.md` + `.sdlc/` (universal), `.claude/agents/` + `.claude/commands/` + `.claude/sdlc/` (Claude Code), `.github/copilot-instructions.md` + `.github/prompts/` (Copilot). Committed on purpose, never hand-edited. |
| `docs/` | SA Design, Codebase Guide, Adapter Contract, and this journal. |

### Functions

- **validate** — schema + referential integrity (every `output_template`/`policies` reference must exist on disk) + valid target names.
- **build** — render all targets → write files + `.sdlc/build-manifest.json`; hash-compare to warn on drift.
- **list** — enumerate defined agents.
- **init** — scaffold `sdlc.config.yaml`.
- **Drift detection** — integration tests fail if committed output diverges from a fresh render, forcing rebuild + commit together.

### Current positioning (read with the 2026-06-16 audit entry)

The actual product today is an **in-place renderer + canonical catalog** (run `pnpm sdlc build` inside this repo) — fully working. The **installable framework** vision (`npx sdlc-agents init` for other teams to install) is still roadmap, not shipped. See the audit entry for the concrete gap.

---

## Changelog (newest first)

### 2026-06-16 · Self-contained Claude outputs (Pilot Readiness Task 1) · `feature`

**Done.** `ClaudeCodeAdapter` now bundles every referenced template + policy under `.claude/sdlc/templates/` and `.claude/sdlc/policies/`, and rewrites the references inside generated agent files from root `templates/…`/`policies/…` to `.claude/sdlc/…`. `.gitignore` tracks the new bundle. Added adapter tests (bundle emission, skip-when-absent, root-ref-free self-containment) and updated the integration/drift tests to scope agent-shaped assertions away from raw support files.

**Why.** Copying `.claude/` alone was incomplete — agent files pointed at root `templates/`/`policies/` that wouldn't travel with the folder. A Codex-driven dogfood (artifacts in `docs/work/2026-06-16/self-contained-claude-outputs/`) ranked this the #1 pilot blocker, ahead of the `skill-md` adapter and the `init` wizard.

**Impact.** `pnpm sdlc build` → claude-code now emits 22 files (6 agents + 6 commands + 10 support: 5 templates + 5 policies); 141/141 tests pass; typecheck + lint clean. `.claude/` is now copyable into another repo standalone. Remaining open: a fully autonomous `/coder` execution writing real code in Claude Code (this feature was implemented by the orchestrator following the plan, not yet by an isolated subagent chain).

### 2026-06-16 · External audit — "in-place vs installable" positioning · `audit`

**Context.** An independent AI review scored: build engine 7/10, agent content 6.5/10, installer/distribution 2/10; concluded "not yet a complete Agent Skills framework".

**Verified findings (checked against code).** The factual claims are **correct**:
- `package.json` sets `private: true`, has no `dist` build, and `bin` points at TS source → `npx sdlc-agents init` does not work as the docs imply.
- `init` only writes `sdlc.config.yaml`; it does **not** copy `agents/`/`policies/`/`templates/` → an empty repo cannot `build`.
- Outputs were **not self-contained**: `.claude/agents/*.md` referenced root `policies/*.md`, which the adapter did not bundle → copying `.claude/agents/` alone broke the links. *(Resolved by the entry above.)*
- No SKILL.md adapter yet; the Step 3 dogfood golden case is incomplete.

**Verdict.** "Unusable" only holds for the **distributable (installable)** product; the **in-place renderer** works today (validate/build/list/test/typecheck/lint all pass). The gap is between *docs/vision* and *the real artifact*, not an architectural failure.

**Action.** Two small high-ROI fixes flip "not usable by others": (1) make `init` bootstrap the agent set; (2) make the bundle self-contained — *done 2026-06-16*. Then `dist` + drop `private` + publish. Near-term: align docs with reality (in-place catalog, pre-pilot).

### 2026-06-16 · Agent v1.2.0 + policy depth + VERIFY hardening · `feature`

**Done.** In ROI order:
1. **Slash commands** — the Claude Code adapter renders an extra `.claude/commands/<id>.md` per agent (entry point `/coder`, `/planner`… with `$ARGUMENTS`). Generated automatically from the same YAML, no hand-written file per tool.
2. **Policy depth** — added 3 checklists (`debugging-and-recovery`, `performance-checklist`, `testing-patterns`, adapted from addyosmani/agent-skills, MIT); enriched `security-checklist` (Threat Modeling, AI/LLM Security, OWASP cross-check).
3. **VERIFY patch** — `coder` and `test-generator` gained a diagnose→recover loop when tests fail unexpectedly (referencing `debugging-and-recovery`).
4. Bumped 3 agents `1.1.0 → 1.2.0`.

**Why.** Close the gap vs addyosmani (slash-command UX, deeper quality gates) and patch the weak VERIFY phase (previously only generated tests, with no recovery loop when they broke).

**Impact.** `build` 26 files (claude-code grew 6→12 with commands), 136/136 tests, typecheck + lint clean. SHIP deliberately deferred — see appendix §9 in `AGENT_CONTENT_PLAN.md` for how to add it later.

### 2026-06-11 · Docs refactor — nav hub replaces iframe SPA · `refactor`

**Done.** `docs/index.html` moved from an iframe SPA to a direct-link nav hub; consolidated assets (`style.css`, `docs.js`); fixed `file://` compatibility and an iframe full-width bug.

**Why.** Simplify and make docs work when opened locally without a server.

**Impact.** Every doc uses the `page-doc` 3-column layout (left nav + content + right TOC), with navigation driven by `docs-manifest.js`.

---

<!--
  HOW TO ADD AN ENTRY (for whoever/whatever updates this later):
  - Insert the new entry DIRECTLY UNDER the "## Changelog" heading, above the current newest entry.
  - Heading format: ### YYYY-MM-DD · <short title> · `<type>`
    type ∈ { feature | fix | audit | refactor | docs | chore }
  - Body should cover: Done / Why / Impact (audit entries add Verified findings).
  - This MD is English (source of truth). After editing, re-render the Vietnamese
    docs/release/release-notes.html from this file. NEVER edit the HTML by hand.
-->
