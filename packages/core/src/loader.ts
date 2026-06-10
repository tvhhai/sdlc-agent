import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { type AgentDef, AgentSchema } from "./schema.js";

export function loadAgents(dir: string): AgentDef[] {
	const files = fs
		.readdirSync(dir)
		.filter((f) => f.endsWith(".yaml"))
		.sort();

	return files.map((f) => {
		const filePath = path.join(dir, f);
		const raw = fs.readFileSync(filePath, "utf8");
		const parsed = parse(raw);
		return AgentSchema.parse(parsed);
	});
}
