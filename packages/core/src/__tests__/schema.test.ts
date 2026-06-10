import { describe, expect, it } from "vitest";
import { AgentSchema } from "../schema.js";

const validAgent = {
	id: "planner",
	version: "1.0.0",
	phase: "planning",
	description: "Breaks down a spec into a concrete implementation plan.",
	model_hint: "high-reasoning",
	tools_required: ["read_file"],
	inputs: [{ name: "spec", required: true }],
	workflow: [{ step: "Read the spec" }, { step: "Break into tasks" }],
	output_template: "templates/plan.md",
	policies: [],
} as const;

describe("AgentSchema", () => {
	it("accepts a valid agent definition", () => {
		const result = AgentSchema.safeParse(validAgent);
		expect(result.success).toBe(true);
	});

	it("rejects id with uppercase letters", () => {
		const result = AgentSchema.safeParse({ ...validAgent, id: "Planner" });
		expect(result.success).toBe(false);
		expect(result.error?.issues[0].path).toContain("id");
	});

	it("rejects non-semver version", () => {
		const result = AgentSchema.safeParse({ ...validAgent, version: "v1.0" });
		expect(result.success).toBe(false);
		expect(result.error?.issues[0].path).toContain("version");
	});

	it("rejects unknown phase", () => {
		const result = AgentSchema.safeParse({ ...validAgent, phase: "deploy" });
		expect(result.success).toBe(false);
		expect(result.error?.issues[0].path).toContain("phase");
	});

	it("rejects empty workflow", () => {
		const result = AgentSchema.safeParse({ ...validAgent, workflow: [] });
		expect(result.success).toBe(false);
		expect(result.error?.issues[0].path).toContain("workflow");
	});

	it("rejects description shorter than 10 chars", () => {
		const result = AgentSchema.safeParse({
			...validAgent,
			description: "Too short",
		});
		expect(result.success).toBe(false);
	});

	it("defaults model_hint to 'balanced' when omitted", () => {
		const { model_hint: _, ...withoutHint } = validAgent;
		const result = AgentSchema.safeParse(withoutHint);
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.model_hint).toBe("balanced");
	});

	it("rejects import with malformed source", () => {
		const result = AgentSchema.safeParse({
			...validAgent,
			imports: [
				{
					source: "not-a-github-ref",
					path: "skills/foo",
					pin: "v1",
					license: "MIT",
				},
			],
		});
		expect(result.success).toBe(false);
	});

	it("accepts import with valid github: source", () => {
		const result = AgentSchema.safeParse({
			...validAgent,
			imports: [
				{
					source: "github:obra/superpowers",
					path: "skills/systematic-debugging",
					pin: "v4.2.0",
					license: "MIT",
				},
			],
		});
		expect(result.success).toBe(true);
	});

	it("rejects import with disallowed license", () => {
		const result = AgentSchema.safeParse({
			...validAgent,
			imports: [
				{
					source: "github:owner/repo",
					path: "skills/foo",
					pin: "abc123",
					license: "GPL-3.0",
				},
			],
		});
		expect(result.success).toBe(false);
	});
});
