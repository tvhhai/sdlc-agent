#!/usr/bin/env node
import path from "node:path";
import { Command } from "commander";
import { runBuild } from "./commands/build.js";
import { runInit } from "./commands/init.js";
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
		const ok = runValidate(path.join(opts.cwd, "agents"));
		if (!ok) process.exit(1);
	});

program
	.command("init")
	.description("Scaffold sdlc.config.yaml in the current project")
	.option("-C, --cwd <dir>", "project directory", process.cwd())
	.action((opts: { cwd: string }) => runInit(opts.cwd));

program.parse();
