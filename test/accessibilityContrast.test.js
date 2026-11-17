const test = require("node:test");
const assert = require("node:assert/strict");
const {
	getAccessibilityClassList,
	calculateLuminance,
	calculateContrastRatio,
	isWcagAaCompliant,
} = require("../pilot/js/accessibilityContrast.js");

test("black/white contrast ~21:1", () => {
	const ratio = calculateContrastRatio([0, 0, 0], [255, 255, 255]);
	assert.ok(Math.abs(ratio - 21) < 0.1);
});
test("class list", () => {
	assert.deepEqual(getAccessibilityClassList(true, true), [
		"high-contrast",
		"large-text",
	]);
	assert.deepEqual(getAccessibilityClassList(false, false), []);
});
test("luminance black/white", () => {
	assert.equal(calculateLuminance(0, 0, 0), 0);
	assert.ok(calculateLuminance(255, 255, 255) > 0.9);
});
test("WCAG AA thresholds", () => {
	assert.equal(isWcagAaCompliant(4.5, false), true);
	assert.equal(isWcagAaCompliant(4.4, false), false);
	assert.equal(isWcagAaCompliant(3, true), true);
	assert.equal(isWcagAaCompliant(2.9, true), false);
});
test("pilot-like colors", () => {
	const ratio = calculateContrastRatio([33, 37, 41], [255, 255, 255]);
	assert.ok(ratio > 10);
});
test("invalid inputs", () => {
	assert.equal(calculateLuminance(-1, 0, 0), null);
	assert.equal(calculateContrastRatio(null, [0, 0, 0]), null);
	assert.equal(isWcagAaCompliant(NaN), false);
});
