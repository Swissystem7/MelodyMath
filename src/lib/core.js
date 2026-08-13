// MelodyMath shared kernel — one <script src> for every page.
//
// Classic script (not type=module) so a teacher can open index.html from disk.
// GitHub Pages serves this fine. In the browser this file document.write-s the
// three focused modules, then installs the Hebrew site nav + print CSS.
// Node tests keep requiring adaptive.js / sonify.js / teacherStore.js directly.
(function (root) {
  const IN_NODE = typeof module === 'object' && module.exports && typeof document === 'undefined';

  function pick() {
    if (IN_NODE) {
      return Object.assign(
        {},
        require('./sonify'),
        require('./adaptive'),
        require('./teacherStore')
      );
    }
    return root;
  }

  function installSharedChrome() {
    if (typeof document === 'undefined') return;
    const script = document.currentScript || document.querySelector('script[src*="core.js"]');
    const base = script && script.src ? script.src.replace(/[^/]+$/, '') : 'src/lib/';
    if (!document.querySelector('link[data-mm-print]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = base + 'print.css';
      link.setAttribute('data-mm-print', '1');
      document.head.appendChild(link);
    }
    if (document.getElementById('mm-site-nav')) return;
    const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const links = [
      ['index.html', 'דף הבית'],
      ['functions.html', 'שומעים פונקציה'],
      ['807.html', 'גדילה ודעיכה'],
      ['landing.html', 'אודות'],
    ];
    const nav = document.createElement('nav');
    nav.id = 'mm-site-nav';
    nav.setAttribute('aria-label', 'MelodyMath');
    nav.innerHTML = '<span class="mm-brand">♫ MelodyMath</span>' + links.map(function (pair) {
      const file = pair[0];
      const label = pair[1];
      const current = here === file || (here === '' && file === 'index.html');
      return '<a href="' + file + '"' + (current ? ' aria-current="page"' : '') + '>' + label + '</a>';
    }).join(' · ');
    document.body.insertBefore(nav, document.body.firstChild);
  }

  function api() {
    const parts = pick();
    return Object.assign({}, parts, { installSharedChrome: installSharedChrome });
  }

  const exported = IN_NODE ? api() : { installSharedChrome: installSharedChrome };
  if (IN_NODE) module.exports = exported;
  else {
    Object.assign(root, exported);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installSharedChrome);
    else installSharedChrome();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
