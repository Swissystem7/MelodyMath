const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const uc = require('../src/lib/unitCheck.js');
const store = require('../src/lib/teacherStore.js');

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
}

test('every unit has parallel pre/post forms of 6-8 tagged items', () => {
  uc.listUnits().forEach((u) => {
    const pre = uc.formItems(u.id, 'pre');
    const post = uc.formItems(u.id, 'post');
    assert.ok(pre.length >= 6 && pre.length <= 8, u.id + ' has ' + pre.length + ' items');
    assert.equal(post.length, pre.length);
    pre.forEach((a, i) => {
      const b = post[i];
      assert.equal(a.pair, b.pair);
      assert.equal(a.skill, b.skill, u.id + ' pair ' + a.pair + ' skill');
      assert.equal(a.level, b.level, u.id + ' pair ' + a.pair + ' level');
      assert.equal(a.choices.length, b.choices.length, u.id + ' pair ' + a.pair + ' choices');
      assert.notEqual(a.prompt, b.prompt, 'parallel forms, not the same item');
      assert.ok(uc.UNIT_CHECK_SKILL_HE[a.skill], a.skill + ' has a Hebrew label');
      [a, b].forEach((it) => {
        assert.ok(it.choices.includes(it.answer), it.id + ' answer is a choice');
        assert.equal(new Set(it.choices).size, it.choices.length, it.id + ' choices are unique');
      });
    });
  });
});

test('both forms have the same level profile', () => {
  const levels = (form) => uc.formItems('frac-dur-4', form).map((it) => it.level).reduce((a, b) => a + b, 0);
  assert.equal(levels('pre'), levels('post'));
});

test('the check carries no music and no efficacy wording', () => {
  const text = JSON.stringify(['pre', 'post'].map((f) => uc.formItems('frac-dur-4', f)));
  assert.doesNotMatch(text, /תו|צליל|מוזיק|קצב/);
  assert.match(uc.UNIT_CHECK_DISCLAIMER, /לא מחקר מבוקר/);
});

test('unknown units and forms give nothing, kinds round-trip', () => {
  assert.deepEqual(uc.formItems('nope', 'pre'), []);
  assert.deepEqual(uc.formItems('frac-dur-4', 'mid'), []);
  assert.deepEqual(uc.formItems('__proto__', 'pre'), []);
  assert.deepEqual(uc.parseCheckKind(uc.checkKind('frac-dur-4', 'post')), { form: 'post', unitId: 'frac-dur-4' });
  assert.equal(uc.parseCheckKind('practice'), null);
  assert.equal(uc.parseCheckKind('check-pre:nope'), null);
});

test('isCheckCorrect compares the trimmed choice text', () => {
  const [item] = uc.formItems('frac-dur-4', 'pre');
  assert.equal(uc.isCheckCorrect(item, ' 2 '), true);
  assert.equal(uc.isCheckCorrect(item, '3'), false);
  assert.equal(uc.isCheckCorrect(null, '2'), false);
});

function takeCheck(storage, name, form, correctCount, finish = true) {
  const items = uc.formItems('frac-dur-4', form);
  const s = store.startSession('4a', name, uc.checkKind('frac-dur-4', form), storage);
  items.forEach((it, i) => {
    const given = i < correctCount ? it.answer : 'x';
    store.addItem('4a', name, s.id, { skill: it.skill, prompt: it.prompt, answer: it.answer, given, correct: uc.isCheckCorrect(it, given) }, storage);
  });
  if (finish) store.endSession('4a', name, s.id, storage);
}

test('checkReport gives pre vs post per student and class means over n with both', () => {
  const storage = memoryStorage();
  takeCheck(storage, 'דנה', 'pre', 3);
  takeCheck(storage, 'דנה', 'post', 6);
  takeCheck(storage, 'יואב', 'pre', 5);
  takeCheck(storage, 'יואב', 'post', 4);
  takeCheck(storage, 'מאיה', 'pre', 2);
  takeCheck(storage, 'נועם', 'post', 7, false);
  store.startSession('4a', 'רון', 'practice', storage);
  const r = uc.checkReport(store.loadRoster('4a', storage).students, 'frac-dur-4');
  assert.equal(r.total, 8);
  assert.deepEqual(r.rows.map((x) => x.name), ['דנה', 'יואב', 'מאיה']);
  assert.equal(r.rows[0].change, 3);
  assert.equal(r.rows[1].change, -1);
  assert.equal(r.rows[2].post, null);
  assert.equal(r.n, 2);
  assert.equal(r.preOnly, 1);
  assert.equal(r.postOnly, 0);
  assert.equal(r.meanPre, 4);
  assert.equal(r.meanPost, 5);
  assert.equal(r.disclaimer, uc.UNIT_CHECK_DISCLAIMER);
});

test('a retaken form counts the latest finished attempt', () => {
  const storage = memoryStorage();
  takeCheck(storage, 'דנה', 'pre', 2);
  const roster = store.loadRoster('4a', storage);
  roster.students['דנה'].sessions[0].ended -= 1000;
  store.saveRoster('4a', roster, storage);
  takeCheck(storage, 'דנה', 'pre', 5);
  const r = uc.checkReport(store.loadRoster('4a', storage).students, 'frac-dur-4');
  assert.equal(r.rows[0].pre.correct, 5);
});

test('checkReport survives empty and malformed rosters', () => {
  assert.equal(uc.checkReport(null, 'frac-dur-4').n, 0);
  assert.equal(uc.checkReport({ a: null, b: 'x', c: { name: 'c', sessions: 'bad' } }, 'frac-dur-4').rows.length, 0);
  assert.equal(uc.checkReport([], 'frac-dur-4').meanPre, null);
});

test('check.html loads the module, shows the disclaimer and is precached', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'check.html'), 'utf8');
  assert.match(html, /src="src\/lib\/unitCheck\.js"/);
  assert.match(html, /UNIT_CHECK_DISCLAIMER/);
  assert.match(html, /width=device-width/);
  assert.match(html, /min-height:44px/);
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(sw, /'\.\/check\.html'/);
  assert.match(sw, /'\.\/src\/lib\/unitCheck\.js'/);
});
