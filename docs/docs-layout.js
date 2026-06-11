/* ==========================================================================
   docs-layout.js — sidebar layout manager for sdlc-agent docs
   ========================================================================== */

(function () {
  'use strict';

  const DocLayout = {
    init() {
      this.markActiveDoc();
      this.buildToc();
      this.setupScrollSpy();
      this.setupMobileToggle();
    },

    /* Mark the left-sidebar link whose data-doc matches body[data-doc] */
    markActiveDoc() {
      const current = document.body.dataset.doc;
      if (!current) return;
      document.querySelectorAll('.doc-nav-link[data-doc]').forEach(link => {
        link.classList.toggle('active', link.dataset.doc === current);
      });
    },

    /* Auto-build right TOC from h2[id] and h3[id] inside .doc-main */
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

    /* IntersectionObserver scroll spy — highlight active TOC link */
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

      /* Pick the heading closest to the top of viewport */
      const pick = entries => {
        /* Collect all currently intersecting + above-fold headings */
        const visibleIds = [];
        entries.forEach(e => {
          if (e.isIntersecting) visibleIds.push(e.target.id);
        });

        if (visibleIds.length) {
          /* prefer the first one in DOM order */
          const first = headings.find(h => visibleIds.includes(h.id));
          if (first) setActive(first.id);
          return;
        }

        /* If nothing intersecting, find the last heading above viewport */
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

    /* Mobile hamburger: open/close left sidebar */
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

      /* Close on nav link click (navigate within page) */
      sidebar.querySelectorAll('.doc-nav-link').forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 860) close();
        });
      });

      /* Close on Escape */
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') close();
      });
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DocLayout.init());
  } else {
    DocLayout.init();
  }
})();
