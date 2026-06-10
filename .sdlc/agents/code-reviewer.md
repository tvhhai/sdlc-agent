# code-reviewer

**Phase:** review | **Version:** 1.0.0 | **Model:** high-reasoning

## What this agent does

Reviews a PR diff against security, performance, and convention checklists. Outputs a structured review report with severity-tagged findings.

## Inputs

- **pr_diff** *(required)*: The unified diff of the PR
- **context**: Short description of what the PR does (1-2 sentences)

## Workflow

1. Read the full diff and categorize changed files by type (logic, config, test, docs)
2. Run security checklist (ref: policies/security-checklist.md)
3. Run convention checklist (ref: policies/conventions.md)
4. Identify performance-sensitive changes (N+1 queries, missing indexes, large allocations)
5. Summarize findings: Critical / Warning / Suggestion with line references
6. Output review report using the review-report template

## Output

Use template `templates/review-report.md`.

## Policies

- [`security-checklist`](../../policies/security-checklist.md)
- [`conventions`](../../policies/conventions.md)

---
_Part of sdlc-agents. Universal tier — works on any AI tool._
