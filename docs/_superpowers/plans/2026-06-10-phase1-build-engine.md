# Phase 1 — Build Engine, Adapters & CLI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working `sdlc build` / `sdlc validate` / `sdlc init` CLI that reads agent YAML definitions and renders output files for Claude Code, GitHub Copilot, and Universal (AGENTS.md) formats.

**Architecture:** Three-layer pipeline — (1) `@sdlc-agents/core` loads + validates + resolves YAML agent definitions; (2) adapter packages (`universal`, `claude-code`, `copilot`) each implement a `ToolAdapter` interface and render `OutputFile[]`; (3) `@sdlc-agents/cli` wires them together behind `commander` sub-commands. Config is read from `sdlc.config.yaml` at the project root and deep-merged across up to 5 layers (base → org → team → project → local).

**Tech Stack:** TypeScript 5 + Node 20, pnpm workspaces, Zod (validation), `yaml` (eemeli/yaml), `commander` (CLI), `deepmerge-ts` (config merge), Vitest (tests).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/core/src/types.ts` | Create | Shared interfaces: `ToolAdapter`, `BuildContext`, `OutputFile`, `Diagnostic`, `ResolvedConfig` |
| `packages/core/src/loader.ts` | Create | `loadAgents(dir)` — reads `agents/*.yaml`, validates each via `AgentSchema` |
| `packages/core/src/resolver.ts` | Create | `resolveVariables(text, vars)` + `resolveAgent(agent, vars)` |
| `packages/core/src/config.ts` | Create | `loadConfig(dir)` — reads `sdlc.config.yaml`, returns `ResolvedConfig` |
| `packages/core/src/merger.ts` | Create | `mergeConfigs(...configs)` — deep-merge with priority order |
| `packages/core/src/index.ts` | Modify | Re-export all new modules |
| `packages/core/src/__tests__/loader.test.ts` | Create | Tests for `loadAgents` |
| `packages/core/src/__tests__/resolver.test.ts` | Create | Tests for `resolveVariables` + `resolveAgent` |
| `packages/core/src/__tests__/merger.test.ts` | Create | Tests for `mergeConfigs` |
| `packages/adapters/universal/package.json` | Create | Package descriptor |
| `packages/adapters/universal/src/index.ts` | Create | `UniversalAdapter` → AGENTS.md + `.sdlc/agents/*.md` |
| `packages/adapters/universal/src/__tests__/universal.test.ts` | Create | Snapshot tests for rendered output |
| `packages/adapters/claude-code/package.json` | Create | Package descriptor |
| `packages/adapters/claude-code/src/index.ts` | Create | `ClaudeCodeAdapter` → `.claude/agents/*.md` |
| `packages/adapters/claude-code/src/__tests__/claude-code.test.ts` | Create | Snapshot tests |
| `packages/adapters/copilot/package.json` | Create | Package descriptor |
| `packages/adapters/copilot/src/index.ts` | Create | `CopilotAdapter` → `.github/copilot-instructions.md` + `.github/prompts/*.prompt.md` |
| `packages/adapters/copilot/src/__tests__/copilot.test.ts` | Create | Snapshot tests |
| `packages/cli/package.json` | Create | Package descriptor |
| `packages/cli/src/index.ts` | Create | CLI entry point (`commander` root command + version) |
| `packages/cli/src/commands/build.ts` | Create | `sdlc build` — load → resolve → render all adapters → write files |
| `packages/cli/src/commands/validate.ts` | Create | `sdlc validate` — load + schema-check, print diagnostics, exit 1 on error |
| `packages/cli/src/commands/init.ts` | Create | `sdlc init` — scaffold `sdlc.config.yaml` in cwd if absent |
| `packages/cli/src/__tests__/build.test.ts` | Create | Integration test: build a temp dir of agents, check output files exist |
| `packages/cli/src/__tests__/validate.test.ts` | Create | validate passes good YAML, exits non-zero on bad YAML |
| `agents/requirement-analyst.yaml` | Create | MVP agent #3 |
| `agents/solution-architect.yaml` | Create | MVP agent #4 |
| `agents/coder.yaml` | Create | MVP agent #5 |
| `agents/test-generator.yaml` | Create | MVP agent #6 |

---

## Task 1: Core shared types

**Files:**
- Create: `packages/core/src/types.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Create `packages/core/src/types.ts`**

```typescript
import type { AgentDef } from "./schema.js";

export interface OutputFile {
  /** Path relative to the consumer project root. */
  path: string;
  content: string;
}

export interface Diagnostic {
  severity: "error" | "warning" | "info";
  message: string;
  /** File that triggered this diagnostic, if known. */
  source?: string;
}

export interface ResolvedConfig {
  targets: string[];
  /** Root dir that agents/, templates/, policies/ live under (absolute). */
  rootDir: string;
  variables: Record<string, string>;
  agentsDir: string;
}

export interface BuildContext {
  config: ResolvedConfig;
  /** template name → file content, pre-loaded */
  templates: Map<string, string>;
  /** policy name → file content, pre-loaded */
  policies: Map<string, string>;
}

export interface ToolAdapter {
  readonly name: string;
  render(agents: AgentDef[], ctx: BuildContext): OutputFile[];
  validate?(outputs: OutputFile[]): Diagnostic[];
}
```

- [ ] **Step 2: Add export to `packages/core/src/index.ts`**

```typescript
export { AgentSchema } from "./schema.js";
export type { AgentDef } from "./schema.js";
export type {
  OutputFile,
  Diagnostic,
  ResolvedConfig,
  BuildContext,
  ToolAdapter,
} from "./types.js";
```

- [ ] **Step 3: Verify typecheck passes**

```
cd AI_Agent_SDLC_set && pnpm tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```
git add packages/core/src/types.ts packages/core/src/index.ts
git commit -m "feat(core): shared types — ToolAdapter, BuildContext, OutputFile"
```

---

## Task 2: Agent loader

