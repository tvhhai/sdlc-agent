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
	return resolveValue(agent, vars) as AgentDef;
}

function resolveValue(value: unknown, vars: Record<string, string>): unknown {
	if (typeof value === "string") {
		return resolveVariables(value, vars);
	}
	if (Array.isArray(value)) {
		return value.map((item) => resolveValue(item, vars));
	}
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([key, nested]) => [
				key,
				resolveValue(nested, vars),
			]),
		);
	}
	return value;
}
