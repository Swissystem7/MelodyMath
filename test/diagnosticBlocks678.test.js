// #678: no long pre-test before play. The diagnostic runs in rounds of at most
// four questions, each round opens with a spoken line, and grades א׳–ב׳ never
// get a "which topics did you learn" questionnaire.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = require('../src/lib/banks');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fn = (name) => {
  const at = html.indexOf('function ' + name + '(');
  assert.ok(at > 0, name + ' not found');
  return html.slice(at, html.indexOf('\n', at));
};

test('every diagnostic block has at most 4 items and the blocks keep every item in order', () => {
  assert.equal(banks.DIAG_BLOCK, 4);
  banks.GRADES.forEach((grade) => {
    const blocks = banks.diagnosticBlocks(grade);
    assert.ok(blocks.length > 0, grade);
    blocks.forEach((b) => assert.ok(b.length >= 1 && b.length <= 4, grade + ' block of ' + b.length));
    assert.deepEqual(blocks.flat().map((x) => x.id), banks.diagnosticItems(grade).map((x) => x.id), grade);
  });
});

test('the diagnostic screen counts within a round and speaks a short opener at each round start', () => {
  const render = fn('rmRender');
  assert.match(render, /rmIdx%DIAG_BLOCK/);
  assert.match(render, /סבב \$\{rd\+1\}/);
  assert.doesNotMatch(render, /RM_DIAG\.length\}<\/bdi>/, 'the counter no longer shows the whole 16-18 item length');
  assert.match(render, /maybeSpeak\(ri\?q\.prompt:/, 'round start speaks an explanation before the first question');
  assert.match(render, /maybeHear\(q\)/, 'every question still opens with a sound');
  assert.match(fn('rmCheck'), /'לסבב הבא'/);
});

test('no self-report questionnaire before play for grades א׳–ב׳', () => {
  for (const phrase of ['אילו נושאים למדת', 'איזה נושאים למדת', 'מה כבר למדת', 'סמנו מה למדתם']) {
    assert.ok(!html.includes(phrase), phrase);
  }
});
