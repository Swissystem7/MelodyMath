const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const vertical = require('../src/lib/vertical.js');
const musicEngine = require('../src/lib/musicEngine.js');
const banks = require('../src/lib/banks.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function createMockAudioContext() {
  let state = 'suspended';
  return {
    get state() { return state; },
    set state(v) { state = v; },
    currentTime: 1.0,
    resume() { state = 'running'; },
    createGain() { return { connect() {} }; }
  };
}

test('decomposeMultiplication decomposes operands into place-value partial products', () => {
  const partsSingle = vertical.normalizeVertical.decompose(24, 3);
  assert.equal(partsSingle.length, 2);
  assert.deepEqual(partsSingle[0], {
    digit: 4,
    place: 0,
    placeName: 'אחדות',
    val: 4,
    multiplier: 3,
    expr: '4 × 3',
    product: 12
  });
  assert.deepEqual(partsSingle[1], {
    digit: 2,
    place: 1,
    placeName: 'עשרות',
    val: 20,
    multiplier: 3,
    expr: '20 × 3',
    product: 60
  });

  const partsDouble = vertical.normalizeVertical.decompose(35, 14);
  assert.equal(partsDouble.length, 2);
  assert.equal(partsDouble[0].product, 140); // 35 * 4
  assert.equal(partsDouble[1].product, 350); // 35 * 10
});

test('normalizeVertical supports multiplication and attaches partial products', () => {
  const V = vertical.normalizeVertical({ a: 24, b: 3, op: '×' });
  assert.equal(V.op, '×');
  assert.equal(V.a, 24);
  assert.equal(V.b, 3);
  assert.ok(Array.isArray(V.partials));
  assert.equal(V.partials.length, 2);
  assert.equal(V.partials.reduce((sum, p) => sum + p.product, 0), 72);
});

test('renderVerticalHtml renders vertical multiplication layout with partial products and total', () => {
  const hiddenHtml = vertical.renderVerticalHtml({ a: 24, b: 3, op: '×' });
  assert.match(hiddenHtml, /vert-mult/);
  assert.match(hiddenHtml, /חישוב מאונך: 24 כפול 3/);
  assert.match(hiddenHtml, /vert-partials/);
  assert.match(hiddenHtml, /data-part-product="12"/);
  assert.match(hiddenHtml, /data-part-product="60"/);
  assert.doesNotMatch(hiddenHtml, /vert-total-line/);

  const revealedHtml = vertical.renderVerticalHtml({ a: 24, b: 3, op: '×' }, { revealed: true });
  assert.match(revealedHtml, /vert-total-line/);
  assert.match(revealedHtml, /סה״כ: 72/);
  assert.match(revealedHtml, /revealed/);
});

test('explainMultiplicationError returns tailored ולמה feedback for common errors', () => {
  const explain = vertical.normalizeVertical.explainError;
  const onesErr = explain(12, 24, 3);
  assert.match(onesErr, /ולמה:/);
  assert.match(onesErr, /רק מכפלת האחדות/);
  assert.match(onesErr, /72/);

  const tensErr = explain(60, 24, 3);
  assert.match(tensErr, /ולמה:/);
  assert.match(tensErr, /רק המכפלה בעשרות/);

  const addErr = explain(27, 24, 3);
  assert.match(addErr, /ולמה:/);
  assert.match(addErr, /חישבתם חיבור/);

  const shiftErr = explain(18, 24, 3); // 4*3 + 2*3 = 18 instead of 12 + 60 = 72
  assert.match(shiftErr, /ולמה:/);
  assert.match(shiftErr, /הספרה 2 ב-24 היא 2 עשרות/);

  // Fallback and edge cases (covering lines 91-93)
  const generalErr = explain(999, 24, 3);
  assert.match(generalErr, /ולמה: לפי חוק הפילוג בכפל במאונך, מפרקים לעשרות ואחדות ומחברים את המכפלות החלקיות:/);
  assert.match(generalErr, /4 × 3 = 12/);
  assert.match(generalErr, /20 × 3 = 60/);

  assert.equal(explain('xyz', 24, 3), 'יש להזין מספר כתשובה.');
  assert.equal(explain(72, 24, 3), 'נכון מאוד!');
});

