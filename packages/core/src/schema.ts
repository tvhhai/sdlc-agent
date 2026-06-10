import { z } from "zod";

const ModelHint = z.enum(["fast", "balanced", "high-reasoning"]);

const WorkflowStep = z.object({
	step: z.string(),
	ref: z.string().optional(),
});

const ImportEntry = z.object({
	source: z.string().regex(/^github:[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/),
	path: z.string(),
	pin: z.string(),
	license: z.enum(["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause"]),
});

const InputDef = z.object({
	name: z.string(),
	description: z.string().optional(),
	required: z.boolean().default(false),
});

const ModelVariant = z.object({
	prompt_append: z.string().optional(),
	prompt_prepend: z.string().optional(),
});

export const AgentSchema = z.object({
	id: z.string().regex(/^[a-z][a-z0-9-]*$/, "id must be kebab-case"),
	version: z.string().regex(/^\d+\.\d+\.\d+$/, "version must be semver x.y.z"),
	phase: z.enum([
		"requirement",
		"planning",
		"architecture",
		"coding",
		"review",
		"testing",
		"release",
		"maintenance",
	]),
	description: z.string().min(10),
	model_hint: ModelHint.default("balanced"),
	model_variants: z
		.object({
			claude: ModelVariant,
			copilot: ModelVariant,
			gemini: ModelVariant,
			codex: ModelVariant,
		})
		.partial()
		.optional(),
	tools_required: z.array(z.string()).default([]),
	inputs: z.array(InputDef).default([]),
	workflow: z.array(WorkflowStep).min(1),
	output_template: z.string().optional(),
	policies: z.array(z.string()).default([]),
	imports: z.array(ImportEntry).optional(),
	prompt_prepend: z.string().optional(),
	extends: z.string().optional(),
});

export type AgentDef = z.infer<typeof AgentSchema>;
