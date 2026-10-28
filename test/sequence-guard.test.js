'use strict';
// #591: a guard on MelodyMath's learning sequence, grades א׳-ו׳. It reads the
// existing data only (curriculum.js MATRIX, progression.js, evidenceMeta.js,
// grade1-6.js music ways, instruments.js, the variety engine and the
// no-music mastery check) and fails, naming the topic, if the order or the
// method rules are broken. A rule master does not keep yet is a test.todo
// that names the gap; app code is not changed here.
const test = require('node:test');
const assert = require('node:assert/strict');
const curriculum = require('../src/lib/curriculum');
const banks = require('../src/lib/banks');
const prog = require('../src/lib/curriculum/progression');
const evidenceMeta = require('../src/lib/curriculum/evidenceMeta');
const instruments = require('../src/lib/instruments');
const variety = require('../src/lib/exercises/variety');
const mastery = require('../src/lib/masteryCheck');
const percentMix = require('../src/lib/music/percentMix');
const GG = require('../src/lib/music/grooveGrid');
const LS = require('../src/lib/music/loopStack');

const GRADES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
const FILES = [1, 2, 3, 4, 5, 6].map((n) => require('../src/lib/curriculum/grade' + n));
const position = {};
curriculum.MATRIX.forEach((r, i) => { position[r.topicId] = i; });
const gradeOf = (id) => GRADES.indexOf(curriculum.MATRIX[position[id]].grade);
const label = (id) => id + ' (' + curriculum.MATRIX[position[id]].grade + '׳ ' + curriculum.MATRIX[position[id]].topic + ')';
// earlier(p, id): p comes at an earlier grade, or earlier in the same grade.
const earlier = (p, id) => gradeOf(p) < gradeOf(id) || (gradeOf(p) === gradeOf(id) && position[p] < position[id]);
const eachWay = (fn) => FILES.forEach((f) => Object.keys(f.music || {}).forEach((key) => fn(f, key, f.music[key])));

// ---------- 1. prerequisites come first ----------

test('1: the matrix covers grades א׳-ו׳ and every topic has a prerequisite entry', () => {
  assert.deepEqual([...new Set(curriculum.MATRIX.map((r) => r.grade))], GRADES);
  assert.deepEqual(curriculum.MATRIX.filter((r) => !prog.PREREQ[r.topicId]).map((r) => r.topicId), []);
});

test('1: no topic comes before one of its prerequisites (grade, then matrix order)', () => {
  const wrong = [];
  Object.keys(prog.PREREQ).forEach((id) => prog.PREREQ[id][0].forEach((p) => {
    if (!(p in position)) wrong.push(label(id) + ' needs unknown ' + p);
    else if (!earlier(p, id)) wrong.push(label(id) + ' comes before its prerequisite ' + label(p));
  }));
  assert.deepEqual(wrong, []);
});

test('1: evidenceMeta buildsFrom names only earlier topics', () => {
  const wrong = [];
  const ids = Object.keys(evidenceMeta.META);
  assert.ok(ids.length > 0);
  ids.forEach((id) => {
    evidenceMeta.metaForTopic(id).buildsFrom.forEach((p) => {
      if (!(p in position) || !earlier(p, id)) wrong.push(label(id) + ' builds from later ' + p);
    });
  });
  assert.deepEqual(wrong, []);
});

test('1: the unlock order (PREREQ key order, masteryCheck.orderTopics) puts every prerequisite first', () => {
  const order = mastery.orderTopics(curriculum.MATRIX.map((r) => r.topicId).reverse(), prog);
  const at = {};
  order.forEach((id, i) => { at[id] = i; });
  const wrong = [];
  order.forEach((id) => prog.PREREQ[id][0].forEach((p) => {
    if (!(at[p] < at[id])) wrong.push(label(id) + ' is offered before its prerequisite ' + label(p));
  }));
  assert.deepEqual(wrong, []);
});

test('1: a topic stays locked until all its prerequisites are mastered', () => {
  const tracker = mastery.createMasteryTracker({ storage: null });
  const wrong = [];
  curriculum.MATRIX.forEach((r) => {
    const needs = prog.PREREQ[r.topicId][0];
    if (needs.length && tracker.isUnlocked(r.topicId, prog)) wrong.push(label(r.topicId) + ' open with nothing mastered');
  });
  assert.deepEqual(wrong, []);
});

test('1: a music skill placed by hand sits in its own grade or links only to earlier/later grades', () => {
  const wrong = [];
  Object.keys(prog.SKILL_TOPIC).forEach((name) => {
    const here = GRADES.indexOf(name.split(':')[0]);
    const own = prog.SKILL_TOPIC[name];
    if (typeof own === 'string') { if (gradeOf(own) !== here) wrong.push(name + ' → ' + label(own)); return; }
    own[0].forEach((p) => { if (gradeOf(p) > here) wrong.push(name + ' needs later ' + p); });
    own[1].forEach((n) => { if (gradeOf(n) < here) wrong.push(name + ' builds back to ' + n); });
  });
  assert.deepEqual(wrong, []);
});

