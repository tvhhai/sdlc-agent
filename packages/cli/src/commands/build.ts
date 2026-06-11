import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ClaudeCodeAdapter } from "@sdlc-agents/adapter-claude-code";
import { CopilotAdapter } from "@sdlc-agents/adapter-copilot";
import { UniversalAdapter } from "@sdlc-agents/adapter-universal";
import {
	type BuildContext,
	loadAgents,
	loadConfig,
	resolveAgent,
	type ToolAdapter,
} from "@sdlc-agents/core";
import {
	validateProjectContracts,
	validateTargets,
} from "./project-validation.js";

const ADAPTERS: Record<string, ToolAdapter> = {
	universal: new UniversalAdapter(),
	"claude-code": new ClaudeCodeAdapter(),
	copilot: new CopilotAdapter(),
};

/** Tracks the hash of every generated file so the next build can detect manual edits. */
const MANIFEST_PATH = ".sdlc/build-manifest.json";

function hashContent(content: string): string {
	return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function loadManifest(cwd: string): Record<string, string> {
	const manifestFile = path.join(cwd, MANIFEST_PATH);
	if (!fs.existsSync(manifestFile)) return {};
	try {
		return JSON.parse(fs.readFileSync(manifestFile, "utf8"));
	} catch {
		return {};
	}
}

function detectDrift(
	cwd: string,
	previousManifest: Record<string, string>,
	outputPath: string,
): boolean {
	const expectedHash = previousManifest[outputPath];
	if (!expectedHash) return false;
	const dest = path.join(cwd, outputPath);
	if (!fs.existsSync(dest)) return false;
	return hashContent(fs.readFileSync(dest, "utf8")) !== expectedHash;
}

export function runBuild(cwd: string): void {
	const config = loadConfig(cwd);
	const targetErrors = validateTargets(config.targets);
	if (targetErrors.length > 0) {
		throw new Error(`Project validation failed:\n${targetErrors.join("\n")}`);
	}
	const agentsDir = path.join(cwd, config.agentsDir);
	const rawAgents = loadAgents(agentsDir);
	const agents = rawAgents.map((a) => resolveAgent(a, config.variables));
	const contractErrors = validateProjectContracts(agents, cwd);
	if (contractErrors.length > 0) {
		throw new Error(`Project validation failed:\n${contractErrors.join("\n")}`);
	}

	const ctx: BuildContext = {
		config,
		templates: loadDir(path.join(cwd, "templates")),
		policies: loadDir(path.join(cwd, "policies")),
	};

	const previousManifest = loadManifest(cwd);
	const nextManifest: Record<string, string> = {};
	const driftedFiles: string[] = [];

	let totalFiles = 0;
	for (const targetName of config.targets) {
		const adapter = ADAPTERS[targetName];
		if (!adapter) {
			console.warn(`Unknown target "${targetName}" — skipping.`);
			continue;
		}
		const outputs = adapter.render(agents, ctx);
		for (const file of outputs) {
			if (detectDrift(cwd, previousManifest, file.path)) {
				driftedFiles.push(file.path);
			}
			const dest = path.join(cwd, file.path);
			fs.mkdirSync(path.dirname(dest), { recursive: true });
			fs.writeFileSync(dest, file.content, "utf8");
			nextManifest[file.path] = hashContent(file.content);
		}
		totalFiles += outputs.length;
		console.log(`✓ ${adapter.name}: ${outputs.length} file(s)`);
	}

	const manifestDest = path.join(cwd, MANIFEST_PATH);
	fs.mkdirSync(path.dirname(manifestDest), { recursive: true });
	const sortedManifest = Object.fromEntries(
		Object.entries(nextManifest).sort(([a], [b]) => a.localeCompare(b)),
	);
	fs.writeFileSync(
		manifestDest,
		`${JSON.stringify(sortedManifest, null, "\t")}\n`,
		"utf8",
	);

	if (driftedFiles.length > 0) {
		console.warn(
			`\n⚠ Drift detected — ${driftedFiles.length} generated file(s) were manually edited and have been overwritten:`,
		);
		for (const f of driftedFiles) {
			console.warn(`  ${f}`);
		}
		console.warn(
			"  Edit the canonical sources (agents/, templates/, policies/) instead.",
		);
	}

	console.log(`\nBuild complete — ${totalFiles} file(s) written.`);
}

function loadDir(dir: string): Map<string, string> {
	const map = new Map<string, string>();
	if (!fs.existsSync(dir)) return map;
	for (const f of fs.readdirSync(dir)) {
		const fullPath = path.join(dir, f);
		if (fs.statSync(fullPath).isFile()) {
			map.set(f, fs.readFileSync(fullPath, "utf8"));
		}
	}
	return map;
}
