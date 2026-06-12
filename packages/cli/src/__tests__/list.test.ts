import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeRows, runList } from "../commands/list.js";

// ─── normalizeRows (pure) ─────────────────────────────────────────────────────

type AgentLike = {
	id: string;
	version: string;
	phase: string;
	model_hint: string;
};

const make = (over: Partial<AgentLike>): AgentLike => ({
	id: "agent",
	version: "1.0.0",
	phase: "coding",
	model_hint: "balanced",
	...over,
});

describe("normalizeRows", () => {
	it("maps the five display fields and attaches global targets to every row", () => {
		const agents = [
			make({ id: "a", phase: "planning", model_hint: "fast" }),
			make({ id: "b", phase: "planning", model_hint: "high-reasoning" }),
		];
		const rows = normalizeRows(agents as never, ["claude-code", "universal"]);
		expect(rows).toEqual([
			{
				id: "a",
				version: "1.0.0",
				phase: "planning",
				model_hint: "fast",
				targets: ["claude-code", "universal"],
			},
			{
				id: "b",
				version: "1.0.0",
				phase: "planning",
				model_hint: "high-reasoning",
				targets: ["claude-code", "universal"],
			},
		]);
	});

	it("sorts by phase ascending, then by id ascending", () => {
		const agents = [
			make({ id: "zeta", phase: "planning" }),
			make({ id: "alpha", phase: "testing" }),
			make({ id: "beta", phase: "planning" }),
			make({ id: "alpha", phase: "coding" }),
		];
		const rows = normalizeRows(agents as never, []);
		expect(rows.map((r) => `${r.phase}/${r.id}`)).toEqual([
			"coding/alpha",
			"planning/beta",
			"planning/zeta",
			"testing/alpha",
		]);
	});

	it("returns an empty array when there are no agents", () => {
		expect(normalizeRows([], ["claude-code"])).toEqual([]);
	});

	it("does not mutate the input agents array order", () => {
		const agents = [make({ id: "b" }), make({ id: "a" })];
		const snapshot = agents.map((a) => a.id);
		normalizeRows(agents as never, []);
		expect(agents.map((a) => a.id)).toEqual(snapshot);
	});
});

// ─── runList (command seam) ───────────────────────────────────────────────────

const AGENT_A = `id: alpha
version: 1.0.0
phase: planning
description: Alpha agent for fixture testing
workflow:
  - step: Do the alpha work
`;
const AGENT_B = `id: beta
version: 2.1.0
phase: coding
model_hint: high-reasoning
description: Beta agent for fixture testing
workflow:
  - step: Do the beta work
`;

function makeProject(
	agents: Record<string, string>,
	config = "targets:\n  - claude-code\nagentsDir: agents\n",
): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sdlc-list-"));
	fs.writeFileSync(path.join(dir, "sdlc.config.yaml"), config);
	const agentsDir = path.join(dir, "agents");
	fs.mkdirSync(agentsDir, { recursive: true });
	for (const [name, body] of Object.entries(agents)) {
		fs.writeFileSync(path.join(agentsDir, name), body);
	}
	return dir;
}

describe("runList table mode", () => {
	let logSpy: ReturnType<typeof vi.spyOn>;
	const created: string[] = [];

	beforeEach(() => {
		logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
	});
	afterEach(() => {
		logSpy.mockRestore();
		while (created.length)
			fs.rmSync(created.pop() as string, { recursive: true, force: true });
	});

	it("prints an aligned table sorted phase then id", () => {
		const dir = makeProject({ "a.yaml": AGENT_A, "b.yaml": AGENT_B });
		created.push(dir);
		const ok = runList(dir, { json: false });
		expect(ok).toBe(true);
		const lines = logSpy.mock.calls
			.map((c: unknown[]) => String(c[0]))
			.join("\n")
			.split("\n")
			.filter(Boolean);
		expect(lines).toHaveLength(3);
		expect(lines[0]).toMatch(/^id\s+version\s+phase\s+model_hint\s+targets/);
		expect(lines[1]).toMatch(/^beta\s/); // coding sorts before planning
		expect(lines[2]).toMatch(/^alpha\s/);
	});

	it("prints a friendly message and succeeds when there are no agents", () => {
		const dir = makeProject({});
		created.push(dir);
		const ok = runList(dir, { json: false });
		expect(ok).toBe(true);
		expect(logSpy).toHaveBeenCalledWith("No agents found.");
	});
});

describe("runList json mode", () => {
	let logSpy: ReturnType<typeof vi.spyOn>;
	const created: string[] = [];

	beforeEach(() => {
		logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
	});
	afterEach(() => {
		logSpy.mockRestore();
		while (created.length)
			fs.rmSync(created.pop() as string, { recursive: true, force: true });
	});

	it("emits exactly one valid pretty 2-space JSON array on stdout", () => {
		const dir = makeProject({ "a.yaml": AGENT_A, "b.yaml": AGENT_B });
		created.push(dir);
		const ok = runList(dir, { json: true });
		expect(ok).toBe(true);
		expect(logSpy).toHaveBeenCalledTimes(1);
		const raw = String(logSpy.mock.calls[0][0]);
		const parsed = JSON.parse(raw);
		expect(parsed).toEqual([
			{
				id: "beta",
				version: "2.1.0",
				phase: "coding",
				model_hint: "high-reasoning",
				targets: ["claude-code"],
			},
			{
				id: "alpha",
				version: "1.0.0",
				phase: "planning",
				model_hint: "balanced",
				targets: ["claude-code"],
			},
		]);
		expect(raw).toBe(JSON.stringify(parsed, null, 2));
	});

	it("emits [] for an empty project in json mode", () => {
		const dir = makeProject({});
		created.push(dir);
		const ok = runList(dir, { json: true });
		expect(ok).toBe(true);
		expect(logSpy).toHaveBeenCalledTimes(1);
		expect(String(logSpy.mock.calls[0][0])).toBe("[]");
	});
});

describe("runList error handling", () => {
	let logSpy: ReturnType<typeof vi.spyOn>;
	let errSpy: ReturnType<typeof vi.spyOn>;
	const created: string[] = [];

	beforeEach(() => {
		logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});
	afterEach(() => {
		logSpy.mockRestore();
		errSpy.mockRestore();
		while (created.length)
			fs.rmSync(created.pop() as string, { recursive: true, force: true });
	});

	it("fails when the agents directory does not exist: stderr, false, no stdout", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sdlc-list-noagents-"));
		created.push(dir);
		// no agents/ dir created → loadAgents throws ENOENT
		const ok = runList(dir, { json: false });
		expect(ok).toBe(false);
		expect(errSpy).toHaveBeenCalled();
		expect(logSpy).not.toHaveBeenCalled();
	});

	it("fails on invalid agent YAML with ZodError stderr and no partial json", () => {
		const dir = makeProject({ "bad.yaml": "id: 123\nphase: planning\n" });
		created.push(dir);
		const ok = runList(dir, { json: true });
		expect(ok).toBe(false);
		expect(logSpy).not.toHaveBeenCalled(); // no partial JSON on stdout
		const errOut = errSpy.mock.calls
			.map((c: unknown[]) => String(c[0]))
			.join("\n");
		expect(errOut).toContain("Validation errors:");
	});
});
