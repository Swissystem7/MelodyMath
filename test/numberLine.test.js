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

test('scaleJumpSound plays semitone steps (12 to the octave); a ten is a full cycle, not an octave', () => {
  const base = 220;
  const ten = line.scaleJumpSound(0, 10, base);
  assert.equal(ten.jump, 10);
  assert.equal(ten.isOctave, false, 'a scale is not place value (docs/research/topics/039)');
  assert.deepEqual([ten.isTen, ten.tens, ten.ones], [true, 1, 0]);
  assert.deepEqual(line.TEN_CYCLE, [2, 3, 2, 3]);
  assert.equal(line.TEN_CYCLE.reduce((s, x) => s + x, 0), 10);
  const mixed = line.scaleJumpSound(60, 85, base);
  assert.deepEqual([mixed.isTen, mixed.tens, mixed.ones], [false, 2, 5]);
  const octaveJump = line.scaleJumpSound(0, 12, base);
  assert.equal(octaveJump.frequency, 440);
  assert.equal(octaveJump.isOctave, true);

  const stepJump = line.scaleJumpSound(2, 3, base);
  assert.equal(stepJump.jump, 1);
  assert.equal(stepJump.frequency, Math.round(base * 2 ** (1 / 12) * 100) / 100);
  assert.equal(stepJump.isOctave, false);

  const downOctave = line.scaleJumpSound(17, 5, base);
  assert.equal(downOctave.jump, -12);
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
  assert.equal(line.scaleStepFreq(-50, 12), 440);
  assert.equal(line.scaleStepFreq(0, 12), 440);
  assert.equal(line.scaleStepFreq(NaN, 12), 440);

  // jumpSize is coerced to integer step
  assert.equal(line.scaleStepFreq(base, 12.4), 440);
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
  const strJump = line.scaleJumpSound('2', '14', '220');
  assert.equal(strJump.from, 2);
  assert.equal(strJump.to, 14);
  assert.equal(strJump.jump, 12);
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

function tickButtonsFromHtml(html) {
  const ticks = [];
  for (const m of html.matchAll(/data-n="(-?\d+)"/g)) {
    const n = m[1];
    const btn = {
      getAttribute(name) { return name === 'data-n' ? n : null; },
      addEventListener(type, fn) { if (type === 'click') btn._click = fn; },
      click() { if (typeof btn._click === 'function') btn._click(); },
    };
    ticks.push(btn);
  }
  return ticks;
}

function fakeRoot(mode) {
  const root = { html: '', ticks: [] };
  const parse = (html) => {
    root.html = html;
    root.ticks = tickButtonsFromHtml(html);
  };
  if (mode === 'replace') {
    root.replaceChildren = () => { root.html = ''; root.ticks = []; };
    root.insertAdjacentHTML = (_pos, html) => { parse((root.html || '') + html); };
  } else if (mode === 'insert') {
    root.textContent = 'stale';
    Object.defineProperty(root, 'textContent', {
      set() { root.html = ''; root.ticks = []; },
      get() { return root.html; },
    });
    root.insertAdjacentHTML = (_pos, html) => { parse((root.html || '') + html); };
  } else if (mode === 'inner') {
    Object.defineProperty(root, 'innerHTML', {
      set(v) { parse(v); },
      get() { return root.html; },
    });
  }
  if (mode !== 'no-qsa') {
    root.querySelectorAll = (sel) => (sel === '.nline-tick' ? root.ticks : []);
  }
  return root;
}

test('bindNumberLine returns null without a root and paints through replaceChildren plus insertAdjacentHTML', () => {
  assert.equal(line.bindNumberLine(null, { min: 0, max: 10, start: 2 }), null);
  assert.equal(line.bindNumberLine(undefined, { min: 0, max: 10, start: 2 }), null);

  const picks = [];
  const root = fakeRoot('replace');
  const api = line.bindNumberLine(root, { min: 0, max: 10, start: 2 }, (n) => { picks.push(n); });
  assert.equal(typeof api.value, 'function');
  assert.equal(api.value(), 2);
  assert.match(root.html, /data-n="2"/);
  assert.match(root.html, /נבחר: 2/);

  const tick4 = root.ticks.find((btn) => btn.getAttribute('data-n') === '4');
  assert.ok(tick4);
  tick4.click();
  assert.equal(api.value(), 4);
  assert.deepEqual(picks, [4]);
  assert.match(root.html, /נבחר: 4/);

  api.set(8);
  assert.equal(api.value(), 8);
  assert.match(root.html, /נבחר: 8/);
});

test('bindNumberLine falls back to textContent plus insertAdjacentHTML when replaceChildren is missing', () => {
  const root = fakeRoot('insert');
  const api = line.bindNumberLine(root, { min: 0, max: 6, start: 0 });
  assert.equal(api.value(), 0);
  assert.match(root.html, /data-n="0"/);
  assert.doesNotMatch(root.html, /stale/);
  api.set(6);
  assert.equal(api.value(), 6);
  assert.match(root.html, /נבחר: 6/);
});

test('bindNumberLine falls back to innerHTML and skips clicks when querySelectorAll is missing', () => {
  const picks = [];
  const withQsa = fakeRoot('inner');
  const api = line.bindNumberLine(withQsa, { min: 0, max: 4, start: 1 }, (n) => { picks.push(n); });
  assert.equal(api.value(), 1);
  assert.match(withQsa.html, /data-n="1"/);
  const tick3 = withQsa.ticks.find((btn) => btn.getAttribute('data-n') === '3');
  tick3.click();
  assert.equal(api.value(), 3);
  assert.deepEqual(picks, [3]);

  const noQsa = fakeRoot('inner');
  delete noQsa.querySelectorAll;
  const silent = line.bindNumberLine(noQsa, { min: 0, max: 4, start: 1 }, (n) => { picks.push(n); });
  assert.equal(silent.value(), 1);
  assert.match(noQsa.html, /data-n="1"/);
  silent.set(4);
  assert.equal(silent.value(), 4);
  assert.match(noQsa.html, /נבחר: 4/);
  assert.deepEqual(picks, [3]);
});

test('escapeHtml encodes markup characters and treats null as empty', () => {
  assert.equal(line.escapeHtml(null), '');
  assert.equal(line.escapeHtml(undefined), '');
  assert.equal(line.escapeHtml('a&b<c>"\''), 'a&amp;b&lt;c&gt;&quot;&#39;');
});

test('zero or negative step input is safely normalized without infinite loop', () => {
  const normZero = line.normalizeLine({ min: 0, max: 20, step: 0 });
  assert.equal(normZero.step, 1);
  const normNeg = line.normalizeLine({ min: 0, max: 20, step: -4 });
  assert.equal(normNeg.step, 1);

  const ticksZero = line.ticksOf({ min: 0, max: 10, step: 0 });
  assert.deepEqual(ticksZero, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  const ticksNeg = line.ticksOf({ min: 0, max: 5, step: -3 });
  assert.deepEqual(ticksNeg, [0, 1, 2, 3, 4, 5]);

  const html = line.renderNumberLineHtml({ min: 0, max: 4, step: 0 });
  assert.match(html, /data-min="0"/);
  assert.match(html, /data-max="4"/);
  const tickCount = (html.match(/class="nline-tick/g) || []).length;
  assert.equal(tickCount, 5);
});

test('NaN inputs normalize safely without producing NaN labels in the UI', () => {
  const norm = line.normalizeLine({ min: NaN, max: NaN, step: NaN, start: NaN, mark: NaN });
  assert.equal(norm.min, 0);
  assert.equal(norm.max, 20);
  assert.equal(norm.step, 1);
  assert.equal(norm.start, null);
  assert.equal(norm.mark, null);

  const ticks = line.ticksOf({ min: NaN, max: NaN, step: NaN });
  assert.equal(ticks.length, 21);
  assert.equal(ticks.every((n) => Number.isFinite(n)), true);

  assert.equal(line.jumpOnLine(NaN, 5, { min: NaN, max: NaN }), 0);
  assert.equal(line.jumpOnLine(5, NaN, { min: 0, max: 20 }), 5);
  assert.equal(line.placeOnLine(NaN, { min: NaN, max: NaN }), 0);
  assert.equal(line.percentOnLine(NaN, { min: NaN, max: NaN }), 0);

  const sound = line.soundForTick(NaN, { min: NaN, max: NaN });
  assert.equal(Number.isFinite(sound.frequency), true);
  assert.equal(sound.value, 0);
  assert.equal(sound.percent, 0);

  const htmlAllNaN = line.renderNumberLineHtml({ min: NaN, max: NaN, step: NaN, start: NaN }, NaN);
  assert.equal(htmlAllNaN.includes('NaN'), false, 'HTML must not contain NaN');
  assert.match(htmlAllNaN, /בחרו מספר על הישר/);

  const htmlSelectedNaN = line.renderNumberLineHtml({ min: 0, max: 10 }, NaN);
  assert.equal(htmlSelectedNaN.includes('NaN'), false, 'HTML with NaN selected must not contain NaN');
  assert.match(htmlSelectedNaN, /בחרו מספר על הישר/);
  assert.doesNotMatch(htmlSelectedNaN, /class="nline-tick on"/);
});

test('inverted boundaries normalize safely and swap endpoints', () => {
  const norm1 = line.normalizeLine({ min: 20, max: 0 });
  assert.equal(norm1.min, 0);
  assert.equal(norm1.max, 20);

  const norm2 = line.normalizeLine({ min: 50, max: -10, start: 0 });
  assert.equal(norm2.min, -10);
  assert.equal(norm2.max, 50);
  assert.equal(norm2.start, 0);

  const ticks = line.ticksOf({ min: 10, max: 0 });
  assert.deepEqual(ticks, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  assert.equal(line.jumpOnLine(4, 3, { min: 20, max: 0 }), 7);
  assert.equal(line.placeOnLine(15, { min: 20, max: 0 }), 15);
  assert.equal(line.placeOnLine(-5, { min: 20, max: 0 }), 0);
  assert.equal(line.percentOnLine(10, { min: 20, max: 0 }), 50);

  const html = line.renderNumberLineHtml({ min: 10, max: 0 }, 5);
  assert.match(html, /data-min="0"/);
  assert.match(html, /data-max="10"/);
  assert.match(html, /class="nline-tick on"[^>]*data-n="5"/);
  assert.match(html, /נבחר: 5/);
});

test('a single given endpoint opens a 10-step line on the missing side', () => {
  const onlyMin = line.normalizeLine({ min: 50 });
  assert.equal(onlyMin.min, 50);
  assert.equal(onlyMin.max, 60);
  const onlyMax = line.normalizeLine({ max: -5 });
  assert.equal(onlyMax.min, -15);
  assert.equal(onlyMax.max, -5);
});

test('set(null) or set(NaN) clears the selection on a bound line', () => {
  const root = fakeRoot('inner');
  delete root.querySelectorAll;
  const api = line.bindNumberLine(root, { min: 0, max: 4, start: 2 });
  assert.equal(api.value(), 2);
  api.set(null);
  assert.equal(api.value(), null);
  assert.match(root.html, /בחרו מספר על הישר/);
  api.set(3);
  api.set(NaN);
  assert.equal(api.value(), null);
});
