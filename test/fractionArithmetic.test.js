const test = require("node:test");
const assert = require("node:assert/strict");

const fractionArithmetic = require("../src/lib/fractionArithmetic.js");

test("simplifyFraction reduces fractions by GCD and handles edge cases", () => {
	assert.deepEqual(fractionArithmetic.simplifyFraction(2, 4), { n: 1, d: 2 });
	assert.deepEqual(fractionArithmetic.simplifyFraction(6, 8), { n: 3, d: 4 });
	assert.deepEqual(fractionArithmetic.simplifyFraction(0, 4), { n: 0, d: 1 });
	assert.deepEqual(fractionArithmetic.simplifyFraction(4, 4), { n: 1, d: 1 });
	assert.deepEqual(fractionArithmetic.simplifyFraction(7, 8), { n: 7, d: 8 });
	assert.deepEqual(fractionArithmetic.simplifyFraction(8, 8), { n: 1, d: 1 });
});

test("addFractions adds fractions with same denominators", () => {
	assert.deepEqual(fractionArithmetic.addFractions(1, 4, 1, 4), { n: 1, d: 2 });
	assert.deepEqual(fractionArithmetic.addFractions(1, 8, 1, 8), { n: 1, d: 4 });
	assert.deepEqual(fractionArithmetic.addFractions(3, 8, 3, 8), { n: 3, d: 4 });
	assert.deepEqual(fractionArithmetic.addFractions(1, 2, 1, 2), { n: 1, d: 1 });
	assert.deepEqual(fractionArithmetic.addFractions(0, 4, 1, 4), { n: 1, d: 4 });
});

test("addFractions adds fractions with different multiple denominators", () => {
	assert.deepEqual(fractionArithmetic.addFractions(1, 2, 1, 4), { n: 3, d: 4 });
	assert.deepEqual(fractionArithmetic.addFractions(1, 8, 3, 8), { n: 1, d: 2 });
	assert.deepEqual(fractionArithmetic.addFractions(1, 2, 3, 8), { n: 7, d: 8 });
	assert.deepEqual(fractionArithmetic.addFractions(1, 4, 1, 8), { n: 3, d: 8 });
	assert.deepEqual(fractionArithmetic.addFractions(1, 4, 3, 8), { n: 5, d: 8 });
});

test("addFractions handles edge cases: sum = 1 and sum > 1", () => {
	// sum = 1
	assert.deepEqual(fractionArithmetic.addFractions(1, 2, 1, 2), { n: 1, d: 1 });
	assert.deepEqual(fractionArithmetic.addFractions(3, 4, 1, 4), { n: 1, d: 1 });
	assert.deepEqual(fractionArithmetic.addFractions(7, 8, 1, 8), { n: 1, d: 1 });

	// sum > 1 (not converted to a mixed number)
	assert.deepEqual(fractionArithmetic.addFractions(3, 4, 1, 2), { n: 5, d: 4 });
	assert.deepEqual(fractionArithmetic.addFractions(1, 2, 5, 8), { n: 9, d: 8 });
	assert.deepEqual(fractionArithmetic.addFractions(3, 4, 3, 4), { n: 3, d: 2 });
});

test("fractionToBeats converts fractions to beat counts with default and custom beatsPerMeasure", () => {
	assert.equal(fractionArithmetic.fractionToBeats(1, 2), 2);
	assert.equal(fractionArithmetic.fractionToBeats(3, 4), 3);
	assert.equal(fractionArithmetic.fractionToBeats(1, 8), 0.5);
	assert.equal(fractionArithmetic.fractionToBeats(1, 4), 1);
	assert.equal(fractionArithmetic.fractionToBeats(0, 4), 0);
	assert.equal(fractionArithmetic.fractionToBeats(4, 4), 4);

	// Custom beatsPerMeasure 3
	assert.equal(fractionArithmetic.fractionToBeats(1, 2, 3), 1.5);
	assert.equal(fractionArithmetic.fractionToBeats(1, 3, 3), 1);
	assert.equal(fractionArithmetic.fractionToBeats(2, 3, 3), 2);

	// Custom beatsPerMeasure 6
	assert.equal(fractionArithmetic.fractionToBeats(1, 2, 6), 3);
});

test("explainFractionAddition produces the exact Hebrew sentence for 1/4 + 1/4", () => {
	assert.equal(
		fractionArithmetic.explainFractionAddition(1, 4, 1, 4),
		"רבע תיבה ועוד רבע תיבה שווים לחצי תיבה",
	);
});

test("explainFractionAddition explains named fractions and sum > 1", () => {
	assert.equal(
		fractionArithmetic.explainFractionAddition(1, 2, 1, 2),
		"חצי תיבה ועוד חצי תיבה שווים לתיבה שלמה",
	);
	assert.equal(
		fractionArithmetic.explainFractionAddition(3, 4, 1, 2),
		"שלושה רבעי תיבה ועוד חצי תיבה שווים ל-5/4 תיבה — יותר מתיבה שלמה",
	);
	assert.equal(
		fractionArithmetic.explainFractionAddition(1, 2, 1, 4),
		"חצי תיבה ועוד רבע תיבה שווים לשלושה רבעי תיבה",
	);
	assert.equal(
		fractionArithmetic.explainFractionAddition(1, 8, 1, 8),
		"שמינית תיבה ועוד שמינית תיבה שווים לרבע תיבה",
	);
	assert.equal(
		fractionArithmetic.explainFractionAddition(1, 2, 3, 8),
		"חצי תיבה ועוד 3/8 תיבה שווים ל-7/8 תיבה",
	);
});

