'use strict';
// #591 goal B: world instruments, each matched to the maths it fits and why.
// Dosage rules (owner 15:54): an instrument is a timbre or optional play,
// never a new method. Its mechanism is the primary one of its topics
// (M1/M2/M3/M6); a weak mechanism (M4/M5/M7) only when the entry is marked
// optional with evidence:'weak'; unsupported mechanisms (M8-M14) never.
const test = require('node:test');
const assert = require('node:assert/strict');
const I = require('../src/lib/instruments');
const banks = require('../src/lib/banks');
const V = require('../src/lib/instrumentVoices');

const ALL = I.INSTRUMENTS;

test('a broad catalogue across all four families', () => {
  assert.deepEqual(I.FAMILIES, ['percussion', 'strings', 'winds', 'keys']);
  assert.ok(ALL.length >= 20, 'instruments: ' + ALL.length);
  ALL.forEach((x) => assert.ok(I.FAMILIES.includes(x.family), x.id + ' family ' + x.family));
});

test('every instrument has every field', () => {
  const ids = new Set();
  ALL.forEach((x) => {
    assert.match(x.id, /^[a-z][a-zA-Z]+$/, x.id);
    assert.ok(!ids.has(x.id), 'duplicate ' + x.id);
    ids.add(x.id);
    assert.match(x.instrument.he, /[א-ת]/, x.id + ' he');
    assert.match(x.instrument.en, /^[A-Za-z]/, x.id + ' en');
    assert.ok(typeof x.origin === 'string' && x.origin.length >= 3, x.id + ' origin');
    assert.ok(Array.isArray(x.mathTopics) && x.mathTopics.length >= 1, x.id + ' topics');
    assert.ok(typeof x.why === 'string' && x.why.length >= 30 && x.why.length <= 400, x.id + ' why');
    assert.ok(V.VOICES[x.voice], x.id + ' voice ' + x.voice);
  });
});

test('source is a URL or DOI, or exactly TODO', () => {
  ALL.forEach((x) => {
    if (x.source === 'TODO') return;
    assert.match(x.source, /^https:\/\/[^\s]+$/, x.id + ' source ' + x.source);
  });
});

test('mechanism exists in MUSIC_MECHANISMS and is evidenced', () => {
  ALL.forEach((x) => {
    assert.ok(banks.MUSIC_MECHANISMS[x.mechanism], x.id + ' ' + x.mechanism);
    assert.ok(I.PRIMARY.includes(x.mechanism) || I.WEAK.includes(x.mechanism), x.id + ' unsupported ' + x.mechanism);
  });
});

test('no weak mechanism without the optional mark (dosage rule 2)', () => {
  ALL.forEach((x) => {
    if (I.WEAK.includes(x.mechanism)) {
      assert.equal(x.optional, true, x.id);
      assert.equal(x.evidence, 'weak', x.id);
    } else {
      assert.equal(x.optional, undefined, x.id);
      assert.equal(x.evidence, undefined, x.id);
    }
  });
});

test('one way per topic: every math topic is served by its own primary mechanism', () => {
  ALL.forEach((x) => x.mathTopics.forEach((t) => {
    assert.ok(I.TOPICS[t], x.id + ' unknown topic ' + t);
    assert.equal(I.TOPICS[t].mechanism, I.mechanismFor(x, t), x.id + ' ' + t);
  }));
  // A per-topic override is only ever a weak way (optional play).
  ALL.filter((x) => x.weakWays).forEach((x) => Object.keys(x.weakWays).forEach((t) => {
    assert.ok(I.WEAK.includes(x.weakWays[t]), x.id + ' ' + t + ' override must be weak');
    assert.ok(x.mathTopics.includes(t), x.id + ' ' + t + ' override for a listed topic');
  }));
  Object.keys(I.TOPICS).forEach((t) => {
    const m = I.TOPICS[t].mechanism;
    assert.ok(I.PRIMARY.includes(m) || I.WEAK.includes(m), t);
    assert.match(I.TOPICS[t].he, /[א-ת]/, t);
  });
});

