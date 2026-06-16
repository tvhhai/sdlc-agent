/**
 * ClaudeCodeAdapter — model mapping, SDLC prefix, input rendering edge cases.
 * Complements claude-code.test.ts which covers the basic contract.
 */
import type { AgentDef, BuildContext } from "@sdlc-agents/core";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { ClaudeCodeAdapter } from "../index.js";

const adapter = new ClaudeCodeAdapter();

const mockCtx: BuildContext = {
	config: {
		targets: ["claude-code"],
		rootDir: "/project",
		variables: {},
		agentsDir: "agents",
	},
	templates: new Map(),
	policies: new Map(),
};

function makeAgent(overrides: Partial<AgentDef> = {}): AgentDef {
	return {
		id: "test-agent",
		version: "1.0.0",
		phase: "planning",
		description: "A minimal test agent for unit testing.",
		model_hint: "balanced",
		tools_required: ["read_file"],
		inputs: [],
		workflow: [{ step: "Do the thing" }],
		policies: [],
		...overrides,
	};
}

function frontmatter(content: string) {
	return parseYaml(content.split("---")[1]);
}

// ─── model mapping ────────────────────────────────────────────────────────────

describe("ClaudeCodeAdapter — model mapping", () => {
	it("fast → claude-haiku-4-5-20251001", () => {
		const { content } = adapter.render(
			[makeAgent({ model_hint: "fast" })],
			mockCtx,
		)[0];
		expect(frontmatter(content).model).toBe("claude-haiku-4-5-20251001");
	});

	it("balanced → claude-sonnet-4-6", () => {
		const { content } = adapter.render(
			[makeAgent({ model_hint: "balanced" })],
			mockCtx,
		)[0];
		expect(frontmatter(content).model).toBe("claude-sonnet-4-6");
	});

	it("high-reasoning → claude-opus-4-8", () => {
		const { content } = adapter.render(
			[makeAgent({ model_hint: "high-reasoning" })],
			mockCtx,
		)[0];
		expect(frontmatter(content).model).toBe("claude-opus-4-8");
	});

	it("unknown hint falls back to claude-sonnet-4-6", () => {
		const agent = makeAgent({ model_hint: "balanced" });
		// @ts-expect-error — intentionally passing unknown value
		const badAgent = { ...agent, model_hint: "ultra-thinking" };
		const { content } = adapter.render([badAgent], mockCtx)[0];
		expect(frontmatter(content).model).toBe("claude-sonnet-4-6");
	});
});

// ─── SDLC phase prefix ────────────────────────────────────────────────────────

describe("ClaudeCodeAdapter — [SDLC:<phase>] description prefix", () => {
	const PHASES = [
		"requirement",
		"planning",
		"architecture",
		"coding",
		"testing",
		"review",
	] as const;

	for (const phase of PHASES) {
		it(`phase '${phase}' produces [SDLC:${phase}] prefix`, () => {
			const agent = makeAgent({ phase, id: `agent-${phase}` });
			const { content } = adapter.render([agent], mockCtx)[0];
			expect(frontmatter(content).description).toMatch(
				new RegExp(`^\\[SDLC:${phase}\\] `),
			);
		});
	}

	it("description text after the prefix matches the agent description", () => {
		const agent = makeAgent({
			phase: "review",
			description: "Reviews code for bugs.",
		});
		const { content } = adapter.render([agent], mockCtx)[0];
		const desc: string = frontmatter(content).description;
		expect(desc).toBe("[SDLC:review] Reviews code for bugs.");
	});

	it("multi-line description is collapsed to single line in frontmatter", () => {
		const agent = makeAgent({
			description: "First line of description.\nSecond line here.",
		});
		const { content } = adapter.render([agent], mockCtx)[0];
		const desc: string = frontmatter(content).description;
		expect(desc).not.toContain("\n");
	});
});

// ─── inputs rendering ─────────────────────────────────────────────────────────

describe("ClaudeCodeAdapter — inputs rendering", () => {
	it("required input renders _(required)_ marker", () => {
		const agent = makeAgent({
			inputs: [{ name: "spec", required: true, description: "The spec file" }],
		});
		const { content } = adapter.render([agent], mockCtx)[0];
		expect(content).toContain("**`spec`** _(required)_");
	});

	it("optional input renders without _(required)_ marker", () => {
		const agent = makeAgent({
			inputs: [
				{ name: "context", required: false, description: "Extra context" },
			],
		});
		const { content } = adapter.render([agent], mockCtx)[0];
		expect(content).toContain("**`context`**");
		expect(content).not.toContain("_(required)_");
	});

	it("agent with no inputs renders _None_ placeholder", () => {
		const agent = makeAgent({ inputs: [] });
		const { content } = adapter.render([agent], mockCtx)[0];
		expect(content).toContain("_None_");
	});

	it("multiple inputs appear in order", () => {
		const agent = makeAgent({
			inputs: [
				{ name: "first", required: true, description: "First" },
				{ name: "second", required: false, description: "Second" },
			],
		});
		const { content } = adapter.render([agent], mockCtx)[0];
		const firstPos = content.indexOf("first");
		const secondPos = content.indexOf("second");
		expect(firstPos).toBeLessThan(secondPos);
	});
});

