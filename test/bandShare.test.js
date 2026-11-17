'use strict';
// BandShare: percent with a changing base (grade ו׳). The whole is a band of
// one musical world; the counted part is heard one note per player.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const B = require('../src/lib/music/bandShare');
const banks = require('../src/lib/banks');

const bandItems = () => banks.allItems().filter((it) => it.band);
const noReveal = (html) => html.replace(/data-reveal="[^"]*"/g, '');

test('percentOf: the takht has 6 sections, 3 strings play, so 50%', () => {
  const s = B.build({ kind: 'percentOf', ensemble: 'takht', sections: 6, whole: 6, part: 3, pick: [0, 1, 3] });
  assert.equal(s.answer, 50);
  assert.equal(s.bands[0].count, 6);
  assert.deepEqual(s.bands[0].sections.filter((x) => x.playing).map((x) => x.he), ['עוּד', 'קאנון', 'כינור']);
  assert.deepEqual(s.hearCheck.a, [6, 3]);
});

test('wholeFrom: 12 tamborims are 30% of the bateria, heard as 3 groups of 4', () => {
  const s = B.build({ kind: 'wholeFrom', ensemble: 'samba', sections: 10, percent: 30, part: 12, pick: 'טמבורים' });
  assert.equal(s.answer, 40);
  assert.equal(s.counted[0].group, 4);
  const ev = B.soundEvents(s);
  assert.equal(ev.filter((n) => n.stage === 'part').length, 12, 'one note per player');
  assert.equal(ev.filter((n) => n.stage === 'countAid').length, 3, 'a bell at the start of each block of 10%');
  assert.equal(ev.filter((n) => n.stage === 'enter').length, 10, 'the ten blocks enter one by one');
  assert.ok(s.bands[0].sections.filter((x) => x.playing).every((x) => x.he === 'טמבורים'));
});

test('twoWholes keeps one world and one counted timbre: only the size changes (Meta AI review)', () => {
  const s = B.build({ kind: 'twoWholes', ensemble: 'gamelan', pick: 'גנגסה', a: { sections: 4, percent: 25, part: 5 }, b: { sections: 4, percent: 25, part: 10 }, ask: 'second' });
  assert.equal(s.answer, 40);
  assert.deepEqual(s.wholes, [20, 40]);
  assert.equal(s.counted[0].voice, s.counted[1].voice);
  assert.equal(s.bands[0].ensemble, s.bands[1].ensemble);
  const ev = B.soundEvents(s);
  assert.equal(ev.filter((n) => n.stage === 'part' && n.band === 'a').length, 5);
  assert.equal(ev.filter((n) => n.stage === 'part' && n.band === 'b').length, 10);
});

test('twoWholes difference: the same 15 players are 30% of 50 and 50% of 30', () => {
  const s = B.build({ kind: 'twoWholes', ensemble: 'rock', a: { sections: 10, percent: 30, part: 15 }, b: { sections: 6, percent: 50, part: 15 }, ask: 'difference' });
  assert.deepEqual(s.wholes, [50, 30]);
  assert.equal(s.answer, 20);
  assert.equal(s.counted[0].players, s.counted[1].players);
});

test('change: 10 leave and only 8 come back in the same timbre, so the band ends at 48', () => {
  const s = B.build({ kind: 'change', ensemble: 'symphony', sections: 5, whole: 50, down: 20, up: 20, pick: 'כלי נשיפה ממתכת' });
  assert.equal(s.answer, 48);
  assert.notEqual(s.answer, s.whole);
  const ev = B.soundEvents(s);
  const leave = ev.filter((n) => n.stage === 'leave'), join = ev.filter((n) => n.stage === 'join');
  assert.equal(leave.length, 10);
  assert.equal(join.length, 8);
  assert.equal(leave[0].voice, join[0].voice);
  assert.ok(Math.max(...leave.map((n) => n.at)) < Math.min(...join.map((n) => n.at)), 'leaving is heard before joining');
});

