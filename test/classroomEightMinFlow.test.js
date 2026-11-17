const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const store = require('../src/lib/teacherStore');
const tabs = require('../src/lib/tabs');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function mockMemoryStorage() {
  const map = Object.create(null);
  return {
    getItem: (k) => (k in map ? map[k] : null),
    setItem: (k, v) => { map[k] = String(v); },
    removeItem: (k) => { delete map[k]; },
    clear: () => { Object.keys(map).forEach((k) => { delete map[k]; }); },
  };
}

test('1. anonymous class code validation: enforces exactly 5 characters and safe format', () => {
  assert.equal(store.isValidClassCode('K7M3Q'), true);
  assert.equal(store.isValidClassCode('k7m3q'), true);
  assert.equal(store.isValidClassCode('A2B3C'), true);
  assert.equal(store.isValidClassCode('כיתה1'), true);

  // Rejects invalid lengths or empty
  assert.equal(store.isValidClassCode(''), false);
  assert.equal(store.isValidClassCode(null), false);
  assert.equal(store.isValidClassCode(undefined), false);
  assert.equal(store.isValidClassCode('K7M3'), false, 'too short');
  assert.equal(store.isValidClassCode('K7M3QX'), false, 'too long');

  // Formatting and normalization
  assert.equal(store.formatClassCode(' k7m3q '), 'K7M3Q');
  assert.equal(store.cleanClassCode('k7m0o1i'), 'K7M');
});

test('2. anonymous student nickname/number validation: rejects real personal names, emails and phone numbers', () => {
  // Valid nicknames / student numbers
  assert.equal(store.isAnonymousName('נמר3'), true);
  assert.equal(store.isAnonymousName('כוכב'), true);
  assert.equal(store.isAnonymousName('שמש'), true);
  assert.equal(store.isAnonymousName('דולפין1'), true);
  assert.equal(store.isAnonymousName('#5'), true);
  assert.equal(store.isAnonymousName(12), true);
  assert.equal(store.isAnonymousName('ילד/ה 1'), true);

  // Rejected real names, emails, phone numbers, invalid inputs
  assert.equal(store.isAnonymousName('יוסי כהן'), false, 'real full name rejected');
  assert.equal(store.isAnonymousName('ישראל ישראלי'), false, 'real full name rejected');
  assert.equal(store.isAnonymousName('student@school.edu'), false, 'email rejected');
  assert.equal(store.isAnonymousName('052-1234567'), false, 'phone number rejected');
  assert.equal(store.isAnonymousName('1234567'), false, 'long digits sequence rejected');
  assert.equal(store.isAnonymousName(''), false);
  assert.equal(store.isAnonymousName(null), false);
  assert.equal(store.isAnonymousName(undefined), false);
});

test('3. validateAnonymousLogin verifies 5-char code and nickname with informative Hebrew feedback', () => {
  const good = store.validateAnonymousLogin('K7M3Q', 'כוכב3');
  assert.equal(good.ok, true);
  assert.equal(good.classCode, 'K7M3Q');
  assert.equal(good.name, 'כוכב3');

  const badCode = store.validateAnonymousLogin('K7M', 'כוכב3');
  assert.equal(badCode.ok, false);
  assert.equal(badCode.reason, 'code_invalid');
  assert.match(badCode.message, /5 תווים/);

  const badName = store.validateAnonymousLogin('K7M3Q', 'יוסי כהן');
  assert.equal(badName.ok, false);
  assert.equal(badName.reason, 'name_invalid');
  assert.match(badName.message, /ללא שמות אמיתיים/);

  const badBoth = store.validateAnonymousLogin('', '');
  assert.equal(badBoth.ok, false);
  assert.equal(badBoth.reason, 'code_and_name_invalid');
  assert.equal(store.isAnonymousLogin('K7M3Q', 'כוכב3'), true);
  assert.equal(store.isAnonymousLogin('bad', 'bad'), false);
});

test('4. calm session tracking: 8-minute target duration with calm background progress', () => {
  const ls = mockMemoryStorage();
  const session = store.startCalmSession('K7M3Q', 'כוכב3', { clockVisible: false }, ls);
  assert.ok(session);
  assert.equal(session.kind, 'class');
  assert.equal(session.calm, true);
  assert.equal(session.targetDuration, 8 * 60 * 1000);
  assert.equal(session.clockVisible, false);

  // Check progress mid-session (e.g. at 4 minutes)
  const now = session.started + 4 * 60 * 1000;
  const mid = store.checkCalmSession(session, now);
  assert.equal(mid.complete, false);
  assert.equal(mid.calm, true);
  assert.equal(mid.elapsedMs, 240000);
  assert.equal(mid.remainingMs, 240000);

  // Check progress at 8 minutes (completed)
  const endNow = session.started + 8 * 60 * 1000;
  const finish = store.checkCalmSession(session, endNow);
  assert.equal(finish.complete, true);
  assert.equal(finish.remainingMs, 0);
});

