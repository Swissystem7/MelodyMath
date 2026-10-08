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
  'feedback.js': 'Node-only CommonJS (bare module.exports) that would throw in a browser; pages link the form directly',
  'pedagogy.js': 'lesson-plan bank, wired into the teacher tab in the follow-up PR for #33',
};

function loadedByPages() {
  const loaded = new Set();
  fs.readdirSync(root).filter((f) => f.endsWith('.html')).forEach((page) => {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    [...html.matchAll(/ src="src\/lib\/([^"]+\.js)"/g)].forEach((m) => loaded.add(m[1]));
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
