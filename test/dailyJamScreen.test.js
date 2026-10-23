// #591 proposal 5/5: the DailyJam screen (spaced, mixed review + song of the week).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DJ = require('../src/components/DailyJam.js');
const S = require('../src/lib/review/scheduler.js');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

const DAY1 = '2026-10-19';

function playDay(state) {
  let s = state;
  while (s.phase === 'jam') s = DJ.next(DJ.answer(s, s.jam.items[s.pos].item.answer));
  return s;
}

function fresh(date, extra) {
  return DJ.seed(DJ.createState(Object.assign({ date: date }, extra || {})), DJ.TOPICS);
}

test('first use asks which topics were learned; at least 3 are needed', () => {
  const s = DJ.createState({ date: DAY1 });
  assert.equal(s.phase, 'setup');
  assert.match(DJ.renderHtml(s), /data-act="seed"/);
  assert.equal(DJ.seed(s, ['counting', 'patterns']).phase, 'setup');
  assert.equal(DJ.seed(s, ['counting', 'patterns', 'fractions']).phase, 'jam');
});

test('a jam mixes at least 3 topics and every item keeps its topic\'s primary way', () => {
  const s = fresh(DAY1);
  assert.ok(new Set(s.jam.items.map((i) => i.topic)).size >= 3);
  assert.ok(s.jam.items.length >= 6);
  assert.deepEqual(DJ.TOPIC_PRIMARY, { counting: 'M1', multiplication: 'M2', fractions: 'M3', patterns: 'M6' });
  s.jam.items.forEach((i) => {
    assert.equal(i.primary.mechanism, DJ.TOPIC_PRIMARY[i.topic]);
    assert.notEqual(i.primary.mechanism, 'M4');
    assert.ok(i.item.choices.map(String).includes(String(i.item.answer)), i.item.he);
  });
});

test('completing the jam adds one bar; answers feed the Leitner history', () => {
  const s = playDay(fresh(DAY1));
  assert.equal(s.phase, 'done');
  assert.equal(s.song.bars.length, 1);
  assert.equal(s.history.filter((h) => h.date === DAY1).length, s.jam.items.length);
  assert.match(s.message, /נוספה תיבה/);
  const again = DJ.createState({ date: DAY1, history: s.history, song: s.song });
  assert.equal(again.phase, 'done', 'the same day does not ask again');
});

test('a missed day keeps the bars, and on day 7 the song of the week plays', () => {
  let s = playDay(fresh(DAY1));
  for (const d of [1, 2, 4]) s = playDay(DJ.createState({ date: S.addDays(DAY1, d), history: s.history, song: s.song }));
  assert.equal(s.song.bars.length, 4, 'day 4 was missed, nothing was deleted');
  assert.doesNotMatch(DJ.renderHtml(s), /data-act="song"/);
  const day7 = playDay(DJ.createState({ date: S.addDays(DAY1, 6), history: s.history, song: s.song }));
  assert.equal(day7.song.bars.length, 5, 'day 6 was missed too');
  assert.deepEqual(day7.song.bars.map((b) => b.day), [1, 2, 3, 5, 7]);
  assert.match(DJ.renderHtml(day7), /data-act="song"/);
  assert.equal(DJ.songPlan(day7.song).length > 6, true);
});

test('the M4 bonus is hidden during the jam and shown, marked weak, only in grades ה׳-ו׳ after it', () => {
  const s = fresh(DAY1, { grade: 5 });
  assert.doesNotMatch(DJ.renderHtml(s), /data-evidence/);
  const done = playDay(s);
  assert.match(DJ.renderHtml(done), /data-evidence="weak" data-mechanism="M4"/);
  assert.doesNotMatch(DJ.renderHtml(Object.assign({}, done, { grade: 3 })), /data-evidence/);
});

test('with music the answers sound on pointerdown; without music every item is solvable silently', () => {
  const on = DJ.renderHtml(fresh(DAY1));
  assert.match(on, /data-act="answer" data-value="[^"]+" data-tap="/);
  assert.match(on, /data-act="hear"/);
  const off = fresh(DAY1, { showMusic: false });
  assert.doesNotMatch(DJ.renderHtml(off), /data-tap|data-act="hear"/);
  assert.equal(playDay(off).phase, 'done');
});

test('index.html mounts the DailyJam card, its scripts are in order and precached', () => {
  assert.match(html, /<section id="musicGames" [^>]*>[\s\S]*id="djCard"[\s\S]*<!-- #591 music games end -->/);
  const at = (src) => html.indexOf('<script src="' + src + '"></script>');
  ['src/lib/review/scheduler.js', 'src/lib/review/weeklySong.js'].forEach((s) => {
    assert.ok(at(s) > 0 && at(s) < at('src/components/DailyJam.js'), s);
    assert.ok(sw.includes("'./" + s + "'"), s + ' precached');
  });
  assert.ok(sw.includes("'./src/components/DailyJam.js'"));
});
