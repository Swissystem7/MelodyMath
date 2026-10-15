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
  assert.equal(stepJump.frequency, Math.round(base * Math.pow(2, 1 / 10) * 100) / 100);
  assert.equal(stepJump.isOctave, false);

  const downOctave = line.scaleJumpSound(15, 5, base);
  assert.equal(downOctave.jump, -10);
  assert.equal(downOctave.frequency, 110);
  assert.equal(downOctave.isOctave, true);
});
