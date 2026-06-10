import type { AgentDef } from "./schema.js";

export function resolveVariables(
	text: string,
	vars: Record<string, string>,
): string {
	return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export function resolveAgent(
	agent: AgentDef,
	vars: Record<string, string>,
): AgentDef {
	const serialized = JSON.stringify(agent);
	const resolved = resolveVariables(serialized, vars);
	return JSON.parse(resolved) as AgentDef;
}
