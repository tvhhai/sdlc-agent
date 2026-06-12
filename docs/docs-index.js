/* ==========================================================================
   docs-index.js — SPA for docs/index.html
   Reads window.__DOCS_MANIFEST__ (from docs-manifest.js).
   ========================================================================== */

/* ── Pure helpers (no DOM dependency) ────────────────────────────────────── */

function parseHash(hash) {
	const raw = (hash || '').replace(/^#/, '').trim();
	if (!raw) return null;
	return raw; // returned as-is; callers split on '/' as needed
}

function getEntryBySlug(manifest, slug) {
	for (const group of manifest.groups) {
		for (const entry of group.entries) {
			if (entry.slug === slug) return entry;
		}
	}
	return null;
}

function isAutoHidden(slug, prefix) {
	return Boolean(prefix && slug.startsWith(prefix));
}

/* ── SPA ──────────────────────────────────────────────────────────────────── */

(function () {
	'use strict';

	const manifest = window.__DOCS_MANIFEST__;
	if (!manifest) {
		console.error('[docs-index] window.__DOCS_MANIFEST__ missing — is docs-manifest.js loaded?');
		return;
	}

	const state = { mode: 'html', currentSlug: null, currentFile: null };
	let _suppressHashChange = false;

	const $ = id => document.getElementById(id);
	const sidebar = $('index-sidebar');
	const frame = $('index-frame');
	const mdView = $('index-md-view');
	const tocNav = $('index-toc-nav');
	const crumb = $('index-breadcrumb');
	const btnHtml = $('btn-html');
	const btnMd = $('btn-md');

	/* ── Sidebar ────────────────────────────────────────────────────────── */

	function buildSidebar() {
		const brand = document.createElement('div');
		brand.className = 'index-sidebar-brand';
		brand.innerHTML =
			`<div class="index-sidebar-brand-title">📚 ${manifest.project || 'Docs'}</div>` +
			`<div class="index-sidebar-brand-sub">Documentation</div>`;
		brand.addEventListener('click', loadDefault);
		sidebar.appendChild(brand);

		for (const group of manifest.groups) {
			const nav = document.createElement('nav');
			nav.className = 'index-nav-group';
			nav.innerHTML = `<div class="index-nav-group-label">${group.label}</div>`;

			for (const entry of group.entries) {
				if (isAutoHidden(entry.slug, manifest.autoHidePrefix)) continue;
				if (entry.hidden) continue;

				const btn = document.createElement('button');
				btn.className = 'index-nav-link';
				btn.dataset.slug = entry.slug;
				btn.innerHTML =
					`<span class="index-nav-link-icon">${entry.icon || '📄'}</span>` +
					`<span>${entry.title}</span>`;

				if (entry.expandable) {
					const sub = document.createElement('div');
					sub.className = 'index-nav-subitems';
					sub.id = 'subitems-' + entry.slug;
					btn.addEventListener('click', () => handleExpandable(entry, sub, btn));
					nav.appendChild(btn);
					nav.appendChild(sub);
				} else {
					btn.addEventListener('click', () => navigateTo(entry.slug, entry));
					nav.appendChild(btn);
				}
			}

			sidebar.appendChild(nav);
		}
	}

	async function handleExpandable(entry, sub, btn) {
		const isOpen = sub.classList.contains('open');
		if (isOpen) {
			sub.classList.remove('open');
			return;
		}

		if (!sub.dataset.loaded) {
			const data = await loadFolderIndex(entry.slug);
			if (!data) return;
			sub.dataset.loaded = '1';
			renderSubitems(sub, entry.slug, data);
		}
		sub.classList.add('open');
	}

	function renderSubitems(sub, parentSlug, data) {
		sub.innerHTML = '';
		for (const group of data.entries) {
			const label = document.createElement('div');
			label.className = 'index-nav-subgroup-label';
			label.textContent = group.title;
			sub.appendChild(label);

			for (const doc of group.docs) {
				const fullSlug = `${parentSlug}/${group.slug}/${doc.slug}`;
				const a = document.createElement('a');
				a.className = 'index-nav-sublink';
				a.dataset.slug = fullSlug;
				a.textContent = doc.title;
				a.addEventListener('click', e => {
					e.preventDefault();
					navigateTo(fullSlug, doc);
				});
				sub.appendChild(a);
			}
		}
	}

	function loadFolderIndex(slug) {
		return new Promise(resolve => {
			const s = document.createElement('script');
			s.src = slug + '/_index.js';
			s.onload = () => resolve((window.__DOCS_INDEX__ || {})[slug] || null);
			s.onerror = () => resolve(null);
			document.head.appendChild(s);
		});
	}

	/* ── Navigation ──────────────────────────────────────────────────────── */

	function navigateTo(slug, entryOrDoc) {
		state.currentSlug = slug;
		state.currentFile = { html: entryOrDoc?.file || null, md: entryOrDoc?.md || null };

		_suppressHashChange = true;
		location.hash = '#' + slug;
		setTimeout(() => {
			_suppressHashChange = false;
		}, 0);

		loadContent();
		setActiveLink(slug);
		crumb.textContent = entryOrDoc?.title || slug;

		if (window.innerWidth <= 860) closeMobile();
	}

	function setActiveLink(slug) {
		document.querySelectorAll('.index-nav-link, .index-nav-sublink').forEach(el => {
			el.classList.toggle('active', el.dataset.slug === slug);
		});
	}

	function loadDefault() {
		const first = manifest.groups[0]?.entries?.find(e => !e.expandable && !e.hidden);
		if (first) navigateTo(first.slug, first);
	}

	/* ── Content loading ─────────────────────────────────────────────────── */

	function loadContent() {
		state.mode === 'html' ? loadHtml() : loadMd();
	}

	function loadHtml() {
		const htmlFile = state.currentFile?.html;
		tocNav.innerHTML = '';
		frame.removeAttribute('hidden');
		mdView.setAttribute('hidden', '');
		frame.src = htmlFile || 'about:blank';
		if (!htmlFile) crumb.textContent += ' — (no HTML yet, switch to MD)';
	}

	async function loadMd() {
		const mdFile = state.currentFile?.md;
		if (!window.marked) {
			try {
				await loadScript('marked.min.js');
			} catch {
				mdView.innerHTML = '<p style="padding:32px">Could not load marked.min.js.</p>';
				showMdView();
				return;
			}
		}
		if (!mdFile) {
			mdView.innerHTML = '<p style="padding:32px">No MD file for this entry.</p>';
			showMdView();
			return;
		}

		let text;
		try {
			const r = await fetch(mdFile);
			if (!r.ok) throw new Error(r.status);
			text = await r.text();
		} catch {
			mdView.innerHTML =
				'<p style="padding:32px">Could not fetch MD. Open via HTTP server (<code>npx serve docs</code>) for MD toggle support.</p>';
			showMdView();
			return;
		}

		mdView.innerHTML = window.marked.parse(text);
		showMdView();

		const headings = Array.from(mdView.querySelectorAll('h2, h3')).filter(h => h.id);
		buildToc(headings.map(h => ({ id: h.id, text: h.textContent.trim(), level: +h.tagName[1] })));
	}

	function showMdView() {
		frame.setAttribute('hidden', '');
		mdView.removeAttribute('hidden');
	}

	function loadScript(src) {
		return new Promise((resolve, reject) => {
			const s = document.createElement('script');
			s.src = src;
			s.onload = resolve;
			s.onerror = reject;
			document.head.appendChild(s);
		});
	}

	/* ── TOC ──────────────────────────────────────────────────────────────── */

	function buildToc(headings) {
		tocNav.innerHTML = '';
		const frag = document.createDocumentFragment();
		headings.forEach(h => {
			const a = document.createElement('a');
			a.href = '#' + h.id;
			a.className = 'index-toc-link' + (h.level === 3 ? ' depth-3' : '');
			a.textContent = h.text;
			a.addEventListener('click', e => {
				e.preventDefault();
				tocNav.querySelectorAll('.index-toc-link').forEach(l => l.classList.remove('toc-active'));
				a.classList.add('toc-active');
				try {
					frame.contentDocument?.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
				} catch {
					/* cross-origin guard */
				}
				mdView.querySelector('#' + h.id)?.scrollIntoView({ behavior: 'smooth' });
			});
			frag.appendChild(a);
		});
		tocNav.appendChild(frag);
	}

	/* ── Toggle HTML / MD ────────────────────────────────────────────────── */

	function setupToggle() {
		btnHtml.addEventListener('click', () => {
			if (state.mode === 'html') return;
			state.mode = 'html';
			btnHtml.classList.add('active');
			btnMd.classList.remove('active');
			loadContent();
		});
		btnMd.addEventListener('click', () => {
			if (state.mode === 'md') return;
			state.mode = 'md';
			btnMd.classList.add('active');
			btnHtml.classList.remove('active');
			loadContent();
		});
	}

	/* ── postMessage from iframe ─────────────────────────────────────────── */

	function setupMessageListener() {
		window.addEventListener('message', e => {
			if (e.data?.type === 'doc-headings') buildToc(e.data.data);
		});
	}

	/* ── Hash routing ────────────────────────────────────────────────────── */

	function setupHashRouting() {
		window.addEventListener('hashchange', () => {
			if (_suppressHashChange) return;
			const slug = parseHash(location.hash);
			if (slug) routeToSlug(slug);
		});
	}

	async function routeToSlug(slug) {
		// Direct manifest entry
		const entry = getEntryBySlug(manifest, slug);
		if (entry && !entry.expandable) {
			navigateTo(slug, entry);
			return;
		}

		// Deep slug: parentSlug/groupSlug/docSlug (e.g. work/sdlc-list/prd)
		const parts = slug.split('/');
		if (parts.length === 3) {
			const [parentSlug, groupSlug, docSlug] = parts;
			const sub = document.getElementById('subitems-' + parentSlug);

			// Ensure folder index is loaded
			let data = (window.__DOCS_INDEX__ || {})[parentSlug];
			if (!data) data = await loadFolderIndex(parentSlug);
			if (data && sub && !sub.dataset.loaded) {
				renderSubitems(sub, parentSlug, data);
				sub.dataset.loaded = '1';
				sub.classList.add('open');
			}

			const group = data?.entries?.find(g => g.slug === groupSlug);
			const doc = group?.docs?.find(d => d.slug === docSlug);
			if (doc) {
				navigateTo(slug, doc);
				return;
			}
		}

		loadDefault();
	}

	/* ── Mobile ──────────────────────────────────────────────────────────── */

	function closeMobile() {
		sidebar.classList.remove('open');
		document.querySelector('.index-nav-backdrop')?.classList.remove('visible');
		document.querySelector('.index-nav-toggle')?.setAttribute('aria-expanded', 'false');
	}

	function setupMobileToggle() {
		const toggle = document.querySelector('.index-nav-toggle');
		const backdrop = document.querySelector('.index-nav-backdrop');
		if (!toggle) return;

		const open = () => {
			sidebar.classList.add('open');
			backdrop?.classList.add('visible');
			toggle.setAttribute('aria-expanded', 'true');
		};

		toggle.addEventListener('click', () => (sidebar.classList.contains('open') ? closeMobile() : open()));
		backdrop?.addEventListener('click', closeMobile);
		document.addEventListener('keydown', e => {
			if (e.key === 'Escape') closeMobile();
		});
	}

	/* ── Init ────────────────────────────────────────────────────────────── */

	function init() {
		buildSidebar();
		setupToggle();
		setupMessageListener();
		setupHashRouting();
		setupMobileToggle();

		const slug = parseHash(location.hash);
		if (slug) routeToSlug(slug);
		else loadDefault();
	}

	document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
