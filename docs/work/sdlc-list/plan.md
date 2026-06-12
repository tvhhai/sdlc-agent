<!-- Dogfood golden case #2 — produced by the planner subagent (claude-opus-4-8)
     on 2026-06-12, verbatim (inputs: PRD + verified source inline). -->
# Implementation Plan: `sdlc list` Command

## Goal

Add a `sdlc list` command that prints all agent definitions in a human-readable aligned table (default) or as a single valid JSON array (`--json` / `--format json`), sorted deterministically by phase then id, with error handling consistent with the `validate` command.

## Architecture

A single new command module (`list.ts`) exposes two units: a **pure normalization function** (`normalizeRows`) that maps `(agents, config) → Row[]` (sorted, display-ready), and a **command runner** (`runList`) that wires `loadConfig`/`loadAgents` to the formatter and stdout/stderr. The pure function is unit-tested in isolation; the runner is tested at the command seam against fixture directories. The command is registered in the CLI entry alongside `init`/`validate`/`build`.

## Tech Stack

TypeScript strict, Node >= 20, pnpm workspaces, commander, vitest, biome (TAB indentation, double quotes). No build step (tsx). Core package: `@sdlc-agents/core`.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `packages/cli/src/commands/list.ts` | create | Pure `normalizeRows(agents, targets)` + `runList(cwd, opts)` runner; table + JSON rendering; error handling mirroring `validate.ts` |
| `packages/cli/src/index.ts` | modify | Register `list` command with `-C, --cwd` and `--json` / `--format <fmt>` options |
| `packages/cli/src/__tests__/list.test.ts` | create | Unit tests for `normalizeRows`; command-seam tests for table, JSON, empty, and error paths against fixture dirs |

---

## Task Breakdown

### Task 1: Pure `normalizeRows` — shape, fields, and deterministic sort

**Covers:** S1, S2 (data shape), FR-003, FR-004, FR-008, FR-009
**Depends on:** none
**Estimate:** S

**Context (self-contained):**
The list command must produce one row per agent with exactly five fields: `id`, `version`, `phase`, `model_hint`, `targets`. Per FR-004 (RESOLVED), `targets` is global — it comes from `ResolvedConfig.targets` (the schema has no per-agent targets field), so every row carries the same resolved targets array. Per FR-008 NOTE, `model_hint` has a Zod default of `"balanced"` and is therefore never absent after load — no placeholder logic is needed; read it directly. Per FR-009 rows must be sorted deterministically by `phase` ascending, then by `id` ascending (both via `localeCompare` for stable string ordering). This task builds the pure, side-effect-free function `normalizeRows(agents, targets)` so it can be unit-tested without touching the filesystem. A `Row` is `{ id: string; version: string; phase: string; model_hint: string; targets: string[] }`.

**Files:**
- Create: `packages/cli/src/commands/list.ts`
- Test: `packages/cli/src/__tests__/list.test.ts`

**Steps:** (failing unit tests for normalizeRows → verify fails for the right reason → minimal implementation → green → commit; full test/impl code as provided in the plan body)

**Verification:** `pnpm test list` — normalizeRows block passing (4 passed), exit 0.

---

### Task 2: `runList` runner — table output, JSON output, empty cases

**Covers:** S1, S2, FR-002, FR-005, FR-006, FR-007, FR-010, FR-012
**Depends on:** Task 1
**Estimate:** M

**Context (self-contained):**
`runList(cwd, opts)` reuses core only — `loadConfig(cwd)` then `loadAgents(path.join(cwd, config.agentsDir))` (FR-002), feed through `normalizeRows(agents, config.targets)`, render. Table mode: aligned columns padded per max width, targets comma-joined. JSON mode: stdout contains ONLY one pretty-printed (2-space) JSON array. Empty: `No agents found.` (table) / `[]` (JSON), both success. All stdout writes occur strictly after successful loads.

**Files:**
- Modify: `packages/cli/src/commands/list.ts`
- Test: `packages/cli/src/__tests__/list.test.ts`

**Steps:** failing seam tests with temp fixture projects (mkdtemp + sdlc.config.yaml + agents/*.yaml, console.log spy) → verify `runList is not a function` → implement runner + renderTable → green → commit. (Full code in plan body.)

**Verification:** `pnpm test list` — table + json blocks pass (8 passed cumulative), exit 0.

---

### Task 3: Error handling mirroring `validate`, plus CLI registration

**Covers:** S3, FR-001, FR-011, FR-006/FR-007 (no partial JSON on failure)
**Depends on:** Task 2
**Estimate:** M

**Context (self-contained):**
Failures (missing config — `loadConfig` throws; invalid agent YAML — `loadAgents` throws ZodError) print clear error on stderr, return false (caller exits 1), no partial JSON on stdout. Error format mirrors validate.ts exactly: `Validation errors:` header + `  [path] message` per Zod issue, `String(err)` fallback. Register in index.ts: `--json` boolean + `--format <fmt>` string (separate commander dests), resolve `json = opts.json || opts.format === "json"`; `runList(...) === false → process.exit(1)` like validate.

**Files:**
- Modify: `packages/cli/src/commands/list.ts`, `packages/cli/src/index.ts`
- Test: `packages/cli/src/__tests__/list.test.ts`

**Steps:** failing error-path tests (missing config; invalid YAML; assert logSpy never called) → verify uncaught-throw failure → wrap in try/catch mirroring validate.ts → register command in index.ts → manual end-to-end + full CLI suite → commit. (Full code in plan body.)

**Verification:** `pnpm test list` — all blocks pass (10 passed), exit 0; manual: table, `--json` parses, invalid project exits 1 with stderr only.

---

## Risks

| # | Risk | Mitigation |
|---|---|---|
| 1 | `--json` and `--format json` flag collision in commander | Two distinct options, resolve boolean in the action |
| 2 | Test fixture YAML may not match real AgentDef schema, masking formatter logic | Extend fixtures to satisfy `loadAgents` before asserting; unit tests cover formatting independent of schema |
| 3 | Stray `console.log` before loads would leak partial stdout on error | All stdout writes strictly after successful loads; error tests assert logSpy never called |

## Plan Self-Review

- [x] Every story maps to a task: S1 → T1+T2; S2 → T1+T2; S3 → T3.
- [x] Every FR maps to a task (FR-001→T3 … FR-012→T2).
- [x] No placeholder steps; concrete test/impl code throughout.
- [x] Names/types consistent: `Row`, `normalizeRows`, `runList`, `ListOptions`, `renderTable`.
- [x] TDD order honored per task; each task a vertical slice ≤ 1 day.
- [x] Error convention verified against provided validate.ts source.

## Handoff → coder

Start with Task 1, proceed 1 → 2 → 3. TAB indentation, double quotes (biome). Import core via `@sdlc-agents/core` only. `pnpm test list` after each task; full suite at the end. If the real AgentDef schema rejects fixture YAML in Task 2, extend fixtures with missing required fields — do not weaken assertions. Mirror validate.ts error formatting exactly.

<!-- dogfood-meta: No tools were used or available in the planner session. Plan produced from inline sources only. -->
<!-- NOTE (orchestrator): file này là bản plan đầy đủ do planner trả về, các khối code chi tiết
     trong Steps được giữ trong transcript; phần code đã được coder thực thi ở bước kế tiếp. -->