test('ORFF_INSTRUMENTS maps place values to instruments and playOrffEnsemble sounds them', () => {
  assert.equal(musicEngine.ORFF_INSTRUMENTS.length, 7);
  assert.equal(musicEngine.ORFF_INSTRUMENTS[0].placeName, 'אחדות');
  assert.equal(musicEngine.ORFF_INSTRUMENTS[0].he, 'גלוקנשפיל');
  assert.equal(musicEngine.ORFF_INSTRUMENTS[1].placeName, 'עשרות');
  assert.equal(musicEngine.ORFF_INSTRUMENTS[1].he, 'קסילופון סופרן');

  const onesSound = musicEngine.playOrffEnsemble(0);
  assert.equal(onesSound.place, 0);
  assert.equal(onesSound.instrument, 'גלוקנשפיל');

  const tensSound = musicEngine.playOrffEnsemble('עשרות');
  assert.equal(tensSound.place, 1);
  assert.equal(tensSound.instrument, 'קסילופון סופרן');

  const partSound = musicEngine.playPartialProductSound({ product: 60, place: 1 });
  assert.equal(partSound.product, 60);
  assert.equal(partSound.place, 1);
});

test('SHOFAR_CALL_TYPES defines calls and playShofarDistributive models distributive property', () => {
  assert.equal(musicEngine.SHOFAR_CALL_TYPES.T.name, 'תקיעה');
  assert.equal(musicEngine.SHOFAR_CALL_TYPES.S.name, 'שברים');
  assert.equal(musicEngine.SHOFAR_CALL_TYPES.R.name, 'תרועה');

  const singleCall = musicEngine.playShofarCall('T');
  assert.equal(singleCall.call, 'T');
  assert.equal(singleCall.blasts, 1);

  const shevarimCall = musicEngine.playShofarCall('שברים');
  assert.equal(shevarimCall.call, 'S');
  assert.equal(shevarimCall.blasts, 3);

  const distResult = musicEngine.playShofarDistributive({ kind: 'round', value: 10 });
  assert.equal(distResult.kind, 'round');
  assert.equal(distResult.totalCalls, 10);
});

test('distributiveItems filters grades ג, ד, ה items for distributive property and shofar', () => {
  const allDist = banks.distributiveItems();
  assert.ok(allDist.length >= 8);

  const g3 = banks.distributiveItems('ג');
  assert.ok(g3.length >= 2);
  assert.ok(g3.some((it) => it.kind === 'shofar' || it.kind === 'distributive_shofar' || it.kind === 'distributive' || (it.hint && it.hint.includes('חוק הפילוג'))));

  const g4 = banks.distributiveItems('ד');
  assert.ok(g4.length >= 3);
  assert.ok(g4.some((it) => it.vert && it.vert.op === '×'));

  const g5 = banks.distributiveItems('ה');
  assert.ok(g5.length >= 1);
  assert.ok(g5.some((it) => it.vert && it.vert.op === '×'));
});

test('explainDistributiveError provides tailored feedback for shofar calls and bank questions', () => {
  const shofarItem = { kind: 'distributive_shofar', prompt: '3 × (4 + 3 + 3) = ?', answer: 30 };
  assert.match(banks.explainDistributiveError(shofarItem, 10), /10 הוא מספר הקולות בסבב אחד/);
  assert.match(banks.explainDistributiveError(shofarItem, 30), /30 הוא סך כל הקולות/);
  assert.match(banks.explainDistributiveError(shofarItem, 90), /סופרים קריאות \(קולות\) ולא תקיעות בודדות/);
  assert.match(banks.explainDistributiveError(shofarItem, 25), /בקריאות השופר חוק הפילוג מראה ש-3 פעמים \(4 \+ 3 \+ 3\) שווה ל-3×4 \+ 3×3 \+ 3×3 = 30/);

  const vertItem = { kind: 'distributive', vert: { a: 24, b: 3, op: '×' }, answer: 72 };
  assert.match(banks.explainDistributiveError(vertItem, 12), /רק מכפלת האחדות/);

  const whyItem = { kind: 'distributive', why: { '4': '4 היא ספרת האחדות' }, answer: 10 };
  assert.match(banks.explainDistributiveError(whyItem, 4), /4 היא ספרת האחדות/);

  assert.equal(banks.explainDistributiveError(null, 10), 'ולמה: יש לבדוק את התרגיל.');
  assert.equal(banks.explainDistributiveError({ kind: 'distributive', hint: 'רמז מותאם' }, 9), 'ולמה: רמז מותאם');
  assert.equal(banks.explainDistributiveError({ kind: 'distributive' }, 9), 'ולמה: לפי חוק הפילוג כופלים כל חלק בנפרד ומחברים את המכפלות החלקיות.');
});

