const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RM = require('../src/lib/music/rhythmMaster.js');
const MS = require('../src/lib/music/rhythmMeasure.js');
const UI = require('../src/components/RhythmMaster.js');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

function score(unp, pr) {
  return { correct: unp + (pr || 0), total: 12, practised: { correct: pr || 0, total: 6 }, unpractised: { correct: unp, total: 6 } };
}

// ---- the screen: pre-test -> 3 steps -> post-test ------------------------

test('screen flow: 12-item pre-test, 3 steps with a reason each, then the parallel post-test', () => {
  const day = MS.DAY_MS;
  let s = UI.createState({ now: 0 });
  assert.match(UI.renderHtml(s), /data-act="start-test" data-phase="pre"/);
  s = UI.reduce(s, { type: 'start-test', phase: 'pre' }, { now: 0 });
  const pre = s.test.items;
  assert.equal(pre.length, 12);
  for (let i = 0; i < 12; i++) {
    const html = UI.renderHtml(s);
    assert.match(html, new RegExp('שאלה ' + (i + 1) + ' מתוך 12'));
    assert.doesNotMatch(html, /data-act="play"|data-tap/, 'the tests are silent');
    s = UI.reduce(s, { type: 'test-answer', value: i < 6 ? pre[i].answer : 'x' }, { now: 0 });
  }
  assert.equal(s.phase, 'practice');
  assert.equal(s.record.pre.score.correct, 6);
  assert.doesNotMatch(UI.renderHtml(s), /data-phase="post"/, 'post-test closed before 3 steps');
  const kinds = [];
  for (let step = 0; step < 3; step++) {
    kinds.push(s.task.kind);
    assert.match(UI.renderHtml(s), /data-act="answer"/);
    s = UI.reduce(s, { type: 'answer', value: s.task.answer }, { now: day });
    assert.equal(s.answerOk, true);
    const html = UI.renderHtml(s);
    assert.match(html, /למה\?/);
    assert.equal((html.match(/data-act="reason"/g) || []).length, 3);
    s = UI.reduce(s, { type: 'reason', id: s.task.reasonId }, { now: day });
    assert.equal(s.reasonOk, true);
    if (step < 2) s = UI.reduce(s, { type: 'next' }, { now: day });
  }
  assert.deepEqual(kinds, ['lcm', 'ratio', 'fraction'], 'interleaved');
  assert.equal(s.record.steps, 3);
  const html = UI.renderHtml(s);
  assert.match(html, /data-phase="post"/);
  assert.match(html, /4 שבועות/, 'says the post-test is meant for 4 weeks later');
  s = UI.reduce(s, { type: 'start-test', phase: 'post' }, { now: 28 * day });
  const post = s.test.items;
  assert.notDeepEqual(post.map((i) => i.prompt), pre.map((i) => i.prompt), 'parallel form, not the same items');
  post.forEach((it) => { s = UI.reduce(s, { type: 'test-answer', value: it.answer }, { now: 28 * day }); });
  assert.equal(s.phase, 'summary');
  assert.equal(s.record.post.score.correct, 12);
  assert.equal(s.record.post.early, false);
  const sum = UI.renderHtml(s);
  assert.match(sum, /בפריטים שלא תורגלו: 6 מתוך 6/);
  assert.match(sum, /לא ניסוי מבוקר/);
  assert.match(sum, /בדיקת שימור תיפתח/);
});

test('screen: a wrong answer still asks for the reason and names the right one', () => {
  let s = UI.reduce(UI.createState({ record: MS.recordTest(null, 'pre', score(1), 0) }), { type: 'practice' }, { now: 0 });
  const wrong = s.task.choices.find((c) => !RM.sameAnswer(s.task.kind, c, s.task.answer));
  s = UI.reduce(s, { type: 'answer', value: wrong }, { now: 0 });
  assert.equal(s.answerOk, false);
  assert.equal(s.sub, 'explain');
  assert.match(s.message, /התשובה היא/);
  const bad = s.task.reasons.find((r) => r.id !== s.task.reasonId);
  s = UI.reduce(s, { type: 'reason', id: bad.id }, { now: 0 });
  assert.equal(s.reasonOk, false);
  assert.match(s.message, /הנימוק המתאים/);
});

