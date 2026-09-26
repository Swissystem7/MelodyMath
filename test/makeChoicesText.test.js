

const test = require('node:test');
const assert = require('node:assert/strict');
const teacherStore = require('../src/lib/teacherStore');

test('makeChoices in beat mode returns multiple options for non-numeric answers', () => {
  // Mock a deterministic rng function
  const deterministicRng = () => 0.5;
  
  // Test that 'כן' returns exactly 2 options including both 'כן' and 'לא'
  const choicesYesNo = teacherStore.makeChoices('כן', deterministicRng);
  assert(Array.isArray(choicesYesNo));
  assert.equal(choicesYesNo.length, 2);
  assert(choicesYesNo.includes('כן'));
  assert(choicesYesNo.includes('לא'));
  
  // Test that 'זוגי' returns exactly 2 options including both 'זוגי' and 'אי-זוגי'
  const choicesEvenOdd = teacherStore.makeChoices('זוגי', deterministicRng);
  assert(Array.isArray(choicesEvenOdd));
  assert.equal(choicesEvenOdd.length, 2);
  assert(choicesEvenOdd.includes('זוגי'));
  assert(choicesEvenOdd.includes('אי-זוגי'));
  
  // Test that 'משולש' returns exactly 4 options including 'משולש'
  const choicesShape = teacherStore.makeChoices('משולש', deterministicRng);
  assert(Array.isArray(choicesShape));
  assert.equal(choicesShape.length, 4);
  assert(choicesShape.includes('משולש'));
  
  // Verify that numeric and fraction behavior remains unchanged
  const choicesNumeric = teacherStore.makeChoices('5', deterministicRng);
  assert(Array.isArray(choicesNumeric));
  assert(choicesNumeric.length >= 4);
  assert(choicesNumeric.includes(5));
  
  const choicesFraction = teacherStore.makeChoices('1/2', deterministicRng);
  assert(Array.isArray(choicesFraction));
  assert(choicesFraction.length >= 4);
  assert(choicesFraction.includes('1/2'));
});
