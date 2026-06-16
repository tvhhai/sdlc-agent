# Golden case: `sdlc list --phase` filter — real `planner` → `coder` → `code-reviewer` chain

**Purpose.** This folder is the first golden case where every step of the SDLC agent chain was executed for real, through Claude Code's actual subagent dispatch — not simulated/orchestrator-narrated. It closes the "coder: Not exercised" gap flagged in `docs/work/2026-06-16/self-contained-claude-outputs/06-evaluation.md`, and validates the tool-name mapping fix in commit `c859e36`.

## Why this exists

A prior dogfood attempt (same day, before `c859e36`) invoked the real `planner` subagent and got **zero successful tool calls** — it never read a file and fabricated a plan from prompt context alone. After fixing the abstract→real tool-name mapping in the `claude-code` adapter and rebuilding, a second `planner` invocation (run by the user in a separate Claude Code session) **did** read real files and produced a plan with verified-accurate file:line citations. This folder captures that plan plus the real `coder` and `code-reviewer` runs that followed it in this session.

## What's real here

- `01-plan.md` — produced by a live `planner` subagent run by the user (separate session `Phase filter for sdlc list command`), pasted into this session and independently verified line-by-line against the actual source files (`packages/core/src/schema.ts:31`, `packages/core/src/index.ts:6`, `packages/cli/src/__tests__/list.test.ts` fixtures) — all citations checked correct.
- Two real `coder` subagent runs (this session, via the `Agent` tool with `subagent_type: coder`), each given exactly one Task block from the plan, followed strict TDD, and produced real commits:
  - `6d4eba0` — `feat(cli): filter sdlc list by --phase and reject unknown values` (Task 1)
  - `cac5050` — `feat(cli): add --phase option to sdlc list command` (Task 2)
  - Both commits verified independently afterward (`git show --stat`, manual re-run of `pnpm sdlc list --phase coding` and `--phase bogus`) — not just trusted from the subagent's self-report.
- `02-review-report.md` — produced by a real `code-reviewer` subagent run (this session) against `git diff 943777d..cac5050 -- packages/cli`. Verdict: Approve, 3 non-blocking suggestions, no Critical/Warning findings. One citation (`docs/work/sdlc-list/prd.md:92`, listing `list --phase` as an explicit out-of-scope/future-enhancement item in an earlier, unrelated PRD from 2026-06-12) was independently checked and confirmed accurate — not a hallucination.

## Result

End-to-end: 143→147 tests passing, typecheck/lint clean throughout, 2 real commits, 1 real review with no blocking findings. This is the first fully-real (non-simulated) run of the agent chain in this project's history.

## Caveat / honesty note

This was a small, low-ambiguity CLI feature (a single flag on an existing command) — it does not stress-test the chain on a large or ambiguous feature. The `requirement-analyst` and `solution-architect` agents were not exercised in this run (the feature spec was simple enough to skip straight to `planner`). Those remain unvalidated against a real Claude Code subagent invocation.
