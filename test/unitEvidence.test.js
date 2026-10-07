const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ev = require('../src/lib/unitEvidence');
const lab = require('../src/lib/freqLab');

const DAY = 24 * 60 * 60 * 1000;

function memStore() {
  const m = {};
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } };
}

test('R11: the arm is drawn once per learner and unit, then kept', () => {
  const s = memStore();
  assert.equal(ev.assignArm('u', 'a', s, () => 0.1), 'music');
  assert.equal(ev.assignArm('u', 'a', s, () => 0.9), 'music');
  assert.equal(ev.assignArm('u', 'b', s, () => 0.9), 'visual');
  assert.equal(ev.assignArm('other', 'a', s, () => 0.9), 'visual');
});

test('R4: a unit is learned only when the no-music transfer is all right', () => {
  const s = memStore();
  ev.assignArm('u', 'a', s, () => 0.1);
  ev.recordStage('u', 'a', 'post', { right: 3, total: 3 }, 1, s);
  ev.recordStage('u', 'a', 'near', { right: 1, total: 1 }, 1, s);
  const rec = () => ev.loadEvidence(s).u.a;
  assert.equal(ev.unitLearned(rec()), false, 'right with sound only is not learned');
  ev.recordStage('u', 'a', 'far', { right: 2, total: 3 }, 1, s);
  assert.equal(ev.unitLearned(rec()), false);
  ev.recordStage('u', 'a', 'far', { right: 3, total: 3 }, 2, s);
  assert.equal(ev.unitLearned(rec()), true);
  assert.deepEqual(rec().stages.far, { right: 2, total: 3, at: 1 }, 'the first far attempt is kept as measured');
});

test('R6: a missed transfer comes back on days 1, 3, 7 and 14, the last without music', () => {
  const s = memStore();
  const t0 = 1000;
  ev.recordStage('u', 'a', 'far', { right: 1, total: 3 }, t0, s);
  let rec = ev.loadEvidence(s).u.a;
  assert.deepEqual(rec.due.map((d) => d.day), [1, 3, 7, 14]);
  assert.equal(rec.due[3].noMusic, true);
  assert.equal(ev.retrievalDue(rec, t0 + DAY / 2), null);
  assert.equal(ev.retrievalDue(rec, t0 + DAY).day, 1);
  ev.recordStage('u', 'a', 'far', { right: 3, total: 3 }, t0 + DAY, s);
  rec = ev.loadEvidence(s).u.a;
  assert.deepEqual(rec.due.map((d) => d.day), [3, 7, 14], 'a served review drops out, the rest stay');
  assert.equal(ev.retrievalDue(rec, t0 + 2 * DAY), null);
  assert.equal(ev.retrievalDue(rec, t0 + 3 * DAY).day, 3);
});

test('R6: all right on the first transfer schedules nothing', () => {
  const s = memStore();
  ev.recordStage('u', 'a', 'far', { right: 3, total: 3 }, 0, s);
  assert.deepEqual(ev.loadEvidence(s).u.a.due, []);
});

test('R10: retention opens 14 days after the transfer step and only once', () => {
  const s = memStore();
  ev.recordStage('u', 'a', 'far', { right: 3, total: 3 }, 0, s);
  const rec = () => ev.loadEvidence(s).u.a;
  assert.equal(ev.retentionDue(rec(), 13 * DAY), false);
  assert.equal(ev.retentionDue(rec(), 14 * DAY), true);
  ev.recordStage('u', 'a', 'retention', { right: 2, total: 3 }, 14 * DAY, s);
  assert.equal(ev.retentionDue(rec(), 30 * DAY), false);
});

test('recordStage refuses unknown stages and impossible scores', () => {
  const s = memStore();
  assert.equal(ev.recordStage('u', 'a', 'stars', { right: 1, total: 1 }, 0, s), null);
  assert.equal(ev.recordStage('u', 'a', 'far', { right: 4, total: 3 }, 0, s), null);
  assert.equal(ev.recordStage('u', 'a', 'far', { right: 0, total: 0 }, 0, s), null);
  assert.deepEqual(ev.loadEvidence(s), {});
});

test('a stored learner named like a prototype key cannot break the record', () => {
  const s = memStore();
  ev.recordStage('u', 'constructor', 'far', { right: 1, total: 1 }, 0, s);
  assert.equal(ev.unitLearned(ev.loadEvidence(s).u.constructor), true);
  assert.equal(ev.fixOrRemove('toString', s).verdict, 'collecting');
});

