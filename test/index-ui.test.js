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

test('the teacher tab runs the local unit pre/post check and says what it is not', () => {
  assert.match(indexHtml, /id="unitMeasureCard"/);
  assert.match(indexHtml, /id="unitCheckPre"/);
  assert.match(indexHtml, /id="unitCheckPost"/);
  assert.match(indexHtml, /id="unitCheckHear"/);
  assert.match(indexHtml, /id="unitCheckDisclaimer"/);
  assert.match(indexHtml, /src="src\/lib\/unitChecks\.js"/);
  assert.match(indexHtml, /לא ניסוי מבוקר/);
  // The check player is screen-only: it must not land on a printed worksheet,
  // class board or parent letter.
  assert.match(indexHtml, /#certCard,#unitMeasureCard\{display:none!important\}/);
});

// Drives the real player source out of index.html against a fake DOM, the way
// the saveWhoFromForm test below does: a string match would not notice the
// player logging the wrong session kind or never closing itself.
test('the unit check player runs a whole form, logs every item, and closes itself', () => {
  const vm = require('node:vm');
  const unit = require('../src/lib/unitChecks');
  const store = require('../src/lib/teacherStore');
  const adaptive = require('../src/lib/adaptive');
  const src = indexHtml.match(/const UNIT_CHECK_ID=[\s\S]*?\nfunction cancelUnitCheck\(\)\{[^\n]*\n/)[0];

  function el() {
    const node = {
      textContent: '', className: '', disabled: false, children: [],
      classList: { add: () => {}, toggle: () => {} },
      setAttribute: () => {},
      appendChild: (c) => node.children.push(c),
      set innerHTML(v) { node._html = v; if (v === '') node.children.length = 0; },
      get innerHTML() { return node._html || ''; },
    };
    return node;
  }

  function harness(who) {
    const nodes = Object.create(null);
    const shown = Object.create(null);
    const logged = [];
    const ctx = {
      $: (id) => (nodes[id] || (nodes[id] = el())),
      show: (id, on) => { shown[id] = !!on; },
      prefsNow: () => ({ quiet: true }),
      maybeSpeak: () => { throw new Error('must not speak on a muted device'); },
      setMath: (node, text) => { node.textContent = text; },
      renderWidget: () => {}, renderTeacherReport: () => {}, renderClassBoard: () => {},
      noteMetro: () => {}, mathHtml: String, preferLessMotion: () => true,
      rng: () => () => 0.5, setTimeout: (fn) => fn(), document: { createElement: el },
      makeChoices: store.makeChoices, isCorrect: adaptive.isCorrect,
      getUnitForm: unit.getUnitForm, scoreForm: unit.scoreForm, who: who,
      UNIT_CHECK_UNIT_ID: unit.UNIT_CHECK_UNIT_ID,
      logTeacherItem: (item) => logged.push(item.kind),
      endTeacherSession: () => logged.push('end'),
    };
    vm.createContext(ctx);
    vm.runInContext(src, ctx);
    return { ctx, nodes, shown, logged };
  }

  const items = unit.getUnitForm(unit.UNIT_CHECK_UNIT_ID, 'pre').items;
  const h = harness({ classCode: 'ד׳', name: 'רועי' });
  vm.runInContext('startUnitCheck("pre")', h.ctx);
  assert.equal(h.shown.unitCheckPlay, true);
  assert.equal(h.shown.unitCheckGate, false);
  assert.equal(h.shown.unitCheckMuted, true, 'a muted device gets the read-it-yourself note');

  items.forEach((it, i) => {
    assert.equal(h.nodes.unitCheckPrompt.textContent, it.prompt, 'item ' + i + ' prompt');
    const right = h.nodes.unitCheckChoices.children.filter((b) => adaptive.isCorrect(b.textContent, it.answer));
    assert.equal(h.nodes.unitCheckChoices.children.length, 4);
    assert.equal(right.length, 1);
    right[0].onclick();
  });

  assert.deepEqual(h.logged, items.map(() => 'unitPre').concat(['end']));
  assert.equal(h.shown.unitCheckPlay, false, 'the player closes after the last item');
  assert.equal(h.shown.unitCheckGate, true);
  assert.match(h.nodes.unitCheckFeedback.innerHTML, new RegExp('ltr">' + items.length + '/' + items.length));

  // No student saved, and a phase with no form: neither opens an empty player
  // or logs an item into a session startSession() would refuse to make.
  [[{ classCode: '', name: '' }, 'pre'], [{ classCode: 'ד׳', name: 'רועי' }, 'during']].forEach(([w, phase]) => {
    const g = harness(w);
    vm.runInContext('startUnitCheck("' + phase + '")', g.ctx);
    assert.equal(g.shown.unitCheckPlay, undefined, phase);
    assert.deepEqual(g.logged, [], phase);
  });
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
  assert.match(indexHtml, /id="drumSnareBtn"/);
  assert.match(indexHtml, /id="drumHihatBtn"/);
  assert.match(indexHtml, /id="drumClapBtn"/);
  assert.match(indexHtml, /id="rhythmStageTag"/);
  assert.match(indexHtml, /id="bandStage"/);
  assert.match(indexHtml, /id="bandDrums"/);
  assert.match(indexHtml, /id="bandBass"/);
  assert.match(indexHtml, /id="bandChords"/);
  assert.match(indexHtml, /id="bandMelody"/);
  assert.match(indexHtml, /id="rhythmCursor"/);
  assert.match(indexHtml, /id="rhythmSpark"/);
  assert.match(indexHtml, /id="xyloStudio"/);
  assert.match(indexHtml, /id="xyloKeys"/);
  assert.match(indexHtml, /id="rhythmStartBtn"/);
  assert.match(indexHtml, /id="rhythmPatternNextBtn"/);
  assert.match(indexHtml, /src\/lib\/rhythmGame\.js/);
});

test('home provides interactive guided micro-lessons studio with manipulatives and stepper', () => {
  assert.match(indexHtml, /id="tab-lessons"/);
  assert.match(indexHtml, /data-tab="lessons"/);
  assert.match(indexHtml, /id="lessons"/);
  assert.match(indexHtml, /id="lessonsGrid"/);
  assert.match(indexHtml, /id="lessonsGradeFilter"/);
  assert.match(indexHtml, /id="activeLessonCard"/);
  assert.match(indexHtml, /id="lessonStepper"/);
  assert.match(indexHtml, /id="stepInteractiveBox"/);
  assert.match(indexHtml, /id="stepQuizBox"/);
  assert.match(indexHtml, /id="stepPracticeBtn"/);
  assert.match(indexHtml, /src\/lib\/interactiveLessons\.js/);
  assert.match(indexHtml, /src\/lib\/polyrhythm\.js/);
  assert.match(indexHtml, /src\/lib\/circleOfFifths\.js/);
  assert.match(indexHtml, /renderLessonsUI/);
  assert.match(indexHtml, /renderFractionBuilderUI/);
  assert.match(indexHtml, /renderMultExplorerUI/);
  assert.match(indexHtml, /renderTensBuilderUI/);
  assert.match(indexHtml, /renderLineExplorerUI/);
  assert.match(indexHtml, /renderDivExplorerUI/);
  assert.match(indexHtml, /renderEuclideanWheelUI/);
  assert.match(indexHtml, /renderEvenOddExplorerUI/);
  assert.match(indexHtml, /circleFifthsExplorer/);
  assert.match(indexHtml, /id="stepSpeakBtn"/);
  assert.match(indexHtml, /pulse-hint/);
});
