import path from "node:path";
import { loadAgents } from "@sdlc-agents/core";
import { ZodError } from "zod";
import { validateProjectContracts } from "./project-validation.js";

export function runValidate(agentsDir: string): boolean {
	try {
		const agents = loadAgents(agentsDir);
		const projectRoot = path.dirname(agentsDir);
		const contractErrors = validateProjectContracts(agents, projectRoot);
		if (contractErrors.length > 0) {
			console.error("Validation errors:");
			for (const message of contractErrors) {
				console.error(`  ${message}`);
			}
			return false;
		}
		console.log(`OK ${agents.length} agent(s) valid.`);
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