function fill(s, arm, n, far, retention) {
  for (let i = 0; i < n; i++) {
    const who = arm + i;
    ev.assignArm('u', who, s, () => (arm === 'music' ? 0.1 : 0.9));
    ev.recordStage('u', who, 'far', { right: far, total: 3 }, 0, s);
    ev.recordStage('u', who, 'retention', { right: retention, total: 3 }, 14 * DAY, s);
  }
}

test('R11: under 30 learners per arm the verdict is "collecting"', () => {
  const s = memStore();
  fill(s, 'music', 30, 3, 3);
  fill(s, 'visual', 29, 1, 1);
  const r = ev.fixOrRemove('u', s);
  assert.equal(r.verdict, 'collecting');
  assert.equal(r.music.n, 30);
  assert.equal(r.visual.n, 29);
});

test('R11: music at least as good as visual-only on transfer and retention is kept', () => {
  const s = memStore();
  fill(s, 'music', 30, 2, 2);
  fill(s, 'visual', 30, 2, 2);
  assert.equal(ev.fixOrRemove('u', s).verdict, 'keep');
});

test('R11: music worse than visual-only on retention is flagged "fix"', () => {
  const s = memStore();
  fill(s, 'music', 30, 3, 1);
  fill(s, 'visual', 30, 3, 2);
  assert.equal(ev.fixOrRemove('u', s).verdict, 'fix');
});

test('R5: frequency-lab misses name the slip and the calculation', () => {
  const fifth = lab.ITEMS.pre[0];
  assert.equal(fifth.answer, 150);
  assert.equal(lab.explain(fifth, '150').ok, true);
  assert.match(lab.explain(fifth, '66.67').why, /חילקתם/);
  assert.match(lab.explain(fifth, '300').why, /רק ב־3/);
  assert.match(lab.explain(fifth, '200').why, /כפלתם ב־2/);
  assert.match(lab.explain(fifth, '103').why, /הוספתם/);
  assert.match(lab.explain(fifth, '7').why, /⁦100 ÷ 2 × 3⁩/, 'math stays LTR inside Hebrew (#93)');
  const times = lab.ITEMS.pre[1];
  assert.match(lab.explain(times, '150').why, /הפרש/);
  assert.match(lab.explain(times, '0.5').why, /הפוך/);
  assert.equal(lab.explain(times, '2').ok, true);
  assert.match(lab.explain(times, 'abc').why, /כתבו מספר/);
  assert.equal(lab.harmonicExplain(5, 110, '550').ok, true);
  assert.match(lab.harmonicExplain(5, 110, '440').why, /השכן/);
  assert.match(lab.harmonicExplain(5, 110, '115').why, /הוספתם/);
});

test('R4/R10: far and retention items are parallel forms with no sound words', () => {
  const { far, retention } = lab.ITEMS;
  assert.equal(far.length, retention.length);
  assert.deepEqual(far.map((i) => i.kind), retention.map((i) => i.kind));
  far.concat(retention).forEach((it) => {
    assert.ok(Number.isInteger(it.answer), it.id);
    assert.doesNotMatch(it.textHe, /Hz|הרץ|צליל|(^|\s)תווים?(\s|$)|מנגינ|אוקטב|קווינט/, it.id);
  });
  const ids = Object.values(lab.ITEMS).flat().map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('freq-lab page wires the §10 steps and loads only cached scripts', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'freq-lab.html'), 'utf8');
  const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  assert.match(html, /המטרה:/, 'R1 goal sentence');
  assert.match(html, /data-quiz="pre"/);
  assert.match(html, /data-quiz="near"/);
  assert.match(html, /data-quiz="far"/);
  assert.match(html, /id="mute"/, 'R7 mute');
  assert.match(html, /זה לא ניסוי מבוקר/, 'R10 honest note');
  const farCard = html.slice(html.indexOf('id="h-far"'), html.indexOf('data-quiz="far"'));
  assert.doesNotMatch(farCard, /data-ab|▶/, 'no play button in the no-music step');
  ['src/lib/unitEvidence.js', 'src/lib/freqLab.js'].forEach((f) => {
    assert.match(html, new RegExp('src="' + f.replace(/\./g, '\\.') + '"'));
    assert.ok(sw.includes("'./" + f + "'"), f + ' in sw.js');
  });
});