// ---------- 2. one primary method, locked methods kept ----------

const LOCKED = ['percentBar', 'hundredBar', 'partOfHundredBar', 'sectionsFillBar', 'areaScore', 'cubeLayerGroups',
  'tenExchange', 'woodClick', 'fillBar', 'balanceBars', 'barFill'];

test('2: every standard of grades א׳-ו׳ has a primary way, and its primary ways are one mechanism', () => {
  const wrong = [];
  eachWay((f, key, ways) => {
    const primary = banks.primaryWays(ways);
    const mechs = new Set(primary.map(([tag]) => banks.mechanismOf(tag)));
    if (!primary.length) wrong.push(f.grade + ' ' + key + ': no primary way');
    else if (mechs.size !== 1) wrong.push(f.grade + ' ' + key + ': primary mechanisms ' + [...mechs].join('+'));
  });
  assert.deepEqual(wrong, []);
});

test('2: every instruments.js topic names exactly one primary mechanism', () => {
  Object.keys(instruments.TOPICS).forEach((t) => {
    assert.equal(typeof instruments.TOPICS[t].mechanism, 'string', t);
  });
});

// Gap on master: these standards list more than one primary (non-optional)
// way tag, e.g. ו׳ FRAC_MUL has noteLength, barFill and tripletShare. They
// share one mechanism (above), but not one method.
const multiPrimary = [];
eachWay((f, key, ways) => { if (banks.primaryWays(ways).length > 1) multiPrimary.push(f.grade + ' ' + key); });
if (multiPrimary.length) {
  test.todo('2: every standard has exactly one primary way — gap: ' + multiPrimary.length + ' standards have several: ' + multiPrimary.join(', '));
} else {
  test('2: every standard has exactly one primary way', () => assert.deepEqual(multiPrimary, []));
}

// Where each locked name lives today: as a primary way, an EXTRA (optional)
// way, an EXPERIMENTAL add-on, or (woodClick) an instrument voice.
function whereIs(name) {
  const found = new Set();
  eachWay((f, key, ways) => ways.forEach((w) => {
    if (w[0] !== name) return;
    found.add(banks.isOptionalWay(w) ? 'EXTRA' : 'primary');
  }));
  const meta = percentMix.TEACHER_METADATA;
  [meta.primary, meta.addon].forEach((m) => {
    if (m.id === name) found.add(m.evidence === evidenceMeta.EXPERIMENTAL ? 'EXPERIMENTAL' : 'primary');
  });
  if (instruments.INSTRUMENTS.some((x) => x.voice === name)) found.add('voice');
  return found;
}

test('2: the locked methods (all but woodClick) still exist as primary, EXTRA or EXPERIMENTAL', () => {
  const missing = LOCKED.filter((n) => n !== 'woodClick').filter((n) => {
    const at = whereIs(n);
    return !(at.has('primary') || at.has('EXTRA') || at.has('EXPERIMENTAL'));
  });
  assert.deepEqual(missing, []);
});

test('2: every locked method is still known to a mechanism in banks.js', () => {
  const known = LOCKED.filter((n) => n !== 'woodClick').filter((n) => !banks.mechanismOf(n));
  assert.deepEqual(known, []);
});

test('2: percentBar stays the primary way of PERCENT', () => {
  const g6 = FILES[5];
  assert.deepEqual(banks.primaryWays(g6.music.PERCENT).map((w) => w[0]), ['percentBar']);
});

test('2: woodClick is not deleted — it is still an instrument voice', () => {
  assert.ok(whereIs('woodClick').has('voice'));
});

// Gap on master: woodClick exists only as a sound (instrument voice of cajón
// and claves, and the click of the music modules); no grade file lists it as
// a primary, EXTRA or EXPERIMENTAL way.
if (['primary', 'EXTRA'].some((k) => whereIs('woodClick').has(k))) {
  test('2: woodClick is a method (primary or EXTRA way)', () => assert.ok(true));
} else {
  test.todo('2: woodClick is a method (primary, EXTRA or EXPERIMENTAL) — gap: it is only an instrument voice');
}

// ---------- 3. instrument rules ----------

const byId = (ids) => ids.map((x) => x.id).sort();
const onTopic = (t) => instruments.INSTRUMENTS.filter((x) => x.mathTopics.includes(t));

test('3: percent uses only darbuka and erhu', () => {
  const ok = ['darbuka', 'erhu'];
  assert.deepEqual(byId(onTopic('percent')).filter((id) => !ok.includes(id)), []);
  assert.deepEqual(byId(instruments.forTopic('percent')), ok);
});

test('3: ukulele only in fractions; gankogui and kora only in LCM', () => {
  assert.deepEqual(instruments.instrumentById('ukulele').mathTopics, ['fractions']);
  assert.deepEqual(instruments.instrumentById('gankogui').mathTopics, ['lcm']);
  assert.deepEqual(instruments.instrumentById('kora').mathTopics, ['lcm']);
});

