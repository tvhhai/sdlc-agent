import type { BuildContext } from "@sdlc-agents/core";
import { describe, expect, it } from "vitest";
import { UniversalAdapter } from "../index.js";

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

	it("AGENTS.md contains agent id and phase", () => {
		const outputs = adapter.render([mockAgent], mockCtx);
		const index = outputs.find((o) => o.path === "AGENTS.md")!;
		expect(index.content).toContain("planner");
		expect(index.content).toContain("planning");
	});

	it("agent file contains workflow steps", () => {
		const outputs = adapter.render([mockAgent], mockCtx);
		const agentFile = outputs.find(
			(o) => o.path === ".sdlc/agents/planner.md",
		)!;
		expect(agentFile.content).toContain("Read spec");
		expect(agentFile.content).toContain("Break into tasks");
	});

	it("matches AGENTS.md snapshot", () => {
		const outputs = adapter.render([mockAgent], mockCtx);
		const index = outputs.find((o) => o.path === "AGENTS.md")!;
		expect(index.content).toMatchSnapshot();
	});
});
