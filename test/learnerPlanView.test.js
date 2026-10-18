const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const view = require('../src/lib/learnerPlanView');

test('csv is a local nickname sheet', () => {
  const csv = view.classPlanCsv([{
    name: 'נ-14', grade: 'ג', branch: 'weak', topic: 'לוח כפל',
    paceDone: 1, paceExpected: 3, diagPercent: 25,
  }]);
  assert.match(csv, /^כינוי,כיתה,ענף/);
  assert.match(csv, /נ-14,ג,weak,לוח כפל,1,3,25/);
  assert.doesNotMatch(csv, /תעודת זהות|מספר זהות/);
  const quoted = view.classPlanCsv([{ name: 'א,ב', grade: 'א', branch: 'fresh', topic: 'נושא', paceDone: 0, paceExpected: 3, diagPercent: '' }]);
  assert.match(quoted, /"א,ב"/);
});

test('the plan card is wired on every practice surface and the palette file is cached', () => {
  const root = path.join(__dirname, '..');
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(index, /src\/lib\/learnerPlanView\.js/);
  assert.match(index, /src\/sefirot\.css/);
  assert.match(index, /dir="rtl"/);
  view.SLOTS.forEach((id) => assert.match(index, new RegExp('id="' + id + '"')));
  assert.match(sw, /learnerPlanView\.js/);
  assert.match(sw, /sefirot\.css/);
  const curriculum = fs.readFileSync(path.join(root, 'curriculum.html'), 'utf8');
  assert.match(curriculum, /learnerPlanView\.js/);
  assert.match(curriculum, /sefirot\.css/);
});
