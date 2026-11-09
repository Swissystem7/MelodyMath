const test = require("node:test");
const assert = require("node:assert/strict");
const {
	isValidClassCode,
	formatClassCode,
	generateRandomClassCode,
	CODE_RE,
} = require("../pilot/js/classCodeValidator.js");

test("valid code K7M3Q", () => {
	assert.equal(isValidClassCode("K7M3Q"), true);
	assert.equal(CODE_RE.test("K7M3Q"), true);
});
test("rejects 0 1 O I", () => {
	assert.equal(isValidClassCode("K7M0Q"), false);
	assert.equal(isValidClassCode("K7M1Q"), false);
	assert.equal(isValidClassCode("K7MOQ"), false);
	assert.equal(isValidClassCode("K7MIQ"), false);
});
test("rejects wrong length", () => {
	assert.equal(isValidClassCode("K7M3"), false);
	assert.equal(isValidClassCode("K7M3QX"), false);
	assert.equal(isValidClassCode(""), false);
});
test("format uppercases and strips illegal", () => {
	assert.equal(formatClassCode(" k7m3q "), "K7M3Q");
	assert.equal(formatClassCode("k7m0o1i"), "K7M");
});
test("case normalized validation", () => {
	assert.equal(isValidClassCode("k7m3q"), true);
});
test("generateRandomClassCode shape", () => {
	for (let i = 0; i < 20; i++) {
		const c = generateRandomClassCode();
		assert.equal(c.length, 5);
		assert.equal(isValidClassCode(c), true);
	}
});
test("null/undefined format", () => {
	assert.equal(formatClassCode(null), "");
	assert.equal(formatClassCode(undefined), "");
});