test("simplifyFraction returns null on invalid inputs", () => {
	assert.equal(fractionArithmetic.simplifyFraction(-1, 4), null);
	assert.equal(fractionArithmetic.simplifyFraction(1, 0), null);
	assert.equal(fractionArithmetic.simplifyFraction(1, -2), null);
	assert.equal(fractionArithmetic.simplifyFraction("1", 4), null);
	assert.equal(fractionArithmetic.simplifyFraction(1, "4"), null);
	assert.equal(fractionArithmetic.simplifyFraction(1.5, 4), null);
	assert.equal(fractionArithmetic.simplifyFraction(1, 2.5), null);
	assert.equal(fractionArithmetic.simplifyFraction(Number.NaN, 4), null);
	assert.equal(fractionArithmetic.simplifyFraction(1, Number.NaN), null);
	assert.equal(fractionArithmetic.simplifyFraction(null, 4), null);
	assert.equal(fractionArithmetic.simplifyFraction(undefined, 4), null);
});

test("addFractions returns null on invalid inputs (denominator 3/0, negatives, NaN, strings, non-integers)", () => {
	// Denominator not in 2, 4, 8
	assert.equal(fractionArithmetic.addFractions(1, 3, 1, 4), null);
	assert.equal(fractionArithmetic.addFractions(1, 4, 1, 5), null);
	assert.equal(fractionArithmetic.addFractions(1, 0, 1, 4), null);
	assert.equal(fractionArithmetic.addFractions(1, 4, 1, 0), null);
	assert.equal(fractionArithmetic.addFractions(1, 6, 1, 8), null);
	assert.equal(fractionArithmetic.addFractions(1, 1, 1, 4), null);

	// Negatives
	assert.equal(fractionArithmetic.addFractions(-1, 4, 1, 4), null);
	assert.equal(fractionArithmetic.addFractions(1, 4, -1, 4), null);
	assert.equal(fractionArithmetic.addFractions(1, -4, 1, 4), null);

	// NaN, strings, non-integers, null, undefined
	assert.equal(fractionArithmetic.addFractions(Number.NaN, 4, 1, 4), null);
	assert.equal(fractionArithmetic.addFractions(1, Number.NaN, 1, 4), null);
	assert.equal(fractionArithmetic.addFractions("1", 4, 1, 4), null);
	assert.equal(fractionArithmetic.addFractions(1, "4", 1, 4), null);
	assert.equal(fractionArithmetic.addFractions(1.5, 4, 1, 4), null);
	assert.equal(fractionArithmetic.addFractions(1, 4, 1.5, 4), null);
	assert.equal(fractionArithmetic.addFractions(null, 4, 1, 4), null);
	assert.equal(fractionArithmetic.addFractions(1, 4, undefined, 4), null);
});

test("fractionToBeats returns null on invalid inputs", () => {
	assert.equal(fractionArithmetic.fractionToBeats(-1, 4), null);
	assert.equal(fractionArithmetic.fractionToBeats(1, 0), null);
	assert.equal(fractionArithmetic.fractionToBeats(1, -4), null);
	assert.equal(fractionArithmetic.fractionToBeats(1, 4, 0), null);
	assert.equal(fractionArithmetic.fractionToBeats(1, 4, -1), null);
	assert.equal(fractionArithmetic.fractionToBeats(1, 4, 2.5), null);
	assert.equal(fractionArithmetic.fractionToBeats("1", 4), null);
	assert.equal(fractionArithmetic.fractionToBeats(1, "4"), null);
	assert.equal(fractionArithmetic.fractionToBeats(1, 4, "4"), null);
	assert.equal(fractionArithmetic.fractionToBeats(Number.NaN, 4), null);
	assert.equal(fractionArithmetic.fractionToBeats(1, Number.NaN), null);
	assert.equal(fractionArithmetic.fractionToBeats(1, 4, Number.NaN), null);
});

test("explainFractionAddition returns short Hebrew invalid-input message for invalid inputs", () => {
	assert.equal(
		fractionArithmetic.explainFractionAddition(1, 3, 1, 4),
		"שברים לא תקינים.",
	);
	assert.equal(
		fractionArithmetic.explainFractionAddition(-1, 4, 1, 4),
		"שברים לא תקינים.",
	);
	assert.equal(
		fractionArithmetic.explainFractionAddition(1, 0, 1, 4),
		"שברים לא תקינים.",
	);
	assert.equal(
		fractionArithmetic.explainFractionAddition("1", 4, 1, 4),
		"שברים לא תקינים.",
	);
});