**Files:**
- Create: `packages/core/src/loader.ts`
- Create: `packages/core/src/__tests__/loader.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/core/src/__tests__/loader.test.ts
import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadAgents } from "../loader.js";

const FIXTURES = path.join(
  fileURLToPath(import.meta.url),
  "../../__fixtures__"
);

describe("loadAgents", () => {
  it("loads all .yaml files in a directory", () => {
    const agents = loadAgents(path.join(FIXTURES, "valid"));
    expect(agents).toHaveLength(2);
    expect(agents.map((a) => a.id).sort()).toEqual([
      "code-reviewer",
      "planner",
    ]);
  });

  it("throws ZodError on invalid agent YAML", () => {
    expect(() =>
      loadAgents(path.join(FIXTURES, "invalid"))
    ).toThrow();
  });

  it("ignores non-.yaml files in directory", () => {
    const agents = loadAgents(path.join(FIXTURES, "valid"));
    // fixture dir has a README.md — should not be loaded
    expect(agents.every((a) => typeof a.id === "string")).toBe(true);
  });
});
```

- [ ] **Step 2: Create fixture files**

```
packages/core/src/__fixtures__/valid/planner.yaml     (copy agents/planner.yaml)
packages/core/src/__fixtures__/valid/code-reviewer.yaml (copy agents/code-reviewer.yaml)
packages/core/src/__fixtures__/valid/README.md        (any text — should be ignored)
packages/core/src/__fixtures__/invalid/bad.yaml       (content: "id: BAD_ID\nversion: not-semver")
```

- [ ] **Step 3: Run tests to confirm they fail**

```
pnpm vitest run packages/core/src/__tests__/loader.test.ts
```
Expected: FAIL — `loadAgents` not found.

- [ ] **Step 4: Create `packages/core/src/loader.ts`**

```typescript
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { AgentSchema, type AgentDef } from "./schema.js";

export function loadAgents(dir: string): AgentDef[] {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yaml"))
    .sort();

  return files.map((f) => {
    const filePath = path.join(dir, f);
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = parse(raw);
    return AgentSchema.parse(parsed);
  });
}
```

- [ ] **Step 5: Add export to index.ts**

```typescript
// append to packages/core/src/index.ts
export { loadAgents } from "./loader.js";
```

- [ ] **Step 6: Run tests — expect pass**

```
pnpm vitest run
```
Expected: all pass.

- [ ] **Step 7: Commit**

```
git add packages/core/src/loader.ts packages/core/src/index.ts packages/core/src/__tests__/loader.test.ts packages/core/src/__fixtures__/
git commit -m "feat(core): agent loader with Zod validation"
```

---

## Task 3: Variable resolver

**Files:**
- Create: `packages/core/src/resolver.ts`
- Create: `packages/core/src/__tests__/resolver.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// packages/core/src/__tests__/resolver.test.ts
import { describe, expect, it } from "vitest";
import { resolveVariables, resolveAgent } from "../resolver.js";

describe("resolveVariables", () => {
  it("replaces known variables", () => {
    expect(resolveVariables("Hello {{name}}", { name: "world" })).toBe("Hello world");
  });

  it("leaves unknown variables as-is", () => {
    expect(resolveVariables("{{unknown}}", {})).toBe("{{unknown}}");
  });

  it("handles multiple occurrences", () => {
    const result = resolveVariables("{{a}} + {{a}}", { a: "x" });
    expect(result).toBe("x + x");
  });
});

describe("resolveAgent", () => {
  const agent = {
    id: "planner",
    version: "1.0.0",
    phase: "planning" as const,
    description: "Plans for {{team}} team using {{stack}}.",
    model_hint: "balanced" as const,
    tools_required: [],
    inputs: [],
    workflow: [{ step: "Plan for {{team}}" }],
    policies: [],
  };

  it("substitutes variables in description and workflow", () => {
    const resolved = resolveAgent(agent, { team: "payments", stack: "Node.js" });
    expect(resolved.description).toContain("payments team");
    expect(resolved.workflow[0].step).toBe("Plan for payments");
  });

  it("leaves unmatched variables in place", () => {
    const resolved = resolveAgent(agent, {});
    expect(resolved.description).toContain("{{team}}");
  });
});
```

- [ ] **Step 2: Run — expect fail**

```
pnpm vitest run packages/core/src/__tests__/resolver.test.ts
```

- [ ] **Step 3: Create `packages/core/src/resolver.ts`**

```typescript
import type { AgentDef } from "./schema.js";

export function resolveVariables(
  text: string,
  vars: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export function resolveAgent(
  agent: AgentDef,
  vars: Record<string, string>
): AgentDef {
  const serialized = JSON.stringify(agent);
  const resolved = resolveVariables(serialized, vars);
  return JSON.parse(resolved) as AgentDef;
}
```

- [ ] **Step 4: Export from index.ts**

```typescript
// append
export { resolveVariables, resolveAgent } from "./resolver.js";
```

- [ ] **Step 5: Run all tests — expect pass**

```
pnpm vitest run
```

- [ ] **Step 6: Commit**

```
git add packages/core/src/resolver.ts packages/core/src/index.ts packages/core/src/__tests__/resolver.test.ts
git commit -m "feat(core): variable resolver for agent templates"
```

---

## Task 4: Config loader + merger

**Files:**
- Create: `packages/core/src/config.ts`
- Create: `packages/core/src/merger.ts`
- Create: `packages/core/src/__tests__/merger.test.ts`
- Create: `sdlc.config.yaml` (default config at repo root)

- [ ] **Step 1: Write failing tests for merger**

```typescript
// packages/core/src/__tests__/merger.test.ts
import { describe, expect, it } from "vitest";
import { mergeConfigs } from "../merger.js";
import type { ResolvedConfig } from "../types.js";

const base: ResolvedConfig = {
  targets: ["universal"],
  rootDir: "/project",
  variables: { language: "en" },
  agentsDir: "agents",
};

describe("mergeConfigs", () => {
  it("later config overrides earlier for scalar fields", () => {
    const result = mergeConfigs(base, {
      targets: ["universal", "claude-code"],
    } as Partial<ResolvedConfig>);
    expect(result.targets).toEqual(["universal", "claude-code"]);
  });

  it("deep-merges variables", () => {
    const result = mergeConfigs(base, {
      variables: { team: "payments" },
    } as Partial<ResolvedConfig>);
    expect(result.variables).toEqual({ language: "en", team: "payments" });
  });

  it("preserves base values when override is undefined", () => {
    const result = mergeConfigs(base, {} as Partial<ResolvedConfig>);
    expect(result.agentsDir).toBe("agents");
  });

  it("merges three layers in priority order (last wins)", () => {
    const result = mergeConfigs(
      base,
      { variables: { language: "vi" } } as Partial<ResolvedConfig>,
      { variables: { language: "en", team: "core" } } as Partial<ResolvedConfig>
    );
    expect(result.variables.language).toBe("en");
    expect(result.variables.team).toBe("core");
  });
});
```

