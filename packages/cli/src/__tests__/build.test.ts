import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

	it("writes a build manifest with a hash per generated file", () => {
		runBuild(tmpDir);
		const manifestPath = path.join(tmpDir, ".sdlc", "build-manifest.json");
		expect(fs.existsSync(manifestPath)).toBe(true);
		const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
		expect(manifest["AGENTS.md"]).toMatch(/^[0-9a-f]{64}$/);
	});

	it("warns about drift when a generated file was manually edited", () => {
		runBuild(tmpDir);
		const target = path.join(tmpDir, "AGENTS.md");
		fs.appendFileSync(target, "\nmanual edit\n", "utf8");

		const warnings: string[] = [];
		const warnSpy = vi
			.spyOn(console, "warn")
			.mockImplementation((msg: string) => {
				warnings.push(String(msg));
			});
		try {
			runBuild(tmpDir);
		} finally {
			warnSpy.mockRestore();
		}

		expect(warnings.some((w) => w.includes("Drift detected"))).toBe(true);
		expect(warnings.some((w) => w.includes("AGENTS.md"))).toBe(true);
		// drifted file is regenerated from canonical sources
		expect(fs.readFileSync(target, "utf8")).not.toContain("manual edit");
	});

	it("does not warn about drift when outputs are untouched", () => {
		runBuild(tmpDir);

		const warnings: string[] = [];
		const warnSpy = vi
			.spyOn(console, "warn")
			.mockImplementation((msg: string) => {
				warnings.push(String(msg));
			});
		try {
			runBuild(tmpDir);
		} finally {
			warnSpy.mockRestore();
		}

		expect(warnings.some((w) => w.includes("Drift detected"))).toBe(false);
	});

	it("throws instead of silently skipping unknown targets", () => {
		fs.writeFileSync(
			path.join(tmpDir, "sdlc.config.yaml"),
			stringifyYaml({
				targets: ["universal", "claude_code"],
				variables: {},
			}),
		);

		expect(() => runBuild(tmpDir)).toThrow(/Unknown target/);
	});
});
