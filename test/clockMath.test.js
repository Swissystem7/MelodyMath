const test = require("node:test");
const assert = require("node:assert/strict");

const clockMath = require("../src/lib/clockMath.js");

test("addMinutes handles midnight wrap forward", () => {
	assert.deepEqual(clockMath.addMinutes(23, 45, 30), { h: 0, m: 15 });
	assert.deepEqual(clockMath.addMinutes(23, 0, 120), { h: 1, m: 0 });
	assert.deepEqual(clockMath.addMinutes(23, 59, 1), { h: 0, m: 0 });
});

test("addMinutes handles negative delta and wraps backward", () => {
	assert.deepEqual(clockMath.addMinutes(0, 10, -20), { h: 23, m: 50 });
	assert.deepEqual(clockMath.addMinutes(0, 0, -60), { h: 23, m: 0 });
	assert.deepEqual(clockMath.addMinutes(1, 15, -90), { h: 23, m: 45 });
	assert.deepEqual(clockMath.addMinutes(12, 0, -1440), { h: 12, m: 0 });
	assert.deepEqual(clockMath.addMinutes(0, 0, -1441), { h: 23, m: 59 });
});

test("addMinutes handles standard same-day additions", () => {
	assert.deepEqual(clockMath.addMinutes(9, 15, 45), { h: 10, m: 0 });
	assert.deepEqual(clockMath.addMinutes(8, 20, 10), { h: 8, m: 30 });
	assert.deepEqual(clockMath.addMinutes(14, 30, 0), { h: 14, m: 30 });
});

test("minutesBetween computes forward distance including across midnight", () => {
	assert.equal(clockMath.minutesBetween(23, 30, 0, 15), 45);
	assert.equal(clockMath.minutesBetween(22, 0, 2, 0), 240);
	assert.equal(clockMath.minutesBetween(10, 0, 10, 45), 45);
	assert.equal(clockMath.minutesBetween(0, 0, 23, 59), 1439);
	assert.equal(clockMath.minutesBetween(12, 0, 12, 0), 0);
	assert.equal(clockMath.minutesBetween(0, 0, 0, 0), 0);
	assert.equal(clockMath.minutesBetween(1, 0, 0, 59), 1439);
});

test("toDigital24 converts all 24 hours (1-12 AM and PM in a loop)", () => {
	const expectedAm = [
		"01:00",
		"02:00",
		"03:00",
		"04:00",
		"05:00",
		"06:00",
		"07:00",
		"08:00",
		"09:00",
		"10:00",
		"11:00",
		"00:00",
	];
	const expectedPm = [
		"13:00",
		"14:00",
		"15:00",
		"16:00",
		"17:00",
		"18:00",
		"19:00",
		"20:00",
		"21:00",
		"22:00",
		"23:00",
		"12:00",
	];

	for (let h = 1; h <= 12; h += 1) {
		assert.equal(clockMath.toDigital24(h, false), expectedAm[h - 1]);
		assert.equal(clockMath.toDigital24(h, true), expectedPm[h - 1]);
	}

	assert.equal(clockMath.toDigital24(12, false), "00:00");
	assert.equal(clockMath.toDigital24(12, true), "12:00");
	assert.equal(clockMath.toDigital24(5, true), "17:00");
	assert.equal(clockMath.toDigital24(9, false), "09:00");
});

test("clockFraction maps quarters and rejects non-quarters", () => {
	assert.deepEqual(clockMath.clockFraction(0), {
		fraction: "0",
		nameHe: "שעה שלמה",
		barHe: "תיבה שלמה",
	});
	assert.deepEqual(clockMath.clockFraction(15), {
		fraction: "1/4",
		nameHe: "רבע",
		barHe: "רבע תיבה",
	});
	assert.deepEqual(clockMath.clockFraction(30), {
		fraction: "1/2",
		nameHe: "חצי",
		barHe: "חצי תיבה",
	});
	assert.deepEqual(clockMath.clockFraction(45), {
		fraction: "3/4",
		nameHe: "שלושה רבעים",
		barHe: "שלושה רבעי תיבה",
	});

	const nonQuarters = [-15, 1, 7, 14, 16, 29, 31, 44, 46, 59, 60, 90];
	for (const m of nonQuarters) {
		assert.equal(clockMath.clockFraction(m), null);
	}
});

test("explainTimeStep generates expected Hebrew explanation texts", () => {
	assert.equal(
		clockMath.explainTimeStep(3, 30),
		"השעה 3:30 — חצי שעה אחרי 3, כמו חצי תיבה בשעון.",
	);
	assert.equal(
		clockMath.explainTimeStep(3, 0),
		"השעה 3:00 — שעה שלמה, כמו תיבה שלמה בשעון.",
	);
	assert.equal(
		clockMath.explainTimeStep(3, 15),
		"השעה 3:15 — רבע שעה אחרי 3, כמו רבע תיבה בשעון.",
	);
	assert.equal(
		clockMath.explainTimeStep(3, 45),
		"השעה 3:45 — שלושה רבעי שעה אחרי 3, כמו שלושה רבעי תיבה בשעון.",
	);
	assert.equal(clockMath.explainTimeStep(3, 20), "השעה 3:20");
	assert.equal(clockMath.explainTimeStep(9, 5), "השעה 9:05");
	assert.equal(clockMath.explainTimeStep(23, 59), "השעה 23:59");
});

test("invalid inputs (NaN, strings, 24, 60, fractions) return null or error text", () => {
	const invalidHours = [
		-1,
		24,
		25,
		2.5,
		NaN,
		Infinity,
		"12",
		null,
		undefined,
		{},
	];
	const invalidMinutes = [
		-1,
		60,
		61,
		15.5,
		NaN,
		Infinity,
		"30",
		null,
		undefined,
		[],
	];

	for (const inv of invalidHours) {
		assert.equal(clockMath.addMinutes(inv, 0, 10), null);
		assert.equal(clockMath.minutesBetween(inv, 0, 12, 0), null);
		assert.equal(clockMath.minutesBetween(12, 0, inv, 0), null);
		assert.equal(clockMath.toDigital24(inv, true), null);
		assert.equal(typeof clockMath.explainTimeStep(inv, 0), "string");
		assert.match(clockMath.explainTimeStep(inv, 0), /לא תקינ/);
	}

	for (const inv of invalidMinutes) {
		assert.equal(clockMath.addMinutes(12, inv, 10), null);
		assert.equal(clockMath.minutesBetween(12, inv, 12, 0), null);
		assert.equal(clockMath.minutesBetween(12, 0, 12, inv), null);
		assert.equal(clockMath.clockFraction(inv), null);
		assert.equal(typeof clockMath.explainTimeStep(12, inv), "string");
		assert.match(clockMath.explainTimeStep(12, inv), /לא תקינ/);
	}

	// invalid deltaMinutes
	assert.equal(clockMath.addMinutes(12, 0, NaN), null);
	assert.equal(clockMath.addMinutes(12, 0, 1.5), null);
	assert.equal(clockMath.addMinutes(12, 0, "15"), null);
	assert.equal(clockMath.addMinutes(12, 0, null), null);

	// toDigital24 invalid hour (0, 13) and non-boolean isPm
	assert.equal(clockMath.toDigital24(0, false), null);
	assert.equal(clockMath.toDigital24(13, true), null);
	assert.equal(clockMath.toDigital24(12, "true"), null);
	assert.equal(clockMath.toDigital24(12, 1), null);
	assert.equal(clockMath.toDigital24(12, null), null);
});
