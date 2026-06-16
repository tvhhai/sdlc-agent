# Output from `coder`

**Commit:** [`cac5050`](../../../../.git) — `feat(cli): add --phase option to sdlc list command`
**Result:** Manually re-verified independently afterward (not just trusting the subagent's report): `--phase coding` returned exactly the `coder` row; `--phase bogus` printed `Error: Unknown phase "bogus". Valid phases: requirement, planning, architecture, coding, review, testing, release, maintenance` and exited 1 (confirmed via `ELIFECYCLE Command failed with exit code 1`). 147/147 full suite passing.

```diff
diff --git a/packages/cli/src/index.ts b/packages/cli/src/index.ts
index 8ed8205..f3331c9 100644
--- a/packages/cli/src/index.ts
+++ b/packages/cli/src/index.ts
@@ -35,11 +35,19 @@ program
 	.option("-C, --cwd <dir>", "project directory", process.cwd())
 	.option("--json", "output a JSON array instead of a table")
 	.option("--format <fmt>", "output format: table | json")
-	.action((opts: { cwd: string; json?: boolean; format?: string }) => {
-		const json = Boolean(opts.json) || opts.format === "json";
-		const ok = runList(opts.cwd, { json });
-		if (!ok) process.exit(1);
-	});
+	.option("--phase <phase>", "filter agents by phase")
+	.action(
+		(opts: {
+			cwd: string;
+			json?: boolean;
+			format?: string;
+			phase?: string;
+		}) => {
+			const json = Boolean(opts.json) || opts.format === "json";
+			const ok = runList(opts.cwd, { json, phase: opts.phase });
+			if (!ok) process.exit(1);
+		},
+	);
 
 program
 	.command("init")
```
