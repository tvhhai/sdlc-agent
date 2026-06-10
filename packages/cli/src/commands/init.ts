import fs from "node:fs";
import path from "node:path";

const DEFAULT_CONFIG = `# sdlc-agents configuration
targets:
  - universal
  - claude-code
  - copilot

variables:
  language: en
  # team: my-team
`;

export function runInit(cwd: string): void {
	const dest = path.join(cwd, "sdlc.config.yaml");
	if (fs.existsSync(dest)) {
		console.log("sdlc.config.yaml already exists — skipping.");
		return;
	}
	fs.writeFileSync(dest, DEFAULT_CONFIG, "utf8");
	console.log("Created sdlc.config.yaml");
	console.log("Next: run `sdlc build` to generate agent files.");
}
