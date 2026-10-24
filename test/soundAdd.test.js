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

// #671: the other answer types on the same base (choice, drag, number line).
function answer(s, n) { return s.mode === 'choice' || s.mode === 'line' ? SA.pick(s, n) : taps(s, n - s.taps); }

test('every answer type: right plays the scale, wrong gives a hinted second try, two wrong show the solution', () => {
  SA.MODES.forEach((mode) => {
    const s0 = SA.createState({ stage: 'sound', mode, item: [3, 2], index: 0 });
    const right = SA.check(answer(s0, 5));
    assert.equal(right.status, 'right', mode);
    assert.equal(right.sound, 'scale', mode);
    let w = SA.check(answer(s0, 4));
    assert.equal(w.status, 'retry', mode);
    assert.equal(w.sound, 'hint', mode);
    assert.deepEqual(w.hint, { missing: 1 }, mode);
    assert.match(SA.renderHtml(w), /data-act="listen"/, mode + ': the counted replay is offered');
    assert.equal((SA.renderHtml(w).match(/sa-missing/g) || []).length, 1, mode + ': the missing dot is drawn');
    w = SA.check(answer(w, 6));
    assert.equal(w.status, 'shown', mode);
    assert.equal(SA.next(w).stage, 'sound', mode + ': support comes back after a miss');
    assert.equal(SA.next(w).mode, mode, 'the answer type stays');
  });
});

test('every answer type walks the CRA stages to mastery', () => {
  SA.MODES.forEach((mode) => {
    let s = SA.createState({ mode });
    if (mode === 'tap' || mode === 'drag') s = SA.tap(s);
    assert.equal(s.taps, s.item[0] + s.item[1], mode + ': the worked example ends on the answer');
    s = SA.next(SA.check(s));
    const seen = [s.stage];
    for (let round = 0; round < 12; round++) {
      s = SA.next(SA.check(answer(s, s.item[0] + s.item[1])));
      if (seen[seen.length - 1] !== s.stage) seen.push(s.stage);
    }
    assert.deepEqual(seen, ['sound', 'picture', 'symbol', 'silent'], mode);
    assert.ok(SA.mastered(s), mode);
  });
});

test('choice: three numbers with the sum in a moving place; a wrong one is crossed out', () => {
  const places = new Set();
  SA.ITEMS.forEach(([a, b], i) => {
    const c = SA.choices([a, b], i);
    assert.equal(new Set(c).size, 3);
    assert.ok(c.includes(a + b));
    places.add(c.indexOf(a + b));
  });
  assert.equal(places.size, 3, 'the right answer is not always in the same place');
  const s = SA.createState({ stage: 'picture', mode: 'choice', item: [3, 2], index: 0 });
  assert.equal(s.taps, null);
  assert.match(SA.renderHtml(s), /data-act="check" disabled/, 'nothing to check before a pick');
  assert.equal(SA.check(s).status, 'ready');
  const w = SA.check(SA.pick(s, 4));
  assert.match(w.message, /קטן מדי/);
  assert.match(SA.renderHtml(w), /class="sa-opt sa-wrong" data-act="pick" data-n="4"[^>]* disabled/);
  assert.equal(SA.pick(w, 4).taps, 4, 'a crossed-out number cannot be picked again');
  assert.equal(SA.pick(w, 6).taps, 6);
});

test('line: a 0-10 number line, every sum lands on it, one hop per sound', () => {
  const html = SA.renderHtml(SA.createState({ stage: 'sound', mode: 'line', item: [3, 2] }));
  assert.equal((html.match(/class="sa-tick[^"]*"/g) || []).length, SA.LINE_MAX + 1);
  assert.match(html, /data-tick="0"/);
  assert.match(html, /data-tick="10"/);
  SA.ITEMS.forEach(([a, b]) => assert.ok(a + b <= SA.LINE_MAX));
  const shown = SA.check(SA.check(SA.pick(SA.createState({ stage: 'sound', mode: 'line', item: [3, 2] }), 7)));
  assert.match(shown.message, /3 \+ 2 = 5/);
  assert.match(SA.renderHtml(shown), /sa-tick sa-right" data-act="pick" data-n="5"/, 'the solution is marked on the line');
});

test('drag: a basket and a pile the child can also tap, hints speak of circles', () => {
  const s = SA.createState({ stage: 'sound', mode: 'drag', item: [3, 2] });
  const html = SA.renderHtml(s);
  assert.match(html, /class="sa-answer sa-basket"/);
  assert.match(html, /class="sa-pad sa-source" data-act="tap" data-tap="drumLow"/, 'tapping the pile works without dragging');
  assert.match(html, /data-act="untap"/);
  assert.match(SA.check(taps(s, 3)).message, /חסרים 2 עיגולים בסל/);
  assert.match(SA.check(taps(s, 6)).message, /יש בסל עיגול אחד יותר מדי/);
});

test('every answer type: silent plays nothing, the card stays under 15 words', () => {
  SA.MODES.forEach((mode) => {
    const silent = SA.renderHtml(SA.createState({ stage: 'silent', mode, item: [2, 2] }));
    assert.doesNotMatch(silent, /data-tap=|data-act="listen"/, mode);
    SA.STAGES.forEach((stage) => {
      const s = SA.createState({ stage, mode });
      [s, SA.check(answer(s, 1))].forEach((x) => {
        const text = SA.renderHtml(x).replace(/<[^>]+>/g, ' ').replace(/[🥁🔵▶↩←⭐+=?]/gu, ' ');
        assert.ok(SA.wordCount(text.replace(/\d+/g, ' ')) <= 15, mode + '/' + stage + ': ' + text);
      });
    });
  });
});

test('exercise.html links every answer type for the teacher', () => {
  SA.MODES.forEach((m) => assert.ok(page.includes('href="?mode=' + m + '"'), m));
  assert.ok(page.indexOf('?mode=') > page.indexOf('<details class="sa-teacher"'), 'the links sit in the teacher text, not above the exercise');
});
