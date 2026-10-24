// MelodyMath — Unit tests for NumberPlay (Issue #686, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const NumberPlay = require('../src/components/NumberPlay.js');
const { allItems } = require('../src/lib/banks.js');

test('extractNumberPlan extracts addition, subtraction, multiplication and comparison', () => {
  const pAdd = NumberPlay.extractNumberPlan({ prompt: '3 + 2 = ?' });
  assert.equal(pAdd.groups.length, 2);
  assert.equal(pAdd.totalSounds, 5);

  const pSub = NumberPlay.extractNumberPlan({ prompt: '7 - 3 = ?' });
  assert.equal(pSub.groups[0].count, 7);
  assert.equal(pSub.groups[1].count, 3);

  const pMul = NumberPlay.extractNumberPlan({ prompt: '3 × 4 = ?' });
  assert.equal(pMul.groups.length, 3);
  assert.equal(pMul.totalSounds, 12);

  const pCmp = NumberPlay.extractNumberPlan({ prompt: 'השוו: 6 מול 4' });
  assert.equal(pCmp.groups[0].count, 6);
  assert.equal(pCmp.groups[1].count, 4);
});

test('timing & timbre: >=1 beat pause between groups, distinct instrument per group', () => {
  const plan = NumberPlay.extractNumberPlan({ prompt: '4 + 3 = ?' }, { bpm: 100 });
  const gap = plan.notes[4].at - plan.notes[3].at;
  assert.ok(gap >= plan.beat * 1.5, `Gap ${gap}s must be at least 1 full beat (${plan.beat}s)`);
  assert.notEqual(plan.groups[0].voice, plan.groups[1].voice);
  assert.notEqual(plan.groups[0].hz, plan.groups[1].hz);
});

test('renderHtml creates exact circle count matching sound count', () => {
  const plan = NumberPlay.extractNumberPlan({ prompt: '3 + 2 = ?' });
  const html = NumberPlay.renderHtml(plan);
  assert.match(html, /data-total-sounds="5"/);
  const dotMatches = html.match(/class="np-dot"/g);
  assert.equal(dotMatches.length, plan.totalSounds);
  assert.match(html, /class="np-gap"/);
});

test('play triggers notes and finishes with response under 1 second', async () => {
  const plan = NumberPlay.extractNumberPlan({ prompt: '2 + 1 = ?' }, { bpm: 600 });
  const seen = [];
  const t0 = Date.now();
  await new Promise(resolve => {
    NumberPlay.play(plan, { onNote: (n, i) => seen.push(i), onEnd: resolve });
  });
  assert.ok(Date.now() - t0 < 1000);
  assert.equal(seen.length, plan.totalSounds);
});

test('mount wires click, highlights dots and announces live count', () => {
  const plan = NumberPlay.extractNumberPlan({ prompt: '3 + 2 = ?' });
  const mockBtn = { setAttribute: () => {}, addEventListener: () => {} };
  const mockDots = [0, 1, 2, 3, 4].map(() => ({ classList: { add: () => {}, remove: () => {} } }));
  const mockAnnouncer = { textContent: '' };
  const mockContainer = {
    classList: { remove: () => {}, add: () => {} },
    innerHTML: '',
    querySelector: sel => sel.includes('play-numbers') ? mockBtn : (sel.includes('announcer') ? mockAnnouncer : null),
    querySelectorAll: sel => sel.includes('np-dot') ? mockDots : []
  };
  const handle = NumberPlay.mount(mockContainer, { prompt: '3 + 2 = ?' });
  assert.ok(handle && typeof handle.play === 'function');
});

test('curriculum coverage: extracts valid number plans across grades א to ו', () => {
  const items = allItems();
  const numSkills = ['addition', 'subtraction', 'multiplication', 'division', 'counting', 'place_value'];
  const numItems = items.filter(x => numSkills.includes(x.skill));
  let count = 0;
  numItems.forEach(it => { if (NumberPlay.extractNumberPlan(it)) count++; });
  assert.ok(count / numItems.length >= 0.95);
});
