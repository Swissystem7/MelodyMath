'use strict';
// FenceFloor: perimeter vs area of the same rectangle (grade ה׳). The fence
// is a walk around the border, the floor is row after row of squares.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const F = require('../src/lib/music/fenceFloor');
const banks = require('../src/lib/banks');

const fenceItems = () => banks.allItems().filter((it) => it.fence);
const noReveal = (html) => html.replace(/data-reveal="[^"]*"/g, '').replace(/<[^>]+>/g, ' ');
const lastAt = (ev) => Math.max(...ev.map((n) => n.at + (n.dur || 0)));

test('1×8 and 2×4: same floor of 8, fences of 18 and 12', () => {
  const s = F.build({ world: 'jazz', rects: [[1, 8], [2, 4]], ask: 'perimeterDiff' });
  assert.deepEqual(s.rects.map((x) => [x.area, x.perimeter]), [[8, 18], [8, 12]]);
  assert.equal(s.answer, 6);
  assert.deepEqual(s.rects[0].sides, [8, 1, 8, 1]);
});

test('the fence is one note per unit edge, with no extra home note (never 19 for 18)', () => {
  const s = F.build({ world: 'jazz', rects: [[1, 8], [2, 4]], ask: 'perimeterDiff' });
  const ev = F.soundEvents(s, 0, 'fence');
  assert.equal(ev.length, 18);
  assert.deepEqual([0, 1, 2, 3].map((k) => ev.filter((n) => n.side === k).length), [8, 1, 8, 1], 'grouped by side');
  assert.equal(ev[ev.length - 1].hz, ev.filter((n) => n.side === 3)[0].hz, 'the last side holds the home note');
  const firstUp = ev.filter((n) => n.side === 0).map((n) => n.hz);
  assert.ok(firstUp.every((hz, i) => i === 0 || hz > firstUp[i - 1]), 'the first side climbs');
  const down = ev.filter((n) => n.side === 2).map((n) => n.hz);
  assert.ok(down.every((hz, i) => i === 0 || hz <= down[i - 1]), 'the third side comes down: a corner is a turn you hear');
});

test('the floor: one click per square, one held row note that is not counted', () => {
  const s = F.build({ world: 'gamelan', rects: [[2, 4], [1, 8]], ask: 'areaMax' });
  assert.equal(s, null, 'gamelan is not a FenceFloor world: no invented worlds');
  const t = F.build({ world: 'japan', rects: [[2, 4], [1, 8]], ask: 'areaMax' });
  const ev = F.soundEvents(t, 0, 'floor');
  assert.equal(ev.filter((n) => n.stage === 'floor').length, 8);
  assert.equal(ev.filter((n) => n.stage === 'row').length, 2);
  assert.equal(F.counted(t, 0, 'floor'), 8);
  assert.equal(F.counted(t, 0, 'fence'), 12);
});

test('every listen takes the same time, so a longer sound tells nothing', () => {
  const s = F.build({ world: 'gospel', rects: [[1, 5], [2, 4], [3, 3]], ask: 'areaMax' });
  [0, 1, 2].forEach((i) => {
    ['fence', 'floor'].forEach((mode) => {
      const end = lastAt(F.soundEvents(s, i, mode));
      assert.ok(Math.abs(end - F.LISTEN_SEC) < 0.35, mode + ' ' + i + ' ends at ' + end);
    });
  });
});

test('pitch only organises: the floor clicks do not change pitch with size', () => {
  const s = F.build({ world: 'mande', rects: [[1, 9], [3, 4]], ask: 'areaMax' });
  const clicks = F.soundEvents(s, 1, 'floor').filter((n) => n.stage === 'floor');
  assert.equal(new Set(clicks.map((n) => n.hz)).size, 1);
});

test('answers for each ask, and null for shapes that do not fit', () => {
  assert.equal(F.build({ world: 'andes', rects: [[2, 4], [4, 2]], ask: 'perimeterOf', index: 1 }).answer, 12);
  assert.equal(F.build({ world: 'gospel', rects: [[1, 5], [2, 4], [3, 3]], ask: 'areaMax' }).answer, 9);
  assert.equal(F.build({ world: 'jazz', rects: [[2, 4], [1, 8]], ask: 'perimeterDiff' }), null, 'a negative difference is a badly written item');
  assert.equal(F.build({ world: 'jazz', rects: [[1, 13], [2, 4]], ask: 'areaMax' }), null);
  assert.equal(F.build({ world: 'jazz', rects: [[1, 8]], ask: 'areaMax' }), null);
  assert.equal(F.build({ world: 'jazz', rects: [[1, 8], [2, 4]], ask: 'perimeterOf', index: 5 }), null);
  assert.equal(F.build({ world: 'jazz', rects: [[1, 8], [2, 4]], ask: 'what' }), null);
  assert.equal(F.build(null), null);
  assert.equal(F.rect([0, 3]), null);
});

test('the picture shows both rectangles and hides every count until the answer', () => {
  const s = F.build({ world: 'jazz', rects: [[1, 8], [2, 4]], ask: 'perimeterDiff' });
  const open = F.html(s);
  assert.equal((open.match(/class="ff-cell"/g) || []).length, 16);
  assert.equal((open.match(/data-mode="fence"/g) || []).length, 2);
  assert.match(open, /אותו מלבן, מקשיבים אחרת/);
  assert.match(open, /סופרים צעדים ומשבצות, לא שניות/);
  assert.doesNotMatch(noReveal(open), /18|12/);
  const shown = F.html(s, { revealed: true });
  assert.match(shown, /8\+1\+8\+1 = 18/);
  assert.match(shown, /1 שורות של 8 = 8|שורות של 8 = 8/);
  assert.equal(F.html(null), '');
});

