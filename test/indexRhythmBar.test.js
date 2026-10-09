const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const engine = require('../src/lib/musicEngine.js');

// The playground rhythm generator used to do its own bar arithmetic in floats
// (`left>.001`, `n<=left+.001`) and print each length by matching it back to a
// name table with a 1e-9 tolerance. musicEngine.js exists for exactly that, so
// the page now calls it. These tests run the page's own source.
function rhythmSource() {
  const from = indexHtml.indexOf('const RHYTHM_NOTES=[');
  const to = indexHtml.indexOf('function showRhythm(');
  assert.ok(from > 0 && to > from, 'index.html no longer has the rhythm generator');
  return indexHtml.slice(from, to);
}

function loadRhythm() {
  const ctx = Object.assign({ Math: Math }, engine);
  vm.createContext(ctx);
  vm.runInContext(rhythmSource()
    + '\nthis.generateRhythmExercise=generateRhythmExercise;this.fillRhythmBar=fillRhythmBar;'
    + 'this.RHYTHM_NOTES=RHYTHM_NOTES;', ctx);
  return ctx;
}

test('index.html loads musicEngine.js and builds the bar through it', () => {
  assert.match(indexHtml, /src\/lib\/musicEngine\.js/);
  const src = rhythmSource();
  assert.match(src, /measureFill\(RHYTHM_BAR/);
  assert.match(src, /durationToFraction/);
  assert.match(src, /bpmToSeconds\(bpm\)/);
  // The old float note lengths and epsilon comparisons are gone.
  assert.doesNotMatch(src, /\.001/);
  assert.doesNotMatch(src, /\[\.25,\.5\]/);
});

test('every difficulty level fills a 4/4 bar exactly, out of real note lengths', () => {
  const { generateRhythmExercise, RHYTHM_NOTES } = loadRhythm();
  const named = new Set();
  RHYTHM_NOTES.forEach((set) => set.forEach((n) => {
    named.add(engine.fractionText(engine.durationToFraction(n)));
  }));
  for (let level = 1; level <= RHYTHM_NOTES.length; level++) {
    for (let i = 0; i < 300; i++) {
      const x = generateRhythmExercise(level, 0.7);
      assert.equal(x.full, true, 'level ' + level + ' left the bar at ' + x.fractionPattern);
      assert.equal(x.missing, '');
      // Exact, not 0.99999: the printed tokens are the fractions themselves,
      // and each one is a note length the level actually offers.
      const tokens = x.fractionPattern.split('+');
      assert.ok(tokens.length > 0);
      tokens.forEach((t) => assert.ok(named.has(t), 'not a note length: ' + t));
      const sum = tokens.reduce((acc, t) => engine.addFractions(acc, t), { n: 0, d: 1 });
      assert.deepEqual(sum, { n: 1, d: 1 });
      assert.equal(x.pattern.length, tokens.length);
    }
  }
});

test('a full bar still lasts four beats, as 240/BPM did before', () => {
  const { generateRhythmExercise } = loadRhythm();
  for (let i = 0; i < 50; i++) {
    const x = generateRhythmExercise(2, 0.7);
    assert.equal(x.expectedDuration, +(240 / x.bpm).toFixed(3));
  }
});

test('a bar that cannot close is reported short, not padded with a fake note', () => {
  // Two whole-note triplets leave 1/3, and a 2/3 is the only length on offer,
  // so no tie of the given notes closes the bar. The old code pushed the raw
  // leftover float in as if it were a note and printed it as "0.333".
  const { fillRhythmBar } = loadRhythm();
  const bar = fillRhythmBar(['whole triplet']);
  assert.equal(bar.state.fill, 'short');
  assert.deepEqual(bar.state.remainder, { n: 1, d: 3 });
  // Spread first: the vm realm has its own Array.prototype.
  assert.deepEqual([...bar.picks], [{ n: 2, d: 3 }]);
  assert.deepEqual(bar.state.total, { n: 2, d: 3 });
});

test('showRhythm says how much is missing instead of claiming a full bar', () => {
  const show = indexHtml.match(/function showRhythm\(play\)\{[\s\S]*?\n\}/)[0];
  assert.match(show, /x\.full/);
  assert.match(show, /התיבה לא נסגרה/);
  assert.match(show, /x\.missing/);
});
