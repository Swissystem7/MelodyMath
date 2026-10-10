const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('home has no fake pro upgrade, streak badge, or leftover paywall chrome', () => {
  assert.doesNotMatch(indexHtml, /rmUpgradeBtn|שדרוג לפרו|rmProBadge|rmParentPro|rmStreakBadge/);
});

test('the teacher tab has a class board and a parent letter, not a paywall', () => {
  assert.match(indexHtml, /id="classBoard"/);
  assert.match(indexHtml, /id="parentLetter"/);
  assert.match(indexHtml, /מכתב קצר הביתה/);
  assert.match(indexHtml, /id="firstRun"/);
  assert.match(indexHtml, /id="beatMode"/);
  assert.match(indexHtml, /id="certCard"/);
  assert.match(indexHtml, /לא הצטיינות/);
  assert.doesNotMatch(indexHtml, /checkout|stripe|תשלום עכשיו/i);
  assert.match(indexHtml, /offer\.html/);
  assert.match(indexHtml, /חינם לתמיד/);
});

test('home is the elementary product: grade picker, coverage link, no mixed sonify hero', () => {
  assert.match(indexHtml, /id="gradePick"/);
  assert.match(indexHtml, /curriculum\.html/);
  assert.match(indexHtml, /id="rmWidget"/);
  assert.match(indexHtml, /תרגול לפי כיתה/);
  assert.match(indexHtml, /src\/lib\/mastery\.js/);
  assert.match(indexHtml, /src\/lib\/numberLine\.js/);
  assert.match(indexHtml, /src\/lib\/bar44\.js/);
});

test('teacher report escapes imported item text before injecting it into HTML', () => {
  // importRoster() stores session items from a pasted JSON file as-is, so
  // prompt / skill / kind must be escaped at render time, like student names.
  const report = indexHtml.match(/function renderTeacherReport\(\)[\s\S]*?\n/)[0];
  assert.match(report, /<td>\$\{escapeHtml\(s\.skill\)\}<\/td>/);
  // mathHtml escapes too (see mathBidi.test.js) and keeps "40 + 40 = ?" LTR.
  assert.match(report, /<li>\$\{mathHtml\(e\.prompt\)\}/);
  assert.match(report, /escapeHtml\(e\.skill\)/);
  assert.match(report, /escapeHtml\(KIND_HE\[s\.kind\]\|\|s\.kind\)/);
  assert.doesNotMatch(report, /\$\{s\.skill\}|\$\{e\.prompt\}|\|\|s\.kind\}/);
  assert.match(indexHtml, /escapeHtml\(KIND_HE\[r\.lastKind\]\|\|r\.lastKind\)/);
});

test('the who form refuses a name the roster refuses instead of saying it was saved', () => {
  // upsertStudent() returns null for a prototype-key name (constructor,
  // __proto__). Before this check the form still set `who`, showed the saved
  // line, and every answer afterwards was dropped because startSession() was null.
  const vm = require('node:vm');
  const store = require('../src/lib/teacherStore');
  const src = indexHtml.match(/function saveWhoFromForm\(\)[\s\S]*?\n/)[0];
  function run(typed) {
    const fields = { classCode: { value: 'שילוב' }, studentName: { value: typed }, whoStatus: { textContent: '' } };
    const calls = [];
    const ctx = {
      $: (id) => fields[id],
      normalizeCode: store.normalizeCode,
      studentLabel: store.studentLabel,
      upsertStudent: (code, name) => { calls.push(['upsert', code, name]); return {}; },
      saveWho: (w) => { calls.push(['saveWho', w.classCode, w.name]); },
      endTeacherSession: () => { calls.push(['end']); },
      applyWhoToForm: () => {}, renderTeacherReport: () => {}, renderClassBoard: () => {}, renderClassKids: () => {},
      who: { classCode: '', name: '' }, openSess: null,
    };
    vm.createContext(ctx);
    vm.runInContext(src + '\nsaveWhoFromForm();', ctx);
    return { calls, status: fields.whoStatus.textContent, who: ctx.who };
  }
  const bad = run('constructor');
  assert.deepEqual(bad.calls, []);
  assert.equal(bad.who.name, '');
  assert.match(bad.status, /שם/);
  const good = run('  נועה ');
  assert.deepEqual(good.calls, [['upsert', 'שילוב', 'נועה'], ['saveWho', 'שילוב', 'נועה']]);
  assert.equal(good.who.name, 'נועה');
  assert.equal(run('').calls.length, 0);
});

test('index.html provides Smartboard mode toggle and classroom projection styles', () => {
  assert.match(indexHtml, /id="smartboardToggle"/);
  assert.match(indexHtml, /\.smartboard-mode/);
  assert.match(indexHtml, /toggleSmartboard/);
});

test('index.html provides Quick QR Code modal and WhatsApp share for classrooms', () => {
  assert.match(indexHtml, /id="qrShareBtn"/);
  assert.match(indexHtml, /id="qrModal"/);
  assert.match(indexHtml, /id="qrCloseBtn"/);
  assert.match(indexHtml, /id="copyLinkBtn"/);
  assert.match(indexHtml, /id="whatsappShareBtn"/);
  assert.match(indexHtml, /icons\/qr-code\.svg/);
});

test('teacher tab provides a printable RAMA failure-point diagnostic card', () => {
  assert.match(indexHtml, /id="ramaCard"/);
  assert.match(indexHtml, /id="ramaMake"/);
  assert.match(indexHtml, /id="ramaPrint"/);
  assert.match(indexHtml, /id="ramaSheet"/);
  assert.match(indexHtml, /print-rama/);
  assert.match(indexHtml, /src\/lib\/remediation\.js/);
});

test('playground includes singing number line with harmonic fraction bells', () => {
  assert.match(indexHtml, /id="singingLine"/);
  assert.match(indexHtml, /id="singingLabel"/);
  assert.match(indexHtml, /id="singingResult"/);
  assert.match(indexHtml, /updateSingingLine/);
  assert.match(indexHtml, /soundForTick/);
});

test('noteMetro triggers harmonic arpeggio streak rewards', () => {
  assert.match(indexHtml, /playHarmonicReward\(correct \? metroStreak \+ 1 : 0\)/);
});

test('playground includes interactive rhythm gameplay with progressive musical layers', () => {
  assert.match(indexHtml, /id="drumPadBtn"/);
  assert.match(indexHtml, /id="rhythmStageTag"/);
  assert.match(indexHtml, /id="rhythmCursor"/);
  assert.match(indexHtml, /id="rhythmStartBtn"/);
  assert.match(indexHtml, /id="rhythmPatternNextBtn"/);
  assert.match(indexHtml, /src\/lib\/rhythmGame\.js/);
});
