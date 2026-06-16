# Dogfood Evaluation: Self-Contained Claude Outputs

**Evaluator:** Codex orchestrator
**Date:** 2026-06-16
**Feature:** `self-contained-claude-outputs`
**Artifacts:** `raw-idea.md`, `01-prd.md`, `02-hld.md`, `03-plan.md`, `04-test-plan.md`, `05-review-report.md`

---

## What This Dogfood Proved

1. **The artifact chain is useful.** The PRD identified a real pilot blocker, the HLD kept the solution narrow, the plan decomposed it into testable adapter-level tasks, and the review found exact current-code lines that violate the desired behaviour.

2. **The next improvement is not a big wizard.** The dogfood points to a smaller, higher-leverage feature: make Claude output self-contained before investing in installer UX.

3. **The existing architecture can support the fix.** `runBuild()` already preloads `templates` and `policies` into `BuildContext`; adapter outputs are already manifest-tracked. This means the feature should not require build engine redesign.

4. **The Claude adapter is the right first target.** Claude already has generated subagents and slash commands. Making `.claude/` copyable gives the project a concrete pilot story.

## What This Dogfood Exposed

| Area | Finding | Severity |
|------|---------|----------|
| Claude output bundle | `.claude/agents/*.md` references root `templates/` and `policies/`, so copying `.claude/` alone is incomplete. | High |
| Adapter usage of context | Claude adapter currently ignores `BuildContext`, even though support content is already loaded. | Medium |
| Docs/product wording | Docs say `npx sdlc-agents init` is the target flow, but the next practical dogfood step is support-file bundling, not a full installer. | Medium |
| Agent chain | The artifact chain works well for planning, but this run still did not execute an isolated `coder` agent writing code. | Medium |

## Agent Quality Notes

| Agent | Result | Notes |
|-------|--------|-------|
| requirement-analyst | Good | Produced testable stories and scoped out installer/SKILL.md work. |
| solution-architect | Good | Compared copy-vs-inline and chose a reversible adapter-only design. |
| planner | Good | Tasks are self-contained and TDD-oriented. |
| test-generator | Good | Focused on behaviours, manifest implications, and realistic gaps. |
| code-reviewer | Useful | Found concrete current-code warning points. |
| coder | Not exercised | No implementation was requested in this dogfood run. This remains an open validation gap. |

## Recommended Next Step

Implement **Self-Contained Claude Outputs** before `skill-md` or interactive wizard.

Suggested implementation order:

1. Extend `ClaudeCodeAdapter.render()` to emit referenced support files under `.claude/sdlc/templates/` and `.claude/sdlc/policies/`.
2. Rewrite generated agent references to those support paths.
3. Add adapter tests and snapshots.
4. Run `pnpm sdlc validate && pnpm sdlc build && pnpm test && pnpm typecheck && pnpm lint`.
5. Copy `.claude/` into a scratch repo and manually verify Claude Code can inspect the referenced support docs.

## Product Decision

Treat this as **Pilot Readiness Task 1**.

Do **not** start the full `npx sdlc-agents init` wizard yet. The wizard would still install an incomplete Claude bundle unless this is fixed first.

## Honest Caveat

This was a guided dogfood run by the orchestrator following the generated agent workflows and templates. It produced useful artifacts, but it is not the same as a fully isolated Claude Code subagent chain autonomously reading, writing, and reviewing code. The next dogfood should implement this feature using the generated `/coder` command in Claude Code if possible.
