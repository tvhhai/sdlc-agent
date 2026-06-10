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

const ADAPTERS: Record<string, ToolAdapter> = {
	universal: new UniversalAdapter(),
	"claude-code": new ClaudeCodeAdapter(),
	copilot: new CopilotAdapter(),
};

export function runBuild(cwd: string): void {
	const config = loadConfig(cwd);
	const agentsDir = path.join(cwd, config.agentsDir);
	const rawAgents = loadAgents(agentsDir);
	const agents = rawAgents.map((a) => resolveAgent(a, config.variables));

	const ctx: BuildContext = {
		config,
		templates: loadDir(path.join(cwd, "templates")),
		policies: loadDir(path.join(cwd, "policies")),
	};

	let totalFiles = 0;
	for (const targetName of config.targets) {
		const adapter = ADAPTERS[targetName];
		if (!adapter) {
			console.warn(`Unknown target "${targetName}" — skipping.`);
			continue;
		}
		const outputs = adapter.render(agents, ctx);
		for (const file of outputs) {
			const dest = path.join(cwd, file.path);
			fs.mkdirSync(path.dirname(dest), { recursive: true });
			fs.writeFileSync(dest, file.content, "utf8");
		}
		totalFiles += outputs.length;
		console.log(`✓ ${adapter.name}: ${outputs.length} file(s)`);
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
