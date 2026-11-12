const test = require('node:test');
const assert = require('node:assert/strict');
const tabs = require('../src/lib/tabs');

test('in RTL, ArrowLeft is next and ArrowRight is previous', () => {
  assert.equal(tabs.tabIndexAfterKey(0, 4, 'ArrowLeft', true), 1);
  assert.equal(tabs.tabIndexAfterKey(0, 4, 'ArrowRight', true), 3);
  assert.equal(tabs.tabIndexAfterKey(3, 4, 'ArrowLeft', true), 0);
});

test('in LTR, ArrowRight is next and ArrowLeft is previous', () => {
  assert.equal(tabs.tabIndexAfterKey(0, 4, 'ArrowRight', false), 1);
  assert.equal(tabs.tabIndexAfterKey(0, 4, 'ArrowLeft', false), 3);
  assert.equal(tabs.tabIndexAfterKey(3, 4, 'ArrowRight', false), 0);
});

test('Home and End jump to the ends', () => {
  assert.equal(tabs.tabIndexAfterKey(2, 6, 'Home', true), 0);
  assert.equal(tabs.tabIndexAfterKey(2, 6, 'End', true), 5);
});

test('a single tab stays put', () => {
  assert.equal(tabs.tabIndexAfterKey(0, 1, 'ArrowLeft', true), 0);
  assert.equal(tabs.tabIndexAfterKey(0, 1, 'ArrowRight', true), 0);
});

test('garbage count does not throw', () => {
  assert.equal(tabs.tabIndexAfterKey(0, 0, 'ArrowLeft', true), 0);
  assert.equal(tabs.tabIndexAfterKey('x', 'nope', 'Home', false), 0);
});

test('syncRovingTabindex leaves only the selected tab in the tab order', () => {
  const nodes = [
    { getAttribute: () => 'false', tabIndex: 0, setAttribute() {} },
    { getAttribute: () => 'true', tabIndex: 0, setAttribute() {} },
    { getAttribute: () => 'false', tabIndex: 0, setAttribute() {} },
  ];
  tabs.syncRovingTabindex(nodes);
  assert.equal(nodes[0].tabIndex, -1);
  assert.equal(nodes[1].tabIndex, 0);
  assert.equal(nodes[2].tabIndex, -1);
});

test('isTabKey only accepts the four APG keys', () => {
  assert.equal(tabs.isTabKey('ArrowLeft'), true);
  assert.equal(tabs.isTabKey('Home'), true);
  assert.equal(tabs.isTabKey(' '), false);
  assert.equal(tabs.isTabKey('Enter'), false);
});

test('syncRovingTabindex handles no tabs', () => {
  const nodes = [];
  tabs.syncRovingTabindex(nodes);
  nodes.forEach((node) => {
    assert.equal(node.tabIndex, -1);
  });
});

test('syncRovingTabindex handles first tab selected', () => {
  const nodes = [
    { getAttribute: () => 'true', tabIndex: 0, setAttribute() {} },
    { getAttribute: () => 'false', tabIndex: 0, setAttribute() {} },
  ];
  tabs.syncRovingTabindex(nodes);
  assert.equal(nodes[0].tabIndex, 0);
  assert.equal(nodes[1].tabIndex, -1);
});

test('syncRovingTabindex handles last tab selected', () => {
  const nodes = [
    { getAttribute: () => 'false', tabIndex: 0, setAttribute() {} },
    { getAttribute: () => 'true', tabIndex: 0, setAttribute() {} },
  ];
  tabs.syncRovingTabindex(nodes);
  assert.equal(nodes[0].tabIndex, -1);
  assert.equal(nodes[1].tabIndex, 0);
});

function createMockTab(opts = {}) {
  const attrs = new Map(Object.entries(opts.attrs || {}));
  const tab = {
    tabIndex: opts.tabIndex !== undefined ? opts.tabIndex : -1,
    clicks: 0,
    focuses: 0,
    getAttribute(k) { return attrs.has(k) ? attrs.get(k) : null; },
    setAttribute(k, v) { attrs.set(k, String(v)); },
    removeAttribute(k) { attrs.delete(k); },
    click() { tab.clicks++; },
    focus() { tab.focuses++; },
    closest(selector) {
      if (selector === '[role="tab"]') return tab;
      return null;
    },
  };
  return tab;
}

