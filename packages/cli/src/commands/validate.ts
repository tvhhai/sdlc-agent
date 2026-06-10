import { loadAgents } from "@sdlc-agents/core";
import { ZodError } from "zod";

export function runValidate(agentsDir: string): boolean {
	try {
		const agents = loadAgents(agentsDir);
		console.log(`✓ ${agents.length} agent(s) valid.`);
		return true;
	} catch (err) {
		if (err instanceof ZodError) {
			console.error("Validation errors:");
			err.issues.forEach((i) => {
				console.error(`  [${i.path.join(".")}] ${i.message}`);
			});
		} else {
			console.error(String(err));
		}
		return false;
	}
}