- [ ] **Step 2: Run — expect fail**

```
pnpm vitest run packages/core/src/__tests__/merger.test.ts
```

- [ ] **Step 3: Create `packages/core/src/merger.ts`**

```typescript
import type { ResolvedConfig } from "./types.js";

type PartialConfig = Partial<ResolvedConfig>;

export function mergeConfigs(
  base: ResolvedConfig,
  ...overrides: PartialConfig[]
): ResolvedConfig {
  let result = { ...base };
  for (const override of overrides) {
    result = {
      ...result,
      ...override,
      variables: { ...result.variables, ...(override.variables ?? {}) },
    };
  }
  return result;
}
```

- [ ] **Step 4: Create `packages/core/src/config.ts`**

```typescript
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import type { ResolvedConfig } from "./types.js";

const ConfigFileSchema = z.object({
  targets: z.array(z.string()).optional(),
  variables: z.record(z.string(), z.string()).optional(),
  agentsDir: z.string().optional(),
});

export function loadConfig(dir: string): ResolvedConfig {
  const defaults: ResolvedConfig = {
    targets: ["universal", "claude-code"],
    rootDir: path.resolve(dir),
    variables: { language: "en" },
    agentsDir: "agents",
  };

  const configPath = path.join(dir, "sdlc.config.yaml");
  if (!fs.existsSync(configPath)) return defaults;

  const raw = fs.readFileSync(configPath, "utf8");
  const parsed = ConfigFileSchema.parse(parse(raw));

  return {
    ...defaults,
    ...parsed,
    variables: { ...defaults.variables, ...(parsed.variables ?? {}) },
  };
}
```

- [ ] **Step 5: Create default `sdlc.config.yaml` at repo root**

```yaml
# sdlc-agents configuration
# Override per project by creating sdlc.config.yaml in your project root.

targets:
  - universal      # AGENTS.md + .sdlc/agents/ — works on all AI tools
  - claude-code    # .claude/agents/*.md — native Claude Code subagents
  - copilot        # .github/copilot-instructions.md + .github/prompts/

variables:
  language: en     # output language hint for agents
  # team: my-team  # inject into {{team}} template variables
```

- [ ] **Step 6: Export from index.ts**

```typescript
// append
export { loadConfig } from "./config.js";
export { mergeConfigs } from "./merger.js";
```

- [ ] **Step 7: Run all tests**

```
pnpm vitest run
```
Expected: all pass.

- [ ] **Step 8: Commit**

```
git add packages/core/src/config.ts packages/core/src/merger.ts packages/core/src/index.ts packages/core/src/__tests__/merger.test.ts sdlc.config.yaml
git commit -m "feat(core): config loader + 5-layer config merger"
```

---

## Task 5: Universal adapter

**Files:**
- Create: `packages/adapters/universal/package.json`
- Create: `packages/adapters/universal/src/index.ts`
- Create: `packages/adapters/universal/src/__tests__/universal.test.ts`

- [ ] **Step 1: Create `packages/adapters/universal/package.json`**

```json
{
  "name": "@sdlc-agents/adapter-universal",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "@sdlc-agents/core": "workspace:*"
  }
}
```

- [ ] **Step 2: Write snapshot tests**

```typescript
// packages/adapters/universal/src/__tests__/universal.test.ts
import { describe, expect, it } from "vitest";
import { UniversalAdapter } from "../index.js";
import type { BuildContext } from "@sdlc-agents/core";

const adapter = new UniversalAdapter();

const mockCtx: BuildContext = {
  config: {
    targets: ["universal"],
    rootDir: "/project",
    variables: { language: "en" },
    agentsDir: "agents",
  },
  templates: new Map(),
  policies: new Map(),
};

const mockAgent = {
  id: "planner",
  version: "1.0.0",
  phase: "planning" as const,
  description: "Breaks a spec into tasks.",
  model_hint: "high-reasoning" as const,
  tools_required: ["read_file"],
  inputs: [{ name: "spec", required: true, description: "The spec" }],
  workflow: [{ step: "Read spec" }, { step: "Break into tasks" }],
  output_template: "templates/plan.md",
  policies: ["conventions"],
};

describe("UniversalAdapter", () => {
  it("has name 'universal'", () => {
    expect(adapter.name).toBe("universal");
  });

  it("renders AGENTS.md + per-agent .sdlc file", () => {
    const outputs = adapter.render([mockAgent], mockCtx);
    const paths = outputs.map((o) => o.path);
    expect(paths).toContain("AGENTS.md");
    expect(paths).toContain(".sdlc/agents/planner.md");
  });

  it("AGENTS.md contains agent name and phase", () => {
    const outputs = adapter.render([mockAgent], mockCtx);
    const index = outputs.find((o) => o.path === "AGENTS.md")!;
    expect(index.content).toContain("planner");
    expect(index.content).toContain("planning");
  });

  it("agent file contains workflow steps", () => {
    const outputs = adapter.render([mockAgent], mockCtx);
    const agentFile = outputs.find((o) => o.path === ".sdlc/agents/planner.md")!;
    expect(agentFile.content).toContain("Read spec");
    expect(agentFile.content).toContain("Break into tasks");
  });

  it("matches AGENTS.md snapshot", () => {
    const outputs = adapter.render([mockAgent], mockCtx);
    const index = outputs.find((o) => o.path === "AGENTS.md")!;
    expect(index.content).toMatchSnapshot();
  });
});
```

- [ ] **Step 3: Run — expect fail**

```
pnpm vitest run packages/adapters/universal
```

- [ ] **Step 4: Create `packages/adapters/universal/src/index.ts`**

