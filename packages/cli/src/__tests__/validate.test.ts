import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { stringify as stringifyYaml } from "yaml";
import { runValidate } from "../commands/validate.js";

const REAL_AGENTS = path.resolve(
	fileURLToPath(import.meta.url),
	"../../../../../agents",
);

describe("runValidate", () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sdlc-validate-"));
		fs.mkdirSync(path.join(tmpDir, "agents"));
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it("returns true for the real agents/ directory", () => {
		expect(runValidate(path.dirname(REAL_AGENTS))).toBe(true);
	});

	it("uses agentsDir from sdlc.config.yaml", () => {
		fs.mkdirSync(path.join(tmpDir, "custom-agents"));
		fs.rmSync(path.join(tmpDir, "agents"), { recursive: true, force: true });
		writeAgentFile(path.join(tmpDir, "custom-agents", "planner.yaml"), {
			id: "planner",
		});
		fs.writeFileSync(
			path.join(tmpDir, "sdlc.config.yaml"),
			stringifyYaml({ agentsDir: "custom-agents" }),
			"utf8",
		);

		expect(runValidate(tmpDir)).toBe(true);
	});

	it("returns false when config declares an unknown target", () => {
		writeAgent(tmpDir, "planner.yaml", { id: "planner" });
		fs.writeFileSync(
			path.join(tmpDir, "sdlc.config.yaml"),
			stringifyYaml({ targets: ["universal", "claude_code"] }),
			"utf8",
		);

		expect(runValidate(tmpDir)).toBe(false);
	});

	it("returns false when two agent files use the same id", () => {
		writeAgent(tmpDir, "first.yaml", { id: "duplicate-agent" });
		writeAgent(tmpDir, "second.yaml", { id: "duplicate-agent" });

		expect(runValidate(tmpDir)).toBe(false);
	});

	it("returns false when an output_template does not exist", () => {
		writeAgent(tmpDir, "planner.yaml", {
			id: "planner",
			output_template: "templates/missing.md",
		});

		expect(runValidate(tmpDir)).toBe(false);
	});

	it("returns false when a referenced policy does not exist", () => {
		writeAgent(tmpDir, "reviewer.yaml", {
			id: "reviewer",
			policies: ["missing-policy"],
		});

		expect(runValidate(tmpDir)).toBe(false);
	});

	it("returns false when an agent uses the unsupported 'extends' field", () => {
		writeAgent(tmpDir, "child.yaml", {
			id: "child-agent",
			extraLines: ["extends: code-reviewer"],
		});

		expect(runValidate(tmpDir)).toBe(false);
	});

	it("returns false when an agent uses the unsupported 'imports' field", () => {
		writeAgent(tmpDir, "importer.yaml", {
			id: "importer-agent",
			extraLines: [
				"imports:",
				"  - source: github:obra/superpowers",
				"    path: skills/systematic-debugging",
				"    pin: v4.2.0",
				"    license: MIT",
			],
		});

		expect(runValidate(tmpDir)).toBe(false);
	});
});

function writeAgent(
	projectDir: string,
	fileName: string,
	overrides: {
		id?: string;
		output_template?: string;
		policies?: string[];
		extraLines?: string[];
	},
): void {
	const agent = {
		id: overrides.id ?? "test-agent",
		version: "1.0.0",
		phase: "planning",
		description: "Test agent used to validate project contracts.",
		model_hint: "balanced",
		tools_required: [],
		inputs: [],
		workflow: [{ step: "Run the validation contract" }],
		policies: overrides.policies ?? [],
		...(overrides.output_template
			? { output_template: overrides.output_template }
			: {}),
	};

	writeAgentFile(path.join(projectDir, "agents", fileName), {
		id: agent.id,
		output_template: agent.output_template,
		policies: agent.policies,
		extraLines: overrides.extraLines,
	});
}

function writeAgentFile(
	filePath: string,
	overrides: {
		id?: string;
		output_template?: string;
		policies?: string[];
		extraLines?: string[];
	},
): void {
	const agent = {
		id: overrides.id ?? "test-agent",
		version: "1.0.0",
		phase: "planning",
		description: "Test agent used to validate project contracts.",
		model_hint: "balanced",
		tools_required: [],
		inputs: [],
		workflow: [{ step: "Run the validation contract" }],
		policies: overrides.policies ?? [],
		...(overrides.output_template
			? { output_template: overrides.output_template }
			: {}),
	};

	fs.writeFileSync(
		filePath,
		[
			`id: ${agent.id}`,
			`version: ${agent.version}`,
			`phase: ${agent.phase}`,
			`description: ${agent.description}`,
			`model_hint: ${agent.model_hint}`,
			"tools_required: []",
			"inputs: []",
			"workflow:",
			`  - step: ${agent.workflow[0].step}`,
			...(agent.output_template
				? [`output_template: ${agent.output_template}`]
				: []),
			...(agent.policies.length
				? ["policies:", ...agent.policies.map((policy) => `  - ${policy}`)]
				: ["policies: []"]),
			...(overrides.extraLines ?? []),
			"",
		].join("\n"),
		"utf8",
	);
}
