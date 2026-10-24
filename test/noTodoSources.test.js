'use strict';
// #671 / #691 review item 6: no component, instrument or music way may cite
// 'TODO' as its source. Every musicSrc is a real id in MUSIC_SOURCES with a
// D, A or R evidence label; an instrument without a confirmed source has
// source null and is a weak optional timbre, never the way a topic is voiced.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = require('../src/lib/banks');
const I = require('../src/lib/instruments.js');
const JAM = require('../src/components/jamKit.js');
const TTG = require('../src/components/TimesTableGroove.js');

const root = path.join(__dirname, '..');
const EVIDENCE = ['D', 'A', 'R'];
const GRADES = [1, 2, 3, 4, 5, 6].map((g) => require('../src/lib/curriculum/grade' + g));
const files = (dir) => fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith('.js')).map((f) => dir + '/' + f);

test('no source, musicSrc or why in components, music libs or instruments is the literal TODO', () => {
  const scan = files('src/components').concat(files('src/lib/music'), ['src/lib/instruments.js', 'src/lib/banks.js']);
  const found = [];
  scan.forEach((f) => {
    // Code lines only: a comment may explain the rule.
    const code = fs.readFileSync(path.join(root, f), 'utf8').split(/\r?\n/).filter((l) => !/^\s*\/\//.test(l));
    code.forEach((l, i) => { if (/['"`]TODO['"`]/.test(l)) found.push(f + ': ' + l.trim()); });
  });
  assert.deepEqual(found, []);
});

test('every instrument source is an https link, or null and then optional with weak evidence', () => {
  I.INSTRUMENTS.forEach((x) => {
    if (x.source === null) {
      assert.deepEqual([x.optional, x.evidence], [true, 'weak'], x.id);
      Object.keys(I.TOPICS).forEach((t) => assert.ok(!I.forTopic(t).includes(x), x.id + ' voices ' + t));
    } else {
      assert.match(x.source, /^https:\/\/\S+$/, x.id);
    }
  });
});

test('every music way in the grade files names a real source id and a D/A/R label', () => {
  const bad = [];
  GRADES.forEach((f) => {
    Object.keys(f.music || {}).forEach((k) => {
      f.music[k].forEach((w) => {
        if (!(banks.MUSIC_SOURCES[w[2]] && EVIDENCE.includes(w[3]))) bad.push(f.grade + ' ' + k + ' ' + w[0] + ' ' + w[2] + ' ' + w[3]);
      });
    });
  });
  assert.deepEqual(bad, []);
  Object.keys(banks.MUSIC_SOURCES).forEach((id) => {
    const s = banks.MUSIC_SOURCES[id];
    assert.ok(s[0] && s[0] !== 'TODO', id);
    assert.match(s[1], /^https?:\/\/\S+$/, id);
  });
});

test('every item with a musicSrc cites a known id with D, A or R', () => {
  const bad = banks.allItems()
    .filter((it) => it.musicSrc !== undefined && !(banks.MUSIC_SOURCES[it.musicSrc] && EVIDENCE.includes(it.musicEv)))
    .map((it) => it.id + ' ' + it.musicSrc);
  assert.deepEqual(bad, []);
});

test('TimesTableGroove unlocks only instruments with a real source; an unknown one has none', () => {
  assert.ok(TTG.UNLOCK_LIST.length > 0);
  TTG.UNLOCK_LIST.forEach((id) => assert.match(JAM.instrument(id).source, /^https:\/\//, id));
  assert.equal(JAM.instrument('no-such-instrument').source, null);
});

test('EnsembleStudio presets cite an https source', async () => {
  const { ENSEMBLE_PRESETS } = await import('../src/components/EnsembleStudio.js');
  ENSEMBLE_PRESETS.forEach((p) => assert.match(p.source, /^https:\/\/\S+$/, p.id));
});