```typescript
import type { AgentDef, ToolAdapter, BuildContext, OutputFile } from "@sdlc-agents/core";

export class UniversalAdapter implements ToolAdapter {
  readonly name = "universal";

  render(agents: AgentDef[], _ctx: BuildContext): OutputFile[] {
    return [
      { path: "AGENTS.md", content: this.renderIndex(agents) },
      ...agents.map((a) => ({
        path: `.sdlc/agents/${a.id}.md`,
        content: this.renderAgent(a),
      })),
    ];
  }

  private renderIndex(agents: AgentDef[]): string {
    const rows = agents
      .map(
        (a) =>
          `| [\`${a.id}\`](.sdlc/agents/${a.id}.md) | ${a.phase} | ${firstLine(a.description)} |`
      )
      .join("\n");

    return `# SDLC Agents

This project uses the **Agentic SDLC Agents Set** — AI agents for every SDLC phase.

## How to invoke

- **Claude Code / Cursor / Windsurf / Codex / Gemini CLI:** name the agent explicitly,
  e.g. _"use the \`planner\` agent to break down this spec"_
- **All tools:** open the agent file under \`.sdlc/agents/\` and follow the workflow

## Available Agents

| Agent | Phase | Description |
|-------|-------|-------------|
${rows}

---
_Generated by sdlc-agents. Run \`sdlc build\` to regenerate._
`;
  }

  private renderAgent(agent: AgentDef): string {
    const inputs = agent.inputs.length
      ? agent.inputs
          .map((i) => `- **${i.name}**${i.required ? " *(required)*" : ""}: ${i.description ?? ""}`)
          .join("\n")
      : "_None_";

    const workflow = agent.workflow
      .map((w, i) => `${i + 1}. ${w.step}${w.ref ? ` (see \`${w.ref}\`)` : ""}`)
      .join("\n");

    const policies = agent.policies.length
      ? agent.policies.map((p) => `- [\`${p}\`](../../policies/${p}.md)`).join("\n")
      : "";

    return `# ${agent.id}

**Phase:** ${agent.phase} | **Version:** ${agent.version} | **Model:** ${agent.model_hint}

## What this agent does

${agent.description.trim()}

## Inputs

${inputs}

## Workflow

${workflow}
${agent.output_template ? `\n## Output\n\nUse template \`${agent.output_template}\`.\n` : ""}
${policies ? `## Policies\n\n${policies}\n` : ""}
---
_Part of sdlc-agents. Universal tier — works on any AI tool._
`;
  }
}

function firstLine(text: string): string {
  return text.trim().split("\n")[0] ?? text.trim();
}
```

- [ ] **Step 5: Run tests — expect pass + snapshot written**

```
pnpm vitest run packages/adapters/universal
```

- [ ] **Step 6: Commit**

```
git add packages/adapters/universal/
git commit -m "feat(adapter-universal): AGENTS.md + .sdlc/agents/ renderer"
```

---

## Task 6: Claude Code adapter

**Files:**
- Create: `packages/adapters/claude-code/package.json`
- Create: `packages/adapters/claude-code/src/index.ts`
- Create: `packages/adapters/claude-code/src/__tests__/claude-code.test.ts`

- [ ] **Step 1: Create `packages/adapters/claude-code/package.json`**

```json
{
  "name": "@sdlc-agents/adapter-claude-code",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "@sdlc-agents/core": "workspace:*"
  }
}
```

- [ ] **Step 2: Write snapshot tests**

```typescript
// packages/adapters/claude-code/src/__tests__/claude-code.test.ts
import { describe, expect, it } from "vitest";
import { ClaudeCodeAdapter } from "../index.js";
import type { BuildContext } from "@sdlc-agents/core";

const adapter = new ClaudeCodeAdapter();

const mockCtx: BuildContext = {
  config: { targets: ["claude-code"], rootDir: "/project", variables: {}, agentsDir: "agents" },
  templates: new Map(),
  policies: new Map(),
};

const mockAgent = {
  id: "code-reviewer",
  version: "1.0.0",
  phase: "review" as const,
  description: "Reviews PR diff against checklists.",
  model_hint: "high-reasoning" as const,
  model_variants: {
    claude: { prompt_append: "Use extended thinking." },
  },
  tools_required: ["read_file", "grep"],
  inputs: [{ name: "pr_diff", required: true, description: "The diff" }],
  workflow: [{ step: "Read diff" }, { step: "Run security checklist" }],
  policies: ["security-checklist"],
};

describe("ClaudeCodeAdapter", () => {
  it("has name 'claude-code'", () => {
    expect(adapter.name).toBe("claude-code");
  });

  it("renders one file per agent at .claude/agents/<id>.md", () => {
    const outputs = adapter.render([mockAgent], mockCtx);
    expect(outputs).toHaveLength(1);
    expect(outputs[0].path).toBe(".claude/agents/code-reviewer.md");
  });

  it("output has valid YAML frontmatter with name and model fields", () => {
    const { content } = adapter.render([mockAgent], mockCtx)[0];
    expect(content).toMatch(/^---\n/);
    expect(content).toContain("name: code-reviewer");
    expect(content).toContain("model: claude-opus-4-8");
  });

  it("includes workflow steps in body", () => {
    const { content } = adapter.render([mockAgent], mockCtx)[0];
    expect(content).toContain("Read diff");
    expect(content).toContain("Run security checklist");
  });

  it("includes claude-specific prompt_append note", () => {
    const { content } = adapter.render([mockAgent], mockCtx)[0];
    expect(content).toContain("Use extended thinking.");
  });

  it("matches snapshot", () => {
    const outputs = adapter.render([mockAgent], mockCtx);
    expect(outputs[0].content).toMatchSnapshot();
  });
});
```

- [ ] **Step 3: Run — expect fail**

```
pnpm vitest run packages/adapters/claude-code
```

- [ ] **Step 4: Create `packages/adapters/claude-code/src/index.ts`**

```typescript
import type { AgentDef, ToolAdapter, BuildContext, OutputFile } from "@sdlc-agents/core";

const MODEL_MAP: Record<string, string> = {
  fast: "claude-haiku-4-5-20251001",
  balanced: "claude-sonnet-4-6",
  "high-reasoning": "claude-opus-4-8",
};

export class ClaudeCodeAdapter implements ToolAdapter {
  readonly name = "claude-code";

  render(agents: AgentDef[], _ctx: BuildContext): OutputFile[] {
    return agents.map((a) => ({
      path: `.claude/agents/${a.id}.md`,
      content: this.renderAgent(a),
    }));
  }

  private renderAgent(agent: AgentDef): string {
    const toolsYaml = agent.tools_required.length
      ? agent.tools_required.map((t) => `  - ${t}`).join("\n")
      : "  []";

    const claudeNote = agent.model_variants?.claude?.prompt_append
      ? `\n> **Claude-specific:** ${agent.model_variants.claude.prompt_append}\n`
      : "";

    const inputs = agent.inputs.length
      ? agent.inputs
          .map((i) => `- **\`${i.name}\`**${i.required ? " _(required)_" : ""}: ${i.description ?? ""}`)
          .join("\n")
      : "_None_";

    const workflow = agent.workflow
      .map((w, i) => `${i + 1}. ${w.step}${w.ref ? `\n   > ref: \`${w.ref}\`` : ""}`)
      .join("\n");

    const policies = agent.policies.length
      ? agent.policies.map((p) => `- \`policies/${p}.md\``).join("\n")
      : "";

    return `---
name: ${agent.id}
description: >-
  [SDLC:${agent.phase}] ${agent.description.trim().replace(/\n/g, " ")}
model: ${MODEL_MAP[agent.model_hint] ?? "claude-sonnet-4-6"}
tools:
${toolsYaml}
---

# ${agent.id} (phase: ${agent.phase})

${agent.description.trim()}
${claudeNote}
## Inputs

${inputs}

## Workflow

${workflow}
${agent.output_template ? `\n## Output\n\nFollow template \`${agent.output_template}\`.\n` : ""}
${policies ? `## Policies\n\n${policies}\n` : ""}
---
_Generated by sdlc-agents. Do not edit — run \`sdlc build\` to regenerate._
`;
  }
}
```

- [ ] **Step 5: Run — expect pass**

```
pnpm vitest run packages/adapters/claude-code
```

- [ ] **Step 6: Commit**

```
git add packages/adapters/claude-code/
git commit -m "feat(adapter-claude-code): .claude/agents/*.md renderer"
```

---

## Task 7: Copilot adapter

**Files:**
- Create: `packages/adapters/copilot/package.json`
- Create: `packages/adapters/copilot/src/index.ts`
- Create: `packages/adapters/copilot/src/__tests__/copilot.test.ts`

- [ ] **Step 1: Create `packages/adapters/copilot/package.json`**

```json
{
  "name": "@sdlc-agents/adapter-copilot",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "@sdlc-agents/core": "workspace:*"
  }
}
```

- [ ] **Step 2: Write snapshot tests**

```typescript
// packages/adapters/copilot/src/__tests__/copilot.test.ts
import { describe, expect, it } from "vitest";
import { CopilotAdapter } from "../index.js";
import type { BuildContext } from "@sdlc-agents/core";

