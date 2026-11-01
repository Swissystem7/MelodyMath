// Verifies that browser scripts do not attempt to call require() when running in browser
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

test('rhythmTrack, rhythmMaster, rhythmMeasure and RhythmMaster execute in browser sandbox without require', () => {
  const context = vm.createContext({
    globalThis: {},
    document: {
      getElementById: () => null,
    },
    // require is explicitly NOT defined in this context
  });
  context.globalThis = context;

  // In index.html, jamKit is loaded before RhythmMaster
  vm.runInContext(read('src/components/jamKit.js'), context);

  // 1. rhythmTrack
  assert.doesNotThrow(() => {
    vm.runInContext(read('src/lib/music/rhythmTrack.js'), context);
  });
  assert.ok(context.MM_RHYTHM_TRACK, 'MM_RHYTHM_TRACK should be defined on window');

  // 2. rhythmMaster
  assert.doesNotThrow(() => {
    vm.runInContext(read('src/lib/music/rhythmMaster.js'), context);
  });
  assert.ok(context.MM_RHYTHM_MASTER, 'MM_RHYTHM_MASTER should be defined on window');

  // 3. rhythmMeasure
  assert.doesNotThrow(() => {
    vm.runInContext(read('src/lib/music/rhythmMeasure.js'), context);
  });
  assert.ok(context.MM_RHYTHM_MEASURE, 'MM_RHYTHM_MEASURE should be defined on window');

  // 4. RhythmMaster UI component
  assert.doesNotThrow(() => {
    vm.runInContext(read('src/components/RhythmMaster.js'), context);
  });
  assert.ok(context.MM_RHYTHM_MASTER_UI, 'MM_RHYTHM_MASTER_UI should be defined on window');
});
