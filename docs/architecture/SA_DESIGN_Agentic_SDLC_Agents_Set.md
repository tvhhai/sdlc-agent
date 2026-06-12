# Agentic SDLC Agents Set — Solution Architecture Document

| | |
|---|---|
| **Product Name** | Agentic SDLC Agents Set |
| **Product Type** | Library (reusable, multi-platform agent definitions set) |
| **Document Version** | 0.1 (Draft) |
| **Date** | 2026-06-10 |
| **Author** | SA Team |
| **Status** | Designing — awaiting review |

---

## 1. Executive Summary

**Agentic SDLC Agents Set** is a **pre-specified set of AI Agents** (agent definitions, prompts, workflows, skills) for each phase of the Software Development Life Cycle (SDLC), packaged using a **Hybrid** strategy:

1. **Builder core:** maintains a standard source in `agents/*.yaml`, validates using schemas, and then builds into multiple formats via adapters.
2. **Installer UX:** provides an installation experience similar to `npx skills` / `create-vue`: asks the user which tool they are using, which agents they want to enable, project or user scope, language/team variables, and then automatically generates configuration and outputs.

The runtime mechanism remains **universal-first**: it always builds `AGENTS.md` + `.sdlc/agents/` so that any AI tool can read them, plus **native adapters** for tools with stronger proprietary formats like Claude Code or GitHub Copilot.

**Core Values:**
- New teams only need to run `install` on the agents set to get a standard AI-assisted SDLC workflow immediately — without having to write prompts/agents from scratch.
- Standardizes the quality of AI output across teams (same coding conventions, same document templates, same review process).
- A single source of truth for maintenance → build into multiple formats for each tool.

**Analogy:** like "Terraform modules" + "`npx create-*` wizard" for AI agents — write once, validate/test, then install/generate user-friendly outputs according to the tools the user already has.

### 1.1 Hybrid Direction vs. Agent Skills CLI

The Agent Skills CLI (`npx skills`, `gh skill`) solves the **discover/install** problem very well: select a skill, detect the agent host, and copy it to `.claude/skills/`, `.cursor/skills/`, `.github/skills/`... This project should not be completely replaced by that model, as the core problem is broader than a single skill: standardizing an **SDLC agent catalog containing phases, templates, policies, adapter contracts, generated manifests, and test suites**.

Final Decision on Direction:

- Do not pivot away from the canonical YAML/build engine.
- Add an installer wizard to make onboarding as short as the Agent Skills CLI.
- Possibly add an Agent Skills (`SKILL.md`) output target in Phase 2 for ecosystem compatibility, while keeping `agents/*.yaml` as the source of truth.
- Clearly separate commands for end-users (`npx sdlc-agents init`) and commands for maintainers (`pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm sdlc validate`, `pnpm sdlc build`).

Trade-offs:

| Approach | Pros | Cons |
|---|---|---|
| Current Build Engine | Deterministic, testable, clear source of truth, consistent adapter output | Long installation UX, feels more like a dev tool than a consumer tool |
| Pure Agent Skills CLI | Extremely short UX, fits the ecosystem, good host detection | Hard to fully represent SDLC catalog + templates/policies/build contracts if only copying skill files |
| Hybrid | Keeps the technical foundation solid while having a good installation UX | Requires adding a wizard, host detection, install scope, and update/pin flow |

---

## 2. Problem Statement

### 2.1 Current State
- Each developer/team writes their own prompts, custom instructions, and agent configurations → inconsistent quality and duplicated effort.
- Each AI tool has its own configuration format:
  - Claude Code: `CLAUDE.md`, `.claude/agents/*.md`, `.claude/skills/`, slash commands, hooks, MCP
  - GitHub Copilot: `.github/copilot-instructions.md`, `.github/prompts/*.prompt.md`, custom agents
  - Codex CLI: `AGENTS.md`
  - Cursor: `.cursorrules`, `.cursor/rules/*.mdc`
  - Gemini CLI: `GEMINI.md`
- Company business knowledge and processes (coding standards, review checklists, document formats) are not consistently embedded into AI workflows.
- No versioning, testing, or distribution mechanisms for prompts/agents.

### 2.2 Core Problem to Solve
> How to **write an agent once**, **use it on any AI tool**, **cover all SDLC phases**, and **easily distribute/update** it across multiple teams?

---

## 3. Goals & Non-Goals

### 3.1 Goals (MVP → v1.0)
| # | Goal | Measurement |
|---|------|----------|
| G1 | Agents set covers at least 6 SDLC phases (Requirement → Maintain) | ≥ 12 working agents |
| G2 | **Universal-first**: builds into the open standard AGENTS.md, running on ANY AI agent (Codex, Cursor, Windsurf, Gemini, Antigravity, Zed, Cline...) + native adapters for tools with stronger proprietary formats (Claude Code, Copilot...) | Universal layer covers 100% of tools; adding a new native adapter takes < 1 week |
| G3 | One-command installation via an interactive wizard | `npx sdlc-agents init` takes < 2 minutes; users do not need to remember `validate`/`build` |
| G4 | Allows customization at all levels (override prompt, workflow, template, add custom agent) without fully forking | 4-tier customization model (Section 7) |
| G5 | Versioning + changelog + update mechanism | Semantic versioning, `update` command |

### 3.2 Non-Goals (NOT doing in early phases)
- ❌ Do not build custom AI models / fine-tune models.
- ❌ Do not build custom IDE plugins/extensions (leverage existing tools).
- ❌ Do not build an orchestration platform to run multi-agents automatically 24/7 (that is a separate product — potentially Phase 3).
- ❌ Do not handle billing/licensing of the underlying AI tools.