test('lookups', () => {
  const first = ALL[0];
  assert.equal(I.instrumentById(first.id), first);
  assert.equal(I.instrumentById('nope'), null);
  I.FAMILIES.forEach((f) => assert.ok(I.byFamily(f).every((x) => x.family === f)));
  const t = first.mathTopics[0];
  assert.ok(I.forTopic(t).includes(first));
  assert.ok(I.forTopic(t).every((x) => x.mechanism === I.TOPICS[t].mechanism));
  assert.deepEqual(I.forTopic('nope'), []);
});

test('instrument variety: each topic offers instruments from at least 2 of the 4 families (Refs #591)', () => {
  const activeTopics = Object.keys(I.TOPICS);
  activeTopics.forEach((topic) => {
    const instruments = I.forTopic(topic);
    assert.ok(instruments.length >= 2, topic + ' must offer at least 2 instruments');
    const families = new Set(instruments.map((x) => x.family));
    assert.ok(
      families.size >= 2,
      topic + ' must offer instruments from at least 2 families, got: ' + Array.from(families).join(', ')
    );
  });
});

test('regression guard: topics keep their instruments; gankogui and kora voice patterns and lcm (Refs #740)', () => {
  // Snapshot of what master offered before #740. gankogui and kora keep
  // patterns (M6) and also voice lcm, as optional play (M4, weak evidence).
  const MASTER_TOPIC_INSTRUMENTS = {
    counting: ['taiko', 'cajon', 'tof', 'surdo', 'handbells', 'udu', 'balalaika', 'didgeridoo'],
    nextPrev: ['cajon', 'tof', 'handbells'],
    skipCounting: ['djembe', 'tabla', 'mbira', 'charango'],
    multiplication: ['djembe', 'tabla', 'mridangam', 'bodhran', 'riq', 'mbira', 'charango', 'qanun'],
    division: ['tabla', 'mridangam', 'bodhran', 'qanun'],
    fractions: ['darbuka', 'erhu', 'ukulele', 'shofar', 'ney', 'recorder', 'accordion'],
    decimals: ['darbuka', 'erhu', 'ney', 'recorder'],
    patterns: [
      'conga', 'gamelan', 'kalimba', 'marimba', 'balafon', 'steelPan',
      'claves', 'gankogui', 'oud', 'sitar', 'kora', 'guzheng',
      'violin', 'shakuhachi', 'bagpipes', 'dizi', 'piano', 'harmonium'
    ],
    symmetry: ['marimba', 'dizi'],
    lcm: ['gankogui', 'kora'],
    numberLine: ['xylophone', 'koto', 'guitar', 'panFlute', 'pipeOrgan'],
    data: ['cajon'],
    percent: ['darbuka', 'erhu']
  };

  for (const [topic, masterList] of Object.entries(MASTER_TOPIC_INSTRUMENTS)) {
    const currentIds = new Set(I.forTopic(topic).map((x) => x.id));
    for (const instId of masterList) {
      assert.ok(
        currentIds.has(instId),
        `Topic "${topic}" must not lose instrument "${instId}" vs master`
      );
    }
  }

  ['gankogui', 'kora'].forEach((id) => {
    const x = I.instrumentById(id);
    assert.deepEqual(x.mathTopics, ['patterns', 'lcm'], id);
    assert.equal(I.mechanismFor(x, 'patterns'), 'M6', id + ' patterns is the main way');
    assert.equal(x.optional, undefined, id + ' patterns is not optional');
    assert.equal(I.mechanismFor(x, 'lcm'), 'M4', id + ' lcm is the polyrhythm (weak, optional play)');
    assert.equal(I.forTopic('patterns').some((y) => y.id === id), true, id + ' voices patterns');
    assert.equal(I.forTopic('lcm').some((y) => y.id === id), true, id + ' voices lcm');
  });
});