const adapter = new CopilotAdapter();

const mockCtx: BuildContext = {
  config: { targets: ["copilot"], rootDir: "/project", variables: {}, agentsDir: "agents" },
  templates: new Map(),
  policies: new Map(),
};

const agents = [
  {
    id: "planner",
    version: "1.0.0",
    phase: "planning" as const,
    description: "Breaks a spec into tasks.",
    model_hint: "high-reasoning" as const,
    tools_required: [],
    inputs: [],
    workflow: [{ step: "Plan" }],
    policies: [],
  },
  {
    id: "code-reviewer",
    version: "1.0.0",
    phase: "review" as const,
    description: "Reviews a PR diff.",
    model_hint: "high-reasoning" as const,
    tools_required: ["grep"],
    inputs: [{ name: "pr_diff", required: true, description: "Diff" }],
    workflow: [{ step: "Review diff" }],
    policies: ["security-checklist"],
  },
];

describe("CopilotAdapter", () => {
  it("has name 'copilot'", () => {
    expect(adapter.name).toBe("copilot");
  });

  it("renders copilot-instructions.md + one prompt file per agent", () => {
    const outputs = adapter.render(agents, mockCtx);
    const paths = outputs.map((o) => o.path);
    expect(paths).toContain(".github/copilot-instructions.md");
    expect(paths).toContain(".github/prompts/planner.prompt.md");
    expect(paths).toContain(".github/prompts/code-reviewer.prompt.md");
  });

  it("copilot-instructions lists all agents", () => {
    const outputs = adapter.render(agents, mockCtx);
    const instructions = outputs.find(
      (o) => o.path === ".github/copilot-instructions.md"
    )!;
    expect(instructions.content).toContain("planner");
    expect(instructions.content).toContain("code-reviewer");
  });

  it("prompt file contains workflow steps", () => {
    const outputs = adapter.render(agents, mockCtx);
    const plannerPrompt = outputs.find(
      (o) => o.path === ".github/prompts/planner.prompt.md"
    )!;
    expect(plannerPrompt.content).toContain("Plan");
  });

  it("matches copilot-instructions snapshot", () => {
    const outputs = adapter.render(agents, mockCtx);
    const instructions = outputs.find(
      (o) => o.path === ".github/copilot-instructions.md"
    )!;
    expect(instructions.content).toMatchSnapshot();
  });
});
```

- [ ] **Step 3: Run — expect fail**

```
pnpm vitest run packages/adapters/copilot
```

- [ ] **Step 4: Create `packages/adapters/copilot/src/index.ts`**

```typescript
import type { AgentDef, ToolAdapter, BuildContext, OutputFile } from "@sdlc-agents/core";

export class CopilotAdapter implements ToolAdapter {
  readonly name = "copilot";

  render(agents: AgentDef[], _ctx: BuildContext): OutputFile[] {
    return [
      {
        path: ".github/copilot-instructions.md",
        content: this.renderInstructions(agents),
      },
      ...agents.map((a) => ({
        path: `.github/prompts/${a.id}.prompt.md`,
        content: this.renderPrompt(a),
      })),
    ];
  }

  private renderInstructions(agents: AgentDef[]): string {
    const agentRefs = agents
      .map(
        (a) =>
          `- **${a.id}** (phase: ${a.phase}) — ${firstLine(a.description)}` +
          `\n  Prompt file: [.github/prompts/${a.id}.prompt.md](.github/prompts/${a.id}.prompt.md)`
      )
      .join("\n\n");

    return `# SDLC Agents — Copilot Instructions

This repository uses the **Agentic SDLC Agents Set**. The agents below cover the
full software development lifecycle. Activate one by opening its prompt file or
by asking Copilot Chat: _"@workspace follow the ${agents[0]?.id ?? "planner"} agent workflow"_.

## Available Agents

${agentRefs}

---
_Generated by sdlc-agents. Run \`sdlc build\` to regenerate._
`;
  }

