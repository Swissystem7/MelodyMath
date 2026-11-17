const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { getBeatVisualState } = require('../src/lib/music/beatVisualizer');
const beatVisualizer = require('../src/lib/music/beatVisualizer');

// 1-10: Steps 0 through 9 when active
for (let step = 0; step <= 9; step++) {
  test(`step ${step} is active when stepIndex === ${step} and activeStep === ${step}`, () => {
    const state = getBeatVisualState(step, step, false);
    assert.equal(state.active, true);
    assert.equal(state.pulse, true);
    assert.equal(state.glow, true);
    assert.equal(state.className, 'beat-active beat-pulse-ring');
    assert.deepEqual(state.classes, ['beat-active', 'beat-pulse-ring']);
  });
}

// 11: Idle/stopped state when activeStep is -1
test('idle state when activeStep is -1 returns inactive state', () => {
  const stepsToTest = [0, 1, 4, 8, 9];
  for (const s of stepsToTest) {
    const state = getBeatVisualState(s, -1, false);
    assert.deepEqual(state, {
      active: false,
      pulse: false,
      glow: false,
      className: '',
      classes: []
    });
  }
});

// 12: Idle state when stepIndex is -1 and activeStep is -1
test('idle state when both stepIndex and activeStep are -1 returns inactive state', () => {
  const state = getBeatVisualState(-1, -1, false);
  assert.deepEqual(state, {
    active: false,
    pulse: false,
    glow: false,
    className: '',
    classes: []
  });
});

// 13: prefers-reduced-motion flag reducedMotion = true disables pulse animation
test('reducedMotion = true disables pulse animation while preserving high-contrast glow', () => {
  for (let s = 0; s <= 9; s++) {
    const state = getBeatVisualState(s, s, true);
    assert.equal(state.active, true);
    assert.equal(state.pulse, false);
    assert.equal(state.glow, true);
    assert.equal(state.className, 'beat-active');
    assert.deepEqual(state.classes, ['beat-active']);
  }
});

// 14: Default/falsy reducedMotion enables pulse animation
test('falsy or omitted reducedMotion enables pulse animation', () => {
  const stateOmitted = getBeatVisualState(3, 3);
  assert.equal(stateOmitted.pulse, true);
  assert.equal(stateOmitted.glow, true);
  assert.equal(stateOmitted.className, 'beat-active beat-pulse-ring');

  const stateFalse = getBeatVisualState(3, 3, false);
  assert.equal(stateFalse.pulse, true);

  const stateNull = getBeatVisualState(3, 3, null);
  assert.equal(stateNull.pulse, true);
});

// 15: Inactive when stepIndex does not match activeStep
test('inactive state returned when stepIndex !== activeStep', () => {
  const mismatched = [
    [0, 1],
    [1, 0],
    [3, 7],
    [9, 8],
    [4, 5]
  ];
  for (const [idx, active] of mismatched) {
    const state = getBeatVisualState(idx, active, false);
    assert.deepEqual(state, {
      active: false,
      pulse: false,
      glow: false,
      className: '',
      classes: []
    });
  }
});

// 16: Handling negative out-of-range steps gracefully
test('handles negative out-of-range steps gracefully', () => {
  const badSteps = [-1, -2, -10, -100];
  for (const bad of badSteps) {
    const state1 = getBeatVisualState(bad, 0);
    assert.equal(state1.active, false);
    assert.deepEqual(state1.classes, []);

    const state2 = getBeatVisualState(0, bad);
    assert.equal(state2.active, false);
    assert.deepEqual(state2.classes, []);

    const state3 = getBeatVisualState(bad, bad);
    assert.equal(state3.active, false);
    assert.deepEqual(state3.classes, []);
  }
});

