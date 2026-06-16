// docs/docs-manifest.js
// Navigation source of truth for docs/index.html.
// To add a doc: add an entry here (or to <folder>/_index.js for expandable folders).
// Never edit docs/index.html to change navigation.
window.__DOCS_MANIFEST__ = {
	project: 'sdlc-agent',
	autoHidePrefix: '_',
	groups: [
		{
			label: 'Architecture',
			entries: [
				{
					slug: 'sa-design',
					title: 'SA Design',
					icon: '🏗',
					file: 'architecture/sa-design.html',
					md: 'architecture/SA_DESIGN_Agentic_SDLC_Agents_Set.md',
				},
			],
		},
		{
			label: 'Reference',
			entries: [
				{
					slug: 'codebase-guide',
					title: 'Codebase Guide',
					icon: '📁',
					file: 'reference/codebase-guide.html',
					md: 'reference/CODEBASE_FOLDER_GUIDE.md',
				},
				{
					slug: 'adapter-contract',
					title: 'Adapter Contract',
					icon: '🔌',
					file: 'reference/adapter-contract.html',
					md: 'reference/ADAPTER_CONTRACT.md',
				},
			],
		},
		{
			label: 'Release',
			entries: [
				{
					slug: 'release-notes',
					title: 'Release Notes',
					icon: '📝',
					file: 'release/release-notes.html',
					md: 'release/RELEASE_NOTES.md',
				},
			],
		},
		{
			label: 'AI Work',
			entries: [
				{
					slug: 'work',
					title: 'Work',
					icon: '🤖',
					expandable: true,
				},
			],
		},
	],
};
