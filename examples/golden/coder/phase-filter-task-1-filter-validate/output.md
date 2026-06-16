# Output from `coder`

**Commit:** [`6d4eba0`](../../../../.git) — `feat(cli): filter sdlc list by --phase and reject unknown values`
**Result:** 14/14 tests in the file passing, 147/147 full suite, typecheck + lint clean. Followed strict TDD (RED confirmed before implementing, GREEN after).

```diff
diff --git a/packages/cli/src/__tests__/list.test.ts b/packages/cli/src/__tests__/list.test.ts
index cf5d4e7..d968dbc 100644
--- a/packages/cli/src/__tests__/list.test.ts
+++ b/packages/cli/src/__tests__/list.test.ts
@@ -232,3 +232,81 @@ describe("runList error handling", () => {
 		expect(errOut).toContain("Validation errors:");
 	});
 });
+
+describe("runList --phase filter", () => {
+	let logSpy: ReturnType<typeof vi.spyOn>;
+	const created: string[] = [];
+
+	beforeEach(() => {
+		logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
+	});
+	afterEach(() => {
+		logSpy.mockRestore();
+		while (created.length)
+			fs.rmSync(created.pop() as string, { recursive: true, force: true });
+	});
+
+	it("returns only rows matching the given phase in table mode", () => {
+		const dir = makeProject({ "a.yaml": AGENT_A, "b.yaml": AGENT_B });
+		created.push(dir);
+		const ok = runList(dir, { json: false, phase: "coding" });
+		expect(ok).toBe(true);
+		const lines = logSpy.mock.calls
+			.map((c: unknown[]) => String(c[0]))
+			.join("\n")
+			.split("\n")
+			.filter(Boolean);
+		expect(lines).toHaveLength(2);
+		expect(lines[0]).toMatch(/^id\s+version\s+phase\s+model_hint\s+targets/);
+		expect(lines[1]).toMatch(/^beta\s/);
+		expect(lines.some((l: string) => /^alpha\s/.test(l))).toBe(false);
+	});
+
+	it("returns only rows matching the given phase in json mode", () => {
+		const dir = makeProject({ "a.yaml": AGENT_A, "b.yaml": AGENT_B });
+		created.push(dir);
+		const ok = runList(dir, { json: true, phase: "planning" });
+		expect(ok).toBe(true);
+		const parsed = JSON.parse(String(logSpy.mock.calls[0][0]));
+		expect(parsed).toHaveLength(1);
+		expect(parsed[0].id).toBe("alpha");
+	});
+
+	it("prints 'No agents found.' when no agent matches the phase", () => {
+		const dir = makeProject({ "a.yaml": AGENT_A, "b.yaml": AGENT_B });
+		created.push(dir);
+		const ok = runList(dir, { json: false, phase: "testing" });
+		expect(ok).toBe(true);
+		expect(logSpy).toHaveBeenCalledWith("No agents found.");
+	});
+});
+
+describe("runList unknown phase", () => {
+	let logSpy: ReturnType<typeof vi.spyOn>;
+	let errSpy: ReturnType<typeof vi.spyOn>;
+	const created: string[] = [];
+
+	beforeEach(() => {
+		logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
+		errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
+	});
+	afterEach(() => {
+		logSpy.mockRestore();
+		errSpy.mockRestore();
+		while (created.length)
+			fs.rmSync(created.pop() as string, { recursive: true, force: true });
+	});
+
+	it("fails with stderr and no stdout for an unrecognized phase", () => {
+		const dir = makeProject({ "a.yaml": AGENT_A, "b.yaml": AGENT_B });
+		created.push(dir);
+		const ok = runList(dir, { json: false, phase: "bogus" });
+		expect(ok).toBe(false);
+		expect(logSpy).not.toHaveBeenCalled();
+		const errOut = errSpy.mock.calls
+			.map((c: unknown[]) => String(c[0]))
+			.join("\n");
+		expect(errOut).toContain("bogus");
+		expect(errOut).toContain("coding");
+	});
+});
diff --git a/packages/cli/src/commands/list.ts b/packages/cli/src/commands/list.ts
index b116221..2ed5977 100644
--- a/packages/cli/src/commands/list.ts
+++ b/packages/cli/src/commands/list.ts
@@ -1,5 +1,10 @@
 import path from "node:path";
-import { type AgentDef, loadAgents, loadConfig } from "@sdlc-agents/core";
+import {
+	type AgentDef,
+	AgentSchema,
+	loadAgents,
+	loadConfig,
+} from "@sdlc-agents/core";
 import { ZodError } from "zod";
 
 export type Row = {
@@ -10,7 +15,9 @@ export type Row = {
 	targets: string[];
 };
 
-export type ListOptions = { json: boolean };
+export type ListOptions = { json: boolean; phase?: string };
+
+const VALID_PHASES = AgentSchema.shape.phase.options;
 
 const COLUMNS: { key: keyof Row; header: string }[] = [
 	{ key: "id", header: "id" },
@@ -63,19 +70,31 @@ function renderTable(rows: Row[]): string {
 
 export function runList(cwd: string, opts: ListOptions): boolean {
 	try {
+		if (
+			opts.phase !== undefined &&
+			!VALID_PHASES.includes(opts.phase as never)
+		) {
+			throw new Error(
+				`Unknown phase "${opts.phase}". Valid phases: ${VALID_PHASES.join(", ")}`,
+			);
+		}
+
 		const config = loadConfig(cwd);
 		const agents = loadAgents(path.join(cwd, config.agentsDir));
 		const rows = normalizeRows(agents, config.targets);
+		const filtered = opts.phase
+			? rows.filter((r) => r.phase === opts.phase)
+			: rows;
 
 		if (opts.json) {
-			console.log(JSON.stringify(rows, null, 2));
+			console.log(JSON.stringify(filtered, null, 2));
 			return true;
 		}
-		if (rows.length === 0) {
+		if (filtered.length === 0) {
 			console.log("No agents found.");
 			return true;
 		}
-		console.log(renderTable(rows));
+		console.log(renderTable(filtered));
 		return true;
 	} catch (err) {
 		if (err instanceof ZodError) {
```

**Note (code-reviewer's later suggestion, non-blocking):** `opts.phase as never` on line 75 works but is a code smell — `(VALID_PHASES as readonly string[]).includes(opts.phase)` would be cleaner. Not applied; see [`../../code-reviewer/phase-filter-review/output.md`](../../code-reviewer/phase-filter-review/output.md).
