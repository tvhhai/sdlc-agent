import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { stringify as stringifyYaml } from "yaml";
import { runBuild } from "../commands/build.js";

const REAL_AGENTS = path.resolve(
	fileURLToPath(import.meta.url),
	"../../../../../agents",
);
const REAL_TEMPLATES = path.resolve(
	fileURLToPath(import.meta.url),
	"../../../../../templates",
);
const REAL_POLICIES = path.resolve(
	fileURLToPath(import.meta.url),
	"../../../../../policies",
);

function makeTempProject(): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sdlc-test-"));
	const agentsDir = path.join(dir, "agents");
	fs.mkdirSync(agentsDir);
	for (const f of fs.readdirSync(REAL_AGENTS)) {
		fs.copyFileSync(path.join(REAL_AGENTS, f), path.join(agentsDir, f));
	}
	copyDir(REAL_TEMPLATES, path.join(dir, "templates"));
	copyDir(REAL_POLICIES, path.join(dir, "policies"));
	fs.writeFileSync(
		path.join(dir, "sdlc.config.yaml"),
		stringifyYaml({ targets: ["universal", "claude-code"], variables: {} }),
	);
	return dir;
}

function copyDir(source: string, target: string): void {
	fs.mkdirSync(target, { recursive: true });
	for (const f of fs.readdirSync(source)) {
		fs.copyFileSync(path.join(source, f), path.join(target, f));
	}
}

describe("runBuild", () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = makeTempProject();
	});
	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it("creates AGENTS.md for universal target", () => {
		runBuild(tmpDir);
		expect(fs.existsSync(path.join(tmpDir, "AGENTS.md"))).toBe(true);
	});

	it("creates .claude/agents/ files for claude-code target", () => {
		runBuild(tmpDir);
		const agentsOut = path.join(tmpDir, ".claude", "agents");
		expect(fs.existsSync(agentsOut)).toBe(true);
		const files = fs.readdirSync(agentsOut);
		expect(files.length).toBeGreaterThan(0);
		expect(files.every((f) => f.endsWith(".md"))).toBe(true);
	});

	it("build is idempotent — second run produces identical output", () => {
		runBuild(tmpDir);
		const first = fs.readFileSync(path.join(tmpDir, "AGENTS.md"), "utf8");
		runBuild(tmpDir);
		const second = fs.readFileSync(path.join(tmpDir, "AGENTS.md"), "utf8");
		expect(first).toBe(second);
	});
});
