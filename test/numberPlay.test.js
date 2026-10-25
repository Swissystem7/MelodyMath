// MelodyMath — Unit tests for NumberPlay (Issue #686, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const NumberPlay = require('../src/components/NumberPlay.js');

test('addition above 10 plays as tens (deep bass) and ones (rhythmic clicks) (#720, Refs #591)', () => {
  const pAdd = NumberPlay.extractNumberPlan({ prompt: '15 + 7 = ?' });
  assert.ok(pAdd, 'plan must exist for 15+7');
  assert.equal(pAdd.groups[0].count, 15); assert.equal(pAdd.groups[0].tens, 1); assert.equal(pAdd.groups[0].ones, 5);
  assert.equal(pAdd.groups[1].count, 7); assert.equal(pAdd.groups[1].tens, 0); assert.equal(pAdd.groups[1].ones, 7);

  // 1 ten (deep bass) + 5 ones + 7 ones = 13 sounds total
  assert.equal(pAdd.totalSounds, 13);
  const tenNotes = pAdd.notes.filter(n => n.isTen);
  assert.equal(tenNotes.length, 1);
  assert.equal(tenNotes[0].voice, 'drumLow');
  assert.equal(tenNotes[0].hz, 110);

  const html = NumberPlay.renderHtml(pAdd);
  assert.match(html, /np-ten/);
  assert.notEqual(pAdd.groups[0].voice, pAdd.groups[1].voice, 'addition groups have distinct timbres');
});

test('subtraction sounds distinct: counts minuend and takes away subtrahend with muted action', () => {
  const pSub = NumberPlay.extractNumberPlan({ prompt: '7 - 3 = ?' });
  assert.ok(pSub); assert.equal(pSub.op, 'subtraction');
  assert.equal(pSub.minuend, 7); assert.equal(pSub.subtrahend, 3); assert.equal(pSub.totalSounds, 7, 'shows 7 initial dots');
  const counts = pSub.notes.filter(n => n.action === 'count'), takeaways = pSub.notes.filter(n => n.action === 'takeaway');
  assert.equal(counts.length, 7); assert.equal(takeaways.length, 3);
  assert.notEqual(counts[0].voice, takeaways[0].voice, 'takeaways have distinct timbre');
  assert.ok(NumberPlay.extractNumberPlan({ prompt: '19 - 12 = ?' }).notes.filter(n => n.action === 'takeaway').every(n => n.hz >= 120), '19 - 12 takeaways stay >= 120 Hz');
});

test('multiplication: equal groups use ONE single voice; >20 returns null', () => {
  const pMul = NumberPlay.extractNumberPlan({ prompt: '3 × 4 = ?' });
  assert.ok(pMul); assert.equal(pMul.op, 'multiplication');
  assert.equal(pMul.groups.length, 3); assert.equal(pMul.totalSounds, 12);
  assert.equal(pMul.groups[0].voice, pMul.groups[1].voice);
  assert.equal(pMul.groups[1].voice, pMul.groups[2].voice);
  assert.equal(NumberPlay.extractNumberPlan({ prompt: '6 × 7 = ?' }), null);
});

test('division: Israeli notation a : b partitions into equal groups with one voice', () => {
  const pDiv = NumberPlay.extractNumberPlan({ prompt: '12 : 3 = ?' });
  assert.ok(pDiv); assert.equal(pDiv.op, 'division');
  assert.equal(pDiv.groups.length, 3); assert.equal(pDiv.groups[0].count, 4);
  assert.equal(pDiv.groups[0].voice, pDiv.groups[1].voice);
});

test('fractions, decimals, percentages and advanced curriculum topics are skipped', () => {
  ['מה ערכו של 3/4?', 'חשבו: 2.5 + 1.5', '50% מתוך 20'].forEach(p => assert.equal(NumberPlay.extractNumberPlan({ prompt: p }), null));
  assert.equal(NumberPlay.extractNumberPlan({ topicId: 'mm-cur-32', prompt: 'שברים' }), null);
  assert.equal(NumberPlay.extractNumberPlan({ topicId: 'mm-cur-45', prompt: 'שברים עשרוניים' }), null);
});

test('timbre uses verified sources (no kalimba TODO)', () => {
  const insts = NumberPlay.DEFAULT_VOICES.map(v => v.instrument);
  assert.equal(insts.length, 4);
  assert.ok(!insts.includes('kalimba'));
  ['darbuka', 'cajon', 'marimba', 'handbells'].forEach(id => assert.ok(insts.includes(id)));
});