test('5. AG11 end screen: empowering copy, two equal 48px buttons, zero grades or deterrent failure words', () => {
  const summary = store.buildAG11Summary({ items: [1, 2, 3] }, { topicName: 'שברים' });
  assert.equal(summary.screen, 'AG11');
  assert.equal(summary.title, 'עבדת יפה היום.');
  assert.equal(summary.subtitle, 'אפשר לסיים, ואפשר עוד סבב.');
  assert.equal(summary.doneLabel, 'סיימתי להיום');
  assert.equal(summary.againLabel, 'עוד סבב');
  assert.equal(summary.topicText, 'היום תרגלנו: שברים ♫');

  const html = store.renderAG11SessionEnd({ topicName: 'חיבור עד 20' });
  assert.match(html, /data-screen="AG11"/);
  assert.match(html, /עבדת יפה היום\./);
  assert.match(html, /אפשר לסיים, ואפשר עוד סבב\./);
  assert.match(html, /data-act="session-done"[^>]*style="[^"]*min-height:48px/);
  assert.match(html, /data-act="session-again"[^>]*style="[^"]*min-height:48px/);
  assert.match(html, /סיימתי להיום/);
  assert.match(html, /עוד סבב/);

  // No failure or deterrent words
  store.AG11_FORBIDDEN.forEach((bad) => {
    assert.equal(html.includes(bad), false, `contains forbidden word ${bad}`);
  });
  // No percent score
  assert.equal(/\d+\s*%/.test(html), false, 'contains percentage score');
});

test('6. tabs.js selectTab and navigateSessionEnd provide complete accessible tab routing', () => {
  const tabsMap = {};
  const panelsMap = {};
  function makeTab(id, controls) {
    const attrs = new Map([['aria-selected', 'false'], ['aria-controls', controls], ['data-tab', controls]]);
    const t = {
      id,
      tabIndex: -1,
      getAttribute: (k) => attrs.get(k) || null,
      setAttribute: (k, v) => attrs.set(k, String(v)),
      classList: { toggle() {} },
      click() { t.clicked = true; },
    };
    tabsMap[id] = t;
    return t;
  }
  function makePanel(id) {
    const p = {
      id,
      hidden: true,
      setAttribute() {},
      classList: { toggle() {} },
    };
    panelsMap[id] = p;
    return p;
  }

  const t1 = makeTab('tab-remediation', 'remediation');
  const t2 = makeTab('tab-classMode', 'classMode');
  const p1 = makePanel('remediation');
  const p2 = makePanel('classMode');

  const mockDoc = {
    getElementById: (id) => tabsMap[id] || panelsMap[id] || null,
    querySelectorAll: (sel) => {
      if (sel.includes('[role="tab"]')) return [t1, t2];
      if (sel.includes('panel')) return [p1, p2];
      return [];
    },
  };

  // selectTab activates target and updates roving tabindex
  const activated = tabs.selectTab(mockDoc, 'tab-classMode');
  assert.equal(activated, t2);
  assert.equal(t2.getAttribute('aria-selected'), 'true');
  assert.equal(t2.tabIndex, 0);
  assert.equal(t1.getAttribute('aria-selected'), 'false');
  assert.equal(t1.tabIndex, -1);
  assert.equal(p2.hidden, false);
  assert.equal(p1.hidden, true);

  // navigateSessionEnd handles 'session-done' and 'session-again'
  let againCalled = false;
  let doneCalled = false;
  const resAgain = tabs.navigateSessionEnd('session-again', { onAgain: () => { againCalled = true; } });
  assert.equal(resAgain, 'again');
  assert.equal(againCalled, true);

  const resDone = tabs.navigateSessionEnd('session-done', { onDone: () => { doneCalled = true; } });
  assert.equal(resDone, 'done');
  assert.equal(doneCalled, true);
});

