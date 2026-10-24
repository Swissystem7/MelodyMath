// #665 example exercise: SoundAdd (addition heard as drums, grades א׳–ב׳).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SA = require('../src/components/SoundAdd.js');
const page = fs.readFileSync(path.join(__dirname, '..', 'exercise.html'), 'utf8');

function taps(state, n) {
  let s = state;
  for (let i = 0; i < n; i++) s = SA.tap(s);
  return s;
}

test('numbersToBeats: one sound per unit, low drums then a pause then high drums', () => {
  SA.ITEMS.forEach(([a, b]) => {
    const notes = SA.numbersToBeats(a, b);
    assert.equal(notes.length, a + b, a + ' + ' + b);
    assert.equal(notes.filter((n) => n.voice === 'drumLow').length, a);
    assert.equal(notes.filter((n) => n.voice === 'drumHigh').length, b);
    assert.deepEqual(notes.map((n) => n.dot), [...Array(a + b).keys()], 'every sound lights its own circle');
  });
  const n = SA.numbersToBeats(3, 2, 0.4, 0.5);
  assert.ok(n[3].at - n[2].at > n[1].at - n[0].at, 'the gap between the groups is longer than a beat');
  assert.equal(n[0].at, 0, 'the first sound is at once, well inside one second');
});

test('a right answer plays a rising scale, one note per dot', () => {
  const s = SA.check(taps(SA.createState({ stage: 'sound', item: [3, 2] }), 5));
  assert.equal(s.status, 'right');
  assert.equal(s.sound, 'scale');
  assert.match(s.message, /3 \+ 2 = 5/);
  const scale = SA.scalePlan(5);
  assert.equal(scale.length, 5);
  scale.slice(1).forEach((x, i) => assert.ok(x.hz > scale[i].hz, 'rising'));
});

test('a wrong answer gives a second try with a hint that names what is missing', () => {
  const s = SA.check(taps(SA.createState({ stage: 'sound', item: [3, 2] }), 4));
  assert.equal(s.status, 'retry');
  assert.equal(s.sound, 'hint');
  assert.deepEqual(s.hint, { missing: 1 });
  assert.match(s.message, /חסרה הקשה אחת/);
  const html = SA.renderHtml(s);
  assert.match(html, /data-act="tap" data-tap="drumLow" aria-label/, 'the pad stays active for the second try');
  assert.equal((html.match(/sa-missing/g) || []).length, 1, 'the missing dot is drawn');
  assert.match(html, /data-act="listen"/, 'the counted replay is offered');
  const plan = SA.countPlan([3, 2]);
  assert.deepEqual(plan.map((n) => n.count), [1, 2, 3, 4, 5], 'the replay counts every sound');

  const over = SA.check(taps(SA.createState({ stage: 'sound', item: [3, 2] }), 7));
  assert.deepEqual(over.hint, { extra: 2 });
  assert.equal((SA.renderHtml(over).match(/sa-extra/g) || []).length, 2);
});

test('the second try can be right; two wrong tries show the solution and step back', () => {
  let s = SA.check(taps(SA.createState({ stage: 'picture', item: [4, 1] }), 3));
  s = SA.check(SA.tap(SA.tap(s)));
  assert.equal(s.status, 'right');
  assert.equal(s.streak, 0, 'a hinted answer does not count towards the next stage');

  let w = SA.check(taps(SA.createState({ stage: 'picture', item: [4, 1] }), 3));
  w = SA.check(w);
  assert.equal(w.status, 'shown');
  assert.equal(w.sound, 'solution');
  assert.match(w.message, /4 \+ 1 = 5/);
  assert.equal(SA.next(w).stage, 'sound', 'support comes back after a miss');
});

test('CRA: example, sound, picture, symbol, silent; two right first tries move on', () => {
  let s = SA.createState();
  assert.equal(s.stage, 'example');
  assert.equal(s.taps, SA.ITEMS[0][0] + SA.ITEMS[0][1] - 1, 'the worked example leaves one tap for the child');
  s = SA.next(SA.check(SA.tap(s)));
  const seen = [s.stage];
  for (let round = 0; round < 12; round++) {
    s = SA.check(taps(s, s.item[0] + s.item[1]));
    s = SA.next(s);
    if (seen[seen.length - 1] !== s.stage) seen.push(s.stage);
  }
  assert.deepEqual(seen, ['sound', 'picture', 'symbol', 'silent']);
  assert.ok(SA.mastered(s), 'two right first tries in the silent stage = mastered');
});

test('the silent stage plays nothing and still needs the answer', () => {
  const s = SA.createState({ stage: 'silent', item: [2, 2] });
  const html = SA.renderHtml(s);
  assert.doesNotMatch(html, /data-tap=/);
  assert.doesNotMatch(html, /data-act="listen"/);
  assert.match(html, /2 \+ 2 = \?/);
});

test('the child card stays under 15 words, with no sources or curriculum lines', () => {
  Object.keys(SA.PROMPTS).forEach((k) => assert.ok(SA.wordCount(SA.PROMPTS[k]) <= 15, k));
  SA.STAGES.forEach((stage) => {
    [SA.createState({ stage }), SA.check(SA.createState({ stage }))].forEach((s) => {
      const text = SA.renderHtml(s).replace(/<[^>]+>/g, ' ').replace(/[🥁▶↩←⭐+=?]/gu, ' ');
      assert.ok(SA.wordCount(text.replace(/\d+/g, ' ')) <= 15, stage + ': ' + text);
      assert.doesNotMatch(text, /doi|et al|תוכנית הלימודים|Hz/);
    });
  });
});

test('exercise.html: the exercise comes first, teacher text folded, scripts precached', () => {
  assert.ok(page.indexOf('id="saCard"') < page.indexOf('<details class="sa-teacher"'), 'exercise above the teacher text');
  assert.match(page, /<summary>למורה ▸<\/summary>/);
  const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  [...page.matchAll(/(?:src|href)="(src\/[^"]+)"/g)].forEach((m) => assert.ok(sw.includes("'./" + m[1] + "'"), m[1] + ' not precached'));
});
