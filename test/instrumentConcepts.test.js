'use strict';
// #673 (Refs #665): every math concept has one short Hebrew kid-level line per
// instrument family, and the families reuse the #591/#623 instrument catalogue.
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/data/instrumentConcepts');
const I = require('../src/lib/instruments');

const TECHNICAL = /[A-Za-z]|מרווח|הרץ|טמפו|אוקטבה|תדר|\bM\d/;

test('the four families match the instrument catalogue families', () => {
  assert.deepEqual(C.FAMILIES.map((f) => f.id), I.FAMILIES);
  assert.deepEqual(C.FAMILIES.map((f) => f.he), ['תופים', 'מיתרים', 'כלי נשיפה', 'קלידים']);
});

test('every family instrument id exists in the catalogue with that family', () => {
  C.FAMILIES.forEach((f) => {
    assert.ok(f.instruments.length >= 2, f.id);
    f.instruments.forEach((id) => {
      const inst = I.instrumentById(id);
      assert.ok(inst, 'unknown instrument ' + id);
      assert.equal(inst.family, f.id, id + ' family');
    });
  });
});

test('concept ids reuse the catalogue topics (addition/subtraction are new)', () => {
  C.CONCEPTS.forEach((c) => {
    assert.ok(c.id in I.TOPICS || ['addition', 'subtraction'].includes(c.id), c.id);
  });
});

test('at least 5 concepts, each with a short clean line for every family', () => {
  assert.ok(C.CONCEPTS.length >= 5, 'concepts: ' + C.CONCEPTS.length);
  assert.equal(new Set(C.CONCEPTS.map((c) => c.id)).size, C.CONCEPTS.length);
  C.CONCEPTS.forEach((c) => {
    assert.ok(c.he && !TECHNICAL.test(c.he), c.id + ' he');
    assert.deepEqual(Object.keys(c.lines).sort(), I.FAMILIES.slice().sort(), c.id + ' families');
    I.FAMILIES.forEach((f) => {
      const line = c.lines[f];
      assert.equal(typeof line, 'string', c.id + '/' + f);
      assert.ok(line.trim().length > 0, c.id + '/' + f + ' empty');
      const words = line.trim().split(/\s+/).length;
      assert.ok(words <= 12, c.id + '/' + f + ' has ' + words + ' words');
      assert.ok(!TECHNICAL.test(line), c.id + '/' + f + ' technical: ' + line);
      assert.equal(C.lineFor(c.id, f), line);
    });
  });
});

test('data is frozen and lookup is safe', () => {
  assert.ok(Object.isFrozen(C.CONCEPTS) && Object.isFrozen(C.CONCEPTS[0].lines));
  assert.ok(Object.isFrozen(C.FAMILIES[0].instruments));
  assert.equal(C.lineFor('nope', 'keys'), null);
  assert.equal(C.lineFor('addition', 'nope'), null);
});
