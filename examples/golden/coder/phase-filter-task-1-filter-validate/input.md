# Input given to `coder`

**Mechanism:** real Claude Code `Agent` tool call, `subagent_type: coder`. Given exactly one self-contained Task block from the plan below, per `agents/coder.yaml`'s expectation (`inputs: task` required, `plan` optional context).

**Task block (verbatim from the plan):**

### Task 1: Filter + validate phase in `runList`

**Covers:** Core filtering behavior, unknown-phase error
**Depends on:** none
**Estimate:** M

**Context (self-contained):**
`packages/core/src/schema.ts:31` defines `phase: z.enum(["requirement","planning","architecture","coding","review","testing","release","maintenance"])` on `AgentSchema`, which is already exported from `@sdlc-agents/core` (`packages/core/src/index.ts:6`). `packages/cli/src/commands/list.ts` currently has `ListOptions = { json: boolean }` and `runList(cwd, opts)` builds `rows` via `normalizeRows`, then prints table/json, with a try/catch that prints `ZodError` issues specially and falls back to `console.error(String(err))` for any other thrown error, returning `false`. Add a `phase?: string` to `ListOptions`. At the top of the `try` block in `runList`, before touching the filesystem, validate `opts.phase` (if defined) against `AgentSchema.shape.phase.options` — if it's not one of those values, `throw new Error(...)` with a message listing the valid phases; this will be caught by the existing `else` branch and printed via `console.error`, giving stderr output + `return false` for free. When `opts.phase` is valid, filter `rows` to `r.phase === opts.phase` before the json/table/"No agents found." branches (so an empty filtered result still hits the existing "No agents found." path).

**Files:**
- Modify: `packages/cli/src/commands/list.ts`
- Test: `packages/cli/src/__tests__/list.test.ts`

**Steps:**
- [ ] Write failing test in `list.test.ts`: new `describe("runList --phase filter")` block with a project containing `AGENT_A` (phase `planning`) and `AGENT_B` (phase `coding`); `it("returns only rows matching the given phase in table mode")` calling `runList(dir, { json: false, phase: "coding" })`, asserting `ok === true` and the logged table has exactly 2 lines (header + the `beta` row), with no `alpha` row
- [ ] Add a second failing test in the same describe: `it("returns only rows matching the given phase in json mode")` calling `runList(dir, { json: true, phase: "planning" })`, asserting the parsed JSON array has length 1 and `id === "alpha"`
- [ ] Add a third failing test: `it("prints 'No agents found.' when no agent matches the phase")` calling `runList(dir, { json: false, phase: "testing" })` (valid enum value, zero matches), asserting `ok === true` and `console.log` was called with `"No agents found."`
- [ ] Add a fourth failing test in a new `describe("runList unknown phase")`: `it("fails with stderr and no stdout for an unrecognized phase")` calling `runList(dir, { json: false, phase: "bogus" })`, asserting `ok === false`, `logSpy` was never called, and the joined `errSpy` output contains `"bogus"` and at least one valid phase name (e.g. `"coding"`)
- [ ] Run `pnpm vitest run packages/cli/src/__tests__/list.test.ts` — confirm all four new tests fail
- [ ] Implement: in `list.ts`, import `AgentSchema` from `@sdlc-agents/core`; add `phase?: string` to `ListOptions`; at the top of the `try` block add the validation throw against `AgentSchema.shape.phase.options`; after `const rows = normalizeRows(...)`, add `const filtered = opts.phase ? rows.filter((r) => r.phase === opts.phase) : rows;` and replace the three downstream uses of `rows` with `filtered`
- [ ] Run `pnpm vitest run packages/cli/src/__tests__/list.test.ts` — all green, including the four pre-existing test groups (no regression)
- [ ] Refactor if needed (e.g. extract `VALID_PHASES = AgentSchema.shape.phase.options` as a module-level const), re-run tests
- [ ] Commit: `feat(cli): filter sdlc list by --phase and reject unknown values`

**Verification:** `pnpm vitest run packages/cli/src/__tests__/list.test.ts` → all tests pass, including the 4 new ones
