# Dogfood Raw Idea: Self-Contained Claude Outputs

**Dogfood date:** 2026-06-16
**Feature folder:** `docs/work/2026-06-16/self-contained-claude-outputs/`
**Orchestrator:** Codex

## Raw Idea

The current build can generate `.claude/agents/*.md` and `.claude/commands/*.md`, but those generated Claude files still point back to `templates/*.md` and `policies/*.md`. If a user copies only `.claude/` into another repository, the subagents lose important workflow references. This makes the first real Claude Code pilot weaker than it looks from the build output count.

Evaluate and specify a minimal improvement so Claude Code output is self-contained enough for a pilot user to copy or commit without manually chasing extra folders.

## Scope Constraint

Do not implement the feature during this dogfood run. Produce artifacts first:

1. PRD
2. HLD / ADR
3. Implementation plan
4. Test plan
5. Review report against current code
6. Dogfood evaluation and next recommendations

## Why This Feature

This is the most practical blocker before an external pilot. Installer UX and `SKILL.md` adapter matter, but if the current Claude output cannot stand on its own, the pilot will test copy mechanics instead of agent quality.
