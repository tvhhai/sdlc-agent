import { describe, expect, it } from "vitest";
import { mergeConfigs } from "../merger.js";
import type { ResolvedConfig } from "../types.js";

const base: ResolvedConfig = {
	targets: ["universal"],
	rootDir: "/project",
	variables: { language: "en" },
	agentsDir: "agents",
};

describe("mergeConfigs", () => {
	it("later config overrides earlier for scalar fields", () => {
		const result = mergeConfigs(base, {
			targets: ["universal", "claude-code"],
		});
		expect(result.targets).toEqual(["universal", "claude-code"]);
	});

	it("deep-merges variables", () => {
		const result = mergeConfigs(base, { variables: { team: "payments" } });
		expect(result.variables).toEqual({ language: "en", team: "payments" });
	});

	it("preserves base values when override is empty", () => {
		const result = mergeConfigs(base, {});
		expect(result.agentsDir).toBe("agents");
	});

	it("merges three layers in priority order (last wins)", () => {
		const result = mergeConfigs(
			base,
			{ variables: { language: "vi" } },
			{ variables: { language: "en", team: "core" } },
		);
		expect(result.variables.language).toBe("en");
		expect(result.variables.team).toBe("core");
	});

	it("does not mutate the base config", () => {
		mergeConfigs(base, { variables: { language: "vi" } });
		expect(base.variables.language).toBe("en");
	});
});
