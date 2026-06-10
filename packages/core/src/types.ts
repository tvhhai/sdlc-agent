import type { AgentDef } from "./schema.js";

export interface OutputFile {
	/** Path relative to the consumer project root. */
	path: string;
	content: string;
}

export interface Diagnostic {
	severity: "error" | "warning" | "info";
	message: string;
	/** File that triggered this diagnostic, if known. */
	source?: string;
}

export interface ResolvedConfig {
	targets: string[];
	/** Absolute path to the root dir (agents/, templates/, policies/ live here). */
	rootDir: string;
	variables: Record<string, string>;
	agentsDir: string;
}

export interface BuildContext {
	config: ResolvedConfig;
	/** template filename → file content, pre-loaded */
	templates: Map<string, string>;
	/** policy name → file content, pre-loaded */
	policies: Map<string, string>;
}

export interface ToolAdapter {
	readonly name: string;
	render(agents: AgentDef[], ctx: BuildContext): OutputFile[];
	validate?(outputs: OutputFile[]): Diagnostic[];
}
