import type { ResolvedConfig } from "./types.js";

type PartialConfig = Partial<ResolvedConfig>;

export function mergeConfigs(
	base: ResolvedConfig,
	...overrides: PartialConfig[]
): ResolvedConfig {
	let result: ResolvedConfig = { ...base, variables: { ...base.variables } };
	for (const override of overrides) {
		result = {
			...result,
			...override,
			variables: { ...result.variables, ...(override.variables ?? {}) },
		};
	}
	return result;
}
