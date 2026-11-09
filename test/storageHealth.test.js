const test = require("node:test");
const assert = require("node:assert/strict");
const {
	estimateStorageBytes,
	isStorageQuotaSafe,
	formatBytesHebrew,
	isBackupRecommended,
} = require("../pilot/js/storageHealth.js");

test("byte estimation positive", () => {
	const n = estimateStorageBytes({ a: "hello", b: [1, 2, 3] });
	assert.ok(n > 10);
});
test("3MB safety threshold", () => {
	assert.equal(isStorageQuotaSafe(3 * 1024 * 1024), true);
	assert.equal(isStorageQuotaSafe(3 * 1024 * 1024 + 1), false);
});
test("hebrew bytes", () => {
	assert.match(formatBytesHebrew(500), /בתים/);
	assert.match(formatBytesHebrew(2048), /ק״ב/);
	assert.match(formatBytesHebrew(2 * 1024 * 1024), /מ״ב/);
});
test("weekly backup recommendation", () => {
	assert.equal(isBackupRecommended(7), true);
	assert.equal(isBackupRecommended(6), false);
	assert.equal(isBackupRecommended(null), true);
	assert.equal(isBackupRecommended(undefined), true);
});
test("invalid estimate", () => assert.equal(estimateStorageBytes(null), 0));
test("invalid quota args", () => assert.equal(isStorageQuotaSafe(-1), false));
