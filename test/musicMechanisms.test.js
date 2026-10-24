'use strict';
// #591 (owner comment 23.10 15:44): every way and music activity uses one of
// 14 musical mechanisms. M1-M7 carry peer-reviewed or credible evidence with
// a one-line finding; M8-M14 have none yet. A music activity of an evidenced
// mechanism cites one of that mechanism's studies.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');

const FILES = [1, 2, 3, 4, 5, 6].map((n) => require('../src/lib/curriculum/grade' + n));
const M = banks.MUSIC_MECHANISMS;
const EVIDENCED = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'];

test('the 14 mechanisms: M1-M7 cite resolvable studies with a finding, M8-M14 cite none', () => {
  assert.deepEqual(Object.keys(M), ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12', 'M13', 'M14']);
  Object.keys(M).forEach((id) => {
    const m = M[id];
    assert.match(m.he, /[א-ת]/, id);
    if (EVIDENCED.includes(id)) {
      assert.ok(m.sources.length >= 1, id);
      m.sources.forEach((src) => {
        const s = banks.MUSIC_SOURCES[src];
        assert.ok(s, id + ' ' + src);
        assert.match(s[1], /^https:\/\/(doi\.org\/10\.|pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC)/, src);
      });
      assert.ok(typeof m.finding === 'string' && m.finding.length > 40 && m.finding.length < 400, id);
    } else {
      assert.deepEqual(m.sources, [], id);
      assert.equal(m.finding, null, id);
    }
  });
});

test('every tag belongs to exactly one mechanism', () => {
  const seen = new Map();
  Object.keys(M).forEach((id) => M[id].tags.forEach((tag) => {
    assert.ok(!seen.has(tag), tag + ' in ' + seen.get(tag) + ' and ' + id);
    seen.set(tag, id);
    assert.equal(banks.mechanismOf(tag), id);
  }));
  assert.equal(banks.mechanismOf('noSuchTag'), null);
});

test('every way of every grade file and every music activity is mapped to a mechanism', () => {
  const unmapped = new Set();
  FILES.forEach((file) => Object.values(file.music).forEach((ways) => ways.forEach(([tag]) => {
    if (!banks.mechanismOf(tag)) unmapped.add(file.grade + ' ' + tag);
  })));
  banks.allItems().forEach((it) => { if (!banks.mechanismOf(it.music)) unmapped.add(it.grade + ' ' + it.music); });
  assert.deepEqual([...unmapped], []);
});

test('a music activity of an evidenced mechanism other than M5 and M7 cites that mechanism', () => {
  banks.allItems().filter((it) => !it.musicNote).forEach((it) => {
    const id = banks.mechanismOf(it.music);
    if (['M1', 'M2', 'M3', 'M4', 'M6'].includes(id)) assert.ok(M[id].sources.includes(it.musicSrc), it.id + ' ' + it.music + ' ' + it.musicSrc);
  });
});

test('every way of an evidenced mechanism cites one of its studies', () => {
  const wrong = [];
  FILES.forEach((file) => Object.keys(file.music).forEach((key) => file.music[key].forEach(([tag, , src]) => {
    const id = banks.mechanismOf(tag);
    if (EVIDENCED.includes(id) && !M[id].sources.includes(src)) wrong.push(file.grade + ' ' + key + ' ' + tag + ' ' + src);
  })));
  assert.deepEqual(wrong, []);
});

// M8-M14 have no evidence: in these grades every such way was replaced by a
// way of M2, M3, M6 or M7, distinct within its standard.
const REPLACED = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
test('grades ' + REPLACED.join(', ') + ': no way uses a mechanism without evidence (M8-M14)', () => {
  const left = [];
  FILES.filter((file) => REPLACED.includes(file.grade)).forEach((file) => Object.keys(file.music).forEach((key) => file.music[key].forEach(([tag]) => {
    if (!EVIDENCED.includes(banks.mechanismOf(tag))) left.push(file.grade + ' ' + key + ' ' + tag);
  })));
  assert.deepEqual(left, []);
});
