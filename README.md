# Agentic SDLC Agents Set

A portable set of AI agent definitions covering the software development lifecycle
(requirement → planning → architecture → coding → review → testing), written **once**
as canonical YAML and **built** into the native format of each AI tool.

```
agents/*.yaml  ──►  build engine  ──►  AGENTS.md + .sdlc/   (universal — any AI tool)
                                  ──►  .claude/agents/      (Claude Code subagents)
                                  ──►  .github/prompts/     (GitHub Copilot)
```

Think *Terraform modules, but for AI agents*: one source of truth, many providers.

## Quickstart

Requires Node.js ≥ 20 and pnpm 9.

```bash
# 1. Install
pnpm install

# 2. Validate agent definitions (schema + cross-references)
pnpm sdlc validate

# 3. Build all configured targets
pnpm sdlc build

# 4. Use an agent in your AI tool
#    Claude Code:  "use the planner agent to break down this spec"
#    Copilot:      open .github/prompts/planner.prompt.md
#    Any tool:     open .sdlc/agents/planner.md and follow the workflow
```

In a consumer project, scaffold the config first:

```bash
pnpm sdlc init     # creates sdlc.config.yaml
```

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
  cli/         sdlc init | validate | build
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
```

See [docs/sa-design/SA_DESIGN_Agentic_SDLC_Agents_Set.md](docs/sa-design/SA_DESIGN_Agentic_SDLC_Agents_Set.md)
for the full architecture and roadmap, and
[docs/adapter-contract/ADAPTER_CONTRACT.md](docs/adapter-contract/ADAPTER_CONTRACT.md) for the rules every adapter must follow.
The [docs/codebase-guide/CODEBASE_FOLDER_GUIDE.md](docs/codebase-guide/CODEBASE_FOLDER_GUIDE.md) maps every folder and file to its role in the build pipeline.