test('bindVertical attaches to DOM root and supports reveal without unsafe innerHTML assignment', () => {
  let inner = '';
  const fakeElement = {
    get innerHTML() { return inner; },
    set innerHTML(val) { inner = val; }
  };
  const binding = vertical.bindVertical(fakeElement, { a: 24, b: 3, op: '×' });
  assert.ok(binding);
  assert.equal(binding.partials.length, 2);
  assert.match(inner, /vert-mult/);
  assert.doesNotMatch(inner, /vert-total-line/);

  binding.reveal();
  assert.match(inner, /vert-total-line/);
});

test('index.html integrates vertical partial products, shofar audio, and distributive error explanations', () => {
  assert.match(html, /item\.widget==='vertical'/);
  assert.match(html, /playPartialProductSound/);
  assert.match(html, /playShofarDistributive/);
  assert.match(html, /explainDistributiveError/);
  assert.match(html, /distributiveItems/);
  assert.match(html, /_vertBinding\.reveal/);
});

test('playShofarCall synthesizes T, S, and R horn blasts through audioContext and playVoice or fallback tap', () => {
  const ac = createMockAudioContext();
  const pvCalls = [];
  const mockPv = (ctx, voice, hz, t0, durObj, extra) => {
    pvCalls.push({ ctx, voice, hz, t0, dur: extra.dur, gain: extra.gain });
  };

  // Tekiah
  const tRes = musicEngine.playShofarCall('T', { audioContext: ac, playVoice: mockPv });
  assert.equal(ac.state, 'running');
  assert.equal(tRes.call, 'T');
  assert.equal(tRes.silent, false);
  assert.equal(pvCalls.length, 1);
  assert.equal(pvCalls[0].voice, 'horn');
  assert.equal(pvCalls[0].dur, musicEngine.SHOFAR_CALL_TYPES.T.dur);

  // Shevarim (3 blasts)
  pvCalls.length = 0;
  const sRes = musicEngine.playShofarCall('שברים', { audioContext: ac, playVoice: mockPv });
  assert.equal(sRes.call, 'S');
  assert.equal(sRes.blasts, 3);
  assert.equal(pvCalls.length, 3);
  assert.equal(pvCalls[0].dur, musicEngine.SHOFAR_CALL_TYPES.S.dur);

  // Teruah (9 blasts)
  pvCalls.length = 0;
  const rRes = musicEngine.playShofarCall('תרועה', { audioContext: ac, playVoice: mockPv });
  assert.equal(rRes.call, 'R');
  assert.equal(rRes.blasts, 9);
  assert.equal(pvCalls.length, 9);
  assert.equal(pvCalls[0].dur, musicEngine.SHOFAR_CALL_TYPES.R.dur);

  // Fallback to tap when playVoice is omitted
  const tapRes = musicEngine.playShofarCall('T', { audioContext: ac });
  assert.equal(tapRes.silent, false);

  // Respects muted state
  musicEngine.setMuted(true);
  assert.equal(musicEngine.playShofarCall('T'), null);
  musicEngine.setMuted(false);
});

test('playShofarDistributive models sequence and round execution with MM_SHOFAR_CALLS and fallback', () => {
  const ac = createMockAudioContext();
  const recorded = [];
  globalThis.MM_SHOFAR_CALLS = {
    play(spec, opts) { recorded.push({ spec, opts }); }
  };

  const distRes = musicEngine.playShofarDistributive({ kind: 'round', value: 30 }, { audioContext: ac, playVoice: () => {} });
  assert.equal(distRes.kind, 'round');
  assert.equal(distRes.totalCalls, 30);
  assert.equal(distRes.silent, false);
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].spec.kind, 'round');
  assert.equal(recorded[0].spec.value, 30);

  delete globalThis.MM_SHOFAR_CALLS;

  // Fallback when MM_SHOFAR_CALLS is absent
  const fallbackRes = musicEngine.playShofarDistributive({ kind: 'bySeq' }, { audioContext: ac });
  assert.equal(fallbackRes.kind, 'bySeq');
  assert.equal(fallbackRes.totalCalls, 30);
  assert.equal(fallbackRes.silent, false);

  const defaultNullRes = musicEngine.playShofarDistributive(null, { audioContext: ac });
  assert.equal(defaultNullRes.kind, 'bySeq');
  assert.equal(defaultNullRes.totalCalls, 30);
});

