import type { BuildContext } from "@sdlc-agents/core";
import { describe, expect, it } from "vitest";
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
