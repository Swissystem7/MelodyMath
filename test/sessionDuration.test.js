const test = require("node:test");
const assert = require("node:assert/strict");
const {
	formatDurationHebrew,
	isTargetDurationReached,
	calculateAverageSessionMinutes,
} = require("../pilot/js/sessionDuration.js");

test("480 -> 8 minutes", () => assert.equal(formatDurationHebrew(480), "8 דקות"));
test("195 -> 3 min 15 sec", () => assert.match(formatDurationHebrew(195), /3/));
test("under 60", () => assert.equal(formatDurationHebrew(45), "פחות מדקה"));
test("8 minute threshold", () => {
	assert.equal(isTargetDurationReached(480), true);
	assert.equal(isTargetDurationReached(479), false);
});
test("average sessions", () => {
	const avg = calculateAverageSessionMinutes([
		{ start: "2026-01-01T10:00:00Z", end: "2026-01-01T10:08:00Z" },
		{ start: "2026-01-01T11:00:00Z", end: "2026-01-01T11:10:00Z" },
	]);
	assert.equal(avg, 9);
});
test("empty list", () => assert.equal(calculateAverageSessionMinutes([]), 0));
