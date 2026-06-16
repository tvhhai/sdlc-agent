# Golden cases

Real input/output pairs from genuinely invoking an agent through Claude Code's
subagent runtime (not hand-written, not simulated). Used as calibration
references — what a good run of this agent actually looks like.

## Layout

```
examples/golden/<agent-id>/<case-name>/
  input.md    exactly what the agent was given
  output.md   exactly what the agent produced (or the relevant excerpt + commit ref for code changes)
```

## Provenance

All cases below come from the **2026-06-16 phase-filter dogfood** — the first
end-to-end real run of `planner` → `coder` → `code-reviewer`. Full narrative,
honesty caveats, and independent verification notes live in
[`docs/work/2026-06-16/phase-filter-golden-case/`](../../docs/work/2026-06-16/phase-filter-golden-case/README.md).

| Agent | Case | Status |
|---|---|---|
| `planner` | `phase-filter-cli-option` | real |
| `coder` | `phase-filter-task-1-filter-validate` | real |
| `coder` | `phase-filter-task-2-cli-wiring` | real |
| `code-reviewer` | `phase-filter-review` | real |
| `requirement-analyst` | — | not yet exercised |
| `solution-architect` | — | not yet exercised |
| `test-generator` | — | not yet exercised |

`requirement-analyst`, `solution-architect`, and `test-generator` have no
golden case yet — this dogfood's feature was small enough to skip straight to
`planner`, and no test-generator run has been dispatched for real. Add a case
here the next time one of them runs for real, rather than backfilling with a
synthetic example.
