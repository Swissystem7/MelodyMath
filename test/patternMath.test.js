const test = require("node:test");
const assert = require("node:assert/strict");
const {
	detectPatternCycle,
	predictNextElement,
	generateRhythmicSequence,
	explainPatternStep,
} = require("../src/lib/patternMath.js");

test("cycle length 2", () => {
	assert.deepEqual(detectPatternCycle(["A", "B", "A", "B"]), {
		cycleLength: 2,
		pattern: ["A", "B"],
	});
});
test("cycle length 3", () => {
	assert.deepEqual(detectPatternCycle([1, 2, 3, 1, 2, 3]), {
		cycleLength: 3,
		pattern: [1, 2, 3],
	});
});
test("cycle length 4", () => {
	assert.deepEqual(detectPatternCycle(["x", "y", "z", "w", "x", "y", "z", "w"]), {
		cycleLength: 4,
		pattern: ["x", "y", "z", "w"],
	});
});
test("non-periodic returns null", () => {
	assert.equal(detectPatternCycle([1, 2, 3, 5]), null);
	assert.equal(predictNextElement([1, 2, 4]), null);
});
test("predict next element", () => {
	assert.equal(predictNextElement(["A", "B", "A", "B"]), "A");
	assert.equal(predictNextElement([1, 2, 3, 1, 2]), 3);
});
test("generate rhythmic sequence", () => {
	assert.deepEqual(generateRhythmicSequence([1, 2], 3), [1, 2, 1, 2, 1, 2]);
	assert.deepEqual(generateRhythmicSequence([1], 0), []);
});
test("explain pattern step Hebrew", () => {
	assert.match(explainPatternStep(["A", "B"], "A"), /התבנית/);
	assert.match(explainPatternStep(["A", "B"], "A"), /A/);
});
test("empty / short inputs", () => {
	assert.equal(detectPatternCycle([]), null);
	assert.equal(detectPatternCycle(["A"]), null);
	assert.equal(explainPatternStep([], "x"), "");
});
