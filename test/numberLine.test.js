const test = require('node:test');
const assert = require('node:assert/strict');
const line = require('../src/lib/numberLine');

test('a jump on the line is addition or subtraction, then clamped', () => {
  assert.equal(line.jumpOnLine(3, 4, { min: 0, max: 20 }), 7);
  assert.equal(line.jumpOnLine(8, -3, { min: 0, max: 20 }), 5);
  assert.equal(line.jumpOnLine(90, 20, { min: 0, max: 100 }), 100);
  assert.equal(line.jumpOnLine(5, -10, { min: 0, max: 20 }), 0);
});

test('ticks cover the closed interval and percent is 0–100', () => {
  const ticks = line.ticksOf({ min: 0, max: 10, step: 1 });
  assert.deepEqual(ticks.slice(0, 3), [0, 1, 2]);
  assert.equal(ticks[ticks.length - 1], 10);
  assert.equal(line.percentOnLine(0, { min: 0, max: 20 }), 0);
  assert.equal(line.percentOnLine(10, { min: 0, max: 20 }), 50);
  assert.equal(line.percentOnLine(20, { min: 0, max: 20 }), 100);
});

test('the HTML marks ticks and announces the selected number', () => {
  const html = line.renderNumberLineHtml({ min: 0, max: 10, start: 4 }, 4);
  assert.match(html, /aria-label="ישר מספרים/);
  assert.match(html, /data-n="4"/);
  assert.match(html, /נבחר: 4/);
  assert.doesNotMatch(html, /<script/);
});

test('playJumpSound function should be defined and return undefined for invalid inputs', () => {
  assert.equal(typeof line.playJumpSound, 'function');
  assert.equal(line.playJumpSound(null, null), undefined);
  assert.equal(line.playJumpSound(5, null), undefined);
});

test('soundForTick calculates frequencies and identifies key fraction points', () => {
  const s0 = line.soundForTick(0, { min: 0, max: 100 });
  assert.equal(s0.percent, 0);
  assert.equal(s0.isKeyPoint, true);
  assert.equal(s0.pointName, '0');

  const s50 = line.soundForTick(50, { min: 0, max: 100 });
  assert.equal(s50.percent, 50);
  assert.equal(s50.isKeyPoint, true);
  assert.equal(s50.pointName, '1/2');

  const s100 = line.soundForTick(100, { min: 0, max: 100 });
  assert.equal(s100.percent, 100);
  assert.equal(s100.isKeyPoint, true);
  assert.equal(s100.pointName, '1');

  assert.ok(s100.frequency > s50.frequency);
  assert.ok(s50.frequency > s0.frequency);
});

test('scaleJumpSound plays scale step frequencies where a jump of 10 is an octave', () => {
  const base = 220;
  const octaveJump = line.scaleJumpSound(0, 10, base);
  assert.equal(octaveJump.jump, 10);
  assert.equal(octaveJump.frequency, 440);
  assert.equal(octaveJump.isOctave, true);

  const stepJump = line.scaleJumpSound(2, 3, base);
  assert.equal(stepJump.jump, 1);
  assert.equal(stepJump.frequency, Math.round(base * 2 ** (1 / 10) * 100) / 100);
  assert.equal(stepJump.isOctave, false);

  const downOctave = line.scaleJumpSound(15, 5, base);
  assert.equal(downOctave.jump, -10);
  assert.equal(downOctave.frequency, 110);
  assert.equal(downOctave.isOctave, true);
});

test('renderNumberLineHtml should not mark any button as "on" when selected is explicitly null or undefined', () => {
  const html = line.renderNumberLineHtml({ min: 0, max: 20, start: 0 }, null);
  assert.doesNotMatch(html, /class="nline-tick on"/);
});

test('normalizeLine sanitizes negative steps, float steps, and zero steps to positive integers', () => {
  assert.equal(line.normalizeLine({ min: 0, max: 20, step: -5 }).step, 1);
  assert.equal(line.normalizeLine({ min: 0, max: 20, step: -1 }).step, 1);
  assert.equal(line.normalizeLine({ min: 0, max: 20, step: 0 }).step, 1);
  assert.equal(line.normalizeLine({ min: 0, max: 20, step: 2.4 }).step, 2);
  assert.equal(line.normalizeLine({ min: 0, max: 20, step: 2.7 }).step, 3);
  assert.equal(line.normalizeLine({ min: 0, max: 20, step: NaN }).step, 1);
  assert.equal(line.normalizeLine({ min: 0, max: 20, step: Infinity }).step, 1);
});

test('scaleStepFreq falls back to SCALE_BASE_HZ for negative, zero, or NaN base frequencies', () => {
  const base = line.SCALE_BASE_HZ; // 220
  assert.equal(line.scaleStepFreq(-100, 0), base);
  assert.equal(line.scaleStepFreq(0, 0), base);
  assert.equal(line.scaleStepFreq(NaN, 0), base);
  assert.equal(line.scaleStepFreq(Infinity, 0), base);
  assert.equal(line.scaleStepFreq(-50, 10), 440);
  assert.equal(line.scaleStepFreq(0, 10), 440);
  assert.equal(line.scaleStepFreq(NaN, 10), 440);

  // jumpSize is coerced to integer step
  assert.equal(line.scaleStepFreq(base, 10.4), 440);
  assert.equal(line.scaleStepFreq(base, NaN), base);
});

test('scaleJumpSound safely handles floats, non-finite ticks, and string numeric inputs, producing valid integer jumps and frequencies', () => {
  // Floats produce valid integer ticks and jumps
  const floatJump = line.scaleJumpSound(1.2, 5.8, 220);
  assert.equal(floatJump.from, 1);
  assert.equal(floatJump.to, 6);
  assert.equal(floatJump.jump, 5);
  assert.equal(floatJump.isOctave, false);
  assert.equal(typeof floatJump.frequency, 'number');

  // String numeric inputs coerced to numbers
  const strJump = line.scaleJumpSound('2', '12', '220');
  assert.equal(strJump.from, 2);
  assert.equal(strJump.to, 12);
  assert.equal(strJump.jump, 10);
  assert.equal(strJump.isOctave, true);
  assert.equal(strJump.frequency, 440);

  // Non-finite ticks default safely to 0
  const nanJump = line.scaleJumpSound(NaN, Infinity, 220);
  assert.equal(nanJump.from, 0);
  assert.equal(nanJump.to, 0);
  assert.equal(nanJump.jump, 0);
  assert.equal(nanJump.isOctave, false);
  assert.equal(nanJump.frequency, 220);
});

test('playJumpSound handles negative/invalid line configurations gracefully and validates inputs', () => {
  // Non-finite value returns undefined
  assert.equal(line.playJumpSound(NaN, { min: 0, max: 20 }), undefined);
  assert.equal(line.playJumpSound(Infinity, { min: 0, max: 20 }), undefined);
  assert.equal(line.playJumpSound('invalid', { min: 0, max: 20 }), undefined);
  assert.equal(line.playJumpSound(undefined, { min: 0, max: 20 }), undefined);

  // Invalid line configurations return undefined
  assert.equal(line.playJumpSound(5, null), undefined);
  assert.equal(line.playJumpSound(5, undefined), undefined);
  assert.equal(line.playJumpSound(5, 'not-an-object'), undefined);
  assert.equal(line.playJumpSound(5, 123), undefined);
  assert.equal(line.playJumpSound(5, true), undefined);
  assert.equal(line.playJumpSound(5, []), undefined);

  // Negative line configurations are handled gracefully (returns null off browser in Node)
  assert.equal(line.playJumpSound(3, { min: -20, max: -5, start: -10 }), null);
  assert.equal(line.playJumpSound(-4, { min: -10, max: 10, start: 0 }), null);
});

test('jumpOnLine rounds non-integer delta and returns from on non-finite inputs', () => {
  // Non-integer delta is rounded
  assert.equal(line.jumpOnLine(5, 2.4, { min: 0, max: 20 }), 7);
  assert.equal(line.jumpOnLine(5, 2.6, { min: 0, max: 20 }), 8);
  assert.equal(line.jumpOnLine(5, -2.4, { min: 0, max: 20 }), 3);
  assert.equal(line.jumpOnLine(5, -2.6, { min: 0, max: 20 }), 2);

  // Non-finite delta returns from
  assert.equal(line.jumpOnLine(5, NaN, { min: 0, max: 20 }), 5);
  assert.equal(line.jumpOnLine(5, Infinity, { min: 0, max: 20 }), 5);
  assert.equal(line.jumpOnLine(5, 'not-a-number', { min: 0, max: 20 }), 5);

  // Non-finite start returns from
  assert.equal(line.jumpOnLine(NaN, 5, { min: 0, max: 20 }), 0);
  assert.equal(line.jumpOnLine('not-a-number', 5, { min: 0, max: 20 }), 0);
});