test('numbers that do not fit the sections give no spec', () => {
  assert.equal(B.build({ kind: 'wholeFrom', ensemble: 'chamber', sections: 4, percent: 30, part: 12 }), null);
  assert.equal(B.build({ kind: 'wholeFrom', ensemble: 'chamber', sections: 4, percent: 25, part: 0 }), null);
  assert.equal(B.build({ kind: 'percentOf', ensemble: 'takht', sections: 6, whole: 7, part: 3 }), null);
  assert.equal(B.build({ kind: 'percentOf', ensemble: 'nowhere', sections: 4, whole: 8, part: 2 }), null);
  assert.equal(B.build({ kind: 'wholeFrom', ensemble: 'samba', sections: 10, percent: 30, part: 33 }), null, 'too many players to count by ear');
  assert.equal(B.build({ kind: 'change', ensemble: 'symphony', sections: 5, whole: 50, down: 30, up: 20 }), null, '15 leaving is not whole sections');
  assert.equal(B.build(null), null);
  assert.equal(B.sectionsOf('takht', 11), null);
  assert.equal(B.sectionsOf('takht', 7), null, 'never invents a section the tradition does not have');
});

test('a silent section is silence: only playing sections sound in the part stage, and nothing knocks', () => {
  const s = B.build({ kind: 'wholeFrom', ensemble: 'chamber', sections: 4, percent: 25, part: 10, pick: 'כלי קשת' });
  const part = B.soundEvents(s).filter((n) => n.stage === 'part');
  assert.ok(part.every((n) => n.voice === 'bowed'));
  assert.ok(B.soundEvents(s).every((n) => ['enter', 'part', 'countAid', 'tutti'].includes(n.stage)));
  assert.ok(B.soundEvents(s).filter((n) => n.stage === 'countAid').every((n) => n.voice === B.BELL_VOICE && n.gain < 0.1), 'the counting bell is a quiet separate layer');
});