// 17: Handling non-integer floats, NaN, and Infinity gracefully
test('handles non-integer floats, NaN, and Infinity gracefully', () => {
  const invalidNumbers = [1.5, 0.1, 9.99, NaN, Infinity, -Infinity];
  for (const val of invalidNumbers) {
    assert.deepEqual(getBeatVisualState(val, val), {
      active: false,
      pulse: false,
      glow: false,
      className: '',
      classes: []
    });
    assert.deepEqual(getBeatVisualState(val, 0), {
      active: false,
      pulse: false,
      glow: false,
      className: '',
      classes: []
    });
    assert.deepEqual(getBeatVisualState(0, val), {
      active: false,
      pulse: false,
      glow: false,
      className: '',
      classes: []
    });
  }
});

// 18: Handling non-numeric inputs gracefully
test('handles non-numeric inputs gracefully (strings, booleans, objects, null, undefined)', () => {
  const nonNumerics = ['0', '1', 'two', true, false, {}, [], null, undefined];
  for (const val of nonNumerics) {
    assert.deepEqual(getBeatVisualState(val, 0), {
      active: false,
      pulse: false,
      glow: false,
      className: '',
      classes: []
    });
    assert.deepEqual(getBeatVisualState(0, val), {
      active: false,
      pulse: false,
      glow: false,
      className: '',
      classes: []
    });
  }
  // No arguments
  assert.deepEqual(getBeatVisualState(), {
    active: false,
    pulse: false,
    glow: false,
    className: '',
    classes: []
  });
});

// 19: Classes array immutability & independent instances
test('returns fresh independent classes array on each invocation', () => {
  const s1 = getBeatVisualState(2, 2, false);
  const s2 = getBeatVisualState(2, 2, false);
  assert.notEqual(s1.classes, s2.classes);

  s1.classes.push('extra-class');
  assert.deepEqual(s2.classes, ['beat-active', 'beat-pulse-ring']);

  const inact1 = getBeatVisualState(1, 2);
  const inact2 = getBeatVisualState(1, 2);
  assert.notEqual(inact1.classes, inact2.classes);
});

// 20: UMD export in Node and browser environments
test('exports via UMD pattern compatible with CommonJS and browser globals', () => {
  assert.equal(typeof beatVisualizer.getBeatVisualState, 'function');
  assert.equal(typeof getBeatVisualState, 'function');

  const filePath = path.join(__dirname, '../src/lib/music/beatVisualizer.js');
  const code = fs.readFileSync(filePath, 'utf8');

  // Verify browser global environment without require/module
  const context = vm.createContext({
    globalThis: {}
  });
  context.globalThis = context;
  vm.runInContext(code, context);

  assert.ok(context.MM_BEAT_VISUALIZER, 'MM_BEAT_VISUALIZER attached to root in browser');
  assert.equal(typeof context.MM_BEAT_VISUALIZER.getBeatVisualState, 'function');

  const browserState = context.MM_BEAT_VISUALIZER.getBeatVisualState(1, 1, false);
  assert.equal(browserState.active, true);
  assert.equal(browserState.pulse, true);
});

// 21: CSS validation in src/components/jam.css
test('src/components/jam.css contains beat-active, beat-pulse-ring, and prefers-reduced-motion', () => {
  const cssPath = path.join(__dirname, '../src/components/jam.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.match(css, /\.beat-active\b/, 'defines .beat-active');
  assert.match(css, /\.beat-pulse-ring\b/, 'defines .beat-pulse-ring');
  assert.match(css, /@keyframes beatPulseRing\b/, 'defines @keyframes beatPulseRing');

  // Verify keyframes strictly use transform and opacity
  const keyframesMatch = css.match(/@keyframes beatPulseRing\s*\{([^}]+(\{[^}]+\}[^}]*)*)\}/);
  assert.ok(keyframesMatch, 'keyframes block found');
  const keyframeBody = keyframesMatch[0];
  // Extract all property names used in keyframes
  const propMatches = [...keyframeBody.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
  for (const prop of propMatches) {
    assert.ok(
      prop === 'transform' || prop === 'opacity',
      `keyframes should strictly use transform and opacity, but found: ${prop}`
    );
  }

  // Verify reduced-motion rule disables animation on beat-pulse-ring
  assert.match(css, /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)[\s\S]*?\.beat-pulse-ring[\s\S]*?animation\s*:\s*none/, 'reduced-motion disables animation on .beat-pulse-ring');
});
