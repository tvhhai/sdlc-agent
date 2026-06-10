import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadAgents } from "../loader.js";

const FIXTURES = path.join(
	fileURLToPath(import.meta.url),
	"../../__fixtures__",
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
		expect(() => loadAgents(path.join(FIXTURES, "invalid"))).toThrow();
	});

	it("ignores non-.yaml files in directory", () => {
		const agents = loadAgents(path.join(FIXTURES, "valid"));
		expect(agents.every((a) => typeof a.id === "string")).toBe(true);
		expect(agents).toHaveLength(2); // README.md not counted
	});
});
