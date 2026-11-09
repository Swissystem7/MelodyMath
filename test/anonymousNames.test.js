const test = require("node:test");
const assert = require("node:assert/strict");
const {
	isValidAnonymousNickname,
	generateAnonymousNickname,
	sanitizeNickname,
} = require("../pilot/js/anonymousNames.js");
test("valid short nickname", () =>
	assert.equal(isValidAnonymousNickname("נמר3"), true));
test("rejects email", () =>
	assert.equal(isValidAnonymousNickname("a@b.com"), false));
test("rejects 5+ digits", () =>
	assert.equal(isValidAnonymousNickname("12345"), false));
test("rejects too short", () =>
	assert.equal(isValidAnonymousNickname("א"), false));
test("sanitize strips dangerous", () =>
	assert.equal(sanitizeNickname("  a<script>  "), "ascript"));
test("generate unique", () => {
	const a = generateAnonymousNickname([]);
	assert.match(a, /^.+[1-9]$/);
	assert.notEqual(a, generateAnonymousNickname([a]));
});
test("generate avoids existing list", () => {
	const existing = [];
	for (let i = 0; i < 8; i++)
		existing.push(generateAnonymousNickname(existing));
	assert.equal(new Set(existing).size, 8);
});
