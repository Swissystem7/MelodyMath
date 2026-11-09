const test = require("node:test");
const assert = require("node:assert/strict");

const strategy = require("../src/lib/divStrategy.js");

test("basic division facts without remainder up to 100 (divisor 1..10, quotient 1..10)", () => {
	for (let divisor = 1; divisor <= 10; divisor += 1) {
		for (let quotient = 1; quotient <= 10; quotient += 1) {
			const dividend = divisor * quotient;
			assert.equal(strategy.divideBeatsEqually(dividend, divisor), quotient);
			assert.deepEqual(strategy.divisionAsInverseMult(dividend, divisor), {
				dividend,
				divisor,
				quotient,
				multiplication: { a: divisor, b: quotient, product: dividend },
				divisionText: `${dividend} ÷ ${divisor} = ${quotient}`,
				multiplicationText: `${divisor} × ${quotient} = ${dividend}`,
			});
			assert.equal(
				strategy.explainDivisionStep(dividend, divisor),
				`מחלקים ${dividend} פעימות שווה בשווה ל-${divisor} נגנים: כל נגן מקבל ${quotient} פעימות, כי ${divisor} × ${quotient} = ${dividend}.`,
			);
		}
	}
});

test("division by 1 returns the number itself", () => {
	for (let n = 1; n <= 10; n += 1) {
		assert.equal(strategy.divideBeatsEqually(n, 1), n);
		const inv = strategy.divisionAsInverseMult(n, 1);
		assert.equal(inv?.quotient, n);
		assert.equal(inv?.multiplicationText, `1 × ${n} = ${n}`);
	}
});

test("a number divided by itself equals 1", () => {
	for (let n = 1; n <= 10; n += 1) {
		assert.equal(strategy.divideBeatsEqually(n, n), 1);
		const inv = strategy.divisionAsInverseMult(n, n);
		assert.equal(inv?.quotient, 1);
		assert.equal(inv?.multiplicationText, `${n} × 1 = ${n}`);
	}
});

test("division by 0 is blocked (returns null / Hebrew message)", () => {
	[0, 1, 10, 100].forEach((dividend) => {
		assert.equal(strategy.divideBeatsEqually(dividend, 0), null);
		assert.equal(strategy.divisionAsInverseMult(dividend, 0), null);
		const explanation = strategy.explainDivisionStep(dividend, 0);
		assert.equal(typeof explanation, "string");
		assert.match(explanation, /אפס/);
	});
});

test("remainder cases return null", () => {
	const remainderPairs = [
		[7, 2],
		[10, 3],
		[11, 4],
		[14, 5],
		[25, 4],
		[99, 10],
	];
	remainderPairs.forEach(([dividend, divisor]) => {
		assert.equal(strategy.divideBeatsEqually(dividend, divisor), null);
		assert.equal(strategy.divisionAsInverseMult(dividend, divisor), null);
		const explanation = strategy.explainDivisionStep(dividend, divisor);
		assert.equal(typeof explanation, "string");
		assert.notEqual(
			explanation,
			`מחלקים ${dividend} פעימות שווה בשווה ל-${divisor} נגנים: כל נגן מקבל ${dividend / divisor} פעימות, כי ${divisor} × ${dividend / divisor} = ${dividend}.`,
		);
	});
});

test("invalid inputs (NaN, strings, negatives, fractions) return null", () => {
	const invalidInputs = [
		null,
		undefined,
		NaN,
		Infinity,
		-Infinity,
		"12",
		"abc",
		true,
		false,
		{},
		[],
		-5,
		2.5,
		0.5,
	];

	invalidInputs.forEach((inv) => {
		assert.equal(strategy.divideBeatsEqually(inv, 2), null);
		assert.equal(strategy.divisionAsInverseMult(inv, 2), null);
		assert.equal(typeof strategy.explainDivisionStep(inv, 2), "string");

		assert.equal(strategy.divideBeatsEqually(12, inv), null);
		assert.equal(strategy.divisionAsInverseMult(12, inv), null);
		assert.equal(typeof strategy.explainDivisionStep(12, inv), "string");
	});
});

test("exact Hebrew text for 12 ÷ 3", () => {
	assert.equal(
		strategy.explainDivisionStep(12, 3),
		"מחלקים 12 פעימות שווה בשווה ל-3 נגנים: כל נגן מקבל 4 פעימות, כי 3 × 4 = 12.",
	);
});

test("UMD exports divideBeatsEqually, divisionAsInverseMult, explainDivisionStep functions", () => {
	assert.equal(typeof strategy.divideBeatsEqually, "function");
	assert.equal(typeof strategy.divisionAsInverseMult, "function");
	assert.equal(typeof strategy.explainDivisionStep, "function");
});
