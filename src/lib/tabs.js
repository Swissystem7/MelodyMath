// MelodyMath — keyboard tablists (ARIA APG, RTL-aware).
//
// Special-ed tablets are often used with a keyboard or switch. A role=tablist
// that only responds to clicks is not usable. These helpers are the tested
// reading-order rules; pages still own what a click does.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const KEYS = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
  };

  function isRtl(el) {
    if (!el) return true;
    const node = el.closest ? (el.closest('[dir]') || el) : el;
    const dir = (node.getAttribute && node.getAttribute('dir'))
      || (typeof document !== 'undefined' && document.documentElement.getAttribute('dir'))
      || 'rtl';
    return String(dir).toLowerCase() === 'rtl';
  }

  function isTabKey(key) {
    return key === KEYS.LEFT || key === KEYS.RIGHT || key === KEYS.HOME || key === KEYS.END;
  }

  // Reading order: in RTL, Left is next; in LTR, Right is next.
  function tabIndexAfterKey(current, count, key, rtl) {
    const n = Math.max(0, Math.round(Number(count)) || 0);
    if (n <= 0) return 0;
    const i = Math.max(0, Math.min(n - 1, Math.round(Number(current) || 0)));
    if (key === KEYS.HOME) return 0;
    if (key === KEYS.END) return n - 1;
    const next = rtl ? key === KEYS.LEFT : key === KEYS.RIGHT;
    const prev = rtl ? key === KEYS.RIGHT : key === KEYS.LEFT;
    if (next) return (i + 1) % n;
    if (prev) return (i - 1 + n) % n;
    return i;
  }

  function tabsOf(list) {
    if (!list || !list.querySelectorAll) return [];
    return Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
  }

  function syncRovingTabindex(tabs) {
    const all = Array.isArray(tabs) ? tabs : [];
    all.forEach(function (tab) {
      if (!tab || !tab.setAttribute) return;
      const on = tab.getAttribute('aria-selected') === 'true';
      tab.tabIndex = on ? 0 : -1;
    });
    return all;
  }

  function bindTablist(list, opts) {
    if (!list || list.getAttribute('data-mm-tabs') === 'off') return null;
    if (list.getAttribute('data-mm-bound') === '1') return list;
    const options = opts || {};
    list.setAttribute('data-mm-bound', '1');
    if (!list.getAttribute('aria-orientation')) {
      list.setAttribute('aria-orientation', 'horizontal');
    }
    syncRovingTabindex(tabsOf(list));
    list.addEventListener('keydown', function (e) {
      if (!isTabKey(e.key)) return;
      const all = tabsOf(list);
      const i = all.indexOf(e.target);
      if (i < 0) return;
      const next = tabIndexAfterKey(i, all.length, e.key, isRtl(list));
      if (next === i && e.key !== KEYS.HOME && e.key !== KEYS.END) return;
      e.preventDefault();
      const tab = all[next];
      if (!tab) return;
      if (typeof options.onActivate === 'function') options.onActivate(tab, next);
      else if (typeof tab.click === 'function') tab.click();
      if (typeof tab.focus === 'function') tab.focus();
      syncRovingTabindex(tabsOf(list));
    });
    list.addEventListener('click', function () {
      syncRovingTabindex(tabsOf(list));
    });
    return list;
  }

  function bindAllTablists(root) {
    const doc = root || (typeof document !== 'undefined' ? document : null);
    if (!doc || !doc.querySelectorAll) return [];
    const lists = Array.prototype.slice.call(doc.querySelectorAll('[role="tablist"]'));
    return lists.map(function (list) { return bindTablist(list); }).filter(Boolean);
  }

  return {
    isRtl: isRtl,
    isTabKey: isTabKey,
    tabIndexAfterKey: tabIndexAfterKey,
    tabsOf: tabsOf,
    syncRovingTabindex: syncRovingTabindex,
    bindTablist: bindTablist,
    bindAllTablists: bindAllTablists,
  };
});