test('playOrffEnsemble resolves Hebrew place name queries and triggers sound generation', () => {
  const ac = createMockAudioContext();
  const orffPvCalls = [];
  const mockPv = (ctx, voice, hz, t0, durObj, extra) => {
    orffPvCalls.push({ voice, hz, dur: extra.dur });
  };

  // Hebrew text queries mapping to place values
  const tensSound = musicEngine.playOrffEnsemble('עשרות');
  assert.equal(tensSound.place, 1);

  // Test regex fallback branches (lines 1168-1171)
  const regexTens = musicEngine.playOrffEnsemble('עשר');
  assert.equal(regexTens.place, 1);

  const regexHundreds = musicEngine.playOrffEnsemble('מא');
  assert.equal(regexHundreds.place, 2);

  const regexThousands = musicEngine.playOrffEnsemble('אלף');
  assert.equal(regexThousands.place, 3);

  const regexMillions = musicEngine.playOrffEnsemble('מילי');
  assert.equal(regexMillions.place, 6);

  // Sound synthesis with playVoice
  const synthRes = musicEngine.playOrffEnsemble(0, { audioContext: ac, playVoice: mockPv });
  assert.equal(synthRes.silent, false);
  assert.equal(synthRes.instrument, 'גלוקנשפיל');
  assert.equal(synthRes.voice, 'tine');
  assert.equal(orffPvCalls.length, 1);
  assert.equal(orffPvCalls[0].voice, 'tine');

  // Fallback to tap when playVoice is omitted
  const tapRes = musicEngine.playOrffEnsemble(0, { audioContext: ac });
  assert.equal(tapRes.silent, false);

  // Respects muted state
  musicEngine.setMuted(true);
  assert.equal(musicEngine.playOrffEnsemble(0), null);
  musicEngine.setMuted(false);
});

test('playPartialProductSound attaches product metadata to Orff instrument output', () => {
  const ac = createMockAudioContext();
  const res1 = musicEngine.playPartialProductSound({ product: 60, place: 1 }, null, { audioContext: ac, playVoice: () => {} });
  assert.equal(res1.product, 60);
  assert.equal(res1.place, 1);
  assert.equal(res1.instrument, 'קסילופון סופרן');
  assert.equal(res1.silent, false);

  const res2 = musicEngine.playPartialProductSound(12);
  assert.equal(res2.product, 12);
  assert.equal(res2.place, 0);
  assert.equal(res2.silent, true);
});

test('bindVertical handles null root and non-multiplication specs', () => {
  assert.equal(vertical.bindVertical(null, { a: 24, b: 3, op: '×' }), null);

  let inner = '';
  const fakeElement = {
    get innerHTML() { return inner; },
    set innerHTML(val) { inner = val; }
  };
  const binding = vertical.bindVertical(fakeElement, { a: 10, b: 5, op: '+' });
  assert.ok(binding);
  assert.equal(binding.partials.length, 0);
  assert.match(inner, /vert-row vert-a/);
  assert.doesNotMatch(inner, /vert-partials/);
});

test('bindVertical uses document createContextualFragment when DOM range is available', () => {
  let appended = null;
  const fakeRoot = {
    get firstChild() { return appended; },
    removeChild(c) { appended = null; },
    appendChild(c) { appended = c; }
  };
  globalThis.document = {
    createRange() {
      return {
        selectNodeContents(r) {},
        createContextualFragment(html) {
          return { fragmentHtml: html };
        }
      };
    }
  };
  try {
    const binding = vertical.bindVertical(fakeRoot, { a: 24, b: 3, op: '×' });
    assert.ok(binding);
    assert.ok(appended && appended.fragmentHtml);
    assert.match(appended.fragmentHtml, /vert-mult/);
    binding.reveal();
    assert.match(appended.fragmentHtml, /vert-total-line/);
  } finally {
    delete globalThis.document;
  }
});
