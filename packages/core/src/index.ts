export { loadConfig } from "./config.js";
export { loadAgents } from "./loader.js";
export { mergeConfigs } from "./merger.js";
export { resolveAgent, resolveVariables } from "./resolver.js";
export type { AgentDef } from "./schema.js";
export { AgentSchema } from "./schema.js";
export type {
	BuildContext,
	Diagnostic,
	OutputFile,
	ResolvedConfig,
	ToolAdapter,
} from "./types.js";
