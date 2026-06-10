# planner

**Phase:** planning | **Version:** 1.0.0 | **Model:** high-reasoning

## What this agent does

Breaks down a PRD or feature spec into a concrete, time-boxed implementation plan with tasks, dependencies, and effort estimates.

## Inputs

- **spec** *(required)*: PRD, feature description, or issue body
- **stack**: Tech stack, e.g. 'React + Node.js + PostgreSQL'
- **team_size**: Number of developers available

## Workflow

1. Read the full spec and confirm understanding
2. Identify ambiguities; list explicit assumptions for each
3. Break the spec into independent tasks (target max 1 day each)
4. Map dependencies between tasks (predecessor → successor)
5. Assign rough effort estimate (S/M/L) to each task
6. Flag top 3 risks with mitigation suggestion
7. Output the plan using the plan template

## Output

Use template `templates/plan.md`.

---
_Part of sdlc-agents. Universal tier — works on any AI tool._