function createMockTablist(opts = {}) {
  const attrs = new Map(Object.entries(opts.attrs || {}));
  const listeners = {};
  const tabsList = opts.tabs || [];
  const list = {
    getAttribute(k) { return attrs.has(k) ? attrs.get(k) : null; },
    setAttribute(k, v) { attrs.set(k, String(v)); },
    removeAttribute(k) { attrs.delete(k); },
    querySelectorAll(selector) {
      if (selector === '[role="tab"]') return tabsList;
      return [];
    },
    addEventListener(event, fn) {
      listeners[event] = listeners[event] || [];
      listeners[event].push(fn);
    },
    closest(selector) {
      if (selector === '[dir]' && attrs.has('dir')) return list;
      return null;
    },
    _listeners: listeners,
    dispatch(event, e) {
      const fns = listeners[event] || [];
      fns.forEach((fn) => {
        fn(e);
      });
    },
  };
  return list;
}

function createKeyEvent(key, target) {
  return {
    key,
    target,
    defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; },
  };
}

function setupTablist(count = 3, options = {}) {
  const tabNodes = [];
  for (let i = 0; i < count; i++) {
    const isSelected = i === (options.selected !== undefined ? options.selected : 0);
    const tab = createMockTab({
      attrs: {
        role: 'tab',
        'aria-selected': isSelected ? 'true' : 'false',
      },
      tabIndex: isSelected ? 0 : -1,
    });
    tab.click = () => {
      tab.clicks++;
      tabNodes.forEach((t) => {
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
    };
    tabNodes.push(tab);
  }
  const list = createMockTablist({
    attrs: options.listAttrs || {},
    tabs: tabNodes,
  });
  return { list, tabs: tabNodes };
}

test('bindTablist ArrowLeft and ArrowRight in RTL move to adjacent tabs with wrap-around', () => {
  const { list, tabs: t } = setupTablist(3, { listAttrs: { dir: 'rtl' } });
  tabs.bindTablist(list);

  // In RTL, ArrowLeft moves to next (0 -> 1)
  const e1 = createKeyEvent('ArrowLeft', t[0]);
  list.dispatch('keydown', e1);
  assert.equal(e1.defaultPrevented, true);
  assert.equal(t[1].clicks, 1);
  assert.equal(t[1].focuses, 1);
  assert.equal(t[1].tabIndex, 0);
  assert.equal(t[0].tabIndex, -1);

  // Next again (1 -> 2)
  const e2 = createKeyEvent('ArrowLeft', t[1]);
  list.dispatch('keydown', e2);
  assert.equal(e2.defaultPrevented, true);
  assert.equal(t[2].clicks, 1);
  assert.equal(t[2].focuses, 1);

  // Wrap-around: next from 2 -> 0
  const e3 = createKeyEvent('ArrowLeft', t[2]);
  list.dispatch('keydown', e3);
  assert.equal(e3.defaultPrevented, true);
  assert.equal(t[0].clicks, 1);
  assert.equal(t[0].focuses, 1);

  // In RTL, ArrowRight moves to previous: from 0 wraps to 2
  const e4 = createKeyEvent('ArrowRight', t[0]);
  list.dispatch('keydown', e4);
  assert.equal(e4.defaultPrevented, true);
  assert.equal(t[2].clicks, 2);
  assert.equal(t[2].focuses, 2);

  // Previous from 2 -> 1
  const e5 = createKeyEvent('ArrowRight', t[2]);
  list.dispatch('keydown', e5);
  assert.equal(e5.defaultPrevented, true);
  assert.equal(t[1].clicks, 2);
  assert.equal(t[1].focuses, 2);
});

test('bindTablist ArrowLeft and ArrowRight in LTR move to adjacent tabs with wrap-around', () => {
  const { list, tabs: t } = setupTablist(3, { listAttrs: { dir: 'ltr' } });
  tabs.bindTablist(list);

  // In LTR, ArrowRight moves to next (0 -> 1)
  const e1 = createKeyEvent('ArrowRight', t[0]);
  list.dispatch('keydown', e1);
  assert.equal(e1.defaultPrevented, true);
  assert.equal(t[1].clicks, 1);
  assert.equal(t[1].focuses, 1);

  // Next from 2 wraps around to 0
  const e2 = createKeyEvent('ArrowRight', t[2]);
  list.dispatch('keydown', e2);
  assert.equal(e2.defaultPrevented, true);
  assert.equal(t[0].clicks, 1);
  assert.equal(t[0].focuses, 1);

  // In LTR, ArrowLeft moves to previous: from 0 wraps to 2
  const e3 = createKeyEvent('ArrowLeft', t[0]);
  list.dispatch('keydown', e3);
  assert.equal(e3.defaultPrevented, true);
  assert.equal(t[2].clicks, 1);
  assert.equal(t[2].focuses, 1);

  // From 2 moves to 1
  const e4 = createKeyEvent('ArrowLeft', t[2]);
  list.dispatch('keydown', e4);
  assert.equal(e4.defaultPrevented, true);
  assert.equal(t[1].clicks, 2);
  assert.equal(t[1].focuses, 2);
});

test('bindTablist Home key jumps to first tab and End key jumps to last tab', () => {
  const { list, tabs: t } = setupTablist(4, { selected: 2 });
  tabs.bindTablist(list);

  // Home from tab 2 jumps to tab 0
  const eHome = createKeyEvent('Home', t[2]);
  list.dispatch('keydown', eHome);
  assert.equal(eHome.defaultPrevented, true);
  assert.equal(t[0].clicks, 1);
  assert.equal(t[0].focuses, 1);

  // End from tab 0 jumps to tab 3
  const eEnd = createKeyEvent('End', t[0]);
  list.dispatch('keydown', eEnd);
  assert.equal(eEnd.defaultPrevented, true);
  assert.equal(t[3].clicks, 1);
  assert.equal(t[3].focuses, 1);

  // Home when already on tab 0 still preventsDefault and activates
  const eHomeAgain = createKeyEvent('Home', t[0]);
  list.dispatch('keydown', eHomeAgain);
  assert.equal(eHomeAgain.defaultPrevented, true);
  assert.equal(t[0].clicks, 2);

  // End when already on last tab still preventsDefault and activates
  const eEndAgain = createKeyEvent('End', t[3]);
  list.dispatch('keydown', eEndAgain);
  assert.equal(eEndAgain.defaultPrevented, true);
  assert.equal(t[3].clicks, 2);
});

test('bindTablist ignores non-navigation keys without calling preventDefault', () => {
  const { list, tabs: t } = setupTablist(3);
  tabs.bindTablist(list);

  const ignoredKeys = ['Enter', 'Tab', ' ', 'Space', 'ArrowUp', 'ArrowDown', 'Escape', 'KeyA'];
  for (const key of ignoredKeys) {
    const e = createKeyEvent(key, t[0]);
    list.dispatch('keydown', e);
    assert.equal(e.defaultPrevented, false, `key ${key} should not preventDefault`);
  }

  assert.equal(t[0].clicks, 0);
  assert.equal(t[1].clicks, 0);
  assert.equal(t[2].clicks, 0);
  assert.equal(t[0].focuses, 0);
  assert.equal(t[1].focuses, 0);
  assert.equal(t[2].focuses, 0);
});

test('bindTablist supports event bubbling from child elements nested within role="tab"', () => {
  const { list, tabs: t } = setupTablist(3);
  tabs.bindTablist(list);

  const nestedIcon = {
    closest(selector) {
      if (selector === '[role="tab"]') return t[0];
      return null;
    },
  };

  const e = createKeyEvent('ArrowLeft', nestedIcon);
  list.dispatch('keydown', e);

  assert.equal(e.defaultPrevented, true);
  assert.equal(t[1].clicks, 1);
  assert.equal(t[1].focuses, 1);
});

test('bindTablist calls custom options.onActivate callback when provided', () => {
  const { list, tabs: t } = setupTablist(3);
  let activatedTab = null;
  let activatedIndex = null;

  tabs.bindTablist(list, {
    onActivate(tab, idx) {
      activatedTab = tab;
      activatedIndex = idx;
    },
  });

  const e = createKeyEvent('ArrowLeft', t[0]);
  list.dispatch('keydown', e);

  assert.equal(e.defaultPrevented, true);
  assert.equal(activatedTab, t[1]);
  assert.equal(activatedIndex, 1);
  assert.equal(t[1].clicks, 0, 'custom onActivate bypasses tab.click()');
  assert.equal(t[1].focuses, 1, 'tab.focus() is still invoked');
});

test('bindTablist sets aria-orientation="horizontal" if absent and respects guards', () => {
  // Sets aria-orientation and data-mm-bound
  const { list: l1 } = setupTablist(2);
  const bound1 = tabs.bindTablist(l1);
  assert.equal(bound1, l1);
  assert.equal(l1.getAttribute('aria-orientation'), 'horizontal');
  assert.equal(l1.getAttribute('data-mm-bound'), '1');

  // Respects pre-existing aria-orientation
  const { list: l2 } = setupTablist(2, { listAttrs: { 'aria-orientation': 'vertical' } });
  tabs.bindTablist(l2);
  assert.equal(l2.getAttribute('aria-orientation'), 'vertical');

  // data-mm-tabs="off" guard: returns null and does not bind
  const { list: lOff } = setupTablist(2, { listAttrs: { 'data-mm-tabs': 'off' } });
  const boundOff = tabs.bindTablist(lOff);
  assert.equal(boundOff, null);
  assert.equal(lOff.getAttribute('data-mm-bound'), null);
  assert.equal(lOff._listeners.keydown, undefined);

  // data-mm-bound="1" guard: returns list without re-binding
  const { list: lBound } = setupTablist(2, { listAttrs: { 'data-mm-bound': '1' } });
  const boundAgain = tabs.bindTablist(lBound);
  assert.equal(boundAgain, lBound);
  assert.equal(lBound._listeners.keydown, undefined);
});

test('bindAllTablists queries and binds all tablists in root/document', () => {
  const { list: l1 } = setupTablist(2);
  const { list: l2 } = setupTablist(2, { listAttrs: { 'data-mm-tabs': 'off' } });
  const { list: l3 } = setupTablist(2);

  const mockRoot = {
    querySelectorAll(sel) {
      if (sel === '[role="tablist"]') return [l1, l2, l3];
      return [];
    },
  };

  const bound = tabs.bindAllTablists(mockRoot);
  assert.deepEqual(bound, [l1, l3]);
  assert.equal(l1.getAttribute('data-mm-bound'), '1');
  assert.equal(l2.getAttribute('data-mm-bound'), null);
  assert.equal(l3.getAttribute('data-mm-bound'), '1');

  // Fallbacks for null or invalid root
  assert.deepEqual(tabs.bindAllTablists(null), []);
  assert.deepEqual(tabs.bindAllTablists({}), []);
});

test('isRtl document.documentElement inspection is robust against incomplete or null document mocks', () => {
  const prevDoc = global.document;
  try {
    // 1. el with explicit dir returns correct boolean
    const ltrEl = { getAttribute: (k) => (k === 'dir' ? 'ltr' : null) };
    const rtlEl = { getAttribute: (k) => (k === 'dir' ? 'rtl' : null) };
    assert.equal(tabs.isRtl(ltrEl), false);
    assert.equal(tabs.isRtl(rtlEl), true);

    // 2. document is undefined / deleted
    delete global.document;
    const neutralEl = { getAttribute: () => null };
    assert.equal(tabs.isRtl(neutralEl), true, 'defaults to rtl when document is absent');

    // 3. document is an empty object (no documentElement)
    global.document = {};
    assert.equal(tabs.isRtl(neutralEl), true);

    // 4. document.documentElement is null
    global.document = { documentElement: null };
    assert.equal(tabs.isRtl(neutralEl), true);

    // 5. document.documentElement lacks getAttribute method
    global.document = { documentElement: {} };
    assert.equal(tabs.isRtl(neutralEl), true);

    // 6. document.documentElement with getAttribute returning 'ltr'
    global.document = {
      documentElement: {
        getAttribute: (k) => (k === 'dir' ? 'ltr' : null),
      },
    };
    assert.equal(tabs.isRtl(neutralEl), false);

    // 7. document.documentElement with getAttribute returning 'rtl'
    global.document = {
      documentElement: {
        getAttribute: (k) => (k === 'dir' ? 'rtl' : null),
      },
    };
    assert.equal(tabs.isRtl(neutralEl), true);
  } finally {
    if (prevDoc !== undefined) global.document = prevDoc;
    else delete global.document;
  }
});

test('Home key updates aria-selected and tabindex on the first tab', () => {
  const { list, tabs: t } = setupTablist(4, { selected: 2 });
  tabs.bindTablist(list);
  const e = createKeyEvent('Home', t[2]);
  list.dispatch('keydown', e);
  assert.equal(e.defaultPrevented, true);
  assert.equal(t[0].getAttribute('aria-selected'), 'true');
  assert.equal(t[0].tabIndex, 0);
  assert.equal(t[2].getAttribute('aria-selected'), 'false');
  assert.equal(t[2].tabIndex, -1);
});

test('End key updates aria-selected and tabindex on the last tab', () => {
  const { list, tabs: t } = setupTablist(4, { selected: 0 });
  tabs.bindTablist(list);
  const e = createKeyEvent('End', t[0]);
  list.dispatch('keydown', e);
  assert.equal(e.defaultPrevented, true);
  assert.equal(t[3].getAttribute('aria-selected'), 'true');
  assert.equal(t[3].tabIndex, 0);
  assert.equal(t[0].getAttribute('aria-selected'), 'false');
  assert.equal(t[0].tabIndex, -1);
});

test('arrow key navigation correctly updates aria-selected across active elements', () => {
  const { list, tabs: t } = setupTablist(3, { listAttrs: { dir: 'ltr' } });
  tabs.bindTablist(list);
  const e = createKeyEvent('ArrowRight', t[0]);
  list.dispatch('keydown', e);
  assert.equal(t[0].getAttribute('aria-selected'), 'false');
  assert.equal(t[1].getAttribute('aria-selected'), 'true');
  assert.equal(t[1].tabIndex, 0);
});
