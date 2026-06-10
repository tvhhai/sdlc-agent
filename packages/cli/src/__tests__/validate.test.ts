import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runValidate } from "../commands/validate.js";

const REAL_AGENTS = path.resolve(
	fileURLToPath(import.meta.url),
	"../../../../../agents",
);

describe("runValidate", () => {
	it("returns true for the real agents/ directory", () => {
		expect(runValidate(REAL_AGENTS)).toBe(true);
	});
});
