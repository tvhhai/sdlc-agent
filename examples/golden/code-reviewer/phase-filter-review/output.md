# Code Review: `sdlc list --phase` filter

**Reviewer:** real `code-reviewer` subagent run (this session, via Claude Code `Agent` tool, `subagent_type: code-reviewer`)
**Verdict: Approve (with minor suggestions)**

**Scope reviewed:** commits `6d4eba0` + `cac5050` (`git diff 943777d..cac5050 -- packages/cli`). Files: `packages/cli/src/commands/list.ts`, `packages/cli/src/index.ts`, `packages/cli/src/__tests__/list.test.ts`.

**Declared requirement:** add `--phase <phase>` to `sdlc list`; filter to matching agents; unknown phase → clear stderr error + non-zero exit (never silently zero rows); compose with `--json` / `--format json`.

## Requirement verification

Each clause checked against the actual code, not just the diff:

| Requirement | Status | Evidence |
|---|---|---|
| `--phase <phase>` option exists on `list` | Met | `index.ts:38` `.option("--phase <phase>", ...)` |
| Filters to matching agents | Met | `list.ts:85-87` `rows.filter((r) => r.phase === opts.phase)` |
| Unknown phase → stderr + non-zero exit | Met | `list.ts:73-80` throws before any load; caught at `list.ts:106` → `console.error` + returns `false`; `index.ts:48` `process.exit(1)` |
| Never silently returns zero rows for a typo | Met | Validation against `VALID_PHASES` (derived from the Zod enum, `list.ts:20`) precedes filtering — a bogus value can't fall through to an empty filter |
| Composes with `--json` / `--format json` | Met | Filter applies to `filtered` before the `opts.json` branch (`list.ts:85-91`); `index.ts:46` resolves both flags into `json` |

The validation runs **before** `loadConfig`/`loadAgents` (`list.ts:73` precedes `82`), so an unknown phase fails fast and deterministically even in a broken project — a genuinely good design choice, not an accident.

Independently re-run: **14/14 tests pass**, `pnpm typecheck` clean, `biome check` on the three files clean.

## Findings

### Critical
None.

### Warning
None.

### Suggestion

1. **`list.ts:75` — `as never` cast hides a slightly awkward type** *(Suggestion, non-blocking)*
   `!VALID_PHASES.includes(opts.phase as never)` works but `as never` is a code smell that obscures intent. `VALID_PHASES` is `readonly Phase[]` and `opts.phase` is `string`; the cleaner idiom is `(VALID_PHASES as readonly string[]).includes(opts.phase)`, which widens the array rather than narrowing the value to `never`. Same runtime behaviour, clearer intent. Minor.

2. **`list.ts:74` vs `list.ts:85` — two different emptiness checks for `opts.phase`** *(Suggestion, non-blocking)*
   Validation guards on `opts.phase !== undefined` (line 74) but filtering guards on truthiness `opts.phase ?` (line 85). These diverge only for the empty string `--phase ""`: an empty string would pass validation (it's `!== undefined`, fails the `includes` check) and correctly throw "Unknown phase". So behaviour is actually correct — but the inconsistency is a latent trap if someone later changes line 74. Consider using `opts.phase !== undefined` in both spots for consistency. Cosmetic.

3. **No test asserting `--phase` composes with the empty-project / unknown-value-in-json path** *(Suggestion, non-blocking)*
   Test coverage is strong (table filter, json filter, no-match, unknown phase). One small gap: there's no test that an **unknown phase in JSON mode** still goes to stderr with no stdout (the unknown-phase test only runs `json: false`). The code path is shared so risk is low, but since the requirement explicitly couples "unknown phase" with "compose with json", a `{ json: true, phase: "bogus" }` assertion would lock that intersection. Nice-to-have.

## Checklist results

- **Security** (`security-checklist.md`): No hits. `--phase` is validated against a fixed enum before use. No SQL, no file-path construction from the phase value, no secrets, no new deps, no lockfile change, no LLM/network surface. The error message echoes the user's input but only to the local CLI's stderr — no injection sink. Clean.
- **Performance** (`performance-checklist.md`): CLI tool, not a web/DB path. The added work is one `Array.filter` over an already-in-memory, already-loaded roster — O(n) over a tiny set. No concerns.
- **Conventions** (`conventions.md`): `VALID_PHASES` correctly `UPPER_SNAKE_CASE`; `runList` stays well under 40 lines; early-return/throw style preserved; no swallowed errors. Tests cover happy path and the regression (unknown phase). Pass.

## Not reviewed / out of scope

- **`@sdlc-agents/core` internals** — confirmed `AgentSchema.shape.phase.options` resolves to the 8-value enum at `schema.ts:31-40`, but did not re-review the loader/config code those functions call; unchanged by this PR.
- **`commander` flag-parsing edge cases** — e.g. `--phase` with no argument, or repeated `--phase`. commander's own behaviour, not exercised by these unit tests (they call `runList` directly, bypassing the CLI parse layer at `index.ts:39-50`).
- **User-facing docs** — the PRD at `docs/work/sdlc-list/prd.md:92` (an earlier, unrelated PRD for the base `list` command, dated 2026-06-12) explicitly lists `list --phase` as out-of-scope/"future enhancement" at the time it was written. This PR legitimately implements that later, per the new dogfood requirement, so the contradiction is expected, not a defect. *(Verified independently: this file and line genuinely exist with this content — not a hallucinated citation.)*

## Handoff

No blocking changes. The three suggestions above are optional polish — none gate merge. If addressing them, suggestion 1 (`as never` → `as readonly string[]`) is the highest-value and lowest-risk.
