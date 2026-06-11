import path from "node:path";
import { loadAgents, loadConfig } from "@sdlc-agents/core";
import { ZodError } from "zod";
import {
	validateProjectContracts,
	validateTargets,
} from "./project-validation.js";

export function runValidate(cwd: string): boolean {
	try {
		const config = loadConfig(cwd);
		const targetErrors = validateTargets(config.targets);
		if (targetErrors.length > 0) {
			console.error("Validation errors:");
			for (const message of targetErrors) {
				console.error(`  ${message}`);
			}
			return false;
		}
		const agentsDir = path.join(cwd, config.agentsDir);
		const agents = loadAgents(agentsDir);
		const contractErrors = validateProjectContracts(agents, cwd);
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