  private renderPrompt(agent: AgentDef): string {
    const inputs = agent.inputs.length
      ? agent.inputs
          .map((i) => `- **${i.name}**${i.required ? " (required)" : ""}: ${i.description ?? ""}`)
          .join("\n")
      : "_None_";

    const workflow = agent.workflow
      .map((w, i) => `${i + 1}. ${w.step}`)
      .join("\n");

    const copilotNote = agent.model_variants?.copilot?.prompt_append
      ? `\n> **Copilot note:** ${agent.model_variants.copilot.prompt_append}\n`
      : "";

    return `---
mode: agent
description: "${firstLine(agent.description)}"
---

# ${agent.id} — SDLC Agent (phase: ${agent.phase})

${agent.description.trim()}
${copilotNote}

## Inputs

${inputs}

## Workflow

${workflow}
${agent.output_template ? `\n## Output\n\nUse template \`${agent.output_template}\`.\n` : ""}
---
_Generated by sdlc-agents. Do not edit — run \`sdlc build\` to regenerate._
`;
  }
}

function firstLine(text: string): string {
  return text.trim().split("\n")[0] ?? text.trim();
}
```

- [ ] **Step 5: Run — expect pass**

```
pnpm vitest run packages/adapters/copilot
```

- [ ] **Step 6: Commit**

```
git add packages/adapters/copilot/
git commit -m "feat(adapter-copilot): copilot-instructions.md + .github/prompts/*.prompt.md renderer"
```

---

## Task 8: CLI — init + validate + build

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/src/index.ts`
- Create: `packages/cli/src/commands/init.ts`
- Create: `packages/cli/src/commands/validate.ts`
- Create: `packages/cli/src/commands/build.ts`
- Create: `packages/cli/src/__tests__/validate.test.ts`
- Create: `packages/cli/src/__tests__/build.test.ts`

- [ ] **Step 1: Create `packages/cli/package.json`**

```json
{
  "name": "@sdlc-agents/cli",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "bin": { "sdlc": "./src/index.ts" },
  "dependencies": {
    "@sdlc-agents/adapter-claude-code": "workspace:*",
    "@sdlc-agents/adapter-copilot": "workspace:*",
    "@sdlc-agents/adapter-universal": "workspace:*",
    "@sdlc-agents/core": "workspace:*",
    "commander": "^12.0.0"
  }
}
```

- [ ] **Step 2: Install commander**

```
cd AI_Agent_SDLC_set && pnpm install
```

- [ ] **Step 3: Create `packages/cli/src/commands/init.ts`**

```typescript
import fs from "node:fs";
import path from "node:path";

const DEFAULT_CONFIG = `# sdlc-agents configuration
targets:
  - universal
  - claude-code
  - copilot

variables:
  language: en
  # team: my-team
`;

export function runInit(cwd: string): void {
  const dest = path.join(cwd, "sdlc.config.yaml");
  if (fs.existsSync(dest)) {
    console.log("sdlc.config.yaml already exists — skipping.");
    return;
  }
  fs.writeFileSync(dest, DEFAULT_CONFIG, "utf8");
  console.log("Created sdlc.config.yaml");
  console.log("Next: run `sdlc build` to generate agent files.");
}
```

- [ ] **Step 4: Create `packages/cli/src/commands/validate.ts`**

```typescript
import { loadAgents } from "@sdlc-agents/core";
import { ZodError } from "zod";

export function runValidate(agentsDir: string): boolean {
  let ok = true;
  try {
    const agents = loadAgents(agentsDir);
    console.log(`✓ ${agents.length} agent(s) valid.`);
  } catch (err) {
    ok = false;
    if (err instanceof ZodError) {
      console.error("Validation errors:");
      err.issues.forEach((i) =>
        console.error(`  [${i.path.join(".")}] ${i.message}`)
      );
    } else {
      console.error(String(err));
    }
  }
  return ok;
}
```

- [ ] **Step 5: Create `packages/cli/src/commands/build.ts`**

```typescript
import fs from "node:fs";
import path from "node:path";
import {
  loadAgents,
  loadConfig,
  resolveAgent,
  type ToolAdapter,
  type BuildContext,
} from "@sdlc-agents/core";
import { UniversalAdapter } from "@sdlc-agents/adapter-universal";
import { ClaudeCodeAdapter } from "@sdlc-agents/adapter-claude-code";
import { CopilotAdapter } from "@sdlc-agents/adapter-copilot";

const ADAPTERS: Record<string, ToolAdapter> = {
  universal: new UniversalAdapter(),
  "claude-code": new ClaudeCodeAdapter(),
  copilot: new CopilotAdapter(),
};

export function runBuild(cwd: string): void {
  const config = loadConfig(cwd);
  const agentsDir = path.join(cwd, config.agentsDir);
  const rawAgents = loadAgents(agentsDir);
  const agents = rawAgents.map((a) => resolveAgent(a, config.variables));

  const ctx: BuildContext = {
    config,
    templates: loadDir(path.join(cwd, "templates")),
    policies: loadDir(path.join(cwd, "policies")),
  };

  let totalFiles = 0;
  for (const targetName of config.targets) {
    const adapter = ADAPTERS[targetName];
    if (!adapter) {
      console.warn(`Unknown target "${targetName}" — skipping.`);
      continue;
    }
    const outputs = adapter.render(agents, ctx);
    for (const file of outputs) {
      const dest = path.join(cwd, file.path);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, file.content, "utf8");
      totalFiles++;
    }
    console.log(`✓ ${adapter.name}: ${outputs.length} file(s)`);
  }
  console.log(`\nBuild complete — ${totalFiles} file(s) written.`);
}

function loadDir(dir: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!fs.existsSync(dir)) return map;
  for (const f of fs.readdirSync(dir)) {
    const content = fs.readFileSync(path.join(dir, f), "utf8");
    map.set(f, content);
  }
  return map;
}
```

- [ ] **Step 6: Create `packages/cli/src/index.ts`**

