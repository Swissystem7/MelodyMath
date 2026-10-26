'use strict';
// Refs #689, Refs #665: takeAwayBeats is primary only for SUB10, SUB20 and
// WORD_REMOVE; SUB2D primary is tensBarsBack, even/odd primary is alternateDrums, and tenExchange stays EXTRA there. One circle per
// sound; the end-of-topic check carries no music.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const mod = require('../src/lib/music/takeAwayTen');
const banks = require('../src/lib/banks');
const uc = require('../src/lib/unitCheck');

test('takeAwayBeats: one circle per sound, beats disappear one by one', () => {
  const s = mod.takeAwayCircles(8, 3);
  assert.equal(s.circles.length, 8); // one circle per sound
  assert.equal(s.circles.filter((c) => c.kind === 'beat').length, 8);
  assert.equal(s.circles.filter((c) => c.gone).length, 3);
  assert.equal(s.remaining, 5);
  assert.deepEqual(mod.takeAwaySteps(8, 3), [8, 7, 6, 5]); // one by one
  assert.equal(mod.takeAwayCircles(5, 5).remaining, 0);
  assert.equal(mod.takeAwayCircles(3, 4), null);
  assert.equal(mod.takeAwayCircles(0, 0), null);
});

test('tenExchange: 10 bells become one drum, one circle per sound-object', () => {
  const x = mod.tenExchange(27);
  assert.equal(x.drums, 2);
  assert.equal(x.left, 7);
  assert.equal(x.circles.length, 2 + 7); // drums + leftover bells
  assert.equal(x.circles.filter((c) => c.kind === 'drum').length, 2);
  assert.equal(x.circles.filter((c) => c.kind === 'bell').length, 7);
  assert.equal(mod.tenExchange(10).drums, 1);
  assert.equal(mod.tenExchange(10).left, 0);
  assert.equal(mod.tenExchange(9).drums, 0);
  assert.equal(mod.tenExchange(-1), null);
});

