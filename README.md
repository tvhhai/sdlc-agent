# Agentic SDLC Agents Set

A portable SDLC agent pack that combines two layers:

1. **Builder core** — define agents once as canonical YAML, validate them, then
   render deterministic output for each AI tool.
2. **Installer UX** — initialize projects through an interactive wizard, similar to
   modern project scaffolds and Agent Skills installers.

```
agents/*.yaml  ──►  build engine  ──►  AGENTS.md + .sdlc/   (universal — any AI tool)
                                  ──►  .claude/agents/      (Claude Code subagents)
                                  ──►  .github/prompts/     (GitHub Copilot)

interactive init ──► choose tools / agents / language ──► config + first build
```

Think *Terraform modules plus `npx create-*` UX, but for AI agents*: one source
of truth, many providers, friendly onboarding.

## Quickstart

Consumer flow (planned Hybrid UX):

```bash
npx sdlc-agents init
```

The wizard should ask which AI tools to target, which SDLC agents to install,
whether output should be project-local or user-global, and which language/team
variables to set. It then writes `sdlc.config.yaml` and runs the first build.

Current local development flow:

```bash
pnpm install
pnpm sdlc init       # currently scaffolds sdlc.config.yaml
pnpm sdlc validate   # schema + references + targets
pnpm sdlc build      # renders AGENTS.md, .sdlc/, .claude/, .github/
```

After build, use an agent in your AI tool:

- Claude Code: `use the planner agent to break down this spec`
- Copilot: open `.github/prompts/planner.prompt.md`
- Any tool: open `.sdlc/agents/planner.md` and follow the workflow

## Available agents

| Agent | Phase | What it does |
|-------|-------|--------------|
| `requirement-analyst` | requirement | Clarifies vague requirements into a structured PRD with acceptance criteria |
| `planner` | planning | Breaks a spec into a time-boxed implementation plan with dependencies |
| `solution-architect` | architecture | Produces HLD + ADRs comparing trade-offs |
| `coder` | coding | Implements plan tasks using TDD |
| `code-reviewer` | review | Reviews PR diffs against security/convention checklists |
| `test-generator` | testing | Generates test plans and test code from specs |

## Repository layout

```
agents/        canonical agent definitions (YAML) — the source of truth
templates/     output templates referenced by agents (plan, PRD, review report…)
policies/      checklists and conventions injected into review workflows
packages/
  core/        schema (Zod), loader, resolver, config
  cli/         sdlc init | validate | build; Phase 2 wizard installer UX
  adapters/    universal · claude-code · copilot
docs/          SA design + codebase guide + adapter contract
spike/         Phase 0 spike (kept for reference)
```

Generated outputs (`AGENTS.md`, `.sdlc/`, `.claude/`, `.github/prompts/`) are committed
so consumers get working agents without running the build. **Do not edit them by hand** —
edit the canonical sources and run `pnpm sdlc build`. The build warns when a generated
file drifted from its recorded hash (see `.sdlc/build-manifest.json`).

## Configuration

`sdlc.config.yaml` at the project root:

```yaml
targets:
  - universal      # always recommended — covers every AI tool
  - claude-code
  - copilot

variables:
  language: en     # available as {{language}} inside agent definitions
```

## Validation rules

`sdlc validate` (and `sdlc build`) fail on:

- schema errors (id format, semver, phase enum, empty workflow…)
- duplicate agent ids
- `output_template` pointing to a missing file
- `policies` entries with no matching `policies/<name>.md`
- `extends` / `imports` fields — accepted by the schema but **not implemented yet**
  (planned for Phase 2); validation fails loudly instead of silently ignoring them

## Development

```bash
pnpm test          # vitest — unit + snapshot tests for core, CLI, adapters
pnpm typecheck     # tsc --noEmit
pnpm lint          # biome
pnpm build         # currently aliases typecheck
```

See [docs/sa-design/SA_DESIGN_Agentic_SDLC_Agents_Set.md](docs/sa-design/SA_DESIGN_Agentic_SDLC_Agents_Set.md)
for the full architecture and roadmap, and
[docs/adapter-contract/ADAPTER_CONTRACT.md](docs/adapter-contract/ADAPTER_CONTRACT.md) for the rules every adapter must follow.
The [docs/codebase-guide/CODEBASE_FOLDER_GUIDE.md](docs/codebase-guide/CODEBASE_FOLDER_GUIDE.md) maps every folder and file to its role in the build pipeline.
