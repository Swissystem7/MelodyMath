// #591 TempoRuler (owner comment 6376161970): measuring time and length in
// beat units, measurement structure of RhythmMaster (6376159285).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TR = require('../src/lib/music/tempoRuler.js');
const SCREEN = require('../src/components/TempoRuler.js');
const I = require('../src/lib/instruments.js');
const root = path.join(__dirname, '..');

function memStorage() {
  const m = {};
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, dump: m };
}

test('bpmToSeconds: beats at a tempo last beats * 60 / BPM seconds', () => {
  assert.equal(TR.bpmToSeconds(1, 60), 1);
  assert.equal(TR.bpmToSeconds(4, 120), 2);
  assert.equal(TR.bpmToSeconds(3, 90), 2);
  assert.equal(TR.bpmToSeconds(0.5, 60), 0.5);
  assert.equal(TR.bpmToSeconds(1, 100), 0.6);
  assert.equal(TR.bpmToSeconds(4, 0), null);
  assert.equal(TR.bpmToSeconds(4, -60), null);
  assert.equal(TR.bpmToSeconds(4, 'fast'), null);
  assert.equal(TR.bpmToSeconds('x', 60), null);
});

test('secondsToBeats is the inverse of bpmToSeconds for every whole BPM 40-200', () => {
  for (let bpm = 40; bpm <= 200; bpm++) {
    for (const beats of [0.5, 1, 3, 4, 7, 16]) {
      assert.equal(TR.secondsToBeats(TR.bpmToSeconds(beats, bpm), bpm), beats, bpm + ' ' + beats);
    }
  }
});

test('convertUnits: half beat, beat and bar convert through beats', () => {
  assert.equal(TR.convertUnits(1, 'bar', 'beat'), 4);
  assert.equal(TR.convertUnits(3, 'bar', 'half'), 24);
  assert.equal(TR.convertUnits(6, 'half', 'beat'), 3);
  assert.equal(TR.convertUnits(2, 'beat', 'bar'), 0.5);
  assert.equal(TR.convertUnits(1, 'half', 'bar'), 0.125);
  assert.equal(TR.convertUnits(2, 'bar', 'beat', { beatsPerBar: 3 }), 6, '3/4 bars');
});

test('convertUnits: seconds <-> beats need a BPM', () => {
  assert.equal(TR.convertUnits(10, 'second', 'beat', { bpm: 60 }), 10);
  assert.equal(TR.convertUnits(3, 'second', 'beat', { bpm: 120 }), 6);
  assert.equal(TR.convertUnits(2, 'bar', 'second', { bpm: 120 }), 4);
  assert.equal(TR.convertUnits(6, 'half', 'second', { bpm: 90 }), 2);
  assert.equal(TR.convertUnits(1, 'second', 'bar', { bpm: 240 }), 1);
  assert.equal(TR.convertUnits(10, 'second', 'beat'), null, 'no BPM');
  assert.equal(TR.convertUnits(1, 'beat', 'second'), null);
});

test('convertUnits refuses unknown units and bad input', () => {
  assert.equal(TR.convertUnits(1, 'metre', 'beat'), null);
  assert.equal(TR.convertUnits(1, 'beat', 'toString'), null);
  assert.equal(TR.convertUnits(1, 'constructor', 'beat'), null);
  assert.equal(TR.convertUnits('a', 'beat', 'bar'), null);
  assert.equal(TR.convertUnits(1, 'bar', 'beat', { beatsPerBar: 0 }), null);
});

test('convertUnits round-trips every unit pair', () => {
  const units = ['half', 'beat', 'bar', 'second'];
  for (const a of units) for (const b of units) {
    const there = TR.convertUnits(5, a, b, { bpm: 75 });
    assert.equal(TR.convertUnits(there, b, a, { bpm: 75 }), 5, a + '->' + b);
  }
});

