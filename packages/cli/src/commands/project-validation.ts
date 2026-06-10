import fs from "node:fs";
import path from "node:path";
import type { AgentDef } from "@sdlc-agents/core";

export function validateProjectContracts(
	agents: AgentDef[],
	projectRoot: string,
): string[] {
	const errors: string[] = [];
	const seenIds = new Map<string, number>();

	for (const agent of agents) {
		const count = seenIds.get(agent.id) ?? 0;
		seenIds.set(agent.id, count + 1);

		if (agent.output_template) {
			const templatePath = path.resolve(projectRoot, agent.output_template);
			if (!fs.existsSync(templatePath)) {
				errors.push(
					`Agent "${agent.id}" references missing template: ${agent.output_template}`,
				);
			}
		}

		for (const policy of agent.policies) {
			const policyPath = path.resolve(projectRoot, "policies", `${policy}.md`);
			if (!fs.existsSync(policyPath)) {
				errors.push(
					`Agent "${agent.id}" references missing policy: policies/${policy}.md`,
				);
			}
		}
	}

	for (const [id, count] of seenIds.entries()) {
		if (count > 1) {
			errors.push(`Duplicate agent id "${id}" appears ${count} times.`);
		}
	}

	return errors;
}