---

## 4. Personas & Use Cases

| Persona | Need | Example Use Case |
|---------|---------|----------------|
| **Developer** | Write code quickly, following conventions | Call `@code-agent` to implement a feature according to a plan, running TDD workflow |
| **Tech Lead / SA** | Standardize designs and reviews | `@design-agent` generates ADRs/HLDs according to company templates; `@review-agent` reviews PRs according to checklist |
| **BA / PO** | Write standardized requirements | `@requirement-agent` transforms raw ideas → user stories + acceptance criteria |
| **QA Engineer** | Generate test cases/test scripts | `@test-agent` generates test plans, unit/integration tests from spec |
| **DevOps** | CI/CD, releases | `@devops-agent` generates pipeline configs, release notes, rollback plans |
| **Engineering Manager** | Standardize processes across teams | Install the shared agents set, customize per team via configuration |

---

## 5. Product Scope — Agent Catalog

The agents set is structured around SDLC phases. Each agent consists of: **system prompt, workflow (mandatory steps), input/output templates, checklists, and few-shot examples**.

### Phase 1 — Planning & Requirement
| Agent | Function |
|-------|-----------|
| `requirement-analyst` | Interviews users, clarifies vague requirements → BRDs/PRDs, user stories, acceptance criteria (Gherkin) |
| `estimation-agent` | Breaks down epics → tasks, estimates effort, identifies dependencies & risks |

### Phase 2 — Design
| Agent | Function |
|-------|-----------|
| `solution-architect` | Generates HLDs/LLDs, ADRs (Architecture Decision Records), compares technology trade-offs |
| `api-designer` | Designs API contracts (OpenAPI/Protobuf), data models, ERDs |
| `ux-reviewer` | Reviews wireframes/flows based on heuristics (optional, future phase) |

### Phase 3 — Implementation
| Agent | Function |
|-------|-----------|
| `planner` | Reads specs → generates phased implementation plans, each step containing verification criteria |
| `coder` | Implements according to plans, adheres to conventions injected from configuration, TDD-first |
| `refactor-agent` | Detects code smells, proposes & performs safe refactoring |

### Phase 4 — Testing
| Agent | Function |
|-------|-----------|
| `test-strategist` | Generates test plans, test matrices, coverage strategies |
| `test-generator` | Generates unit/integration/E2E test code from source + specs |
| `bug-triager` | Analyzes bug reports, reproduces issues, performs root-cause analysis (systematic debugging workflow) |

### Phase 5 — Review & Release
| Agent | Function |
|-------|-----------|
| `code-reviewer` | Reviews PRs based on company checklists: security, performance, correctness, conventions |
| `security-auditor` | Scans for OWASP Top 10, secrets, dependency vulnerabilities |
| `release-manager` | Generates release notes, deployment checklists, rollback plans |

### Phase 6 — Operate & Maintain
| Agent | Function |
|-------|-----------|
| `incident-responder` | Guides incident triage, writes blameless postmortems |
| `doc-writer` | Generates/updates READMEs, runbooks, API docs, onboarding guides |
| `tech-debt-auditor` | Scans and prioritizes technical debt |

> **Proposed MVP Scope:** `requirement-analyst`, `solution-architect`, `planner`, `coder`, `test-generator`, `code-reviewer` (6 agents, covering a minimal SDLC cycle).

---

## 6. System Architecture

