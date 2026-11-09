const test = require("node:test");
const assert = require("node:assert/strict");
const {
	verifyCommutativePair,
	decomposeFactorByFive,
	distributiveProductWithFive,
	explainCommutativity,
} = require("../src/lib/multPropertiesMath.js");

test("commutativity pair", () => {
	const r = verifyCommutativePair(3, 4);
	assert.equal(r.total, 12);
	assert.equal(r.formAB, "3×4=12");
	assert.equal(r.formBA, "4×3=12");
});
test("zero and one", () => {
	assert.equal(verifyCommutativePair(0, 5).total, 0);
	assert.equal(verifyCommutativePair(1, 9).total, 9);
});
test("decompose by five", () => {
	assert.deepEqual(decomposeFactorByFive(8), [5, 3]);
	assert.deepEqual(decomposeFactorByFive(5), [5]);
	assert.deepEqual(decomposeFactorByFive(3), [3]);
});
test("distributive with five", () => {
	assert.equal(distributiveProductWithFive(4, 8), 4 * 5 + 4 * 3);
	assert.equal(distributiveProductWithFive(4, 5), 20);
});
test("hebrew explanation", () => {
	assert.match(explainCommutativity(2, 7), /2 כפול 7/);
	assert.match(explainCommutativity(2, 7), /7 כפול 2/);
});
test("invalid edges", () => {
	assert.equal(verifyCommutativePair("x", 1), null);
	assert.equal(decomposeFactorByFive(NaN), null);
	assert.equal(distributiveProductWithFive(null, 3), null);
	assert.equal(explainCommutativity(undefined, 1), "");
});
