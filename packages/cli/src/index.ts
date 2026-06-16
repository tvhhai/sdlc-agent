#!/usr/bin/env node
import { Command } from "commander";
import { runBuild } from "./commands/build.js";
import { runInit } from "./commands/init.js";
import { runList } from "./commands/list.js";
import { runValidate } from "./commands/validate.js";

const program = new Command();

program
	.name("sdlc")
	.description(
		"Agentic SDLC Agents Set — build AI agent definitions for every tool",
	)
	.version("0.1.0");

program
	.command("build")
	.description("Render agent definitions to all configured target formats")
	.option("-C, --cwd <dir>", "project directory", process.cwd())
	.action((opts: { cwd: string }) => runBuild(opts.cwd));

program
	.command("validate")
	.description("Validate all agent YAML definitions without building")
	.option("-C, --cwd <dir>", "project directory", process.cwd())
	.action((opts: { cwd: string }) => {
		const ok = runValidate(opts.cwd);
		if (!ok) process.exit(1);
	});

program
	.command("list")
	.description("List all agent definitions as a table or JSON")
	.option("-C, --cwd <dir>", "project directory", process.cwd())
	.option("--json", "output a JSON array instead of a table")
	.option("--format <fmt>", "output format: table | json")
	.option("--phase <phase>", "filter agents by phase")
	.action(
		(opts: {
			cwd: string;
			json?: boolean;
			format?: string;
			phase?: string;
		}) => {
			const json = Boolean(opts.json) || opts.format === "json";
			const ok = runList(opts.cwd, { json, phase: opts.phase });
			if (!ok) process.exit(1);
		},
	);

program
	.command("init")
	.description("Scaffold sdlc.config.yaml in the current project")
	.option("-C, --cwd <dir>", "project directory", process.cwd())
	.action((opts: { cwd: string }) => runInit(opts.cwd));

program.parse();
