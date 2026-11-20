const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const musicEngine = require('../src/lib/musicEngine.js');
const banks = require('../src/lib/banks.js');
const grade6 = require('../src/lib/curriculum/grade6.js');

test('1. orderOfOperationsSpec parses expressions with parentheses and multiplication', () => {
  const spec = musicEngine.orderOfOperationsSpec('(2 + 3) × 4 = ?');
  assert.ok(spec);
  assert.equal(spec.hasBracket, true);
  assert.equal(spec.answer, 20);
  assert.ok(spec.steps.length >= 2);
});

test('2. orderOfOperationsSpec identifies inner parentheses as emphasized package', () => {
  const spec = musicEngine.orderOfOperationsSpec('120 − 8 × (20 − 15) = ?');
  assert.ok(spec);
  assert.equal(spec.hasBracket, true);
  assert.equal(spec.answer, 80);
  const bracketStep = spec.steps.find((s) => s.emphasized);
  assert.ok(bracketStep);
  assert.equal(bracketStep.val, 5);
});

test('3. playOrderOfOperations plans audio events with parentheses package first', () => {
  const spec = musicEngine.orderOfOperationsSpec('(45 + 15) : 6 × 2 = ?');
  const res = musicEngine.playOrderOfOperations(spec);
  assert.ok(res);
  assert.equal(res.notes, spec.steps.length);
  assert.equal(res.silent, true); // in Node without AudioContext
});

test('4. thinking step (חושבים) provides clear guidance', () => {
  const spec = musicEngine.orderOfOperationsSpec('(2 + 3) × 4 = ?');
  assert.match(spec.thinking, /חושבים/);
  assert.match(spec.thinking, /סוגריים/);
});

test('5. hear and see step (שומעים ורואים) plays inner bracket package then external ops', () => {
  const spec = musicEngine.orderOfOperationsSpec('120 − 8 × (20 − 15) = ?');
  assert.match(spec.hearAndSee, /שומעים ורואים/);
  assert.match(spec.hearAndSee, /סוגריים/);
});

test('6. why explanation (ולמה) identifies left-to-right execution and brackets', () => {
  const spec = musicEngine.orderOfOperationsSpec('48 : 6 : 2 = ?');
  assert.match(spec.why, /ולמה/);
  assert.match(spec.why, /משמאל לימין/);
});

test('7. banks and curriculum integration for grade 6 order of operations items', () => {
  assert.equal(grade6.grade, 'ו');
  assert.ok(grade6.items.some((it) => it[6] && it[6].widget === 'orderOfOperations'));
  const allItems = banks.allItems();
  const ooItems = allItems.filter(
    (it) =>
      (it.grade === 'ו' || it.standard === 'G6_NAT_OPS') &&
      it.widget === 'orderOfOperations' &&
      typeof it.answer === 'number' &&
      !it.prompt.includes('ש״ח') &&
      !it.prompt.includes('בלי לחשב'),
  );
  assert.ok(ooItems.length >= 2);
  ooItems.slice(0, 2).forEach((item) => {
    const spec = musicEngine.orderOfOperationsSpec(item);
    assert.ok(spec, `failed for prompt: ${item.prompt}`);
    assert.equal(spec.answer, item.answer);
  });
});

test('8. index.html renders order of operations widget and plays audio via musicEngine', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(indexHtml, /orderOfOperationsSpec/);
  assert.match(indexHtml, /playOrderOfOperations/);
  assert.match(indexHtml, /OO-PLAY|oo-play/i);
});

test('9. explainOrderOfOperationsError detects left-to-right evaluation ignoring brackets and explains mistake', () => {
  const item = { prompt: '120 − 8 × (20 − 15) = ?', answer: 80 };
  const errExplanation = banks.explainOrderOfOperationsError(item, 560);
  assert.match(errExplanation, /ולמה/);
  assert.match(errExplanation, /סוגריים/);
  assert.match(errExplanation, /משמאל לימין/);
  assert.match(errExplanation, /560/);

  // Fallbacks: null item and falsy/zero givenAnswer
  const noItemExpl = banks.explainOrderOfOperationsError(null);
  assert.match(noItemExpl, /ולמה/);
  const zeroExpl = banks.explainOrderOfOperationsError(item, 0);
  assert.ok(!zeroExpl.includes('(0)'));
  const nullExpl = banks.explainOrderOfOperationsError(item, null);
  assert.ok(!nullExpl.includes('(null)'));
});