```typescript
#!/usr/bin/env node
import { Command } from "commander";
import { runBuild } from "./commands/build.js";
import { runInit } from "./commands/init.js";
import { runValidate } from "./commands/validate.js";

const program = new Command();

program
  .name("sdlc")
  .description("Agentic SDLC Agents Set — build AI agent definitions for every tool")
  .version("0.1.0");

program
  .command("build")
  .description("Render agent definitions to all configured target formats")
  .option("-C, --cwd <dir>", "project directory", process.cwd())
  .action((opts) => runBuild(opts.cwd));

program
  .command("validate")
  .description("Validate all agent YAML definitions without building")
  .option("-C, --cwd <dir>", "project directory", process.cwd())
  .action((opts) => {
    const ok = runValidate(`${opts.cwd}/agents`);
    if (!ok) process.exit(1);
  });

program
  .command("init")
  .description("Scaffold sdlc.config.yaml in the current project")
  .option("-C, --cwd <dir>", "project directory", process.cwd())
  .action((opts) => runInit(opts.cwd));

program.parse();
```

- [ ] **Step 7: Write integration tests**

```typescript
// packages/cli/src/__tests__/build.test.ts
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { runBuild } from "../commands/build.js";

function makeTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sdlc-test-"));
  // copy fixtures
  const agentsDir = path.join(dir, "agents");
  fs.mkdirSync(agentsDir);
  const fixtureAgents = path.resolve(
    import.meta.dirname,
    "../../../../../../agents"
  );
  for (const f of fs.readdirSync(fixtureAgents)) {
    fs.copyFileSync(
      path.join(fixtureAgents, f),
      path.join(agentsDir, f)
    );
  }
  // minimal config
  fs.writeFileSync(
    path.join(dir, "sdlc.config.yaml"),
    stringifyYaml({ targets: ["universal", "claude-code"], variables: {} })
  );
  return dir;
}

describe("runBuild", () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTempProject(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it("creates AGENTS.md for universal target", () => {
    runBuild(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, "AGENTS.md"))).toBe(true);
  });

  it("creates .claude/agents/ files for claude-code target", () => {
    runBuild(tmpDir);
    const agentsOut = path.join(tmpDir, ".claude", "agents");
    expect(fs.existsSync(agentsOut)).toBe(true);
    const files = fs.readdirSync(agentsOut);
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((f) => f.endsWith(".md"))).toBe(true);
  });

  it("build is idempotent — second run produces identical output", () => {
    runBuild(tmpDir);
    const first = fs.readFileSync(path.join(tmpDir, "AGENTS.md"), "utf8");
    runBuild(tmpDir);
    const second = fs.readFileSync(path.join(tmpDir, "AGENTS.md"), "utf8");
    expect(first).toBe(second);
  });
});
```

```typescript
// packages/cli/src/__tests__/validate.test.ts
import { describe, expect, it } from "vitest";
import path from "node:path";
import { runValidate } from "../commands/validate.js";

const REAL_AGENTS = path.resolve(import.meta.dirname, "../../../../../../agents");

describe("runValidate", () => {
  it("returns true for the real agents/ directory", () => {
    expect(runValidate(REAL_AGENTS)).toBe(true);
  });
});
```

- [ ] **Step 8: Run tests**

```
pnpm install && pnpm vitest run
```
Expected: all pass.

- [ ] **Step 9: Smoke-test CLI manually**

```
cd AI_Agent_SDLC_set
npx tsx packages/cli/src/index.ts validate
npx tsx packages/cli/src/index.ts build
```
Expected: `✓ N agent(s) valid.` then build output in project root.

- [ ] **Step 10: Commit**

```
git add packages/cli/ sdlc.config.yaml
git commit -m "feat(cli): sdlc build / validate / init commands"
```

---

## Task 9: Remaining 4 MVP agents

**Files:**
- Create: `agents/requirement-analyst.yaml`
- Create: `agents/solution-architect.yaml`
- Create: `agents/coder.yaml`
- Create: `agents/test-generator.yaml`

- [ ] **Step 1: Create `agents/requirement-analyst.yaml`**

```yaml
id: requirement-analyst
version: 1.0.0
phase: requirement
description: >
  Interviews the user to clarify vague requirements, then produces a structured
  PRD with user stories, acceptance criteria (Gherkin), and out-of-scope list.
model_hint: high-reasoning
model_variants:
  claude:
    prompt_append: "Ask no more than 3 clarifying questions at a time. Stop when requirements are unambiguous."

tools_required:
  - read_file

inputs:
  - name: raw_idea
    description: "Rough idea, Slack message, or meeting notes"
    required: true
  - name: context
    description: "Existing codebase or product context"
    required: false

workflow:
  - step: "Read raw_idea carefully; list every ambiguity you spot (max 10)"
  - step: "Ask the user to resolve each ambiguity — wait for answers before proceeding"
  - step: "Draft user stories: 'As a <role>, I want <goal>, so that <benefit>'"
  - step: "Write acceptance criteria for each story in Gherkin (Given/When/Then)"
  - step: "List explicitly what is OUT of scope"
  - step: "Output the PRD using the prd template"

output_template: templates/prd.md
policies: []
```

- [ ] **Step 2: Create `agents/solution-architect.yaml`**

```yaml
id: solution-architect
version: 1.0.0
phase: architecture
description: >
  Produces a High-Level Design (HLD) and Architecture Decision Records (ADRs)
  for a feature or system, comparing trade-offs across at least two options.
model_hint: high-reasoning
model_variants:
  claude:
    prompt_append: "Use extended thinking for the trade-off analysis step."

tools_required:
  - read_file
  - list_files
  - grep

inputs:
  - name: prd
    description: PRD or feature spec
    required: true
  - name: constraints
    description: "Technical constraints (budget, team skill, existing infra)"
    required: false

workflow:
  - step: "Read the PRD; identify architectural drivers (scale, latency, consistency, cost)"
  - step: "Enumerate at least 2 design options for the key architectural decision"
  - step: "Compare options on: complexity, scalability, team familiarity, cost, reversibility"
  - step: "Write an ADR (Architecture Decision Record) for the chosen approach"
  - step: "Draw a component diagram in ASCII or Mermaid"
  - step: "List open questions and assumptions that need validation"
  - step: "Output HLD using the hld template"

output_template: templates/hld.md
policies: []
```