test('compareLengths and measuring sticks', () => {
  assert.equal(TR.compareLengths({ value: 3, unit: 'half' }, { value: 1, unit: 'beat' }), 1);
  assert.equal(TR.compareLengths({ value: 2, unit: 'bar' }, { value: 8, unit: 'beat' }), 0);
  assert.equal(TR.compareLengths({ value: 3, unit: 'beat' }, { value: 1, unit: 'bar' }), -1);
  assert.deepEqual(TR.measureWithSticks(8, 'bar'), { count: 2, exact: true, stick: 'bar' });
  assert.deepEqual(TR.measureWithSticks(3, 'half'), { count: 6, exact: true, stick: 'half' });
  assert.equal(TR.measureWithSticks(3, 'bar').exact, false);
  assert.equal(TR.measureWithSticks(3, 'nope'), null);
});

test('stickPlan: one stroke at the start of each stick, at the tempo', () => {
  const plan = TR.stickPlan('bar', 3, 120, 'drumLow');
  assert.deepEqual(plan.map((n) => n.at), [0, 2, 4]);
  assert.ok(plan.every((n) => n.voice === 'drumLow'));
  assert.deepEqual(TR.stickPlan('half', 4, 60).map((n) => n.at), [0, 0.5, 1, 1.5]);
  assert.deepEqual(TR.stickPlan('beat', 2, 0), []);
});

test('practice: three steps, each answer is among its 2-4 choices', () => {
  assert.deepEqual(TR.STEPS.map((s) => s.id), ['measure', 'compare', 'convert']);
  let s = SCREEN.startPractice(SCREEN.createState(null, 0));
  let n = 0;
  while (s.view === 'practice') {
    if (TR.STEPS[s.step].id === 'measure') s = SCREEN.pickStick(s, TR.PRACTICE.measure[s.ex].stick);
    const choices = SCREEN.practiceChoices(s);
    assert.ok(choices.length >= 2 && choices.length <= 4, 'choices ' + choices.length);
    const right = String(SCREEN.currentAnswer(s));
    assert.ok(choices.some((c) => c.v === right), 'answer ' + right + ' in choices');
    const wrong = choices.find((c) => c.v !== right);
    assert.equal(SCREEN.answerPractice(s, wrong.v).status, 'wrong');
    s = SCREEN.answerPractice(s, right);
    assert.equal(s.status, 'right');
    s = SCREEN.nextPractice(s);
    n++;
  }
  assert.equal(s.view, 'practiceDone');
  assert.equal(n, TR.PRACTICE.measure.length + TR.PRACTICE.compare.length + TR.PRACTICE.convert.length);
});

test('step 1: the answer follows the stick the child picks', () => {
  let s = SCREEN.startPractice(SCREEN.createState(null, 0));
  assert.match(SCREEN.answerPractice(s, '4').message, /בחרו קודם מקל/);
  s = SCREEN.pickStick(s, 'half');
  assert.equal(SCREEN.currentAnswer(s), 8, '4 beats = 8 half beats');
  assert.equal(SCREEN.stickRow(s).length, 8);
  s = SCREEN.pickStick(s, 'bar');
  assert.equal(SCREEN.currentAnswer(s), 1);
});

test('the pre-test has 12 items; post and retention are parallel forms with new numbers', () => {
  const pre = TR.buildForm('pre');
  const post = TR.buildForm('post');
  const ret = TR.buildForm('retention');
  assert.equal(pre.length, 12);
  for (const f of [post, ret]) {
    assert.equal(f.length, 12);
    f.forEach((it, i) => {
      assert.equal(it.shape, pre[i].shape);
      assert.equal(it.practised, pre[i].practised);
    });
  }
  pre.forEach((it, i) => assert.notEqual(it.prompt, post[i].prompt, it.id + ' same prompt in A and B'));
  [pre, post, ret].forEach((f) => f.forEach((it) => {
    assert.ok(it.choices.includes(it.answer), it.id + ' ' + it.answer + ' not in ' + it.choices);
    assert.ok(it.choices.length >= 2 && it.choices.length <= 4, it.id);
    assert.equal(new Set(it.choices).size, it.choices.length, it.id + ' duplicate choice');
  }));
  const unpractised = pre.filter((it) => !it.practised).length;
  assert.ok(unpractised >= 4, 'enough unpractised items for the gain: ' + unpractised);
});

test('the unpractised test shapes never appear in the practice', () => {
  const practiced = new Set(['compare-half', 'bars-to-beats', 'beats-to-halves', 'beats-to-seconds-60', 'seconds-to-beats-120', 'sticks-bars', 'beats-to-bars']);
  TR.SLOTS.forEach((s) => assert.equal(s[1], practiced.has(s[2]), s[0]));
});