// ─── claude-specific note ─────────────────────────────────────────────────────

describe("ClaudeCodeAdapter — model_variants.claude", () => {
	it("includes Claude-specific note when model_variants.claude.prompt_append is set", () => {
		const agent = makeAgent({
			model_variants: { claude: { prompt_append: "Think step by step." } },
		});
		const { content } = adapter.render([agent], mockCtx)[0];
		expect(content).toContain("**Claude-specific:**");
		expect(content).toContain("Think step by step.");
	});

	it("no Claude note when model_variants is absent", () => {
		const agent = makeAgent({ model_variants: undefined });
		const { content } = adapter.render([agent], mockCtx)[0];
		expect(content).not.toContain("Claude-specific");
	});

	it("no Claude note when claude variant is absent but gemini is present", () => {
		const agent = makeAgent({
			model_variants: { gemini: { prompt_append: "Gemini only." } },
		});
		const { content } = adapter.render([agent], mockCtx)[0];
		expect(content).not.toContain("Claude-specific");
		expect(content).not.toContain("Gemini only.");
	});
});

// ─── output_template + policies ──────────────────────────────────────────────

describe("ClaudeCodeAdapter — output_template and policies", () => {
	it("renders Output section with template path when output_template is set", () => {
		const agent = makeAgent({ output_template: "templates/plan.md" });
		const { content } = adapter.render([agent], mockCtx)[0];
		expect(content).toContain("## Output");
		expect(content).toContain("templates/plan.md");
	});

	it("no Output section when output_template is absent", () => {
		const agent = makeAgent({ output_template: undefined });
		const { content } = adapter.render([agent], mockCtx)[0];
		expect(content).not.toContain("## Output");
	});

	it("renders Policies section when policies are present", () => {
		const agent = makeAgent({
			policies: ["security-checklist", "conventions"],
		});
		const { content } = adapter.render([agent], mockCtx)[0];
		expect(content).toContain("## Policies");
		expect(content).toContain("policies/security-checklist.md");
		expect(content).toContain("policies/conventions.md");
	});

	it("no Policies section when policies is empty", () => {
		const agent = makeAgent({ policies: [] });
		const { content } = adapter.render([agent], mockCtx)[0];
		expect(content).not.toContain("## Policies");
	});
});

// ─── multi-agent render ───────────────────────────────────────────────────────

describe("ClaudeCodeAdapter — multi-agent render", () => {
	it("renders 2N files for N agents (one agent file + one command file each)", () => {
		const agents = [
			makeAgent({ id: "alpha", phase: "planning" }),
			makeAgent({ id: "beta", phase: "review" }),
			makeAgent({ id: "gamma", phase: "coding" }),
		];
		const outputs = adapter.render(agents, mockCtx);
		expect(outputs).toHaveLength(6);
		expect(
			outputs.filter((o) => o.path.startsWith(".claude/agents/")),
		).toHaveLength(3);
		expect(
			outputs.filter((o) => o.path.startsWith(".claude/commands/")),
		).toHaveLength(3);
	});

	it("each file path uses the agent id as filename", () => {
		const agents = [
			makeAgent({ id: "alpha", phase: "planning" }),
			makeAgent({ id: "beta", phase: "review" }),
		];
		const paths = adapter.render(agents, mockCtx).map((o) => o.path);
		expect(paths).toContain(".claude/agents/alpha.md");
		expect(paths).toContain(".claude/agents/beta.md");
	});

	it("each file contains only its own agent content", () => {
		const agents = [
			makeAgent({
				id: "alpha",
				phase: "planning",
				description: "Alpha does planning work exclusively.",
			}),
			makeAgent({
				id: "beta",
				phase: "review",
				description: "Beta does review work exclusively.",
			}),
		];
		const outputs = adapter.render(agents, mockCtx);
		const alpha = outputs.find((o) => o.path.endsWith("alpha.md"))!;
		const beta = outputs.find((o) => o.path.endsWith("beta.md"))!;
		expect(alpha.content).toContain("Alpha does planning");
		expect(alpha.content).not.toContain("Beta does review");
		expect(beta.content).toContain("Beta does review");
		expect(beta.content).not.toContain("Alpha does planning");
	});
});
