(function () {
  'use strict';

  // ==========================================================================
  // Part 1: Custom Web Components (formerly docs-core.js)
  // ==========================================================================

  // <doc-tabs> & <tab-item>
  class DocTabs extends HTMLElement {
    connectedCallback() {
      const tabs = Array.from(this.children);
      if (tabs.length === 0) return;
      const instanceId = 'tabs-' + Math.random().toString(36).substr(2, 9);

      const tabHeaders = tabs.map((tab, index) => {
        const label = tab.getAttribute('label') || `Tab ${index + 1}`;
        const isActive = index === 0;
        return `
          <button 
            class="tab-btn-${instanceId} px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${isActive
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-slate-400 hover:text-slate-200'
          }" 
            data-index="${index}">
            ${label}
          </button>
        `;
      }).join('');

      const tabContents = tabs.map((tab, index) => {
        const isActive = index === 0;
        return `
          <div class="tab-pane-${instanceId} ${isActive ? '' : 'hidden'} mt-3">
            ${tab.innerHTML}
          </div>
        `;
      }).join('');

      this.innerHTML = `
        <div class="my-6 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
          <div class="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-900/60 w-max max-w-full">
            ${tabHeaders}
          </div>
          <div class="mt-2">${tabContents}</div>
        </div>
      `;

      const buttons = this.querySelectorAll(`.tab-btn-${instanceId}`);
      const panes = this.querySelectorAll(`.tab-pane-${instanceId}`);

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetIdx = parseInt(btn.dataset.index);

          buttons.forEach((b, idx) => {
            if (idx === targetIdx) {
              b.classList.add('bg-blue-600', 'text-white', 'shadow-md');
              b.classList.remove('text-slate-400', 'hover:text-slate-200');
            } else {
              b.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
              b.classList.add('text-slate-400', 'hover:text-slate-200');
            }
          });

          panes.forEach((pane, idx) => {
            if (idx === targetIdx) {
              pane.classList.remove('hidden');
            } else {
              pane.classList.add('hidden');
            }
          });
        });
      });
    }
  }

  // <doc-card>
  class DocCard extends HTMLElement {
    connectedCallback() {
      const title = this.getAttribute('title') || '';
      const badge = this.getAttribute('badge') || '';
      const badgeType = this.getAttribute('badge-type') || 'info'; // info, success, warning, error
      const content = this.innerHTML;

      let badgeClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      if (badgeType === 'success') badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      if (badgeType === 'warning') badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      if (badgeType === 'error') badgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

      this.innerHTML = `
        <div class="h-full p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-lg hover:shadow-xl hover:border-slate-700/60 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start gap-4 mb-3">
              <h3 class="text-base font-bold text-slate-100 tracking-tight">${title}</h3>
              ${badge ? `<span class="px-2.5 py-0.5 text-xs font-semibold rounded-full border ${badgeClass}">${badge}</span>` : ''}
            </div>
            <div class="text-sm text-slate-400 leading-relaxed">${content}</div>
          </div>
        </div>
      `;
    }
  }

  // <doc-alert>
  class DocAlert extends HTMLElement {
    connectedCallback() {
      const type = this.getAttribute('type') || 'info'; // info, warning, danger, success
      const title = this.getAttribute('title') || '';
      const content = this.innerHTML;

      let colors = {
        border: 'border-blue-800/50',
        bg: 'bg-blue-950/20',
        text: 'text-blue-200',
        title: 'text-blue-400',
        icon: `<svg class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
      };

      if (type === 'warning') {
        colors = {
          border: 'border-amber-800/50',
          bg: 'bg-amber-950/20',
          text: 'text-amber-200',
          title: 'text-amber-400',
          icon: `<svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`
        };
      } else if (type === 'danger' || type === 'error') {
        colors = {
          border: 'border-rose-800/50',
          bg: 'bg-rose-950/20',
          text: 'text-rose-200',
          title: 'text-rose-400',
          icon: `<svg class="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        };
      } else if (type === 'success') {
        colors = {
          border: 'border-emerald-800/50',
          bg: 'bg-emerald-950/20',
          text: 'text-emerald-200',
          title: 'text-emerald-400',
          icon: `<svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        };
      }

      this.innerHTML = `
        <div class="my-5 flex gap-4 p-4 rounded-xl border ${colors.border} ${colors.bg} ${colors.text}">
          <div class="flex-shrink-0 mt-0.5">${colors.icon}</div>
          <div>
            ${title ? `<h4 class="font-bold mb-1 ${colors.title}">${title}</h4>` : ''}
            <div class="text-sm leading-relaxed">${content}</div>
          </div>
        </div>
      `;
    }
  }

  // <doc-accordion>
  class DocAccordion extends HTMLElement {
    connectedCallback() {
      const title = this.getAttribute('title') || 'Click to expand';
      const content = this.innerHTML;
      const instanceId = 'acc-' + Math.random().toString(36).substr(2, 9);

      this.innerHTML = `
        <div class="my-4 border border-slate-800/80 rounded-xl overflow-hidden bg-slate-900/30">
          <button 
            id="btn-${instanceId}" 
            class="w-full px-5 py-4 flex justify-between items-center text-left font-semibold text-slate-200 hover:bg-slate-900/80 transition-all duration-200">
            <span>${title}</span>
            <svg id="icon-${instanceId}" class="w-5 h-5 transform transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div id="body-${instanceId}" class="hidden p-5 border-t border-slate-800/50 bg-slate-950/40 text-sm text-slate-400 leading-relaxed">
            ${content}
          </div>
        </div>
      `;

      const btn = this.querySelector(`#btn-${instanceId}`);
      const body = this.querySelector(`#body-${instanceId}`);
      const icon = this.querySelector(`#icon-${instanceId}`);

      btn.addEventListener('click', () => {
        const isHidden = body.classList.contains('hidden');
        if (isHidden) {
          body.classList.remove('hidden');
          icon.classList.add('rotate-180');
        } else {
          body.classList.add('hidden');
          icon.classList.remove('rotate-180');
        }
      });
    }
  }

  // Register Web Components
  customElements.define('doc-tabs', DocTabs);
  customElements.define('doc-card', DocCard);
  customElements.define('doc-alert', DocAlert);
  customElements.define('doc-accordion', DocAccordion);


  // ==========================================================================
  // Part 2: Standalone Document Layout Manager (formerly docs-layout.js)
  // ==========================================================================

  const DocLayout = {
    init() {
      if (window.parent !== window) {
        document.body.classList.add('in-iframe');
        document.querySelector('.doc-nav-sidebar')?.remove();
        document.querySelector('.doc-toc-sidebar')?.remove();
        document.querySelector('.doc-nav-toggle')?.remove();
        document.querySelector('.doc-nav-backdrop')?.remove();
        const headings = document.querySelectorAll('h2[id], h3[id]');
        window.parent.postMessage({
          type: 'doc-headings',
          data: Array.from(headings).map(h => ({
            id: h.id,
            text: h.textContent.trim(),
            level: parseInt(h.tagName[1], 10),
          })),
        }, '*');

        // Listen for scroll requests from parent
        window.addEventListener('message', e => {
          if (e.data?.type === 'scroll-to-heading') {
            const el = document.getElementById(e.data.id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        });

        // Scroll spy — post active heading to parent so parent TOC highlights
        this.setupIframeScrollSpy(headings);
        return;
      }
      this.markActiveDoc();
      this.buildToc();
      this.setupScrollSpy();
      this.setupMobileToggle();
    },

    markActiveDoc() {
      const current = document.body.dataset.doc;
      if (!current) return;
      document.querySelectorAll('.doc-nav-link[data-doc]').forEach(link => {
        link.classList.toggle('active', link.dataset.doc === current);
      });
    },

    buildToc() {
      const nav = document.getElementById('doc-toc-nav');
      if (!nav) return;
      const main = document.querySelector('.doc-main');
      if (!main) return;

      const headings = main.querySelectorAll('h2[id], h3[id]');
      if (!headings.length) {
        const sidebar = document.querySelector('.doc-toc-sidebar');
        if (sidebar) sidebar.style.display = 'none';
        return;
      }

      const frag = document.createDocumentFragment();
      headings.forEach(h => {
        const a = document.createElement('a');
        a.href = '#' + h.id;
        a.className = 'toc-link' + (h.tagName === 'H3' ? ' toc-depth-3' : '');
        a.textContent = h.textContent.replace(/^[#\s]+/, '').trim();
        a.dataset.target = h.id;
        frag.appendChild(a);
      });
      nav.appendChild(frag);
    },

    setupScrollSpy() {
      const nav = document.getElementById('doc-toc-nav');
      if (!nav) return;
      const main = document.querySelector('.doc-main');
      if (!main) return;

      const headings = Array.from(main.querySelectorAll('h2[id], h3[id]'));
      if (!headings.length) return;

      let activeId = null;

      const setActive = id => {
        if (id === activeId) return;
        activeId = id;
        nav.querySelectorAll('.toc-link').forEach(a => {
          a.classList.toggle('toc-active', a.dataset.target === id);
        });
      };

      const pick = entries => {
        const visibleIds = [];
        entries.forEach(e => {
          if (e.isIntersecting) visibleIds.push(e.target.id);
        });

        if (visibleIds.length) {
          const first = headings.find(h => visibleIds.includes(h.id));
          if (first) setActive(first.id);
          return;
        }

        const scrollY = window.scrollY;
        let best = null;
        headings.forEach(h => {
          const top = h.getBoundingClientRect().top + scrollY;
          if (top <= scrollY + 80) best = h;
        });
        if (best) setActive(best.id);
      };

      const observer = new IntersectionObserver(pick, {
        rootMargin: '-24px 0px -70% 0px',
        threshold: 0,
      });

      headings.forEach(h => observer.observe(h));
    },

    setupMobileToggle() {
      const toggle = document.querySelector('.doc-nav-toggle');
      const sidebar = document.querySelector('.doc-nav-sidebar');
      const backdrop = document.querySelector('.doc-nav-backdrop');
      if (!toggle || !sidebar) return;

      const open = () => {
        sidebar.classList.add('open');
        backdrop && backdrop.classList.add('visible');
        toggle.setAttribute('aria-expanded', 'true');
      };

      const close = () => {
        sidebar.classList.remove('open');
        backdrop && backdrop.classList.remove('visible');
        toggle.setAttribute('aria-expanded', 'false');
      };

      toggle.addEventListener('click', () => {
        sidebar.classList.contains('open') ? close() : open();
      });

      if (backdrop) backdrop.addEventListener('click', close);

      sidebar.querySelectorAll('.doc-nav-link').forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 860) close();
        });
      });

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') close();
      });
    },

    setupIframeScrollSpy(headingEls) {
      if (!headingEls.length) return;
      const all = Array.from(headingEls);
      let activeId = null;

      const notify = id => {
        if (id === activeId) return;
        activeId = id;
        window.parent.postMessage({ type: 'doc-active-heading', id }, '*');
      };

      const observer = new IntersectionObserver(entries => {
        const visible = entries.filter(e => e.isIntersecting).map(e => e.target);
        if (visible.length) {
          const first = all.find(h => visible.includes(h));
          if (first) notify(first.id);
          return;
        }
        // Nothing intersecting — find last heading scrolled past
        const scrollY = window.scrollY;
        let best = null;
        all.forEach(h => {
          if (h.getBoundingClientRect().top + scrollY <= scrollY + 80) best = h;
        });
        if (best) notify(best.id);
      }, { rootMargin: '-24px 0px -70% 0px', threshold: 0 });

      all.forEach(h => observer.observe(h));
    },
  };

  // ==========================================================================
  // Part 3: Index SPA Shell Manager (formerly docs-index.js)
  // ==========================================================================

  function parseHash(hash) {
    const raw = (hash || '').replace(/^#/, '').trim();
    if (!raw) return null;
    return raw;
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

  function runIndexSPA() {
    const manifest = window.__DOCS_MANIFEST__;
    if (!manifest) {
      console.error('[docs] window.__DOCS_MANIFEST__ missing — is docs-manifest.js loaded?');
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
    const loader = $('index-loader');

    // Listen for iframe load completion to fade it in and hide spinner
    frame.addEventListener('load', () => {
      if (frame.src && frame.src !== 'about:blank') {
        if (loader) {
          loader.style.opacity = '0';
          setTimeout(() => {
            loader.setAttribute('hidden', '');
          }, 200);
        }
        frame.classList.remove('loading');
      }
    });

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

    function loadContent() {
      state.mode === 'html' ? loadHtml() : loadMd();
    }

    function loadHtml() {
      const htmlFile = state.currentFile?.html;
      tocNav.innerHTML = '';
      frame.classList.remove('offline-md');

      // On file:// protocol Chrome blocks cross-directory iframes.
      // Open the HTML doc in a new tab and show an inline prompt.
      if (htmlFile && window.location.protocol === 'file:') {
        frame.setAttribute('hidden', '');
        mdView.setAttribute('hidden', '');
        if (loader) loader.setAttribute('hidden', '');
        let msg = document.getElementById('index-file-msg');
        if (!msg) {
          msg = document.createElement('div');
          msg.id = 'index-file-msg';
          msg.className = 'file-proto-msg';
          frame.parentNode.insertBefore(msg, frame.nextSibling);
        }
        const label = crumb.textContent || htmlFile.split('/').pop();
        msg.innerHTML = `<div class="file-proto-inner">
          <div class="file-proto-icon">📄</div>
          <p class="file-proto-title">${label}</p>
          <p class="file-proto-hint">Browser blocks cross-folder iframes on <code>file://</code>.</p>
          <a class="file-proto-link" href="${htmlFile}" target="_blank">Open full page ↗</a>
        </div>`;
        msg.removeAttribute('hidden');
        window.open(htmlFile, '_blank');
        return;
      }

      // Hide the file:// message if switching back
      const msg = document.getElementById('index-file-msg');
      if (msg) msg.setAttribute('hidden', '');

      if (htmlFile) {
        if (loader) {
          loader.removeAttribute('hidden');
          loader.style.opacity = '1';
        }
        frame.classList.add('loading');
        frame.src = htmlFile;
      } else {
        frame.src = 'about:blank';
        frame.classList.remove('loading');
        if (loader) loader.setAttribute('hidden', '');
        crumb.textContent += ' — (no HTML yet, switch to MD)';
      }

      frame.removeAttribute('hidden');
      mdView.setAttribute('hidden', '');
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

      // Configure marked to use highlight.js for code blocks (once)
      if (window.marked && window.hljs && !window.__markedHljsConfigured) {
        const renderer = new window.marked.Renderer();
        renderer.code = ({ text, lang }) => {
          const language = lang && window.hljs.getLanguage(lang) ? lang : null;
          const highlighted = language
            ? window.hljs.highlight(text, { language }).value
            : window.hljs.highlightAuto(text).value;
          const cls = language ? ` class="hljs language-${language}"` : ' class="hljs"';
          return `<pre><code${cls}>${highlighted}</code></pre>`;
        };
        window.marked.use({ renderer });
        window.__markedHljsConfigured = true;
      }

      let text;
      try {
        const r = await fetch(mdFile);
        if (!r.ok) throw new Error(r.status);
        text = await r.text();
        mdView.innerHTML = window.marked.parse(text);
        showMdView();
        frame.classList.remove('offline-md');

        const headings = Array.from(mdView.querySelectorAll('h2, h3')).filter(h => h.id);
        buildToc(headings.map(h => ({ id: h.id, text: h.textContent.trim(), level: +h.tagName[1] })));
      } catch (err) {
        console.warn('Fetch MD failed, trying iframe fallback:', err);
        // Fallback for file:// protocol local file access
        frame.classList.add('offline-md');
        frame.src = mdFile;
        frame.removeAttribute('hidden');
        mdView.setAttribute('hidden', '');
        crumb.textContent += ' — (Showing raw MD in iframe due to browser local file security)';
        tocNav.innerHTML = '<p style="padding:10px;font-size:11px;color:var(--muted)">TOC not available in offline MD mode</p>';
      }
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

          if (state.mode === 'md') {
            mdView.querySelector('#' + h.id)?.scrollIntoView({ behavior: 'smooth' });
          } else {
            try {
              frame.contentWindow.postMessage({
                type: 'scroll-to-heading',
                id: h.id
              }, '*');
            } catch (err) {
              console.warn('Failed to postMessage to iframe:', err);
            }
          }
        });
        frag.appendChild(a);
      });
      tocNav.appendChild(frag);
    }

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

    function setTocActive(id) {
      tocNav.querySelectorAll('.index-toc-link').forEach(a => {
        a.classList.toggle('toc-active', a.getAttribute('href') === '#' + id);
      });
    }

    function setupMessageListener() {
      window.addEventListener('message', e => {
        if (e.data?.type === 'doc-headings') buildToc(e.data.data);
        if (e.data?.type === 'doc-active-heading') setTocActive(e.data.id);
      });
    }

    function setupHashRouting() {
      window.addEventListener('hashchange', () => {
        if (_suppressHashChange) return;
        const slug = parseHash(location.hash);
        if (slug) routeToSlug(slug);
      });
    }

    async function routeToSlug(slug) {
      const entry = getEntryBySlug(manifest, slug);
      if (entry && !entry.expandable) {
        navigateTo(slug, entry);
        return;
      }

      const parts = slug.split('/');
      if (parts.length === 3) {
        const [parentSlug, groupSlug, docSlug] = parts;
        const sub = document.getElementById('subitems-' + parentSlug);

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

    // Initialize SPA
    buildSidebar();
    setupToggle();
    setupMessageListener();
    setupHashRouting();
    setupMobileToggle();

    const slug = parseHash(location.hash);
    if (slug) routeToSlug(slug);
    else loadDefault();
  }

  // ==========================================================================
  // Orchestrated Initialization
  // ==========================================================================

  function initAll() {
    if (document.body.classList.contains('page-doc')) {
      DocLayout.init();
    }
    if (document.body.classList.contains('page-index')) {
      runIndexSPA();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