test('7. bindActionRow enables APG RTL arrow-key keyboard navigation across AG11 action buttons', () => {
  const listeners = {};
  const b1 = { tabIndex: 0, focus() { b1.focused = true; }, getAttribute: () => null };
  const b2 = { tabIndex: 0, focus() { b2.focused = true; }, getAttribute: () => null };
  const row = {
    getAttribute: () => null,
    setAttribute() {},
    querySelectorAll: () => [b1, b2],
    addEventListener: (ev, fn) => { listeners[ev] = fn; },
    closest: () => ({ getAttribute: () => 'rtl' }),
  };

  tabs.bindActionRow(row);
  assert.ok(listeners.keydown, 'keydown listener attached');

  // In RTL, ArrowLeft moves to next button (b2)
  b1.focused = false;
  b2.focused = false;
  listeners.keydown({
    key: 'ArrowLeft',
    target: b1,
    preventDefault() {},
  });
  assert.equal(b2.focused, true);

  // ArrowRight moves back to previous button (b1)
  b1.focused = false;
  b2.focused = false;
  listeners.keydown({
    key: 'ArrowRight',
    target: b2,
    preventDefault() {},
  });
  assert.equal(b1.focused, true);
});

test('8. index.html markup contains anonymous login fields, calm 8-min flow, and AG11 screen', () => {
  // Anonymous login controls in classGate
  assert.match(indexHtml, /id="classGateCode"[^>]*maxlength="5"/);
  assert.match(indexHtml, /id="classGateNick"/);
  assert.match(indexHtml, /id="classAnonSave"/);
  assert.match(indexHtml, /כניסה אנונימית למפגש כיתתי \(8 דקות\)/);

  // Calm session 8-minute duration and clock option
  assert.match(indexHtml, /id="classClockShow"/);
  assert.match(indexHtml, /בלי סימון: אין שעון על המסך, והמפגש נגמר אחרי 8 דקות/);

  // AG11 end screen semantics
  assert.match(indexHtml, /id="classDone"[^>]*data-screen="AG11"/);
  assert.match(indexHtml, /data-testid="view-session-end"/);
  assert.match(indexHtml, /data-testid="session-end-title"[^>]*>עבדת יפה היום\./);
  assert.match(indexHtml, /data-testid="session-end-subtitle"[^>]*>אפשר לסיים, ואפשר עוד סבב\./);

  // Equal action buttons
  assert.match(indexHtml, /id="classSessionDone"[^>]*data-act="session-done"[^>]*>סיימתי להיום<\/button>/);
  assert.match(indexHtml, /id="classAgain"[^>]*data-act="session-again"[^>]*>עוד סבב<\/button>/);
  assert.match(indexHtml, /#classSessionDone.*style="[^"]*min-height:48px|style="[^"]*min-height:48px;flex:1/);
});

test('9. end-to-end classroom 8-min flow: anonymous login, calm run, AG11 display, and tabs navigation', () => {
  const elements = {
    classGateCode: { value: 'K7M3Q' },
    classGateNick: { value: 'כוכב3' },
    classCode: { value: '' },
    studentName: { value: '' },
    whoStatus: { textContent: '' },
    classGateMsg: { textContent: '', classList: { remove() {}, add() {} } },
    classTimer: { textContent: '' },
    classEndTopic: { textContent: '' },
    classDoneStats: { innerHTML: '' },
    classAgain: { focus() { this.focused = true; } },
    'tab-remediation': { clicked: false, click() { this.clicked = true; } },
  };

  const sandbox = {
    $: (id) => elements[id] || null,
    who: { classCode: '', name: '' },
    openSess: null,
    classEndsAt: 0,
    classTimerId: null,
    clearInterval: () => {},
    setInterval: () => 1,
    preferLessMotion: () => true,
    classTick: () => {},
    CLASS_MS: 480000,
    classSeed: 1,
    classHist: [],
    showClassCard(id) { sandbox.currentCard = id; },
    show() {},
    upsertStudent: (_c, n) => ({ name: n }),
    saveWho: (w) => { sandbox.savedWho = w; },
    applyWhoToForm: () => {},
    renderClassKids: () => {},
    validateAnonymousLogin: store.validateAnonymousLogin,
    formatClassCode: store.formatClassCode,
    sanitizeNickname: store.sanitizeNickname,
    isValidClassCode: store.isValidClassCode,
    startCalmSession: (c, n, opts) => store.startCalmSession(c, n, opts, mockMemoryStorage()),
    checkCalmSession: store.checkCalmSession,
    endTeacherSession: () => ({ kind: 'class', items: [{ correct: true }, { correct: true }] }),
    classClockVisible: () => false,
    classClockText: () => '',
    nextClassQuestion: () => {},
    document: { body: { classList: { add() {}, remove() {} } }, querySelector: () => elements['tab-remediation'] },
    navigateSessionEnd: tabs.navigateSessionEnd,
    activateHomeTab: (tab) => { tab.clicked = true; },
  };

  vm.createContext(sandbox);

  // Extract functions from index.html
  const saveAnonSrc = indexHtml.match(/function saveClassAnonEntry\(\)\{[\s\S]*?\n(?=if\(\$\('classAnonSave'\)\))/)[0];
  const startSessionSrc = indexHtml.match(/function startClassSession\(\)\{[\s\S]*?\n(?=function endClassSession)/)[0];
  const endSessionSrc = indexHtml.match(/function endClassSession\(\)\{[^\n]*/)[0];

  vm.runInContext(`${saveAnonSrc}\n${startSessionSrc}\n${endSessionSrc}`, sandbox);

  // Step 1: Anonymous entry
  const saved = sandbox.saveClassAnonEntry();
  assert.equal(saved, true);
  assert.equal(sandbox.who.classCode, 'K7M3Q');
  assert.equal(sandbox.who.name, 'כוכב3');

  // Step 2: Start 8-minute calm session
  sandbox.startClassSession();
  assert.equal(sandbox.currentCard, 'classPlay');
  assert.ok(sandbox.openSess);
  assert.equal(sandbox.openSess.calm, true);
  assert.equal(sandbox.openSess.clockVisible, false);

  // Step 3: End session and transition to AG11 empowering screen
  sandbox.endClassSession();
  assert.equal(sandbox.currentCard, 'classDone');
  assert.match(elements.classEndTopic.textContent, /היום תרגלנו:/);

  // Step 4: Click 'סיימתי להיום' routes back to home tab
  tabs.navigateSessionEnd('session-done', {
    onDone: () => { sandbox.activateHomeTab(elements['tab-remediation']); },
  });
  assert.equal(elements['tab-remediation'].clicked, true);
});

test('10. single-word nickname with symbols or punctuation outside allowed pattern returns false', () => {
  // Triggers lines 939-940 in teacherStore.js
  assert.equal(store.isAnonymousName('כוכב$1'), false);
  assert.equal(store.isAnonymousName('חתול_2'), false);
  assert.equal(store.isAnonymousName('!invalid'), false);
});

test('11. tabs.js selectTab accepts an element object directly as targetTab', () => {
  // Triggers lines 138-139 in tabs.js
  const tabsList = [];
  const tabA = { id: 'tabA', setAttribute() {}, classList: { toggle() {} } };
  const tabB = { id: 'tabB', setAttribute() {}, classList: { toggle() {} } };
  tabsList.push(tabA, tabB);
  const mockDoc = {
    querySelectorAll: (sel) => (sel.includes('[role="tab"]') ? tabsList : []),
  };
  const res = tabs.selectTab(mockDoc, tabB);
  assert.equal(res, tabB);
  assert.equal(tabB.tabIndex, 0);
  assert.equal(tabA.tabIndex, -1);
});

test('12. navigateSessionEnd handles default document navigation and unknown action', () => {
  // Triggers lines 166-172 and 181 in tabs.js
  const origDoc = globalThis.document;
  try {
    let clickCalled = false;
    let selectedViaSelectTab = false;

    // Subcase 1: homeTab has .click()
    const homeTabWithClick = {
      click: () => { clickCalled = true; },
      setAttribute: () => {},
      classList: { toggle: () => {} },
    };
    globalThis.document = {
      getElementById: (id) => (id === 'tab-remediation' ? homeTabWithClick : null),
      querySelectorAll: (sel) => (sel.includes('[role="tab"]') ? [homeTabWithClick] : []),
    };

    const resDone1 = tabs.navigateSessionEnd('session-done');
    assert.equal(resDone1, 'done');
    assert.equal(clickCalled, true);

    // Subcase 2: homeTab does not have .click(), falls back to selectTab(document, homeTab)
    const homeTabNoClick = {
      setAttribute: () => {},
      classList: { toggle: () => { selectedViaSelectTab = true; } },
    };
    globalThis.document = {
      getElementById: (id) => (id === 'tab-custom' ? homeTabNoClick : null),
      querySelectorAll: (sel) => (sel.includes('[role="tab"]') ? [homeTabNoClick] : []),
    };

    const resDone2 = tabs.navigateSessionEnd('session-done', { homeTabId: 'tab-custom' });
    assert.equal(resDone2, 'done');
    assert.equal(selectedViaSelectTab, true);

    // Subcase 3: unknown action returns null
    const resUnknown = tabs.navigateSessionEnd('something-else');
    assert.equal(resUnknown, null);
  } finally {
    globalThis.document = origDoc;
  }
});