test('the picture hides what the child must find and shows it after the answer', () => {
  const s = B.build({ kind: 'wholeFrom', ensemble: 'chamber', sections: 4, percent: 25, part: 10, pick: 'כלי קשת' });
  const open = B.html(s);
  assert.match(open, /\? נגנים = 100%/);
  assert.match(open, /band-predict/);
  assert.match(open, /עזרה לספירה, לא חלק מהשיר/);
  assert.match(open, /data-reveal="/);
  const shown = B.html(s, { revealed: true });
  assert.match(shown, /40 נגנים = 100%/);
  assert.doesNotMatch(shown, /band-predict/);
  assert.equal(B.html(null), '');
});

test('no bank item shows its own answer before the child answers', () => {
  bandItems().forEach((it) => {
    const s = B.specForItem(it);
    const open = noReveal(B.html(s));
    const ans = String(it.answer);
    assert.ok(!new RegExp('(^|[^0-9])' + ans + '([^0-9]|$)').test(open.replace(/<[^>]+>/g, ' ')), it.prompt + ' leaks ' + ans);
  });
});

test('feedback for the expected wrong answers never names the answer', () => {
  const cases = [
    [{ kind: 'change', ensemble: 'symphony', sections: 5, whole: 50, down: 20, up: 20 }, [50, 40, 60]],
    [{ kind: 'wholeFrom', ensemble: 'samba', sections: 10, percent: 30, part: 12 }, [12, 30, 360, 4]],
    [{ kind: 'percentOf', ensemble: 'takht', sections: 6, whole: 6, part: 3 }, [3, 6]],
    [{ kind: 'twoWholes', ensemble: 'rock', a: { sections: 10, percent: 30, part: 15 }, b: { sections: 6, percent: 50, part: 15 }, ask: 'difference' }, [0, 15]],
  ];
  cases.forEach(([raw, wrongs]) => {
    const s = B.build(raw);
    wrongs.forEach((w) => {
      const f = B.feedbackFor(s, w);
      assert.ok(f.length > 10, raw.kind + ' ' + w);
      assert.ok(!new RegExp('(^|[^0-9])' + s.answer + '([^0-9]|$)').test(f), f);
    });
    assert.equal(B.feedbackFor(s, s.answer), '');
  });
  assert.match(B.feedbackFor(B.build(cases[0][0]), 50), /מהלהקה הקטנה/);
  assert.equal(B.feedbackFor(null, 3), '');
});

test('the bank: seven band items, each its own musical world, each answer equal to what is heard', () => {
  const items = bandItems();
  assert.equal(items.length, 7);
  const worlds = items.map((it) => it.band.ensemble);
  assert.equal(new Set(worlds).size, worlds.length, 'a different world in every exercise');
  items.forEach((it) => {
    const s = B.specForItem(it);
    assert.ok(s, it.prompt);
    assert.equal(s.answer, it.answer, it.prompt);
    assert.ok(it.musicExtra.some((w) => w.music === 'bandShare' && w.evidence === 'experimental'), 'an EXTRA way, marked experimental');
  });
  assert.equal(banks.mechanismOf('bandShare'), 'M2');
});

test('no duplicates: every band prompt appears once in the whole bank', () => {
  const all = banks.allItems().map((it) => it.prompt);
  bandItems().forEach((it) => assert.equal(all.filter((p) => p === it.prompt).length, 1, it.prompt));
});

test('the way exists only where it fits: finding the whole and percent change, never percent of a quantity', () => {
  const ways = (std) => banks.waysCarried('ו', std).map((w) => w[0]);
  const whole = banks.allItems().find((it) => it.band && it.band.kind === 'wholeFrom').standard;
  const change = banks.allItems().find((it) => it.band && it.band.kind === 'change').standard;
  assert.ok(ways(whole).includes('bandShare'));
  assert.ok(ways(change).includes('bandShare'));
  assert.ok(ways(whole).length <= 4 && ways(change).length <= 4);
});

test('specForItem needs both the way and the band, and never runs on a no-music check', () => {
  const raw = { kind: 'percentOf', ensemble: 'klezmer', sections: 5, whole: 5, part: 1, pick: 'קלרינט' };
  assert.ok(B.specForItem({ band: raw, music: 'bandShare' }));
  assert.ok(B.specForItem({ band: raw, musicExtra: [{ music: 'bandShare' }] }));
  assert.equal(B.specForItem({ band: raw }), null);
  assert.equal(B.specForItem({ band: raw, music: 'bandShare', noMusic: true }), null);
  assert.equal(B.specForItem({ music: 'bandShare' }), null);
  assert.equal(B.specForItem(null), null);
});

test('the transfer check has no band, no sound words and whole-number answers', () => {
  assert.equal(B.NO_MUSIC_CHECK_ITEMS.length, 4);
  B.NO_MUSIC_CHECK_ITEMS.forEach((q) => {
    assert.ok(q.noMusic && Number.isInteger(q.answer));
    assert.doesNotMatch(q.prompt, /נגן|להקה|תזמורת|צליל|מוזיק/);
  });
});

test('play uses the page audio when there is one, and stays silent in Node', () => {
  const s = B.build({ kind: 'percentOf', ensemble: 'klezmer', sections: 5, whole: 5, part: 1, pick: 'קלרינט' });
  const calls = [];
  const r = B.play(s, { audioContext: { currentTime: 0, state: 'running' }, playVoice: (ac, v, hz, at) => calls.push([v, hz, at]) });
  assert.equal(r.notes, calls.length);
  assert.ok(calls.some((c) => c[0] === 'reed'), 'the clarinet plays');
  const seq = [];
  assert.equal(B.play(s, { playSequence: (x) => seq.push(...x) }).notes, seq.length);
  assert.equal(B.play(s, {}).silent, true);
  assert.equal(B.play(null, {}), null);
});

test('index.html loads the widget, draws it before the generic ones and reveals it after the answer', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /src="src\/lib\/music\/bandShare\.js"/);
  assert.ok(html.indexOf('MM_BAND_SHARE.specForItem(item)') < html.indexOf('MM_TAKEAWAY_TEN.specForItem(item)'));
  assert.match(html, /host\._bandSpec && typeof MM_BAND_SHARE!=='undefined'/);
  assert.match(html, /\.band-on\{/);
});
