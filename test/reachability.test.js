const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const libDir = path.join(root, 'src', 'lib');

// Modules no page loads on purpose. Each needs a reason; a new module must
// either be loaded by a page or be added here with one.
const INTENTIONALLY_UNUSED = {
  'assignment.js': 'teacher assignment logic with no UI yet; the teacher tab keeps its rows through teacherStore.js',
  'dashboardLogic.js': 'class-dashboard aggregation with no UI yet; the class board renders from teacherStore.js',
  'instrumentLines.js': 'content-only data for the #687 variation engine (#673); no page uses it until that engine lands',
  'feedback.js': 'Node-only CommonJS (bare module.exports) that would throw in a browser; pages link the form directly',
  'narrationPlayer.js': 'pre-recorded Hebrew narration generator and audio player (Refs #515)',
  'partnerSchool.js': 'partner school 4-week pilot protocol and evaluation module (Refs #17)',
  'vendorPortfolio.js': 'vendor portfolio checklist and self-audit module (Refs #18)',
  'mult4Strategy.js': 'pure mental-math multiplication-by-4 double-double strategy helper awaiting UI integration',
  'divStrategy.js': 'pure division-as-equal-beat-sharing and inverse-multiplication helper awaiting UI integration',
  'clockMath.js': 'pure clock arithmetic, 12/24h conversion and quarter-hour fraction helper awaiting UI integration',
  'fractionArithmetic.js': 'pure fraction simplify/add and beats-in-a-bar helper awaiting UI integration',
  'geometryMath.js': 'pure geometry classification and note duration helper awaiting UI integration',
  'measurementConversion.js': 'pure measurement conversion and rectangle/square helper awaiting UI integration',
  'numberLineMath.js': 'pure number-line jump helper awaiting UI integration',
  'patternMath.js': 'pure pattern-cycle and next-element helper awaiting UI integration',
  'moneyMath.js': 'pure Israeli-currency bills/coins/change helper awaiting UI integration',
  'dataRepresentationMath.js': 'pure category-comparison and pictogram helper awaiting UI integration',
  'multPropertiesMath.js': 'pure multiplication-properties helper awaiting UI integration',
  'starProgressCard.js': 'child-friendly visual progress card helper module with star ratings and session progress chart awaiting UI integration',
};

function loadedByPages() {
  const loaded = new Set();
  fs.readdirSync(root).filter((f) => f.endsWith('.html')).forEach((page) => {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    [...html.matchAll(/ src="src\/lib\/([^"]+\.js)"/g)].forEach((m) => { loaded.add(m[1]); });
  });
  return loaded;
}

test('every src/lib module is loaded by a page or listed as intentionally unused', () => {
  const loaded = loadedByPages();
  const unreachable = fs.readdirSync(libDir)
    .filter((f) => f.endsWith('.js'))
    .filter((f) => !loaded.has(f) && !Object.prototype.hasOwnProperty.call(INTENTIONALLY_UNUSED, f));
  assert.deepEqual(unreachable, []);
});

test('the intentionally-unused list names real files that really are unused, each with a reason', () => {
  const loaded = loadedByPages();
  Object.keys(INTENTIONALLY_UNUSED).forEach((f) => {
    assert.ok(fs.existsSync(path.join(libDir, f)), f + ' does not exist');
    assert.ok(!loaded.has(f), f + ' is loaded by a page; drop it from the list');
    assert.ok(INTENTIONALLY_UNUSED[f].length > 20, f + ' needs a reason');
  });
});

test('index.html draws every widget the question banks use', () => {
  const { allItems } = require('../src/lib/banks.js');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const widgets = new Set(allItems().map((it) => it.widget).filter(Boolean));
  assert.ok(widgets.size >= 7, 'expected the bank widgets, got ' + [...widgets].join(','));
  widgets.forEach((w) => {
    assert.ok(html.includes("item.widget==='" + w + "'"), 'renderWidget has no branch for ' + w);
  });
});

test('geometry prompts get the glyphs of the shapes they name, in reading order', () => {
  const { shapesInText, renderShapesHtml } = require('../src/lib/geometryShapes.js');
  assert.deepEqual(shapesInText('משולש, ריבוע ומחומש — מיינו'), ['triangle', 'square', 'pentagon']);
  assert.deepEqual(shapesInText('איזו משתי הצורות: מלבן או מחומש?'), ['rectangle', 'pentagon']);
  assert.deepEqual(shapesInText('זווית ישרה שווה לכמה מעלות?'), []);
  assert.deepEqual(shapesInText(null), []);
  assert.equal(renderShapesHtml('זווית ישרה'), '');
  const html = renderShapesHtml('למשולש יש כמה צלעות?');
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /▲/);
});
