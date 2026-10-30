'use strict';
// #679 family coverage: a per-topic report of how many of the 4 instrument
// families (percussion, strings, winds, keys) each topic offers, plus the
// floor that every topic offers at least 2 families (target: 4).
// #740 already asserts the bare >=2 floor inside instruments.test.js on its
// own branch; this file instead pins the listing itself (the report rows),
// the never-remove baseline for every topic, and the topics #740 missed
// (data, percent, lcm). Run the human-readable report with:
//   node tools/family-coverage.js
const test = require('node:test');
const assert = require('node:assert/strict');
const I = require('../src/lib/instruments');
const { familyCoverage } = require('../tools/family-coverage');

// What master offered per topic before this change (re-taken after #809/#782). Additions are allowed;
// losing any of these ids is not ("never remove").
const BASELINE = {
  counting: ['taiko', 'cajon', 'tof', 'surdo', 'handbells', 'udu', 'balalaika', 'didgeridoo'],
  nextPrev: ['cajon', 'tof', 'handbells', 'balalaika', 'didgeridoo'],
  skipCounting: ['djembe', 'tabla', 'mbira', 'charango'],
  multiplication: ['djembe', 'tabla', 'mridangam', 'bodhran', 'riq', 'mbira', 'charango', 'qanun'],
  division: ['tabla', 'mridangam', 'bodhran', 'qanun'],
  fractions: ['darbuka', 'erhu', 'ukulele', 'shofar', 'ney', 'recorder', 'accordion'],
  decimals: ['darbuka', 'erhu', 'ney', 'recorder', 'accordion'],
  patterns: ['conga', 'gamelan', 'kalimba', 'marimba', 'balafon', 'steelPan', 'claves', 'oud', 'sitar', 'guzheng', 'violin', 'shakuhachi', 'bagpipes', 'dizi', 'piano', 'harmonium'],
  symmetry: ['marimba', 'violin', 'dizi', 'piano'],
  lcm: ['gankogui', 'kora'],
  numberLine: ['xylophone', 'koto', 'guitar', 'panFlute', 'pipeOrgan'],
  data: ['cajon', 'balalaika'],
  percent: ['darbuka', 'erhu'],
  area: ['djembe', 'charango', 'qanun'],
  volume: ['djembe', 'charango', 'qanun'],
};

test('report lists every topic with its family count out of 4', () => {
  const rows = familyCoverage();
  assert.deepEqual(rows.map((r) => r.topic), Object.keys(I.TOPICS));
  rows.forEach((r) => {
    const offered = I.forTopic(r.topic);
    assert.equal(r.mechanism, I.TOPICS[r.topic].mechanism, r.topic);
    assert.equal(r.familyCount, r.families.length, r.topic);
    assert.equal(r.familyCount, new Set(offered.map((x) => x.family)).size, r.topic);
    assert.deepEqual(r.instruments, offered.map((x) => x.id), r.topic);
    r.families.forEach((f) => assert.ok(I.FAMILIES.includes(f), r.topic + ' ' + f));
    assert.ok(r.familyCount >= 0 && r.familyCount <= I.FAMILIES.length, r.topic);
  });
});

test('every topic offers at least 2 of the 4 families (target 4)', () => {
  familyCoverage().forEach((r) => {
    assert.ok(r.familyCount >= 2, r.topic + ' offers only ' + r.familyCount + ': ' + r.families.join(', '));
  });
  // Topics that can reach the target with the verified catalogue do reach it.
  // percent stays darbuka + erhu (#809 sequence guard), so it is not at 4.
  ['fractions', 'decimals', 'patterns', 'symmetry', 'numberLine'].forEach((topic) => {
    const row = familyCoverage().find((r) => r.topic === topic);
    assert.equal(row.familyCount, 4, topic + ': ' + row.families.join(', '));
  });
});

test('no topic loses an instrument it offered on master (never remove)', () => {
  Object.keys(BASELINE).forEach((topic) => {
    const now = new Set(I.forTopic(topic).map((x) => x.id));
    BASELINE[topic].forEach((id) => assert.ok(now.has(id), topic + ' lost ' + id));
  });
});

test('ukulele stays as found: fractions only, no new topics', () => {
  // Ukulele is the fractions note-length voice (M3); master (#809) keeps it
  // fractions-only. It is not a filler for other topics, so its topic list
  // must not grow.
  assert.deepEqual(I.instrumentById('ukulele').mathTopics, ['fractions']);
});
