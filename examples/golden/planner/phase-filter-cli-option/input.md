# Input given to `planner`

**Mechanism:** real Claude Code `Agent` tool call, `subagent_type: planner`, fresh session (post `c859e36` tool-name-mapping fix). No PRD document existed for this — a small feature spec was provided directly as the task description.

**Feature spec provided:**

> Add a `--phase <phase>` option to `sdlc list` that filters output to agents
> in that phase, and exits non-zero with a stderr message for an unrecognized
> phase value.

The `planner` agent's own workflow (per `agents/planner.yaml`) then independently explored the repo (`packages/core/src/schema.ts`, `packages/cli/src/commands/list.ts`, `packages/cli/src/index.ts`, `packages/cli/src/__tests__/list.test.ts`) using its `Read`/`Glob` tools before producing the plan in `output.md` — none of that exploration was spoon-fed in the input.
