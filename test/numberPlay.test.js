// MelodyMath — Unit tests for NumberPlay (Issue #686, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const NumberPlay = require('../src/components/NumberPlay.js');

test('addition above 10 plays as tens (deep bass) and ones (rhythmic clicks) (#720, Refs #591)', () => {
  const pAdd = NumberPlay.extractNumberPlan({ prompt: '15 + 7 = ?' });
  assert.ok(pAdd, 'plan must exist for 15+7');
  assert.equal(pAdd.groups[0].count, 15, 'first group must be 15');
  assert.equal(pAdd.groups[0].tens, 1, '15 has 1 ten');
  assert.equal(pAdd.groups[0].ones, 5, '15 has 5 ones');
  assert.equal(pAdd.groups[1].count, 7, 'second group must be 7');
  assert.equal(pAdd.groups[1].tens, 0);
  assert.equal(pAdd.groups[1].ones, 7);

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
  assert.ok(pSub);
  assert.equal(pSub.op, 'subtraction');
  assert.equal(pSub.minuend, 7);
  assert.equal(pSub.subtrahend, 3);
  assert.equal(pSub.totalSounds, 7, 'shows 7 initial dots');
  const counts = pSub.notes.filter(n => n.action === 'count');
  const takeaways = pSub.notes.filter(n => n.action === 'takeaway');
  assert.equal(counts.length, 7);
  assert.equal(takeaways.length, 3);
  assert.notEqual(counts[0].voice, takeaways[0].voice, 'takeaways have distinct timbre');
});

test('multiplication: equal groups use ONE single voice; >20 returns null', () => {
  const pMul = NumberPlay.extractNumberPlan({ prompt: '3 × 4 = ?' });
  assert.ok(pMul);
  assert.equal(pMul.op, 'multiplication');
  assert.equal(pMul.groups.length, 3);
  assert.equal(pMul.totalSounds, 12);
  assert.equal(pMul.groups[0].voice, pMul.groups[1].voice, 'multiplication groups must share the same voice');
  assert.equal(pMul.groups[1].voice, pMul.groups[2].voice);

  const pLarge = NumberPlay.extractNumberPlan({ prompt: '6 × 7 = ?' });
  assert.equal(pLarge, null, 'large multiplication >20 must return null, not fall back to [a, b]');
});

test('division: Israeli notation a : b partitions into equal groups with one voice', () => {
  const pDiv = NumberPlay.extractNumberPlan({ prompt: '12 : 3 = ?' });
  assert.ok(pDiv);
  assert.equal(pDiv.op, 'division');
  assert.equal(pDiv.groups.length, 3);
  assert.equal(pDiv.groups[0].count, 4);
  assert.equal(pDiv.groups[0].voice, pDiv.groups[1].voice);
});

test('fractions, decimals, percentages and advanced curriculum topics are skipped', () => {
  assert.equal(NumberPlay.extractNumberPlan({ prompt: 'מה ערכו של 3/4?' }), null);
  assert.equal(NumberPlay.extractNumberPlan({ prompt: 'חשבו: 2.5 + 1.5' }), null);
  assert.equal(NumberPlay.extractNumberPlan({ prompt: '50% מתוך 20' }), null);
  assert.equal(NumberPlay.extractNumberPlan({ topicId: 'mm-cur-32', prompt: 'שברים' }), null);
  assert.equal(NumberPlay.extractNumberPlan({ topicId: 'mm-cur-45', prompt: 'שברים עשרוניים' }), null);
});

test('timbre uses verified sources (no kalimba TODO)', () => {
  const voices = NumberPlay.DEFAULT_VOICES;
  assert.equal(voices.length, 4);
  const instruments = voices.map(v => v.instrument);
  assert.ok(!instruments.includes('kalimba'), 'kalimba lacks verified source, must not be in default voices');
  assert.ok(instruments.includes('darbuka'));
  assert.ok(instruments.includes('cajon'));
  assert.ok(instruments.includes('marimba'));
  assert.ok(instruments.includes('handbells'));
});

test('renderHtml creates exact circle count and mount wires visual playback', () => {
  const plan = NumberPlay.extractNumberPlan({ prompt: '4 + 2 = ?' });
  const html = NumberPlay.renderHtml(plan);
  assert.match(html, /data-total-sounds="6"/);
  const dotMatches = html.match(/class="np-dot/g);
  assert.equal(dotMatches.length, plan.totalSounds);

  const mockBtn = { setAttribute: () => {}, addEventListener: () => {} };
  const mockDots = [0, 1, 2, 3, 4, 5].map(() => ({ classList: { add: () => {}, remove: () => {} } }));
  const mockAnnouncer = { textContent: '' };
  const mockContainer = {
    classList: { remove: () => {}, add: () => {} },
    innerHTML: '',
    querySelector: sel => sel.includes('play-numbers') ? mockBtn : (sel.includes('announcer') ? mockAnnouncer : null),
    querySelectorAll: sel => sel.includes('np-dot') ? mockDots : []
  };
  const handle = NumberPlay.mount(mockContainer, { prompt: '4 + 2 = ?' });
  assert.ok(handle && typeof handle.play === 'function');
});

test('timing & timbre: >=1.5 beat pause between groups, distinct instrument per group (#720, Refs #591)', () => {
  const plan = NumberPlay.extractNumberPlan({ prompt: '4 + 3 = ?' }, { bpm: 100 });
  const gap = plan.notes[4].at - plan.notes[3].at;
  assert.ok(gap >= plan.beat * 1.5, `Gap ${gap}s must be at least 1.5 beats (${plan.beat * 1.5}s)`);
  assert.notEqual(plan.groups[0].voice, plan.groups[1].voice);
  assert.notEqual(plan.groups[0].hz, plan.groups[1].hz);
});

test('renderHtml creates exact circle count matching sound count (#720, Refs #591)', () => {
  const plan = NumberPlay.extractNumberPlan({ prompt: '3 + 2 = ?' });
  const html = NumberPlay.renderHtml(plan);
  assert.match(html, /data-total-sounds="5"/);
  const dotMatches = html.match(/class="np-dot/g);
  assert.equal(dotMatches.length, plan.totalSounds);
  assert.match(html, /class="np-gap"/);
});