### 6.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  CANONICAL LAYER (source of truth)       │
│  agents/*.yaml  — tool-agnostic agent definitions        │
│  skills/*.md    — detailed workflows/processes           │
│  templates/*.md — output templates (ADR, PRD, test plan)  │
│  policies/*.yaml — org/team conventions & checklists     │
└────────────────────────┬────────────────────────────────┘
                         │
                ┌────────▼────────┐
                │   BUILD ENGINE  │  (CLI: compile + validate)
                │  - schema check │
                │  - lint prompts │
                │  - render       │
                └────────┬────────┘
                         │
       ┌──────────────────┴───────────────────────┐
       ▼                                          ▼
┌─────────────────────────┐   ┌─────────────────────────────────────┐
│ TIER 0: UNIVERSAL       │   │ TIER 1: NATIVE ADAPTERS (optional)  │
│ (always built, all tools)│   │                                     │
│                         │   │ claude-code  copilot  cursor        │
│ AGENTS.md + .sdlc/      │   │ windsurf     gemini   cline/roo ... │
└────────────┬────────────┘   └────────┬────────────────────────────┘
             ▼                         ▼
   Codex, Windsurf, Antigravity,   .claude/agents/  .github/prompts/
   Zed, Amp, Gemini CLI, Jules,    .cursor/rules/   .windsurf/rules/
   Devin, + all future tools       GEMINI.md        ...
```

### 6.2 Key Components

**1. Canonical Agent Definition (DSL)** — YAML files with Markdown frontmatter, for example:

```yaml
# agents/code-reviewer.yaml
id: code-reviewer
version: 1.2.0
phase: review
description: Reviews PRs based on security, performance, and convention checklists
model_hint: high-reasoning        # adapter automatically maps to the tool's model
model_variants:                   # (optional) fine-tune prompt per model/agent
  claude: { prompt_append: "Use extended thinking for the analysis step." }
  gemini: { prompt_append: "Present conclusions first, followed by details." }
tools_required: [read_file, grep, git_diff]
inputs:
  - name: pr_diff
    required: true
workflow:
  - step: Read the entire diff, classify modified files
  - step: Run security checklist (ref: policies/security-checklist.yaml)
  - step: Run convention checklist (ref: policies/{{team}}/conventions.yaml)
  - step: Output according to the template templates/review-report.md
output_template: templates/review-report.md
policies: [security-checklist, conventions]
```

**2. Build Engine (CLI)** — responsibilities:
- Schema validation (JSON Schema for agent definitions).
- Reference resolution (policies, templates, skills).
- Multi-layer configuration merging **base → org → team → project → local** (5 layers, see Section 7.3).
- Rendering to tool-specific formats via adapters.
- Prompt linting (length, forbidden words, unresolved placeholders).

**2b. Installer / Wizard UX** — responsibilities:
- Detect or ask the user which AI host they are using: Claude Code, Cursor, Copilot, Codex, Windsurf, Gemini...
- Allow selection of agent presets: full SDLC, planning+coding, review+testing, or custom.
- Allow selection of scope: project-local generated files or user-global skills/prompts if supported by the host.
- Generate `sdlc.config.yaml`, run validation, and execute the initial build.
- Reserve development commands (`validate`, `build`, `test`, `typecheck`, `lint`) for maintainers, without forcing end-users to run individual commands.

**3. Adapters — Two-tier strategy: Universal baseline + Progressive enhancement**

> **Principle:** all tools are supported out-of-the-box via the Universal tier; tools with stronger native formats get a dedicated adapter to "enhance" the experience. When a new tool is released → it is automatically supported at the Universal tier with zero code changes.

**Tier 0 — Universal Adapter (`universal`) — ALWAYS built, Priority #1:**

Based on the open standard **AGENTS.md** (https://agents.md) — the de-facto standard supported by OpenAI Codex, Cursor, Windsurf, Gemini CLI, Google Antigravity, Zed, Amp, Roo Code, Cline, Jules, Devin, Factory, and more:

```
AGENTS.md                      # open standard entry point — read by all tools
.sdlc/                         # plain-markdown, tool-agnostic
├─ agents/                     # one plain Markdown file per agent
│  ├─ planner.md
│  ├─ coder.md
│  └─ code-reviewer.md
├─ workflows/                  # workflows for each phase
├─ templates/                  # output templates (ADR, PRD, ...)
└─ policies/                   # checklists, conventions
```

- `AGENTS.md` contains: general instructions + **an index table pointing to `.sdlc/agents/*.md`** ("when you need to review a PR, read and follow `.sdlc/agents/code-reviewer.md`").
- Being plain Markdown + relative links, **any AI agent capable of reading files** (including those not yet created) can use it — ensuring universal support.
- Supports per-directory `AGENTS.md` for monorepos (supported by the standard's nested specification).

**Tier 1 — Native Adapters (progressive enhancement):**

| Adapter | Native Output | Additional Benefit over Universal |
|---------|---------------|-------------------------------|
| `claude-code` | `CLAUDE.md`, `.claude/agents/*.md`, `.claude/skills/`, `.claude/commands/`, hooks | True subagents (isolated context), slash commands, auto-triggered skills, hooks |
| `copilot` | `.github/copilot-instructions.md`, `.github/prompts/*.prompt.md`, `.github/agents/*.md` | Fast-call prompt files, Copilot coding agent on GitHub.com |
| `cursor` | `.cursor/rules/*.mdc` | Rule scoping via glob patterns, auto-attaching to active files |
| `windsurf` | `.windsurf/rules/*.md`, `.windsurf/workflows/*.md` | Cascade workflows, rule activation modes |
| `gemini` | `GEMINI.md` (+ points to `.sdlc/`) | Native Gemini CLI integration |
| `antigravity` | `AGENTS.md` (shares Universal) + `.agent/` config if present | Antigravity reads AGENTS.md directly |
| `codex` | `AGENTS.md` (shares Universal) + `~/.codex/prompts/` | Custom prompts for Codex CLI |
| `cline` / `roo` | `.clinerules/`, `.roo/rules/` | Mode-based rules (architect/code/debug) |
| `zed` / `amp` / others | `AGENTS.md` (shares Universal) | No separate adapter needed |

- Tools in the "shares Universal" group → **support cost = 0** (only requires validation in docs + contract tests).
- Native adapters are only written when a tool has high-value proprietary mechanisms (subagents, slash commands, rule scoping, etc.).
- Both tiers are built from **the same canonical source** → content is identical, only packaging differs.

**4. Config Layer (customization without forking):**
```
sdlc-agents.config.yaml      # at the team's project root
├─ extends: "@org/sdlc-agents-base"
├─ targets: [universal, claude-code, copilot]
├─ agents: { enable: [...], disable: [...] }
├─ policies:
│   conventions: ./team-conventions.yaml   # override
└─ variables: { language: vi, stack: "java-spring" }
```

**5. Distribution:**
- npm package (`npx sdlc-agents init|build|update`) — or a Git template repo for teams not using Node.
- Interactive wizard is the default entry point for end-users; non-interactive flags remain available for CI/automation.
- Claude Code plugin marketplace format (bonus for Claude users).
- Internal registry (Git repo + tags) for enterprises.

### 6.3 Usage Flow (Developer Journey)

```
1. npx sdlc-agents init
   → wizard asks: which tools? which agents? project-local or user-global? language/team variables?
   → generates sdlc.config.yaml + runs initial build

2. Files are generated into the repo (.claude/, .github/, ...)
   → commit to git like normal code

3. Developer uses the agent in their familiar tool:
   Claude Code:  /plan "add feature X"     → planner agent
   Copilot:      @workspace /review-pr      → code-reviewer prompt

4. Org updates the agents set (e.g., new security checklist)
   → npx sdlc-agents update → re-build → automatic PR
```

---

## 7. Customization & Extensibility Model

> **Design Principle:** "Convention over configuration, but everything is overridable."
> New users: run one command and it works out of the box (zero-config). Advanced users: customize **every single line of prompt** without ever forking the original repository.

### 7.1 Four Levels of Customization (Progressive Customization)

Users navigate from Tier 1 to Tier 4 according to their needs, with no requirement to learn everything upfront:

| Tier | Name | What the user does | Effort |
|-----|-----|-------------------|--------|
| **L1** | **Configure** | Enable/disable agents, set variables (`stack`, `language`, `team`) in configuration | 5 minutes |
| **L2** | **Override** | Partially replace: policies, templates, checklists, or individual `steps` in workflows | 30 minutes |
| **L3** | **Extend** | Write project-specific custom agents, inheriting (`extends`) from existing agents | 1–2 hours |
| **L4** | **Plug-in** | Write adapters for new tools, hook into the build pipeline, or publish presets for other teams | 1–2 days |

### 7.2 L1 — Configure: zero-code, configuration only

```yaml
# sdlc-agents.config.yaml
extends: "@org/sdlc-agents-base"        # or a community preset: "@sdlc-agents/preset-fintech"
targets: [universal, claude-code, copilot]   # universal should always be enabled — covers all other tools

variables:
  language: en                          # output language of the agents
  stack: nestjs-postgres
  team: payment-squad

agents:
  enable: [planner, coder, code-reviewer]
  disable: [ux-reviewer]
```

### 7.3 L2 — Override: partial overrides, merged by layer

Prioritized **deep-merge** mechanism (similar to ESLint/Tailwind configurations):

```
Base package (@org/sdlc-agents-base)     ← lowest priority
  ↑ overridden by
Org preset (company-wide standard policies)
  ↑ overridden by
Team preset (team-specific conventions)
  ↑ overridden by
Project config (sdlc-agents.config.yaml) ← highest priority
  ↑ overridden by
Local overrides (sdlc-agents.local.yaml — gitignored, for personal testing)
```

Granular overrides down to **individual workflow steps** — no need to replace the entire agent:

```yaml
# overrides/code-reviewer.yaml
agent: code-reviewer
patch:
  workflow:
    insert_after: "Run security checklist"
    step: "Check naming conventions according to payment-squad (ref: ./our-naming.md)"
  output_template: ./our-review-template.md   # replaces only the template, keeping the prompt intact
  prompt_append: |                            # appends content instead of replacing
    Always check idempotency for all payment APIs.
```

Three patch operators are supported: `replace` (complete replacement), `append`/`prepend` (add to end/beginning), and `insert_after`/`insert_before` (inject into workflow). The build engine validates the patch — if a base agent changes structure in a new version and the patch cannot be applied, it will **raise a clear error instead of silently skipping it**.

### 7.4 L3 — Extend: custom agents via inheritance

```yaml
# .sdlc-agents/agents/migration-reviewer.yaml  (project-specific custom agent)
id: migration-reviewer
extends: code-reviewer            # inherits entire workflow + checklist
version: 1.0.0
description: Specific review agent for database migration scripts
prompt_append: |
  Focus on: backward compatibility, lock time, and rollback scripts.
workflow:
  append:
    - step: Verify that the migration has a corresponding rollback script
policies: [security-checklist, db-migration-rules]   # adds custom policies
```

- Local agents are placed under `.sdlc-agents/agents/` in the project — built, validated, and processed along with original agents.
- Can `extends` multiple levels (org agent → team agent → project agent).
- **Composition via skills:** agents can reference shared skills (`skills/tdd-workflow.md`) — updating the skill in one place updates all agents using it.

### 7.5 L4 — Plug-in: extending the core system

**a) Adapter interface** — add support for new tools without modifying the core:

```typescript
// An adapter is an npm package implementing this interface
interface ToolAdapter {
  name: string;                                   // "windsurf", "zed", ...
  render(agents: ResolvedAgent[], ctx: BuildContext): OutputFile[];
  validate?(output: OutputFile[]): Diagnostic[];  // contract tests for the tool's format
}
```
Register via config: `adapters: ["@myorg/sdlc-adapter-windsurf"]`.

**b) Build hooks** — inject custom logic into the pipeline:

```yaml
hooks:
  pre-build: ./scripts/fetch-latest-conventions.sh   # e.g., pull conventions from Confluence
  post-build: ./scripts/notify-slack.sh
  transform: ./scripts/inject-jira-context.js        # modify resolved agents before rendering
```

**c) Preset publishing** — package all customizations (agents + overrides + policies) into an npm package for other teams to `extends`. This forms the **contribution model**: a team highly skilled in security can publish `@org/preset-security-strict`, which others can reuse.

### 7.6 Escape hatch — never get locked in

| Scenario | Escape Route |
|------------|-----------|
| DSL cannot represent a specific requirement | Use `tool_specific:` block in agent YAML — write raw content for a single tool, ignored by others |
| Want to manually modify a generated file | `eject` mode: `npx sdlc-agents eject code-reviewer` — copies generated file into a regular file, marks it `managed: false`, and prevents build from overwriting |
| Generated file is accidentally modified manually | Build engine injects `# generated — do not edit` header + runs `diff` commands to warn about drift between source and output |
| Need to revert to default state | `npx sdlc-agents reset <agent>` — deletes overrides, reverts to base agent |

### 7.7 Design Constraints for Sustainable Flexibility
1. **All customizations reside outside the original package** (in the user's repository) → updating to new versions won't overwrite customizations.
2. **Patch-based instead of copy-based**: overrides only contain the delta → when the base agent prompt is improved, users benefit from the improvement while retaining their custom settings.
3. **Early validation, clear failures**: all overrides/extensions undergo schema validation at build time; errors point directly to the file and line.
4. **`npx sdlc-agents doctor`**: diagnostic command showing which layers are merging, which overrides are active, and which are orphaned (pointing to deleted agents).

---

## 8. Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | Define agents using a standard DSL (YAML + Markdown), validated via JSON Schema | Must |
| FR-02 | **Universal adapter (AGENTS.md + `.sdlc/`)** — open standard output running on any AI agent | Must |
| FR-02b | First batch of native adapters: Claude Code, Copilot | Must |
| FR-03 | CLI + Hybrid installer UX: interactive `init`, `build`, `update`, `list`, `validate`, `doctor`, `eject`, `reset`; non-interactive flags for CI | Must |
| FR-04 | Multi-layer config override (base → org → team → project → local), prioritized deep-merge | Must |
| FR-05 | Set of 6 MVP agents working end-to-end | Must |
| FR-06 | Patch-based overrides: `replace`/`append`/`insert_after` for parts of an agent (prompt, workflow step, template) | Must |
| FR-07 | Agent inheritance: `extends` existing agents, local agents in `.sdlc-agents/agents/` | Must |
| FR-08 | Escape hatch: `tool_specific` block + `eject`/`reset` commands | Should |
| FR-09 | SemVer versioning, auto-changelog; patch failures clearly reported when base structure changes | Should |
| FR-10 | Template variables ({{team}}, {{stack}}, {{language}}) | Should |
| FR-11 | Adapter plugin interface (npm package) + build hooks (pre/post/transform) | Should |
| FR-12 | `doctor` command: displays merge layers, active/orphaned overrides | Should |
| FR-13 | Preset publishing: packages customization into reusable presets for other teams to `extends` | Could (v1.1) |
| FR-14 | Second batch of native adapters: Cursor, Windsurf, Gemini, Cline/Roo (Codex/Antigravity/Zed/Amp covered by Universal) | Could (v1.1) |
| FR-15 | Eval harness: automated test quality evaluation for agent output | Could (v1.1) |
| FR-16 | Web catalog/docs site to browse agents | Could (v1.2) |

## 9. Non-Functional Requirements

| ID | Requirement | Criteria |
|----|-------------|----------|
| NFR-01 | **Portability** | No specific runtime dependencies; outputs are plain text files committable to git |
| NFR-02 | **Idempotency** | Re-running `build` produces identical outputs (deterministic) — clean git diffs in PRs |
| NFR-03 | **Security** | No secrets stored in agent files; linting blocks sensitive patterns; policy files can be marked `internal-only` |
| NFR-04 | **Maintainability** | Adding a new agent only requires adding a YAML file + templates, without modifying the engine |
| NFR-05 | **Extensibility** | Adapters are plugin interfaces — third parties can write new adapters without altering the core |
| NFR-06 | **Backward compatibility** | Minor version updates do not break team configurations |
| NFR-07 | **Offline-friendly** | Build engine runs locally, making no network calls (except for `update`) |

---

## 10. Proposed Tech Stack

| Layer | Choice | Rationale |
|-------|----------|-------|
| **CLI / Build engine** | **TypeScript + Node.js** (commander/clack for CLI) | npm ecosystem for distribution; runable by any dev via `npx`; straightforward text-rendering adapters |
| **Schema validation** | JSON Schema + `ajv` / Zod | Validate agent definitions and configurations |
| **Template rendering** | Handlebars or Eta | Render templates with variables safely and simply |
| **Agent definitions** | YAML + Markdown | Human-readable, reviewable in PRs, no special tooling required |
| **Testing** | Vitest (unit for engine/adapters) + snapshot tests for output | Outputs are text → snapshot testing fits perfectly |
| **Eval (v1.1)** | promptfoo or custom harness calling Claude API to score output | Measure agent quality changes when modifying prompts |
| **CI/CD** | GitHub Actions: lint → test → build → publish npm | Industry standard |
| **Docs site (v1.2)** | VitePress / Docusaurus | Catalog agents, user guides |
| **Distribution** | npm (public/private registry) + Git tags | `npx sdlc-agents init` for end-users, versioning/updates via npm tags |

> **Note:** this product **does not require a backend/database** for MVP. The entire system consists of static files + CLI. This is a major advantage: operational cost ≈ 0.

### 10.1 Detailed Toolchain during Development

**Core development:**
| Tool/Lib | Role | Notes |
|----------|---------|---------|
| Node.js ≥ 20 LTS + TypeScript 5.x | Runtime + language | strict mode |
| pnpm workspaces | Monorepo (`core`, `cli`, `adapters/*`) | Lighter than Turborepo, sufficient for this scale |
| `commander` | CLI framework (parses commands, flags) | Industry standard |
| `@clack/prompts` | Interactive wizard for `init` | Beautiful UX, lightweight |
| `zod` | Schema validation for DSL + config | Type-safe, excellent error messages; exports JSON Schema via `zod-to-json-schema` for editor autocomplete |
| `yaml` (eemeli/yaml) | Parses YAML preserving comments + line numbers | Line numbers needed to report errors like "file X line Y" |
| `gray-matter` | Parses Markdown frontmatter | For skills/templates |
| Handlebars or `eta` | Renders templates with variables | Logic-less, secure |
| `deepmerge-ts` / custom merger | Multi-layer config deep-merging | Controls override priority + array strategies |
| `tsup` | Bundles CLI into ESM/CJS | Zero-config |

**Quality & release:**
| Tool/Lib | Role |
|----------|---------|
| Vitest | Unit test engine/adapters + **snapshot tests** for all output (text output makes snapshot testing the cheapest and safest method) |
| Biome (replaces ESLint+Prettier) | Lint + format, single fast tool |
| `markdownlint` + link checker (`lychee`) | Lints agent/skill/template contents — the true "source code" of the product |
| Changesets | SemVer versioning + auto-changelog + publish to npm |
| Lefthook | Git hooks (pre-commit linting) |
| GitHub Actions | CI: lint → test → snapshot → build → publish |

**Eval, trace & observability (critical — prompts are code, must be tested):**
| Tool/Lib | Role | When |
|----------|---------|---------|
| **promptfoo** | Eval harness: runs agent prompts across models (Claude/GPT/Gemini), asserts output against rubrics, compares before/after prompt changes, runs in CI | Phase 2 |
| **Langfuse** (self-host, open source) | **Trace** each eval run: prompt → response → score, tracks quality regression across versions | Phase 2 |
| Anthropic/OpenAI/Gemini SDK | Calls models in eval harness (only for testing, NOT a runtime dependency of the product) | Phase 2 |
| Golden test cases | Reference input/output samples per agent (e.g., 1 sample PR diff → expected review report) | Phase 1, each agent ≥ 3 cases |
| OpenTelemetry (opt-in) | CLI Telemetry: tracked commands run, built adapters (anonymous, opt-in) — measures actual adoption | Phase 3 |

**Compatibility testing (product-specific):**
| Tool | Role |
|------|---------|
| Claude Code headless (`claude -p`), Copilot CLI, Gemini CLI running in CI | Contract tests: verify whether generated outputs are successfully loaded by real tools |
| Docker images containing each tool | Replicable test environments for compatibility matrix |

---

## 11. Roadmap & Milestones

### Phase 0 — Foundation (Weeks 1–2)
- [x] Finalize DSL schema for agent definition (spike: manually wrote 2 agents — `planner` + `code-reviewer`, tested rendering to Claude Code + Universal format — valid outputs ✅)
- [x] Setup repo, CI, and monorepo structure (`packages/core`, `packages/cli`, `packages/adapters/*`, `agents/`, `templates/`, `policies/`)
- [x] Write Zod schema + validator (fail clearly if agent YAML is invalid)
- [ ] Setup CI (GitHub Actions: lint → typecheck → spike test)
- [ ] Write unit tests for schema validator (Vitest)

**Spike findings (Q6 answer):**
- Claude Code: `description` field in frontmatter → auto-routing works out of the box, no additions needed
- Universal (AGENTS.md): trigger is manual instruction or naming the agent; no auto-routing — this is the ceiling of the Universal tier, and an acceptable trade-off given the coverage of 20+ tools

### Phase 1 — MVP (Weeks 3–6)
- [ ] Build engine + adapter `universal` (AGENTS.md — highest priority) + adapter `claude-code` + adapter `copilot`
- [ ] CLI `init` / `build` / `validate`
- [ ] 6 MVP agents (Section 5) with completed prompts, workflows, and templates
- [ ] Dogfooding: developer team uses this agents set to build the project itself
- [ ] **Exit criteria:** 1 pilot team outside the core devs successfully installs and uses it in a sprint

### Phase 2 — Hardening (Weeks 7–10)
- [ ] Complete customization: multi-layer overrides, patch-based overrides, `extends` agents, and local agents
- [ ] Escape hatches: `tool_specific`, `eject`/`reset`, drift detection + `doctor` command
- [ ] CLI `update` + changelog + SemVer release flow
- [ ] Snapshot tests for all outputs, basic eval harness
- [ ] Add agents: `test-strategist`, `security-auditor`, `release-manager`
- [ ] **Exit criteria:** 3 teams using the system, NPS survey score ≥ 7

### Phase 3 — Scale (Next Quarter)
- [ ] Second batch of native adapters: Cursor, Windsurf, Gemini CLI, Cline/Roo
- [ ] Public compatibility matrix: which tools run Universal, which have native adapters, updated regularly
- [ ] Docs site + agent catalog
- [ ] Opt-in telemetry (tracking most used agents)
- [ ] Internal marketplace/registry; allow teams to contribute agents back (contribution model)

---

## 12. Success Metrics

| Metric | Target (3 months post-release) |
|--------|------------------------------|
| Number of adopting teams | ≥ 3 teams |
| Setup time for new teams | < 30 minutes (from zero → working state) |
| Weekly active agent rate | ≥ 60% of MVP agents set |
| Reduced documentation writing time (PRD/ADR/test plan) | ≥ 40% (surveyed) |
| PRs reviewed by review-agent prior to human review | ≥ 70% |

---

## 13. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | AI tools **frequently change config formats** (Claude Code, Copilot update rapidly) | High | High | Adapter pattern isolates changes; contract tests track each tool version; monitor tool changelogs |
| R2 | **Lowest common denominator**: powerful tool-specific features (e.g., hooks, MCP in Claude Code) don't map to other tools | High | Medium | DSL includes `tool_specific` block allowing proprietary configurations; do not enforce 100% portability |
| R3 | Agent output quality is unstable across models | Medium | High | Eval harness + golden test cases; `model_hint` in DSL |
| R4 | Teams do not adopt due to "another tool to learn" | Medium | High | One-command `init`, zero-config by default; dogfooding + sponsor champions in each team |
| R5 | Prompts containing internal info leaked during public commits | Low | High | Lint rules + `.gitignore` guidance + isolate internal policies |
| R6 | Scope creep towards an orchestration platform | Medium | Medium | Clear non-goals (Section 3.2); review scope at each milestone |
| R7 | **Supply-chain prompt injection**: community skills imported (Section 15.2) might contain malicious instructions — imported content runs as code inside agents for all teams | Low | **Very High** | Mandatory human review for first-time imports + version updates; diff reviews between pinned versions; lint for suspicious patterns (exfiltration URLs, hidden shell commands); pin by commit hashes, not mutable branches/tags |

---

## 14. Open Questions (to resolve before Phase 0)

1. ~~**Prompt language:**~~ ✅ **DECIDED:** Prompts are written in English (higher model quality); output templates follow `language` config (default `en`, can be set to `vi`).
2. ~~**Second priority tool:**~~ ✅ **DECIDED:** **GitHub Copilot** — native adapters for Phase 1 are Claude Code + Copilot.
3. **OSS vs Private — differences in 3 core architecture points:**

   | Impact Dimension | Open Source | Private-only |
   |---|---|---|
   | **Plugin interface** | Must be stable, versioned, documented — becomes a public API; breaking changes require major bumps | Internal-only, free refactoring |
   | **Policy layer** | Cannot embed proprietary policies into main repo; requires isolating `packages/policies-private` | Embedded directly in monorepo, simpler |
   | **Adapter code** | E2E docs + compatibility promise required since community builds against it | Just needs to run |

   Build engine + DSL schema + vendor mechanism **use identical code** regardless of OSS or private — no architectural divergence risks in that layer.

   **Should we commercialize?** Anyone can build the raw engine — that is a reason to choose the right business model, not to abandon it. **Proposal: Open Core.**
   - **OSS (free):** core engine + Universal adapter + basic agent catalog → build community, boost adoption, receive community adapter contributions
   - **Commercial:** hosted policy management (team dashboard, audit log, secret vault), full suite of native adapters, hosted eval harness, SLA support, industry-specific preset marketplace
   - Precedent: Terraform OSS → HCP, ESLint → enterprise tooling, Biome → enterprise tier
   - **Action item:** decide before Phase 1 (not needed before Phase 0 spike); if OSS is chosen, design the plugin interface as a public API from day one (SemVer + deprecation policies) and isolate `packages/policies-private` from the main repository.
4. **Who owns the organization's standard policy set?** Requires an owner (e.g., Engineering Excellence group) to approve changes to checklists/conventions.
5. **MCP Integration depth:** should we ship MCP servers (e.g., Jira, Confluence connectors) with this set, or leave it for later phases?
6. **Trigger mechanism on Universal tier:** Claude Code has auto-triggered skills by description, but how is an agent "called" in tools that only read AGENTS.md — does the model read the index itself, or is there a manual command convention (e.g., "follow `.sdlc/agents/planner.md`")? Requires a Phase 0 spike on 2-3 real tools, as it dictates the Universal tier UX.
7. **Evaluation budget:** eval harness calls real model APIs (Claude/GPT/Gemini) — who pays, and what is the limit for each CI run? Quota needed to avoid skipping evals due to cost.
8. **Legal issues with commercialization:** attribution requirements for vendored MIT/Apache skills in commercial products; does the product name collide with trademarks? Requires a legal review before public release.

---

## 15. Positioning vs. Skill Ecosystem & Reuse Strategy

### 15.1 How does it differ from other "skills"?

Many famous skill/rule sets exist (obra/superpowers, anthropics/skills, awesome-claude-code, awesome-cursorrules, agent-rules...). This product does **not compete at the single-skill content level** — it competes at the **system** level:

| Criteria | Existing Skills | Agentic SDLC Agents Set |
|----------|-----------------|--------------------------|
| Scope | 1 isolated skill (TDD, debugging...) | **Complete set covering the entire SDLC**, agents connected sequentially (output of requirement-analyst is input of planner) |
| Tool support | Locked into 1 tool (mostly Claude Code only) | **Single source → builds for all tools** (Universal + native adapters) |
| Customization | Fork and edit manually → lose updateability | **Patch-based overrides**, update the base without losing customizations |
| Company Conventions | No standard place to inject | **Policy layer** (org → team → project) embedding internal checklists/conventions |
| Versioning & Distribution | Manual copy/paste, no versioning | SemVer, `update` command, registry, changelog |
| Quality | Untestable | Eval harness + golden cases + snapshot tests in CI |

> **Positioning Statement:** other skills are *singles*; this product is the *album publisher* — curated, standardized, packaged for multi-platform, distributed, and updated.

### 15.2 Reusing Existing Skills (build on, not rebuild)

**Strategy: DO NOT rewrite what the community has already done well.** The `import` mechanism in the build engine:

```yaml
# agents/bug-triager.yaml
id: bug-triager
imports:
  - source: github:obra/superpowers            # high-star GitHub skill
    path: skills/systematic-debugging
    pin: v4.2.0                                # pin version/commit — does not drift with upstream
    license: MIT                                # build fails if license is incompatible
prompt_prepend: |
  Apply the systematic-debugging workflow below, outputting in {{language}}.
```

- **Vendor + pin**: skills are copied to `vendor/` during build, pinned by tag/commit — build remains deterministic and offline-friendly, independent of upstream availability.
- **Automated license checking**: only import skills with compatible licenses (MIT/Apache-2.0); write attribution in the output.
- **Wrap, don't modify**: original skill content is kept intact, customized via `prompt_prepend/append` — when upstream releases a new version, simply bump the `pin` and run evals again.
- **Import candidates for MVP**: systematic-debugging & TDD workflow (superpowers, ~94k+ stars, in Anthropic marketplace), document skills from anthropics/skills (official, ~135k stars), engineering workflow skills from mattpocock/skills (124k stars, MIT — see Table 15.3), individual agents from VoltAgent/awesome-claude-code-subagents and wshobson/agents. Significantly reduces the effort of writing the 6 MVP agents — the part to write manually is mostly company policies + Vietnamese output templates + "connecting" agents into the SDLC loop.

### 15.3 Mapping Community Skills to the Agent Catalog (Evaluated 06/2026)

| Catalog Agent | Skill to Import (Source) | Notes |
|---|---|---|
| `requirement-analyst` | `to-prd`, `grill-me`, `grill-with-docs` (mattpocock) + `brainstorming` (superpowers) | `to-prd` has a ready-made 8-section PRD template (Problem, Solution, User Stories, Implementation/Testing Decisions, Out of Scope) + auto-publishes to issue tracker — almost ready to use |
| `estimation-agent` | `to-issues`, `triage` (mattpocock) | `to-issues` converts specs → independent "grabbable" GitHub issues — perfect for breakdown |
| `solution-architect` | `improve-codebase-architecture`, `zoom-out` (mattpocock) + `docs/adr/` pattern of that repository | mattpocock's repository uses ADRs — borrow the structure directly |
| `planner` | `writing-plans`, `executing-plans` (superpowers) + `prototype` (mattpocock) | |
| `coder` | `tdd` (both superpowers and mattpocock), `subagent-driven-development` (superpowers) | Compare the two TDD versions, select/merge the better one |
| `bug-triager` | `diagnose` (mattpocock) + `systematic-debugging` (superpowers) | Two independent debugging workflows with the same philosophy — strong signal that the pattern is correct |
| `code-reviewer` | `requesting/receiving-code-review` (superpowers), `git-guardrails`, `setup-pre-commit` (mattpocock) | Wrap with company checklist via policy layer |
| `doc-writer` | document skills PDF/DOCX/XLSX/PPTX (anthropics/skills) | Official, production-ready |
| **Cross-cutting (all agents)** | `handoff` (mattpocock) — compresses context when transitioning agent→agent; `caveman` (mattpocock) — reduces token output by ~75% | `handoff` is the missing piece to "connect agents into the SDLC loop"; `caveman` addresses the community's burning token-cost pain point |
| **Meta (build engine)** | `write-a-skill` (mattpocock), `writing-skills` (superpowers) | Reference for standard DSL + guidelines for contributing new agents |

> Skills NOT imported from mattpocock/skills (too personal, out of scope): `setup-matt-pocock-skills`, `scaffold-exercises`, `migrate-to-shoehorn`, `teach`.

## 16. Estimated Team & Effort (MVP)

| Role | Quantity | Responsibility |
|------|----------|-------------|
| Tech Lead / SA | 1 | DSL design, adapter architecture, reviews |
| Backend/Tooling Dev (TS) | 1–2 | Build engine, CLI, adapters, CI |
| Prompt Engineer / Senior Dev | 1 | Write & tune 6 MVP agents, eval cases |
| (Part-time) BA/QA | 0.5 | Test agent output with real cases, write docs |

**Total MVP Effort:** ~6 weeks × 3 people ≈ **18 person-weeks**.

---

## Appendix A — Proposed Repository Structure

```
sdlc-agents/
├─ packages/
│  ├─ core/               # schema, resolver, config merge
│  ├─ cli/                # init/build/update/validate
│  └─ adapters/
│     ├─ claude-code/
│     ├─ copilot/
│     └─ ...
├─ agents/                # canonical agent definitions (YAML)
├─ skills/                # detailed workflows (Markdown)
├─ templates/             # output templates (ADR, PRD, ...)
├─ policies/              # checklists, conventions (org defaults)
├─ examples/              # pre-built demo projects for each tool
└─ docs/
```

## Appendix B — References
- Claude Code subagents/skills/plugins: https://docs.claude.com/en/docs/claude-code
- GitHub Copilot customization: https://docs.github.com/en/copilot/customizing-copilot
- AGENTS.md convention (Linux Foundation AAIF, 60k+ repos adopt): https://agents.md
- promptfoo (LLM eval): https://promptfoo.dev
- obra/superpowers (SDLC skill framework, in Anthropic marketplace): https://github.com/obra/superpowers
- anthropics/skills (official document skills): https://github.com/anthropics/skills
- mattpocock/skills (engineering workflow skills, MIT): https://github.com/mattpocock/skills
- wshobson/agents (multi-harness plugin marketplace — reference competitor): https://github.com/wshobson/agents
- VoltAgent/awesome-claude-code-subagents (100+ subagents): https://github.com/VoltAgent/awesome-claude-code-subagents
