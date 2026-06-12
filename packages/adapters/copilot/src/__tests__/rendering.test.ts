/**
 * CopilotAdapter — rendering edge cases.
 * Complements copilot.test.ts which covers the basic contract.
 */
import type { AgentDef, BuildContext } from "@sdlc-agents/core";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { CopilotAdapter } from "../index.js";

const adapter = new CopilotAdapter();

const mockCtx: BuildContext = {
	config: {
		targets: ["copilot"],
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
		tools_required: [],
		inputs: [],
		workflow: [{ step: "Do the thing" }],
		policies: [],
		...overrides,
	};
}

function getPrompt(outputs: { path: string; content: string }[], id: string) {
	return outputs.find((o) => o.path.endsWith(`${id}.prompt.md`))!;
}

function promptFrontmatter(content: string) {
	return parseYaml(content.split("---")[1]);
}

// ─── prompt frontmatter ───────────────────────────────────────────────────────

describe("CopilotAdapter — prompt frontmatter", () => {
	it("every prompt file has mode: agent", () => {
		const agents = [
			makeAgent({ id: "planner", phase: "planning" }),
			makeAgent({ id: "reviewer", phase: "review" }),
		];
		for (const f of adapter
			.render(agents, mockCtx)
			.filter((o) => o.path.endsWith(".prompt.md"))) {
			expect(promptFrontmatter(f.content).mode, f.path).toBe("agent");
		}
	});

	it("frontmatter description is valid YAML string (no unquoted colons)", () => {
		const agent = makeAgent({
			description: "Reviews code: security and performance.",
		});
		const outputs = adapter.render([agent], mockCtx);
		const prompt = getPrompt(outputs, "test-agent");
		expect(() => promptFrontmatter(prompt.content)).not.toThrow();
		expect(promptFrontmatter(prompt.content).description).toBe(
			"Reviews code: security and performance.",
		);
	});

	it("multi-line description uses only first line in frontmatter", () => {
		const agent = makeAgent({
			description: "First line only.\nThis second line should not appear.",
		});
		const outputs = adapter.render([agent], mockCtx);
		const prompt = getPrompt(outputs, "test-agent");
		const desc: string = promptFrontmatter(prompt.content).description;
		expect(desc).toBe("First line only.");
		expect(desc).not.toContain("second line");
	});

	it("description with double quotes is safely quoted in YAML", () => {
		const agent = makeAgent({
			description: 'Plan for the "payments" team.',
		});
		const outputs = adapter.render([agent], mockCtx);
		const prompt = getPrompt(outputs, "test-agent");
		expect(() => promptFrontmatter(prompt.content)).not.toThrow();
		expect(promptFrontmatter(prompt.content).description).toBe(
			'Plan for the "payments" team.',
		);
	});
});

// ─── copilot-specific note ────────────────────────────────────────────────────

describe("CopilotAdapter — model_variants.copilot", () => {
	it("includes Copilot note when model_variants.copilot.prompt_append is set", () => {
		const agent = makeAgent({
			model_variants: {
				copilot: { prompt_append: "Present conclusions before details." },
			},
		});
		const outputs = adapter.render([agent], mockCtx);
		const prompt = getPrompt(outputs, "test-agent");
		expect(prompt.content).toContain("**Copilot note:**");
		expect(prompt.content).toContain("Present conclusions before details.");
	});

	it("no Copilot note when model_variants is absent", () => {
		const agent = makeAgent({ model_variants: undefined });
		const outputs = adapter.render([agent], mockCtx);
		const prompt = getPrompt(outputs, "test-agent");
		expect(prompt.content).not.toContain("Copilot note");
	});

	it("no Copilot note when only claude variant is present", () => {
		const agent = makeAgent({
			model_variants: { claude: { prompt_append: "Claude only." } },
		});
		const outputs = adapter.render([agent], mockCtx);
		const prompt = getPrompt(outputs, "test-agent");
		expect(prompt.content).not.toContain("Copilot note");
		expect(prompt.content).not.toContain("Claude only.");
	});
});

// ─── output_template ──────────────────────────────────────────────────────────

describe("CopilotAdapter — output_template in prompt", () => {
	it("renders Output section with template path", () => {
		const agent = makeAgent({ output_template: "templates/plan.md" });
		const outputs = adapter.render([agent], mockCtx);
		const prompt = getPrompt(outputs, "test-agent");
		expect(prompt.content).toContain("## Output");
		expect(prompt.content).toContain("templates/plan.md");
	});

	it("no Output section when output_template is absent", () => {
		const agent = makeAgent({ output_template: undefined });
		const outputs = adapter.render([agent], mockCtx);
		const prompt = getPrompt(outputs, "test-agent");
		expect(prompt.content).not.toContain("## Output");
	});
});

// ─── inputs rendering ─────────────────────────────────────────────────────────

describe("CopilotAdapter — inputs in prompt", () => {
	it("required input renders (required) marker", () => {
		const agent = makeAgent({
			inputs: [{ name: "pr_diff", required: true, description: "The diff" }],
		});
		const outputs = adapter.render([agent], mockCtx);
		const prompt = getPrompt(outputs, "test-agent");
		expect(prompt.content).toContain("**pr_diff** (required)");
	});

	it("optional input has no (required) marker", () => {
		const agent = makeAgent({
			inputs: [{ name: "context", required: false, description: "Context" }],
		});
		const outputs = adapter.render([agent], mockCtx);
		const prompt = getPrompt(outputs, "test-agent");
		expect(prompt.content).toContain("**context**");
		expect(prompt.content).not.toContain("(required)");
	});

	it("no inputs renders _None_", () => {
		const agent = makeAgent({ inputs: [] });
		const outputs = adapter.render([agent], mockCtx);
		const prompt = getPrompt(outputs, "test-agent");
		expect(prompt.content).toContain("_None_");
	});
});

// ─── copilot-instructions index ───────────────────────────────────────────────

describe("CopilotAdapter — copilot-instructions.md", () => {
	it("contains prompt file links for every agent", () => {
		const agents = [
			makeAgent({ id: "planner", phase: "planning" }),
			makeAgent({ id: "coder", phase: "coding" }),
		];
		const instr = adapter
			.render(agents, mockCtx)
			.find((o) => o.path.endsWith("copilot-instructions.md"))!;
		expect(instr.content).toContain("planner.prompt.md");
		expect(instr.content).toContain("coder.prompt.md");
	});

	it("instructions file always has the generated-by footer", () => {
		const outputs = adapter.render([makeAgent()], mockCtx);
		const instr = outputs.find((o) =>
			o.path.endsWith("copilot-instructions.md"),
		)!;
		expect(instr.content).toContain("Generated by sdlc-agents");
	});
});
