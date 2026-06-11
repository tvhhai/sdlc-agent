// docs/docs-core.js
// Shared components for Expense Tracker Premium Documentation

// 1. Component <doc-tabs> & <tab-item> (hoặc div)
class DocTabs extends HTMLElement {
  connectedCallback() {
    // Lấy danh sách các tab con
    const tabs = Array.from(this.children);
    if (tabs.length === 0) return;

    // Sinh unique ID để tránh xung đột giữa nhiều cụm tab trên cùng 1 trang
    const instanceId = 'tabs-' + Math.random().toString(36).substr(2, 9);

    const tabHeaders = tabs.map((tab, index) => {
      const label = tab.getAttribute('label') || `Tab ${index + 1}`;
      const isActive = index === 0;
      return `
        <button 
          class="tab-btn-${instanceId} px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
            isActive 
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

    // Render cấu trúc mới
    this.innerHTML = `
      <div class="my-6 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
        <div class="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-900/60 w-max max-w-full">
          ${tabHeaders}
        </div>
        <div class="mt-2">${tabContents}</div>
      </div>
    `;

    // Lắng nghe sự kiện chuyển tab
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

// 2. Component <doc-card>
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

// 3. Component <doc-alert>
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

// 4. Component <doc-accordion>
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

// Đăng ký toàn bộ Custom Components với trình duyệt
customElements.define('doc-tabs', DocTabs);
customElements.define('doc-card', DocCard);
customElements.define('doc-alert', DocAlert);
customElements.define('doc-accordion', DocAccordion);