test('specForItem builds a widget spec only for takeAwayBeats and tenExchange', () => {
  const sub = mod.specForItem({ music: 'takeAwayBeats', prompt: '8 − 3 = ?' });
  assert.equal(sub.kind, 'takeAway');
  assert.equal(sub.remaining, 5);
  const pv = mod.specForItem({ music: 'tenExchange', prompt: 'כמה עשרות ב־34?' });
  assert.equal(pv.kind, 'tenExchange');
  assert.equal(pv.drums, 3);
  assert.equal(mod.specForItem({ music: 'fillBar', prompt: '8 − 3 = ?' }), null);
  assert.equal(mod.specForItem(null), null);
  assert.equal(mod.tenExchange(356).hundreds, 3);
  assert.equal(mod.tenExchange(356).drums, 5);
  // Real shipped prompts, not only toy ones: two-digit subtraction and a
  // three-digit place-value question both get circles from their own numbers.
  const shipped = banks.allItems();
  const sub2d = shipped.find((it) => it.prompt === '58 − 23 = ?');
  assert.ok(sub2d, 'shipped two-digit subtraction item exists');
  assert.equal(sub2d.music, 'tensBarsBack');
  assert.ok(sub2d.musicExtra.some((w) => w.music === 'takeAwayBeats'));
  assert.equal(mod.specForItem({ music: 'takeAwayBeats', prompt: sub2d.prompt }).remaining, 35);
  assert.equal(mod.specForItem({ music: 'takeAwayBeats', prompt: sub2d.prompt }).circles.length, 58);
  const pv356 = shipped.find((it) => /356/.test(it.prompt) && /עשרות/.test(it.prompt));
  assert.ok(pv356, 'shipped 356 place-value item exists');
  assert.equal(pv356.music, 'alternateDrums');
  assert.ok(pv356.musicExtra.some((w) => w.music === 'tenExchange'));
  assert.equal(mod.specForItem({ music: 'tenExchange', prompt: '356' }).drums, 5);
  assert.equal(mod.specForItem({ music: 'tenExchange', prompt: '200 + 30 + 4 = ?' }), null);
  const html = mod.circlesHtml(sub);
  assert.equal((html.match(/class="snd-circle /g) || []).length, 8); // one circle per sound in the DOM string
});

test('SUB2D primary is tensBarsBack, even/odd primary is alternateDrums, takeAwayBeats primary only in SUB10/SUB20/WORD_REMOVE', () => {
  const g1 = require('../src/lib/curriculum/grade1');
  const g2 = require('../src/lib/curriculum/grade2');
  assert.equal(banks.primaryWays(g1.music.SUB10)[0][0], 'takeAwayBeats');
  assert.equal(banks.primaryWays(g1.music.SUB20)[0][0], 'takeAwayBeats');
  assert.equal(banks.primaryWays(g2.music.SUB2D)[0][0], 'tensBarsBack');
  assert.equal(banks.primaryWays(g1.music.WORD_REMOVE)[0][0], 'takeAwayBeats');
  assert.equal(banks.primaryWays(g2.music.WORD_REMOVE)[0][0], 'takeAwayBeats');
  assert.equal(banks.primaryWays(g2.music.PLACE_VALUE)[0][0], 'alternateDrums');
  // takeAwayBeats and tenExchange stay EXTRA wherever they would demote a primary.
  const sub2dTakeAway = g2.music.SUB2D.find((w) => w[0] === 'takeAwayBeats');
  assert.ok(banks.isOptionalWay(sub2dTakeAway));
  assert.match(sub2dTakeAway[1], /תופים \(עשרות\) ושייקרים \(יחידות\)/);
  assert.ok(banks.isOptionalWay(g2.music.PLACE_VALUE.find((w) => w[0] === 'tenExchange')));
  assert.ok(!banks.isOptionalWay(g2.music.SUB2D.find((w) => w[0] === 'tensBarsBack')));
  assert.ok(!banks.isOptionalWay(g2.music.PLACE_VALUE.find((w) => w[0] === 'alternateDrums')));
  // takeAwayBeats is primary in no other topic, in any grade; tenExchange is primary nowhere.
  for (let g = 1; g <= 6; g++) {
    const modG = require('../src/lib/curriculum/grade' + g);
    for (const [topic, ways] of Object.entries(modG.music || {})) {
      const prim = banks.primaryWays(ways).map((w) => w[0]);
      if (prim.includes('takeAwayBeats')) assert.ok(['SUB10', 'SUB20', 'WORD_REMOVE'].includes(topic), 'grade' + g + ' ' + topic);
      assert.ok(!prim.includes('tenExchange'), 'grade' + g + ' ' + topic);
    }
  }
  // Primary ways must come from a strongly evidenced mechanism (dosage rules).
  assert.ok(banks.MUSIC_DOSAGE.primary.includes(banks.mechanismOf('takeAwayBeats')));
  assert.ok(banks.MUSIC_DOSAGE.primary.includes(banks.mechanismOf('tensBarsBack')));
  assert.ok(banks.MUSIC_DOSAGE.primary.includes(banks.mechanismOf('alternateDrums')));
  // Shipped items carry the restored primaries; tenExchange stays an extra.
  const items = banks.allItems();
  assert.ok(items.some((it) => it.music === 'takeAwayBeats' && it.skill === 'subtraction'));
  assert.ok(items.some((it) => it.music === 'tensBarsBack' && it.skill === 'subtraction'));
  assert.ok(items.some((it) => it.music === 'alternateDrums' && it.skill === 'place_value'));
  assert.ok(items.some((it) => it.musicExtra && it.musicExtra.some((w) => w.music === 'tenExchange') && it.skill === 'place_value'));
});

test('end-of-topic check for subtraction and place value has no music', () => {
  const unit = uc.listUnits().find((u) => u.id === 'takeaway-place-2');
  assert.ok(unit, 'silent check unit exists');
  ['pre', 'post'].forEach((form) => {
    const items = uc.formItems('takeaway-place-2', form);
    assert.equal(items.length, 6);
    items.forEach((it) => {
      assert.equal(it.music, undefined);
      assert.equal(it.hear, undefined);
    });
    assert.doesNotMatch(JSON.stringify(items), /🎵|🥁|🔔/);
  });
});

test('index.html wires the circles widget and loads the module', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /src\/lib\/music\/takeAwayTen\.js/);
  assert.match(html, /MM_TAKEAWAY_TEN/);
});
