import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import type { ResolvedConfig } from "./types.js";

const ConfigFileSchema = z.object({
	targets: z.array(z.string()).optional(),
	variables: z.record(z.string(), z.string()).optional(),
	agentsDir: z.string().optional(),
});

export function loadConfig(dir: string): ResolvedConfig {
	const defaults: ResolvedConfig = {
		targets: ["universal", "claude-code"],
		rootDir: path.resolve(dir),
		variables: { language: "en" },
		agentsDir: "agents",
	};

	const configPath = path.join(dir, "sdlc.config.yaml");
	if (!fs.existsSync(configPath)) return defaults;

	const raw = fs.readFileSync(configPath, "utf8");
	const parsed = ConfigFileSchema.parse(parse(raw));

	return {
		...defaults,
		...parsed,
		rootDir: path.resolve(dir),
		variables: { ...defaults.variables, ...(parsed.variables ?? {}) },
	};
}
