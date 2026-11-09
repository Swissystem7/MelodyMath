const test = require("node:test");
const assert = require("node:assert/strict");
const {
	jumpForward,
	jumpBackward,
	missingStepInSequence,
	explainNumberLineJump,
} = require("../src/lib/numberLineMath");

test("jumpForward", () => assert.equal(jumpForward(20, 10, 3), 50));
test("jumpBackward", () => assert.equal(jumpBackward(20, 5, 2), 10));
test("jumpBackward clamps at 0", () => assert.equal(jumpBackward(5, 10, 2), 0));
test("missingStepInSequence ascending", () => {
	assert.deepEqual(missingStepInSequence([5, 10, null, 20]), {
		step: 5,
		missing: 15,
		index: 2,
	});
});
test("missingStepInSequence descending", () => {
	assert.deepEqual(missingStepInSequence([20, 15, null, 5]), {
		step: -5,
		missing: 10,
		index: 2,
	});
});
test("explain forward hebrew", () => {
	assert.equal(
		explainNumberLineJump(20, 10, 3, true),
		"מתחילים ב-20 וקופצים 3 קפיצות של 10 קדימה, מגיעים ל-50",
	);
});
test("explain backward hebrew", () => {
	assert.match(explainNumberLineJump(30, 10, 2, false), /אחורה/);
});
test("missingStepInSequence short -> null", () =>
	assert.equal(missingStepInSequence([1, 2]), null));
