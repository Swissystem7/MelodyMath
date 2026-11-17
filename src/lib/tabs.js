// MelodyMath — keyboard tablists (ARIA APG, RTL-aware).
//
// Special-ed tablets are often used with a keyboard or switch. A role=tablist
// that only responds to clicks is not usable. These helpers are the tested
// reading-order rules; pages still own what a click does.
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const KEYS = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
  };

  function isRtl(el) {
    if (!el) return false;
    const node = el.closest ? (el.closest('[dir]') || el) : el;
    const dir = (node.getAttribute?.('dir'))
      || (typeof document !== 'undefined' && document.documentElement && typeof document.documentElement.getAttribute === 'function' ? document.documentElement.getAttribute('dir') : null)
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

  function getNextTabId(tabIds, currentId, key, rtl) {
    if (!Array.isArray(tabIds) || tabIds.length === 0) return null;
    const count = tabIds.length;
    let idx = tabIds.indexOf(currentId);
    if (idx < 0) {
      if (key === KEYS.END) return tabIds[count - 1];
      if (key === KEYS.HOME) return tabIds[0];
      idx = 0;
    }
    const isRtlMode = typeof rtl === 'boolean'
      ? rtl
      : (rtl === 'rtl' || Boolean(rtl?.rtl));
    const nextIdx = tabIndexAfterKey(idx, count, key, isRtlMode);
    return tabIds[nextIdx];
  }

  function tabsOf(list) {
    if (!list?.querySelectorAll) return [];
    return Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
  }

  function syncRovingTabindex(tabs) {
    const all = Array.isArray(tabs) ? tabs : [];
    all.forEach((tab) => {
      if (!tab?.setAttribute) return;
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
    list.addEventListener('keydown', (e) => {
      if (!isTabKey(e.key)) return;
      const all = tabsOf(list);
      const targetTab = (e.target?.closest) ? (e.target.closest('[role="tab"]') || e.target) : e.target;
      const i = all.indexOf(targetTab);
      if (i < 0) return;
      const next = tabIndexAfterKey(i, all.length, e.key, isRtl(list));
      if (next === i && e.key !== KEYS.HOME && e.key !== KEYS.END) return;
      e.preventDefault();
      const tab = all[next];
      if (!tab) return;
      updateAriaSelected(list, next);
      syncRovingTabindex(tabsOf(list));
      if (typeof options.onActivate === 'function') options.onActivate(tab, next);
      else if (typeof tab.click === 'function') tab.click();
      if (typeof tab.focus === 'function') tab.focus();
      updateAriaSelected(list, next);
      syncRovingTabindex(tabsOf(list));
    });
    list.addEventListener('click', () => {
      syncRovingTabindex(tabsOf(list));
    });
    return list;
  }
  function updateAriaSelected(list, activeIndex) {
    const all = tabsOf(list);
    all.forEach((tab, idx) => {
      const selected = idx === activeIndex ? 'true' : 'false';
      if (tab.getAttribute('aria-selected') !== selected) {
        tab.setAttribute('aria-selected', selected);
      }
    });
  }

  function bindAllTablists(root) {
    const doc = root || (typeof document !== 'undefined' ? document : null);
    if (!doc?.querySelectorAll) return [];
    const lists = Array.prototype.slice.call(doc.querySelectorAll('[role="tablist"]'));
    return lists.map((list) => bindTablist(list)).filter(Boolean);
  }

  function selectTab(listOrDoc, target) {
    const doc = (listOrDoc?.querySelectorAll)
      ? listOrDoc
      : (typeof document !== 'undefined' ? document : null);
    if (!doc?.querySelectorAll) return null;
    const allTabs = Array.prototype.slice.call(doc.querySelectorAll('[role="tab"]'));
    if (!allTabs.length) return null;
    let targetTab = null;
    if (typeof target === 'string') {
      targetTab = (doc.getElementById?.(target))
        || allTabs.find((t) => (t.getAttribute?.('data-tab') === target || t.getAttribute?.('aria-controls') === target || t.id === target));
    } else if (target && typeof target === 'object') {
      targetTab = target;
    }
    if (!targetTab) return null;
    allTabs.forEach((tab) => {
      const on = tab === targetTab;
      if (tab.setAttribute) tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      if (tab.classList) tab.classList.toggle('active', on);
    });
    const panelId = (targetTab.getAttribute?.('aria-controls') || targetTab.getAttribute?.('data-tab')) || null;
    if (panelId && doc.querySelectorAll) {
      const panels = Array.prototype.slice.call(doc.querySelectorAll('.panel, [role="tabpanel"]'));
      panels.forEach((p) => {
        const on = p.id === panelId;
        p.hidden = !on;
        if (p.setAttribute) p.setAttribute('aria-hidden', on ? 'false' : 'true');
        if (p.classList) p.classList.toggle('active', on);
      });
    }
    return targetTab;
  }

  function navigateSessionEnd(action, opts) {
    const o = opts || {};
    if (action === 'session-done') {
      if (typeof o.onDone === 'function') {
        o.onDone();
      } else if (typeof document !== 'undefined') {
        const homeTabId = o.homeTabId || 'tab-remediation';
        const homeTab = (doc => doc?.getElementById?.(homeTabId) || doc?.querySelector?.('.tabs [role="tab"]'))(document);
        if (homeTab) {
          if (typeof homeTab.click === 'function') homeTab.click();
          else selectTab(document, homeTab);
        }
      }
      return 'done';
    }
    if (action === 'session-again') {
      if (typeof o.onAgain === 'function') {
        o.onAgain();
      }
      return 'again';
    }
    return null;
  }

  function bindActionRow(row) {
    if (!row?.addEventListener) return null;
    if (row.getAttribute?.('data-mm-actions-bound') === '1') return row;
    if (row.setAttribute) row.setAttribute('data-mm-actions-bound', '1');
    row.addEventListener('keydown', (e) => {
      if (e.key !== KEYS.LEFT && e.key !== KEYS.RIGHT && e.key !== KEYS.HOME && e.key !== KEYS.END) return;
      const btns = Array.prototype.slice.call(row.querySelectorAll('button:not([disabled])'));
      if (btns.length <= 1) return;
      const curIdx = btns.indexOf(e.target);
      if (curIdx < 0) return;
      e.preventDefault();
      const rtlMode = isRtl(row);
      const nextIdx = tabIndexAfterKey(curIdx, btns.length, e.key, rtlMode);
      if (btns[nextIdx] && typeof btns[nextIdx].focus === 'function') {
        btns[nextIdx].focus();
      }
    });
    return row;
  }

  return {
    isRtl: isRtl,
    isTabKey: isTabKey,
    tabIndexAfterKey: tabIndexAfterKey,
    tabsOf: tabsOf,
    syncRovingTabindex: syncRovingTabindex,
    bindTablist: bindTablist,
    bindAllTablists: bindAllTablists,
    getNextTabId: getNextTabId,
    nextTabId: getNextTabId,
    tabIdAfterKey: getNextTabId,
    navigateTabs: getNextTabId,
    selectTab: selectTab,
    navigateSessionEnd: navigateSessionEnd,
    bindActionRow: bindActionRow,
  };
});
