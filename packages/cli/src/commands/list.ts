import path from "node:path";
import { type AgentDef, loadAgents, loadConfig } from "@sdlc-agents/core";
import { ZodError } from "zod";

export type Row = {
	id: string;
	version: string;
	phase: string;
	model_hint: string;
	targets: string[];
};

export type ListOptions = { json: boolean };

const COLUMNS: { key: keyof Row; header: string }[] = [
	{ key: "id", header: "id" },
	{ key: "version", header: "version" },
	{ key: "phase", header: "phase" },
	{ key: "model_hint", header: "model_hint" },
	{ key: "targets", header: "targets" },
];

export function normalizeRows(
	agents: readonly AgentDef[],
	targets: string[],
): Row[] {
	return agents
		.map((agent) => ({
			id: agent.id,
			version: agent.version,
			phase: agent.phase,
			model_hint: agent.model_hint,
			targets,
		}))
		.sort((a, b) => a.phase.localeCompare(b.phase) || a.id.localeCompare(b.id));
}

function cell(row: Row, key: keyof Row): string {
	const value = row[key];
	return Array.isArray(value) ? value.join(", ") : String(value);
}

function renderTable(rows: Row[]): string {
	const widths = COLUMNS.map((col) =>
		Math.max(
			col.header.length,
			...rows.map((row) => cell(row, col.key).length),
		),
	);
	const line = (cells: string[]) =>
		cells
			.map((text, i) =>
				i === cells.length - 1 ? text : text.padEnd(widths[i]),
			)
			.join("  ")
			.trimEnd();
	const header = line(COLUMNS.map((col) => col.header));
	const body = rows.map((row) =>
		line(COLUMNS.map((col) => cell(row, col.key))),
	);
	return [header, ...body].join("\n");
}

export function runList(cwd: string, opts: ListOptions): boolean {
	try {
		const config = loadConfig(cwd);
		const agents = loadAgents(path.join(cwd, config.agentsDir));
		const rows = normalizeRows(agents, config.targets);

		if (opts.json) {
			console.log(JSON.stringify(rows, null, 2));
			return true;
		}
		if (rows.length === 0) {
			console.log("No agents found.");
			return true;
		}
		console.log(renderTable(rows));
		return true;
	} catch (err) {
		if (err instanceof ZodError) {
			console.error("Validation errors:");
			for (const issue of err.issues) {
				console.error(`  [${issue.path.join(".")}] ${issue.message}`);
			}
		} else {
			console.error(String(err));
		}
		return false;
	}
}
