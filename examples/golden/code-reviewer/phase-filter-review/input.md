# Input given to `code-reviewer`

**Mechanism:** real Claude Code `Agent` tool call, `subagent_type: code-reviewer`, this session.

**Scope given:** review `git diff 943777d..cac5050 -- packages/cli` — the combined Task 1 + Task 2 diff from commits `6d4eba0` and `cac5050` (see [`../../coder/phase-filter-task-1-filter-validate/output.md`](../../coder/phase-filter-task-1-filter-validate/output.md) and [`../../coder/phase-filter-task-2-cli-wiring/output.md`](../../coder/phase-filter-task-2-cli-wiring/output.md) for the literal diffs).

**Declared requirement, as given to the reviewer:** add `--phase <phase>` to `sdlc list`; filter to matching agents; unknown phase → clear stderr error + non-zero exit (never silently zero rows); compose with `--json` / `--format json`.

The `code-reviewer` agent's own workflow (per `agents/code-reviewer.yaml`) then independently re-read the actual source files and re-ran the test suite/typecheck/lint itself before writing the verdict in `output.md` — it did not just trust the diff or the requirement statement at face value.
