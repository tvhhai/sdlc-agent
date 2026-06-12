# Dogfood Evaluation — `sdlc list` artifact chain

**Evaluator:** Haiku agent (claude-haiku-4-5), impartial scoring pass
**Date:** 2026-06-12
**Subject:** 3 of the 6 MVP agents (requirement-analyst, planner, coder) exercised end-to-end on a real feature (`sdlc list` CLI command).
**Ground-truth result of the run:** 10 new tests, full suite 134 passing, typecheck clean, lint clean, `sdlc list` + `--json` work on the real 6 agents.

| Agent | Completeness | Handoff Quality | Specificity | Workflow Fidelity | Avg |
|-------|--------------|-----------------|-------------|-------------------|-----|
| requirement-analyst | 4 | 5 | 5 | 5 | **4.75** |
| planner | 5 | 4 | 5 | 5 | **4.75** |
| coder | 5 | N/A* | 5 | 5 | **5.0** |

*Coder is the final deliverable; handoff dimension judged as integration/production readiness instead.

## Key findings

1. **Information flows forward — no agent restarts from scratch.** The plan cites the PRD ("Covers S1, S2"), maps all 12 FRs to tasks, and reuses the PRD's column names, sort order, and testing decisions. The coder implements the plan's three tasks in order with the exact types/function names (`Row`, `normalizeRows`, `runList`, `ListOptions`). The chain is PRD → Plan → Execute, not three independent rewrites.

2. **Single biggest weakness:** the orchestrator's clarification resolutions (C-1 targets are global; C-2 pretty-printed JSON) live in the PRD but were not quoted in the planner's handoff prose, forcing the coder to re-read the PRD or infer from context. A one-line callout in the plan would close this gap.

3. **Workflow adherence is high:** PRD has prioritized P1/P2 stories + named clarifications + handoff block; plan has self-contained vertical-slice tasks + exact paths + TDD steps; coder did failing-test-first with behaviour tests, then integration.

## Verdict: YES — good enough for a pilot team

These three agents produced a complete, working feature end-to-end in a single pass with no rework loops. The PRD is thorough and explicit about assumptions/gaps; the plan is executable and faithful to the PRD; the code matches the plan, passes the full suite, and runs on the real project. The only refinement worth making is surfacing orchestrator/clarification resolutions in the downstream plan prose.

---

## Orchestrator's honest caveats (not from the evaluator)

The Haiku score is genuinely positive, but two facts temper it — recorded here so the evaluation isn't read as rosier than reality:

1. **The coder subagent did NOT produce the committed code.** When invoked as an isolated subagent, the coder reported success but its file writes never reached the real working tree, and its observed environment contradicted reality (it saw different agent names, a phantom `dist/`+`tsc -b` build, 40 tests / 72 lint files vs. the real 124 tests / 37 lint files). The committed `list.ts` / `list.test.ts` were written by the orchestrator **following the planner's plan**, adapting fixtures to the real Zod schema and `loadConfig`/`loadAgents` behaviour (which differ from the plan's assumptions — e.g. `loadConfig` returns defaults instead of throwing on a missing config). So this run validates the **requirement-analyst and planner output quality**, and validates that **the plan was executable**, but it does NOT prove the coder agent can self-execute in this harness.

2. **The RA and planner subagents also could not read repo files** (every tool call returned empty). They worked from the inline context block the orchestrator provided. Their output is strong *given accurate context*, but in this harness they could not gather that context themselves — a real pilot user on a working Claude Code install would not hit this, since subagents there do have file access.

**Takeaway for the pilot:** the agent *content* (workflows, templates, handoff discipline) is pilot-ready and produces high-quality artifacts. The open risk is operational — subagent file-system access and isolation behaviour — not the prompt quality. Validate the coder agent on a real Claude Code install before relying on it unattended.