- [ ] **Step 3: Create `agents/coder.yaml`**

```yaml
id: coder
version: 1.0.0
phase: coding
description: >
  Implements a task from an implementation plan using TDD — writes the failing
  test first, then the minimal code to make it pass, then refactors.
model_hint: balanced
model_variants:
  claude:
    prompt_append: "Follow Red-Green-Refactor strictly. Never write implementation before a failing test exists."

tools_required:
  - read_file
  - write_file
  - bash
  - grep

inputs:
  - name: task
    description: "Single task description from implementation plan"
    required: true
  - name: plan
    description: "Full implementation plan for context"
    required: false

workflow:
  - step: "Read the task and understand its acceptance criteria"
  - step: "Identify which file(s) need to change"
  - step: "Write a failing test that covers the task's success condition (RED)"
  - step: "Run the test — confirm it fails for the right reason"
  - step: "Write the minimal implementation to make the test pass (GREEN)"
  - step: "Run the test suite — confirm all pass"
  - step: "Refactor: clean up duplication, improve naming — run tests again (REFACTOR)"
  - step: "Commit with a descriptive message"

output_template: ""
policies:
  - conventions
```

- [ ] **Step 4: Create `agents/test-generator.yaml`**

```yaml
id: test-generator
version: 1.0.0
phase: testing
description: >
  Generates a test plan and concrete test code (unit + integration) from a
  feature spec or existing source file, covering happy path and edge cases.
model_hint: balanced
model_variants:
  claude:
    prompt_append: "Think about boundary conditions and error paths, not just the happy path."

tools_required:
  - read_file
  - grep
  - write_file

inputs:
  - name: source
    description: "Source file or feature spec to generate tests for"
    required: true
  - name: framework
    description: "Test framework to use (e.g. Vitest, Jest, pytest)"
    required: false

workflow:
  - step: "Read the source/spec; list every public function and behaviour to cover"
  - step: "Identify edge cases: empty input, null, max value, concurrent access, error paths"
  - step: "Write a test plan table: test name | input | expected output | category"
  - step: "Generate unit tests for pure functions"
  - step: "Generate integration tests for I/O-heavy or multi-component flows"
  - step: "Run the generated tests; fix any that fail due to test bugs (not source bugs)"
  - step: "Report coverage gaps if any remain"

output_template: templates/test-plan.md
policies:
  - conventions
```

- [ ] **Step 5: Validate new agents load cleanly**

```
npx tsx packages/cli/src/index.ts validate
```
Expected: `✓ 6 agent(s) valid.`

- [ ] **Step 6: Run full build**

```
npx tsx packages/cli/src/index.ts build
```
Expected: AGENTS.md + .claude/agents/ (6 files) + .github/ (7 files) — all written.

- [ ] **Step 7: Commit**

```
git add agents/
git commit -m "feat(agents): 4 remaining MVP agents (requirement-analyst, solution-architect, coder, test-generator)"
```

---

## Task 10: Wire up sdlc script + add missing templates

**Files:**
- Modify: `package.json` (root) — add `sdlc` script
- Create: `templates/prd.md`
- Create: `templates/hld.md`
- Create: `templates/test-plan.md`
- Run full test suite + smoke test

- [ ] **Step 1: Add `sdlc` script to root `package.json`**

```json
"scripts": {
  "sdlc": "tsx packages/cli/src/index.ts",
  "spike": "tsx spike/render.ts",
  ...
}
```

- [ ] **Step 2: Create `templates/prd.md`**

```markdown
# Product Requirements Document: {{title}}

**Generated by:** requirement-analyst agent
**Date:** {{date}}

---

## Problem Statement

{{problem}}

## User Stories

{{user_stories}}

## Acceptance Criteria

{{acceptance_criteria}}

## Out of Scope

{{out_of_scope}}
```

- [ ] **Step 3: Create `templates/hld.md`**

```markdown
# High-Level Design: {{title}}

**Generated by:** solution-architect agent
**Date:** {{date}}

---

## Architectural Drivers

{{drivers}}

## Design Options Considered

{{options}}

## Decision

{{decision}}

## Architecture Decision Record (ADR)

{{adr}}

## Component Diagram

{{diagram}}

## Open Questions

{{open_questions}}
```

- [ ] **Step 4: Create `templates/test-plan.md`**

```markdown
# Test Plan: {{title}}

**Generated by:** test-generator agent
**Date:** {{date}}

---

## Test Cases

| Test | Input | Expected | Category |
|------|-------|----------|----------|
{{test_cases}}

## Coverage Gaps

{{coverage_gaps}}
```

- [ ] **Step 5: Run full test suite**

```
pnpm vitest run
```
Expected: all pass.

- [ ] **Step 6: Run `sdlc build` — full end-to-end smoke test**

```
pnpm sdlc build
```
Expected:
```
✓ universal: 7 file(s)
✓ claude-code: 6 file(s)
✓ copilot: 7 file(s)

Build complete — 20 file(s) written.
```

- [ ] **Step 7: Commit**

```
git add package.json templates/
git commit -m "feat: wire sdlc CLI script + remaining output templates"
```

---

## Self-Review

**Spec coverage check:**
- ✅ FR-01 DSL schema — Task 1/2 (schema.ts + loader)
- ✅ FR-02 Universal adapter — Task 5
- ✅ FR-02b Native adapters Claude Code + Copilot — Task 6/7
- ✅ FR-03 CLI init/build/validate — Task 8
- ✅ FR-04 Config merge — Task 4 (merger.ts, basic 2-layer for now; full 5-layer in Phase 2)
- ✅ FR-05 6 MVP agents — Tasks 1+9 (planner + code-reviewer already exist; 4 new agents added)
- ⚠️ FR-06 Patch-based override — Phase 2 (correctly deferred)
- ⚠️ FR-07 Agent extends — Phase 2 (correctly deferred)
- ✅ FR-10 Template variables {{}} — Task 3 (resolver.ts)

**No placeholders found** — all steps include actual code.

**Type consistency check:**
- `BuildContext.config` is `ResolvedConfig` everywhere ✅
- `loadDir` returns `Map<string, string>` matching `BuildContext.templates/policies` ✅
- `ToolAdapter.render` signature consistent across all 3 adapters ✅
