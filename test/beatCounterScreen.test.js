// #591 proposal 3/5: the BeatCounter screen (M1 steady-beat counting).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const BCS = require('../src/components/BeatCounter.js');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

function fill(state) {
  return state.first.slots.reduce((s, _, i) => BCS.place(s, i), state);
}

test('counting 7 beats: one object per beat, a second tap on a full slot gets the gentle hint', () => {
  let s = BCS.createState(1);
  assert.equal(s.first.count, 7);
  assert.equal(s.first.primary.mechanism, 'M1');
  s = BCS.place(s, 0);
  const again = BCS.place(s, 0);
  assert.equal(again.message, 'כל צליל = חפץ אחד');
  assert.equal(again.first.slots.filter(Boolean).length, 1, 'still one object');
  s = fill(s);
  assert.equal(s.phase, 'total');
  assert.equal(BCS.answerTotal(s, 6).phase, 'total');
  s = BCS.answerTotal(s, 7);
  assert.equal(s.phase, 'compare');
});

test('the second round changes tempo and instrument; "שווה" when the count is the same', () => {
  let s = BCS.answerTotal(fill(BCS.createState(1)), 7);
  assert.equal(s.second.count, 7);
  assert.notEqual(s.second.bpm, s.first.bpm);
  assert.equal(s.second.instrument, 'kalimba');
  assert.equal(BCS.answerCompare(s, 'יותר').phase, 'compare');
  s = BCS.answerCompare(s, 'שווה');
  assert.equal(s.phase, 'done');
  const more = BCS.answerTotal(fill(BCS.createState(2)), 4);
  assert.equal(BCS.answerCompare(more, 'יותר').phase, 'done');
});

test('the weak M5 extra is hidden before the exercise is solved and marked weak after', () => {
  const s = BCS.answerTotal(fill(BCS.createState(1)), 7);
  assert.doesNotMatch(BCS.renderHtml(s), /data-evidence/);
  const done = BCS.renderHtml(BCS.answerCompare(s, 'שווה'));
  assert.match(done, /data-evidence="weak" data-mechanism="M5"/);
  assert.match(done, /תרגול נוסף \(ראיות חלשות\)/);
  BCS.EXERCISES.forEach((_, i) => assert.equal(BCS.createState(i).first.primary.mechanism, 'M1', 'M5 is never the primary way'));
});

test('the beat plan has one bell per beat at the round tempo', () => {
  const r = BCS.createState(1).first;
  const plan = BCS.beatPlan(r, 'metalBell');
  assert.equal(plan.length, 7);
  assert.deepEqual(plan.map((n) => n.slot), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(Math.round(plan[1].at * 1000), 750);
});

test('with music the slots are bells on pointerdown; without music it is plain object counting', () => {
  const on = BCS.renderHtml(BCS.createState(0, true));
  assert.match(on, /data-act="slot" data-slot="0" data-tap="metalBell"/);
  assert.match(on, /data-act="play"/);
  const offState = BCS.createState(0, false);
  const off = BCS.renderHtml(offState);
  assert.doesNotMatch(off, /data-tap|data-act="play"/);
  assert.match(off, /סופרים חפצים/);
  const solved = BCS.answerCompare(BCS.answerTotal(fill(offState), 5), 'שווה');
  assert.equal(solved.phase, 'done', 'solvable with the music off');
  assert.doesNotMatch(BCS.renderHtml(solved), /data-tap/);
});

test('index.html mounts the BeatCounter card, its scripts are in order and precached', () => {
  assert.match(html, /<section id="musicGames" [^>]*>[\s\S]*id="bcCard"[\s\S]*<!-- #591 music games end -->/);
  const at = (src) => html.indexOf('<script src="' + src + '"></script>');
  assert.ok(at('src/lib/music/beatCounter.js') > 0 && at('src/lib/music/beatCounter.js') < at('src/components/BeatCounter.js'));
  assert.ok(at('src/components/jamKit.js') < at('src/components/BeatCounter.js'));
  ['src/lib/music/beatCounter.js', 'src/components/BeatCounter.js'].forEach((s) => assert.ok(sw.includes("'./" + s + "'"), s));
});
