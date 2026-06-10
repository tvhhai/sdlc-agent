import { describe, expect, it } from "vitest";
import { resolveAgent, resolveVariables } from "../resolver.js";

describe("resolveVariables", () => {
	it("replaces known variables", () => {
		expect(resolveVariables("Hello {{name}}", { name: "world" })).toBe(
			"Hello world",
		);
	});

	it("leaves unknown variables as-is", () => {
		expect(resolveVariables("{{unknown}}", {})).toBe("{{unknown}}");
	});

	it("handles multiple occurrences", () => {
		expect(resolveVariables("{{a}} + {{a}}", { a: "x" })).toBe("x + x");
	});

	it("handles multiple distinct variables", () => {
		expect(resolveVariables("{{a}} and {{b}}", { a: "foo", b: "bar" })).toBe(
			"foo and bar",
		);
	});
});

describe("resolveAgent", () => {
	const agent = {
		id: "planner",
		version: "1.0.0",
		phase: "planning" as const,
		description: "Plans for {{team}} team using {{stack}}.",
		model_hint: "balanced" as const,
		tools_required: [] as string[],
		inputs: [] as { name: string; required: boolean }[],
		workflow: [{ step: "Plan for {{team}}" }],
		policies: [] as string[],
	};

	it("substitutes variables in description and workflow", () => {
		const resolved = resolveAgent(agent, {
			team: "payments",
			stack: "Node.js",
		});
		expect(resolved.description).toContain("payments team");
		expect(resolved.workflow[0].step).toBe("Plan for payments");
	});

	it("leaves unmatched variables in place", () => {
		const resolved = resolveAgent(agent, {});
		expect(resolved.description).toContain("{{team}}");
	});

	it("does not mutate original agent", () => {
		resolveAgent(agent, { team: "core" });
		expect(agent.description).toContain("{{team}}");
	});
});
