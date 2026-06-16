/**
 * Integration tests against the real agents/ directory.
 * Validates the full pipeline: load YAML → resolve → render with all 3 adapters.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ClaudeCodeAdapter } from "@sdlc-agents/adapter-claude-code";
import { CopilotAdapter } from "@sdlc-agents/adapter-copilot";
import { UniversalAdapter } from "@sdlc-agents/adapter-universal";
import {
	type BuildContext,
	loadAgents,
	loadConfig,
	type OutputFile,
	resolveAgent,
} from "@sdlc-agents/core";
import { beforeAll, describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

const REPO_ROOT = path.resolve(
	fileURLToPath(import.meta.url),
	"../../../../../",
);

function loadDir(dir: string): Map<string, string> {
	const map = new Map<string, string>();
	if (!fs.existsSync(dir)) return map;
	for (const f of fs.readdirSync(dir)) {
		const full = path.join(dir, f);
		if (fs.statSync(full).isFile()) map.set(f, fs.readFileSync(full, "utf8"));
	}
	return map;
}

function loadRealAgents() {
	const config = loadConfig(REPO_ROOT);
	const raw = loadAgents(path.join(REPO_ROOT, config.agentsDir));
	return raw.map((a) => resolveAgent(a, config.variables));
}

function makeCtx(): BuildContext {
	const config = loadConfig(REPO_ROOT);
	return {
		config,
		templates: loadDir(path.join(REPO_ROOT, "templates")),
		policies: loadDir(path.join(REPO_ROOT, "policies")),
	};
}

const EXPECTED_IDS = [
	"code-reviewer",
	"coder",
	"planner",
	"requirement-analyst",
	"solution-architect",
	"test-generator",
];

// ─── agent loading ────────────────────────────────────────────────────────────

describe("real agents — loading", () => {
	it("loads all 6 agent YAML files without error", () => {
		expect(loadRealAgents()).toHaveLength(6);
	});

	it("all 6 expected ids are present", () => {
		const ids = loadRealAgents()
			.map((a) => a.id)
			.sort();
		expect(ids).toEqual(EXPECTED_IDS);
	});

	it("each agent has kebab-case id, valid phase, description > 10 chars, non-empty workflow", () => {
		for (const agent of loadRealAgents()) {
			expect(agent.id, "id").toMatch(/^[a-z][a-z0-9-]*$/);
			expect(agent.phase, "phase").toBeTruthy();
			expect(agent.description.length, "description").toBeGreaterThan(10);
			expect(agent.workflow.length, "workflow").toBeGreaterThan(0);
		}
	});

	it("every output_template reference resolves to an existing file", () => {
		for (const agent of loadRealAgents()) {
			if (!agent.output_template) continue;
			const full = path.join(REPO_ROOT, agent.output_template);
			expect(
				fs.existsSync(full),
				`${agent.id}: template '${agent.output_template}' missing`,
			).toBe(true);
		}
	});

	it("every policy reference resolves to an existing file", () => {
		for (const agent of loadRealAgents()) {
			for (const policy of agent.policies) {
				const full = path.join(REPO_ROOT, "policies", `${policy}.md`);
				expect(
					fs.existsSync(full),
					`${agent.id}: policy '${policy}' missing`,
				).toBe(true);
			}
		}
	});
});

// ─── claude-code adapter ──────────────────────────────────────────────────────

describe("real agents — claude-code adapter", () => {
	let outputs: OutputFile[];
	let agentFiles: OutputFile[];
	let commandFiles: OutputFile[];

	beforeAll(() => {
		outputs = new ClaudeCodeAdapter().render(loadRealAgents(), makeCtx());
		agentFiles = outputs.filter((o) => o.path.startsWith(".claude/agents/"));
		commandFiles = outputs.filter((o) =>
			o.path.startsWith(".claude/commands/"),
		);
	});

	it("produces 12 files: 6 agents + 6 commands", () => {
		expect(outputs).toHaveLength(12);
		expect(agentFiles).toHaveLength(6);
		expect(commandFiles).toHaveLength(6);
	});

	it("agent paths match .claude/agents/<id>.md, command paths .claude/commands/<id>.md", () => {
		for (const f of agentFiles) {
			expect(f.path).toMatch(/^\.claude\/agents\/[a-z][a-z0-9-]+\.md$/);
		}
		for (const f of commandFiles) {
			expect(f.path).toMatch(/^\.claude\/commands\/[a-z][a-z0-9-]+\.md$/);
		}
	});

	it("frontmatter is valid YAML for every file", () => {
		for (const f of outputs) {
			expect(
				() => parseYaml(f.content.split("---")[1]),
				`bad frontmatter in ${f.path}`,
			).not.toThrow();
		}
	});

	it("frontmatter description has [SDLC:<phase>] prefix on every file", () => {
		for (const f of outputs) {
			const fm = parseYaml(f.content.split("---")[1]);
			expect(fm.description, f.path).toMatch(/^\[SDLC:[a-z]+\] /);
		}
	});

	it("each agent file declares at least one tool", () => {
		for (const f of agentFiles) {
			const fm = parseYaml(f.content.split("---")[1]);
			expect(Array.isArray(fm.tools), f.path).toBe(true);
			expect(fm.tools.length, f.path).toBeGreaterThan(0);
		}
	});

	it("each command dispatches to the subagent of the same name with $ARGUMENTS", () => {
		for (const f of commandFiles) {
			const id = path.basename(f.path, ".md");
			expect(f.content, f.path).toContain(`Use the **${id}** subagent`);
			expect(f.content, f.path).toContain("$ARGUMENTS");
		}
	});

	it("code-reviewer maps to claude-opus-4-8 (high-reasoning)", () => {
		const f = agentFiles.find((o) => o.path.endsWith("code-reviewer.md"))!;
		expect(parseYaml(f.content.split("---")[1]).model).toBe("claude-opus-4-8");
	});

	it("coder maps to claude-sonnet-4-6 (balanced)", () => {
		const f = agentFiles.find((o) => o.path.endsWith("coder.md"))!;
		expect(parseYaml(f.content.split("---")[1]).model).toBe(
			"claude-sonnet-4-6",
		);
	});

	it("code-reviewer body contains Claude-specific extended thinking note", () => {
		const f = agentFiles.find((o) => o.path.endsWith("code-reviewer.md"))!;
		expect(f.content).toContain("Claude-specific");
		expect(f.content).toContain("extended thinking");
	});

	it("every file ends with the generated-by footer", () => {
		for (const f of outputs) {
			expect(f.content, f.path).toContain(
				"Generated by sdlc-agents. Do not edit",
			);
		}
	});

	it("rendered output matches committed .claude/ files (no drift)", () => {
		for (const f of outputs) {
			const committed = path.join(REPO_ROOT, f.path);
			if (!fs.existsSync(committed)) continue;
			expect(f.content, `drift in ${f.path}`).toBe(
				fs.readFileSync(committed, "utf8"),
			);
		}
	});
});

// ─── universal adapter ────────────────────────────────────────────────────────

describe("real agents — universal adapter", () => {
	let outputs: OutputFile[];

	beforeAll(() => {
		outputs = new UniversalAdapter().render(loadRealAgents(), makeCtx());
	});

	it("produces 7 files: 1 AGENTS.md + 6 per-agent", () => {
		expect(outputs).toHaveLength(7);
	});

	it("AGENTS.md lists all 6 agent ids", () => {
		const index = outputs.find((o) => o.path === "AGENTS.md")!;
		for (const id of EXPECTED_IDS) {
			expect(index.content, `AGENTS.md missing '${id}'`).toContain(id);
		}
	});

	it("per-agent files are under .sdlc/agents/", () => {
		for (const f of outputs.filter((o) => o.path !== "AGENTS.md")) {
			expect(f.path).toMatch(/^\.sdlc\/agents\/.+\.md$/);
		}
	});

	it("rendered output matches committed .sdlc/agents/ files (no drift)", () => {
		const dir = path.join(REPO_ROOT, ".sdlc", "agents");
		for (const f of outputs.filter((o) => o.path !== "AGENTS.md")) {
			const committed = path.join(dir, path.basename(f.path));
			if (!fs.existsSync(committed)) continue;
			expect(f.content, `drift in ${path.basename(f.path)}`).toBe(
				fs.readFileSync(committed, "utf8"),
			);
		}
	});
});

// ─── copilot adapter ──────────────────────────────────────────────────────────

describe("real agents — copilot adapter", () => {
	let outputs: OutputFile[];

	beforeAll(() => {
		outputs = new CopilotAdapter().render(loadRealAgents(), makeCtx());
	});

	it("produces 7 files: copilot-instructions.md + 6 prompt files", () => {
		expect(outputs).toHaveLength(7);
	});

	it("copilot-instructions.md lists all 6 agent ids", () => {
		const instr = outputs.find((o) =>
			o.path.endsWith("copilot-instructions.md"),
		)!;
		for (const id of EXPECTED_IDS) {
			expect(instr.content, `missing '${id}'`).toContain(id);
		}
	});

	it("each prompt file has mode: agent in frontmatter", () => {
		for (const f of outputs.filter((o) => o.path.endsWith(".prompt.md"))) {
			const fm = parseYaml(f.content.split("---")[1]);
			expect(fm.mode, f.path).toBe("agent");
		}
	});

	it("each prompt file has a non-empty frontmatter description", () => {
		for (const f of outputs.filter((o) => o.path.endsWith(".prompt.md"))) {
			const fm = parseYaml(f.content.split("---")[1]);
			expect(typeof fm.description, f.path).toBe("string");
			expect(fm.description.length, f.path).toBeGreaterThan(0);
		}
	});

	it("every file ends with the generated-by footer", () => {
		for (const f of outputs) {
			expect(f.content, f.path).toContain("Generated by sdlc-agents");
		}
	});
});
