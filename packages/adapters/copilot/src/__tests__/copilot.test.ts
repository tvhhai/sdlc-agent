import type { BuildContext } from "@sdlc-agents/core";
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

const agents = [
	{
		id: "planner",
		version: "1.0.0",
		phase: "planning" as const,
		description: "Breaks a spec into tasks.",
		model_hint: "high-reasoning" as const,
		tools_required: [] as string[],
		inputs: [] as { name: string; required: boolean }[],
		workflow: [{ step: "Plan" }],
		policies: [] as string[],
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
			(o) => o.path === ".github/copilot-instructions.md",
		)!;
		expect(instructions.content).toContain("planner");
		expect(instructions.content).toContain("code-reviewer");
	});

	it("prompt file contains workflow steps", () => {
		const outputs = adapter.render(agents, mockCtx);
		const plannerPrompt = outputs.find(
			(o) => o.path === ".github/prompts/planner.prompt.md",
		)!;
		expect(plannerPrompt.content).toContain("Plan");
	});

	it("matches copilot-instructions snapshot", () => {
		const outputs = adapter.render(agents, mockCtx);
		const instructions = outputs.find(
			(o) => o.path === ".github/copilot-instructions.md",
		)!;
		expect(instructions.content).toMatchSnapshot();
	});

	it("escapes prompt frontmatter description", () => {
		const quotedAgent = {
			...agents[0],
			description: 'Plan for the "core" team.',
		};
		const outputs = adapter.render([quotedAgent], mockCtx);
		const prompt = outputs.find(
			(o) => o.path === ".github/prompts/planner.prompt.md",
		)!;
		const frontmatter = prompt.content.split("---")[1];

		expect(parseYaml(frontmatter).description).toBe(
			'Plan for the "core" team.',
		);
	});
});