test('3: on the practice screen every topic keeps the instrument rules', () => {
  const wrong = [];
  curriculum.MATRIX.forEach((r) => {
    const type = variety.exerciseTypeOf(r.topicId);
    for (let round = 0; round < 12; round++) {
      const ex = variety.generateVariant(r.topicId, round, { rounds: 12 });
      if (type === 'percent' && !['darbuka', 'erhu'].includes(ex.instrument)) wrong.push(label(r.topicId) + ' plays ' + ex.instrument);
      if (ex.instrument === 'ukulele' && !['fractions', 'basic_fractions'].includes(type)) wrong.push(label(r.topicId) + ' (' + type + ') plays ukulele');
      if (['gankogui', 'kora'].includes(ex.instrument) && type !== 'factors') wrong.push(label(r.topicId) + ' (' + type + ') plays ' + ex.instrument);
    }
  });
  assert.deepEqual([...new Set(wrong)], []);
});

test('3: the area grid and box-volume layers never bring in kora, gankogui or ukulele (Refs #665)', () => {
  const banned = ['kora', 'gankogui', 'ukulele'];
  const wrong = [];
  LS.PARTNERS.forEach((p) => { if (banned.includes(p[0])) wrong.push('LoopStack partner ' + p[0]); });
  instruments.FAMILIES.forEach((f) => {
    const partner = GG.partnerFor(f);
    if (banned.includes(partner)) wrong.push('GrooveGrid partner for ' + f + ': ' + partner);
    const own = instruments.byFamily(f).find((x) => !banned.includes(x.id));
    assert.ok(own, 'family ' + f + ' has an unrestricted instrument');
    LS.layerInstruments(4, own.id, f).forEach((id) => {
      if (banned.includes(id)) wrong.push('LoopStack layer for ' + f + ': ' + id);
    });
  });
  assert.deepEqual(wrong, []);
});

test('3: area-grid and box-volume partners are chosen by mathTopics, over 2+ families (Refs #591 #665)', () => {
  const wrong = [];
  const topicsOf = (id) => instruments.instrumentById(id).mathTopics;
  ['kora', 'gankogui'].forEach((id) => assert.deepEqual(topicsOf(id), ['lcm'], id + ' stays lcm-only'));
  LS.PARTNERS.forEach((p) => { if (!topicsOf(p[0]).includes('volume')) wrong.push('LoopStack partner ' + p[0] + ' has no volume'); });
  instruments.FAMILIES.forEach((f) => {
    const partner = GG.partnerFor(f);
    if (!topicsOf(partner).includes('area')) wrong.push('GrooveGrid partner for ' + f + ': ' + partner + ' has no area');
    if (instruments.instrumentById(partner).family === f) wrong.push('GrooveGrid partner for ' + f + ' is the same family');
    const own = instruments.byFamily(f).find((x) => !['kora', 'gankogui', 'ukulele'].includes(x.id));
    const ids = LS.layerInstruments(4, own.id, f);
    ids.slice(1).forEach((id) => { if (!topicsOf(id).includes('volume')) wrong.push('LoopStack layer for ' + f + ': ' + id + ' has no volume'); });
    const fams = new Set(ids.map((id) => instruments.instrumentById(id).family));
    if (fams.size < 2) wrong.push('LoopStack for ' + f + ' uses only ' + [...fams].join());
  });
  assert.deepEqual(wrong, []);
});

// ---------- 4. a music-free mastery check at the end ----------

test('4: the mastery check fades to a plain (no-music) stage last', () => {
  assert.equal(mastery.STAGES[mastery.STAGES.length - 1], 'plain');
});

test('4: no topic is mastered until its plain check is passed', () => {
  const wrong = [];
  curriculum.MATRIX.forEach((r) => {
    const s = mastery.createTopicMastery(r.topicId);
    ['sound', 'picture', 'symbol'].forEach(() => mastery.recordAttempt(s, { correct: true }));
    if (s.mastered || s.currentStage !== 'plain') wrong.push(label(r.topicId) + ' mastered before the plain check');
    mastery.recordAttempt(s, { correct: true });
    if (!s.mastered) wrong.push(label(r.topicId) + ' not mastered after the plain check');
  });
  assert.deepEqual(wrong, []);
});

test('4: the last round of every topic\'s practice is music-free', () => {
  const wrong = [];
  curriculum.MATRIX.forEach((r) => {
    [3, 5, 10].forEach((rounds) => {
      const last = variety.generateVariant(r.topicId, rounds - 1, { rounds });
      if (!last.noMusic || last.hasMusic || last.music != null || last.hear != null) wrong.push(label(r.topicId) + ' rounds=' + rounds);
    });
  });
  assert.deepEqual(wrong, []);
});

test('4: a session ends silent while its earlier rounds keep the music', () => {
  const session = variety.createVarietySession('mm-cur-53', { rounds: 4 });
  const all = [0, 1, 2, 3].map(() => session.next());
  assert.equal(all[3].noMusic, true);
  assert.ok(all.slice(0, 3).every((ex) => ex.hasMusic));
});
