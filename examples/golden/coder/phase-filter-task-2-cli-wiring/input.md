# Input given to `coder`

**Mechanism:** real Claude Code `Agent` tool call, `subagent_type: coder`. Given exactly one self-contained Task block from the plan, dispatched after Task 1's commit (`6d4eba0`) landed, per the plan's stated dependency order.

**Task block (verbatim from the plan):**

### Task 2: Wire `--phase` through the CLI

**Covers:** CLI option parsing, non-zero exit on error
**Depends on:** Task 1
**Estimate:** S

**Context (self-contained):**
`packages/cli/src/index.ts:32-42` defines the `list` command with `.option("-C, --cwd <dir>", ...)`, `.option("--json", ...)`, `.option("--format <fmt>", ...)`, and an `.action` that calls `runList(opts.cwd, { json })` then does `if (!ok) process.exit(1)`. There is no dedicated test file for `index.ts` in this repo (commander wiring is exercised manually / via `real-agents.test.ts` for build, not list) — verification for this task is a manual CLI run, consistent with how `build`/`validate`/`list` commands' own option wiring is otherwise untested at the `index.ts` level.

**Files:**
- Modify: `packages/cli/src/index.ts`

**Steps:**
- [ ] Add `.option("--phase <phase>", "filter agents by phase")` to the `list` command chain in `index.ts`
- [ ] Update the `.action` callback's type annotation to include `phase?: string` and pass it through: `runList(opts.cwd, { json, phase: opts.phase })`
- [ ] Run `pnpm typecheck` — confirm no type errors
- [ ] Manually verify: `pnpm sdlc list --phase coding` against the real `agents/` dir shows only coding-phase agents; `pnpm sdlc list --phase bogus` prints an error to stderr and exits non-zero
- [ ] Commit: `feat(cli): add --phase option to sdlc list command`

**Verification:** `pnpm sdlc list --phase coding` shows a filtered table; `pnpm sdlc list --phase bogus` shows a stderr message and exits non-zero.