test('no bank item shows its own answer before the child answers', () => {
  fenceItems().forEach((it) => {
    const open = noReveal(F.html(F.specForItem(it)));
    assert.ok(!new RegExp('(^|[^0-9×])' + it.answer + '([^0-9×]|$)').test(open), it.prompt + ' leaks ' + it.answer);
  });
});

test('feedback for the expected wrong answers never names the answer', () => {
  const cases = [
    [{ world: 'jazz', rects: [[1, 8], [2, 4]], ask: 'perimeterDiff' }, [0, 8, 2]],
    [{ world: 'mande', rects: [[1, 9], [3, 4]], ask: 'areaMax' }, [20, 14, 9]],
    [{ world: 'andes', rects: [[2, 4], [4, 2]], ask: 'perimeterOf', index: 1 }, [8, 6]],
  ];
  cases.forEach(([raw, wrongs]) => {
    const s = F.build(raw);
    wrongs.forEach((w) => {
      const f = F.feedbackFor(s, w);
      assert.ok(f.length > 10);
      assert.ok(!new RegExp('(^|[^0-9])' + s.answer + '([^0-9]|$)').test(f), f);
    });
    assert.equal(F.feedbackFor(s, s.answer), '');
  });
  assert.match(F.feedbackFor(F.build(cases[1][0]), 20), /גדר/);
  assert.equal(F.feedbackFor(null, 1), '');
});

test('the bank: six items, six musical worlds, each answer equal to what is heard', () => {
  const items = fenceItems();
  assert.equal(items.length, 6);
  const worlds = items.map((it) => it.fence.world);
  assert.equal(new Set(worlds).size, 6);
  items.forEach((it) => {
    const s = F.specForItem(it);
    assert.ok(s, it.prompt);
    assert.equal(s.answer, it.answer, it.prompt);
    assert.equal(it.grade, 'ה');
    assert.ok(it.musicExtra.some((w) => w.music === 'fenceFloor' && w.evidence === 'weak'), 'an EXTRA way, honestly marked weak');
  });
  assert.equal(banks.mechanismOf('fenceFloor'), 'M7');
  assert.equal(F.MECHANISM, 'M7');
  const all = banks.allItems().map((it) => it.prompt);
  items.forEach((it) => assert.equal(all.filter((p) => p === it.prompt).length, 1, 'no duplicate: ' + it.prompt));
});

test('the sequence covers the research tasks: same area, same tiles, rotation, opposite growth, same fence, the square', () => {
  const asks = fenceItems().map((it) => it.fence);
  assert.ok(asks.some((f) => f.ask === 'perimeterDiff' && f.rects[0][0] * f.rects[0][1] === f.rects[1][0] * f.rects[1][1]));
  assert.ok(asks.some((f) => f.ask === 'perimeterOf' && f.rects[0][0] === f.rects[1][1]), 'rotation keeps the perimeter');
  const square = asks.find((f) => f.rects.length === 3);
  assert.ok(square && square.rects.some(([r, c]) => r === c), 'the square has the largest floor for a fence');
});

test('specForItem needs the way and the fence data, never on a no-music check', () => {
  const raw = { world: 'jazz', rects: [[1, 8], [2, 4]], ask: 'perimeterDiff' };
  assert.ok(F.specForItem({ fence: raw, musicExtra: [{ music: 'fenceFloor' }] }));
  assert.equal(F.specForItem({ fence: raw }), null);
  assert.equal(F.specForItem({ fence: raw, music: 'fenceFloor', noMusic: true }), null);
  assert.equal(F.specForItem(null), null);
  F.NO_MUSIC_CHECK_ITEMS.forEach((q) => {
    assert.ok(q.noMusic && Number.isInteger(q.answer));
    assert.doesNotMatch(q.prompt, /צליל|גדר|רצפה|מוזיק|צעד/);
  });
});

test('play uses the page audio and stays silent in Node', () => {
  const s = F.build({ world: 'balkan', rects: [[1, 6], [2, 3]], ask: 'perimeterDiff' });
  const calls = [];
  const r = F.play(s, 1, 'fence', { audioContext: { currentTime: 0, state: 'running' }, playVoice: (ac, v, hz, at) => calls.push([v, hz, at]) });
  assert.equal(r.notes, 10);
  assert.ok(calls.every((c) => c[0] === 'breathy'), 'the kaval walks the fence');
  assert.equal(F.play(s, 0, 'floor', {}).silent, true);
  assert.equal(F.play(s, 7, 'fence', {}), null);
});

test('index.html loads and draws the widget, plays per rectangle and mode, reveals after the answer', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /src="src\/lib\/music\/fenceFloor\.js"/);
  assert.match(html, /MM_FENCE_FLOOR\.play\(ff, Number\(b\.getAttribute\('data-i'\)\), b\.getAttribute\('data-mode'\)\)/);
  assert.match(html, /host\._fenceSpec && typeof MM_FENCE_FLOOR!=='undefined'/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /fenceFloor\.js/);
});