test('10. multi-step order of operations with division and addition respects precedence and creates sound steps', () => {
  const spec = musicEngine.orderOfOperationsSpec('10 + 20 : (2 + 3) = ?');
  assert.ok(spec);
  assert.equal(spec.answer, 14);
  assert.equal(spec.steps.length, 3);
  assert.equal(spec.steps[0].emphasized, true);
  assert.equal(spec.steps[0].val, 5);
  assert.equal(spec.steps[1].val, 4);
  assert.equal(spec.steps[2].val, 14);
});

test('11. playOrderOfOperations with active AudioContext and playVoice schedules notes', () => {
  const spec = musicEngine.orderOfOperationsSpec('(2 + 3) × 4 = ?');
  let resumed = false;
  const mockAc = {
    createGain: () => ({ connect: () => {} }),
    state: 'suspended',
    resume: () => {
      resumed = true;
    },
    currentTime: 2.0,
  };
  const voiceCalls = [];
  const mockPlayVoice = (ac, voice, hz, at, dest, opts) => {
    voiceCalls.push({ voice, hz, at, opts });
  };

  const res = musicEngine.playOrderOfOperations(spec, {
    audioContext: mockAc,
    playVoice: mockPlayVoice,
  });

  assert.ok(res);
  assert.equal(res.silent, false);
  assert.equal(resumed, true);
  assert.equal(voiceCalls.length, spec.steps.length);
  // First step is emphasized in bracket -> bell
  assert.equal(voiceCalls[0].voice, 'bell');
  assert.equal(voiceCalls[0].opts.gain, 0.32);
  // Second step is external multiplication -> xylo
  assert.equal(voiceCalls[1].voice, 'xylo');
  assert.equal(voiceCalls[1].opts.gain, 0.22);
});

test('12. playOrderOfOperations with fallback playTap when playVoice is omitted', () => {
  const spec = musicEngine.orderOfOperationsSpec('6 + 4 = ?');
  const mockAc = {
    createGain: () => ({ connect: () => {} }),
    state: 'running',
    currentTime: 1.0,
  };
  const res = musicEngine.playOrderOfOperations(spec, { audioContext: mockAc });
  assert.ok(res);
  assert.equal(res.silent, false);
});

test('13. playOrderOfOperations handles resume exception gracefully and handles muted state', () => {
  const spec = musicEngine.orderOfOperationsSpec('3 × 5 = ?');
  const throwingAc = {
    createGain: () => ({ connect: () => {} }),
    state: 'suspended',
    resume: () => {
      throw new Error('resume failed');
    },
    currentTime: 0,
  };
  // Should not throw even when resume throws
  const res = musicEngine.playOrderOfOperations(spec, { audioContext: throwingAc });
  assert.ok(res);
  assert.equal(res.silent, false);

  // Muted audio state
  musicEngine.setMuted(true);
  try {
    const resMuted = musicEngine.playOrderOfOperations(spec, { audioContext: throwingAc });
    assert.ok(resMuted);
  } finally {
    musicEngine.setMuted(false);
  }
});

test('14. orderOfOperationsSpec handles ignored characters, null inputs, and unclosed brackets', () => {
  assert.equal(musicEngine.orderOfOperationsSpec(null), null);
  assert.equal(musicEngine.orderOfOperationsSpec(''), null);
  assert.equal(musicEngine.playOrderOfOperations(null), null);
  assert.equal(musicEngine.playOrderOfOperations({}), null);

  // Tokenizer encounters ignored characters (e.g. #, [) and advances (line 1240 i++)
  const specWithExtraChars = musicEngine.orderOfOperationsSpec('2 + # 3 = ?');
  assert.ok(specWithExtraChars);
  assert.equal(specWithExtraChars.answer, 5);

  // Unclosed bracket
  const unclosed = musicEngine.orderOfOperationsSpec('(2 + 3 = ?');
  assert.ok(unclosed);

  // Division by zero
  const divZero = musicEngine.orderOfOperationsSpec('10 : (5 - 5) = ?');
  assert.ok(divZero);
  assert.equal(divZero.steps[1].val, 0);
});