test('scoreForm splits practised and unpractised', () => {
  const form = TR.buildForm('pre');
  const all = {};
  form.forEach((it) => { all[it.id] = it.answer; });
  const full = TR.scoreForm(form, all);
  assert.equal(full.correct, 12);
  assert.equal(full.practised, 1);
  assert.equal(full.unpractised, 1);
  const none = TR.scoreForm(form, {});
  assert.equal(none.correct, 0);
});

test('effectSize = (mean post - mean pre) / SD pre, null without spread', () => {
  assert.equal(TR.effectSize([0, 1, 0, 1], [1, 1, 1, 1]), 0.87);
  assert.equal(TR.effectSize([0.2, 0.4, 0.6], [0.5, 0.7, 0.9]), 1.5);
  assert.equal(TR.effectSize([1, 1, 1], [1, 1, 1]), null);
  assert.equal(TR.effectSize([], [1]), null);
});

test('schedule: post opens 28 days after the pre-test, retention 30 days after the post-test', () => {
  const D = TR.DAY;
  const t0 = Date.UTC(2026, 9, 24);
  let r = TR.emptyRecord();
  assert.equal(TR.phaseAt(r, t0).phase, 'pre');
  r = TR.recordTest(r, 'pre', {}, t0);
  assert.equal(TR.phaseAt(r, t0 + 27 * D).phase, 'practice');
  assert.equal(TR.phaseAt(r, t0 + 27 * D).postDueAt, t0 + 28 * D);
  assert.equal(TR.phaseAt(r, t0 + 28 * D).phase, 'post');
  r = TR.recordTest(r, 'post', {}, t0 + 29 * D);
  assert.equal(TR.phaseAt(r, t0 + 58 * D).phase, 'practice');
  assert.equal(TR.phaseAt(r, t0 + 59 * D).phase, 'retention');
  r = TR.recordTest(r, 'retention', {}, t0 + 60 * D);
  assert.equal(TR.phaseAt(r, t0 + 61 * D).phase, 'done');
});

test('report: gain on unpractised items, target 0.3 SD, kept after 30 days', () => {
  const D = TR.DAY;
  const answersFor = (phase, wrongIds) => {
    const a = {};
    TR.buildForm(phase).forEach((it) => { a[it.id] = wrongIds.includes(it.id) ? 'x' : it.answer; });
    return a;
  };
  let r = TR.recordTest(TR.emptyRecord(), 'pre', answersFor('pre', ['t8', 't9', 't10']), 0);
  r = TR.recordTest(r, 'post', answersFor('post', []), 28 * D);
  let rep = TR.report(r);
  assert.equal(rep.pre, 0.4);
  assert.equal(rep.post, 1);
  assert.ok(rep.d >= TR.TARGET_D);
  assert.equal(rep.meetsTarget, true);
  assert.equal(rep.retained, null);
  r = TR.recordTest(r, 'retention', answersFor('retention', ['t8']), 58 * D);
  rep = TR.report(r);
  assert.equal(rep.retention, 0.8);
  assert.equal(rep.retained, true);
  const flat = TR.recordTest(TR.recordTest(TR.emptyRecord(), 'pre', answersFor('pre', ['t8', 't9']), 0), 'post', answersFor('post', ['t8', 't9']), 28 * D);
  assert.equal(TR.report(flat).meetsTarget, false);
});

test('records load and save through an injectable storage', () => {
  const st = memStorage();
  assert.deepEqual(TR.loadRecord(st), TR.emptyRecord());
  const r = TR.recordTest(TR.emptyRecord(), 'pre', { t1: 'הפעמות' }, 5);
  assert.equal(TR.saveRecord(st, r), true);
  assert.deepEqual(TR.loadRecord(st), JSON.parse(JSON.stringify(r)));
  st.setItem(TR.STORAGE_KEY, '{broken');
  assert.deepEqual(TR.loadRecord(st), TR.emptyRecord());
  assert.equal(TR.saveRecord({ setItem() { throw new Error('full'); } }, r), false);
});