test('screen: "pose a puzzle" refuses one without a solution and solves one that has it', () => {
  let s = UI.reduce(UI.createState({ record: MS.recordTest(null, 'pre', score(1), 0) }), { type: 'pose-open' }, { now: 0 });
  assert.match(UI.renderHtml(s), /המציאו חידה/);
  s = UI.reduce(s, { type: 'pose-check', draft: { voices: ['3', '4', ''], kind: 'lcm', within: '10', strokes: '', answer: '' } }, { now: 0 });
  assert.equal(s.pose.result.ok, false);
  assert.match(UI.renderHtml(s), /אין פתרון/);
  s = UI.reduce(s, { type: 'pose-check', draft: { voices: ['2', '3', '5'], kind: 'lcm', within: '', strokes: '', answer: '30' } }, { now: 0 });
  assert.equal(s.pose.result.ok, true);
  assert.match(UI.renderHtml(s), /יש לחידה פתרון: <bdi dir="ltr">30<\/bdi>\. גם התשובה שלכם נכונה/);
  assert.match(UI.renderHtml(s), /<option value="5" selected>/, 'the draft is kept');
});

test('screen: the music switch removes the play button but the task stays solvable', () => {
  let s = UI.reduce(UI.createState({ showMusic: false, record: MS.recordTest(null, 'pre', score(1), 0) }), { type: 'practice' }, { now: 0 });
  assert.doesNotMatch(UI.renderHtml(s), /data-act="play"|data-tap/);
  const on = UI.reduce(s, { type: 'music' }, { now: 0 });
  const pads = UI.renderHtml(on).match(/class="jam-pad" data-tap="[a-zA-Z]+"/g) || [];
  assert.equal(pads.length, on.task.voices.length, 'one free-play pad per voice, sounding on pointerdown');
  s = UI.reduce(s, { type: 'answer', value: s.task.answer }, { now: 0 });
  assert.equal(s.answerOk, true);
});

// ---- wiring and wording ---------------------------------------------------

test('index.html and sw.js load the three RhythmMaster files in order', () => {
  const html = read('index.html');
  assert.match(html, /id="rmCard"/);
  const a = html.indexOf('src/lib/music/rhythmMaster.js');
  const b = html.indexOf('src/lib/music/rhythmMeasure.js');
  const c = html.indexOf('src/components/RhythmMaster.js');
  const t = html.indexOf('src/lib/music/rhythmTrack.js');
  assert.ok(t > html.indexOf('src/components/jamKit.js') && t < a && a < b && b < c);
  const sw = read('sw.js');
  ['./src/lib/music/rhythmTrack.js', './src/lib/music/rhythmMaster.js', './src/lib/music/rhythmMeasure.js', './src/components/RhythmMaster.js'].forEach((f) => assert.ok(sw.includes("'" + f + "'"), f));
});

test('no "music improves maths" claim and no buy/price words in RhythmMaster text', () => {
  const text = ['src/lib/music/rhythmMaster.js', 'src/lib/music/rhythmMeasure.js', 'src/components/RhythmMaster.js']
    .map(read).join('\n').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  assert.doesNotMatch(text, /קנה|קנו|מחיר|רכישה|מנוי|מטבע|פרס/);
  assert.doesNotMatch(text, /(מוזיקה|מוסיקה|נגינה|הקצב)[^.'"]{0,30}(משפר|משפרת|מחזק|מחזקת|מעלה|משדרג)/);
  assert.doesNotMatch(text, /improves? math/i);
  assert.doesNotMatch(text, /Math\.random/, 'no randomness');
});