test('renderHtml creates exact circle count and mount wires visual playback', () => {
  const plan = NumberPlay.extractNumberPlan({ prompt: '4 + 2 = ?' });
  const html = NumberPlay.renderHtml(plan);
  assert.match(html, /data-total-sounds="6"/);
  const dotMatches = html.match(/class="np-dot/g);
  assert.equal(dotMatches.length, plan.totalSounds);

  const mockBtn = { setAttribute: () => {}, addEventListener: () => {} };
  const mockDots = [0, 1, 2, 3, 4, 5].map(() => ({ classList: { add: () => {}, remove: () => {} } }));
  const mockContainer = {
    classList: { remove: () => {}, add: () => {} }, innerHTML: '',
    querySelector: sel => sel.includes('play-numbers') ? mockBtn : { textContent: '' },
    querySelectorAll: sel => sel.includes('np-dot') ? mockDots : []
  };
  const handle = NumberPlay.mount(mockContainer, { prompt: '4 + 2 = ?' });
  assert.ok(handle && typeof handle.play === 'function');
});

test('timing & timbre: >=1.5 beat pause between groups, distinct instrument per group (#720, Refs #591)', () => {
  const plan = NumberPlay.extractNumberPlan({ prompt: '4 + 3 = ?' }, { bpm: 100 });
  assert.ok((plan.notes[4].at - plan.notes[3].at) >= plan.beat * 1.5);
  assert.notEqual(plan.groups[0].voice, plan.groups[1].voice);
  assert.notEqual(plan.groups[0].hz, plan.groups[1].hz);
});

test('instruments take from forTopic and tempo varies per exercise (0g, #720, Refs #665)', () => {
  const p1 = NumberPlay.extractNumberPlan({ id: 'ex-add-1', prompt: '3 + 4 = ?' });
  const p2 = NumberPlay.extractNumberPlan({ id: 'ex-add-2', prompt: '5 + 2 = ?' });
  assert.ok(p1 && p2);
  assert.notEqual(p1.bpm, 110, 'bpm is not fixed at 110');
  assert.notEqual(p1.bpm, p2.bpm, 'tempo varies across exercises');
  assert.ok(p1.bpm >= 85 && p1.bpm <= 125, 'tempo is within pedagogical range');

  const pMul = NumberPlay.extractNumberPlan({ prompt: '2 × 5 = ?', mathTopic: 'multiplication' });
  assert.ok(pMul);
  const mulVoice = pMul.groups[0].voice;
  // djembe/tabla use drumHigh or drumLow or frameDrum or jingle from forTopic('multiplication')
  assert.ok(['drumHigh', 'drumLow', 'frameDrum', 'jingle', 'tine'].includes(mulVoice));
});

test('chosen instrument is persisted and prioritized in NumberPlay (Refs #665, Refs #686)', () => {
  const dummyStore = {};
  globalThis.localStorage = {
    getItem: k => dummyStore[k] || null, setItem: (k, v) => { dummyStore[k] = String(v); },
    removeItem: k => { delete dummyStore[k]; }, clear: () => { for (const k in dummyStore) delete dummyStore[k]; },
    get length() { return Object.keys(dummyStore).length; }, key: i => Object.keys(dummyStore)[i] || null
  };

  const who = { classCode: 'X', name: 'dana' }; dummyStore['mm_child_inst_X:other'] = 'cajon';
  assert.equal(NumberPlay.getPersistedInstrument({ who }), null, 'another child key is not read');
  assert.equal(NumberPlay.savePersistedInstrument('handbells'), false, 'no child: nothing saved');
  NumberPlay.savePersistedInstrument('handbells', { who }); assert.equal(NumberPlay.getPersistedInstrument({ who }), 'handbells');
  const plan = NumberPlay.extractNumberPlan({ prompt: '3 + 4 = ?' }, { who });
  assert.ok(plan); assert.equal(plan.groups[0].instrument, 'handbells');
  assert.equal(plan.groups[0].voice, 'metalBell');
  // Option overrides
  const planOverride = NumberPlay.extractNumberPlan({ prompt: '3 + 4 = ?' }, { chosenInstrument: 'cajon' });
  assert.equal(planOverride.groups[0].instrument, 'cajon');
});

test('variety integration: picks tempo, pattern and instrument from variety engine (Task V1, Refs #665)', () => {
  const mockVariety = {
    pickTempo: (round) => 92 + round * 4,
    pickPattern: (round) => ({ id: 'swing_dotted', meter: '4/4', he: 'מקצב מנוקד' })
  };
  const p1 = NumberPlay.extractNumberPlan({ prompt: '4 + 3 = ?' }, { variety: mockVariety, roundIndex: 1 });
  assert.ok(p1);
  assert.equal(p1.bpm, 96);
  assert.equal(p1.rhythmPattern.id, 'swing_dotted');

  const varietyItem = {
    id: 'ex-var-r2', prompt: '5 + 4 = ?',
    rhythmPattern: { id: 'waltz_3', meter: '3/4' },
    bpm: 104, instrument: 'cajon', chosenInstrument: 'cajon'
  };
  const p2 = NumberPlay.extractNumberPlan(varietyItem, { chosenInstrument: 'cajon' });
  assert.ok(p2);
  assert.equal(p2.bpm, 104);
  assert.equal(p2.rhythmPattern.id, 'waltz_3');
  assert.equal(p2.groups[0].instrument, 'cajon');
});