test('screen flow: pre-test -> 3 steps -> post-test opens after 4 weeks', () => {
  const D = TR.DAY;
  let s = SCREEN.start(SCREEN.createState(null, 0), 0);
  assert.equal(s.view, 'test');
  assert.equal(s.phase, 'pre');
  for (const it of TR.buildForm('pre')) s = SCREEN.answerTest(s, it.answer, 0);
  assert.equal(s.view, 'practice');
  assert.ok(s.record.pre && s.record.pre.score.correct === 12);
  assert.equal(SCREEN.start(s, 10 * D).view, 'practice', 'post not open yet');
  s = SCREEN.start(s, 28 * D);
  assert.equal(s.phase, 'post');
  for (const it of TR.buildForm('post')) s = SCREEN.answerTest(s, it.answer, 28 * D);
  assert.equal(s.view, 'result');
  assert.match(SCREEN.renderHtml(s), /אחרי 30 יום/);
});

test('a test answer outside the choices is ignored; tests are silent and have no music toggle', () => {
  const s = SCREEN.start(SCREEN.createState(null, 0), 0);
  assert.equal(SCREEN.answerTest(s, 'nonsense').i, 0);
  const html = SCREEN.renderHtml(s);
  assert.doesNotMatch(html, /data-tap|mm-music-toggle/);
});

test('music off: same practice, no sticks that sound and no play button', () => {
  let s = SCREEN.pickStick(SCREEN.startPractice(SCREEN.createState(null, 0, false)), 'beat');
  const off = SCREEN.renderHtml(s);
  assert.doesNotMatch(off, /data-tap|data-act="play"/);
  assert.match(off, /data-act="ans"/);
  const on = SCREEN.renderHtml(SCREEN.pickStick(SCREEN.startPractice(SCREEN.createState(null, 0, true)), 'beat'));
  assert.match(on, /data-tap="drumLow"/);
  assert.match(on, /data-act="play"/);
});

test('instrument choice: 2-4 measurement instruments, at topic start only, timbre only (dosage rules)', () => {
  assert.equal(I.TOPICS.measurement.mechanism, 'M3');
  assert.ok(I.PRIMARY.includes('M3'));
  const choices = SCREEN.instrumentChoices();
  assert.ok(choices.length >= 2 && choices.length <= 4, String(choices.length));
  choices.forEach((c) => assert.equal(I.instrumentById(c.id).mechanism, 'M3'));
  const intro = SCREEN.createState(null, 0);
  const picked = SCREEN.chooseInstrument(intro, choices[1].id);
  assert.equal(picked.instrument.id, choices[1].id);
  const inPractice = SCREEN.startPractice(intro);
  assert.equal(SCREEN.chooseInstrument(inPractice, choices[1].id), inPractice, 'no choice mid-exercise');
  assert.doesNotMatch(SCREEN.renderHtml(inPractice), /data-act="inst"/);
});

test('Hebrew labels and aria on the screen', () => {
  const views = [
    SCREEN.createState(null, 0),
    SCREEN.start(SCREEN.createState(null, 0), 0),
    SCREEN.pickStick(SCREEN.startPractice(SCREEN.createState(null, 0)), 'half'),
  ];
  views.forEach((v) => {
    const html = SCREEN.renderHtml(v);
    assert.match(html, /[א-ת]/);
    assert.match(html, /aria-/);
  });
});

test('no efficacy claims and no buy/price words in TempoRuler text', () => {
  const files = ['src/lib/music/tempoRuler.js', 'src/components/TempoRuler.js'];
  const text = files.map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
  const strings = (text.match(/'[^'\n]*'/g) || []).join('\n');
  assert.doesNotMatch(strings, /(^|[^א-ת])(קנה|מחיר|רכישה|מנוי)([^א-ת]|$)/);
  assert.doesNotMatch(strings, /משפר|משפרת|משפרים|improves?/i);
  assert.doesNotMatch(strings, /מטבע|פרס|הגרלה|שעון עצר|loot/i);
});

test('index.html mounts the screen and sw.js caches both files', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /id="trCard"/);
  assert.match(html, /src="src\/lib\/music\/tempoRuler\.js"/);
  assert.match(html, /src="src\/components\/TempoRuler\.js"/);
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(sw, /tempoRuler\.js/);
  assert.match(sw, /TempoRuler\.js/);
});
