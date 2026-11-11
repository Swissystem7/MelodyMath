const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const {
	calculateStarRating,
	renderProgressSvg,
} = require("../src/lib/starProgressCard.js");

// 1. calculateStarRating - 3 stars threshold (>= 90%)
test("calculateStarRating awards 3 stars for accuracy >= 90%", () => {
	const res90 = calculateStarRating(90);
	assert.equal(res90.stars, 3);
	assert.equal(res90.maxStars, 3);
	assert.equal(res90.accuracyPct, 90);
	assert.match(res90.label, /3 כוכבים/);

	const res95 = calculateStarRating(95);
	assert.equal(res95.stars, 3);
	assert.equal(res95.accuracyPct, 95);

	const res100 = calculateStarRating(100);
	assert.equal(res100.stars, 3);
	assert.equal(res100.accuracyPct, 100);
});

// 2. calculateStarRating - 2 stars threshold (>= 70% and < 90%)
test("calculateStarRating awards 2 stars for accuracy between 70% and 89%", () => {
	const res70 = calculateStarRating(70);
	assert.equal(res70.stars, 2);
	assert.equal(res70.maxStars, 3);
	assert.equal(res70.accuracyPct, 70);
	assert.match(res70.label, /2 כוכבים/);

	const res80 = calculateStarRating(80);
	assert.equal(res80.stars, 2);
	assert.equal(res80.accuracyPct, 80);

	const res89 = calculateStarRating(89);
	assert.equal(res89.stars, 2);
	assert.equal(res89.accuracyPct, 89);
});

// 3. calculateStarRating - 1 star threshold (>= 40% and < 70%)
test("calculateStarRating awards 1 star for accuracy between 40% and 69%", () => {
	const res40 = calculateStarRating(40);
	assert.equal(res40.stars, 1);
	assert.equal(res40.maxStars, 3);
	assert.equal(res40.accuracyPct, 40);
	assert.match(res40.label, /כוכב 1/);

	const res55 = calculateStarRating(55);
	assert.equal(res55.stars, 1);
	assert.equal(res55.accuracyPct, 55);

	const res69 = calculateStarRating(69);
	assert.equal(res69.stars, 1);
	assert.equal(res69.accuracyPct, 69);
});

// 4. calculateStarRating - 0 stars threshold (< 40%)
test("calculateStarRating awards 0 stars for accuracy < 40%", () => {
	const res0 = calculateStarRating(0);
	assert.equal(res0.stars, 0);
	assert.equal(res0.maxStars, 3);
	assert.equal(res0.accuracyPct, 0);
	assert.match(res0.label, /0 כוכבים/);

	const res25 = calculateStarRating(25);
	assert.equal(res25.stars, 0);
	assert.equal(res25.accuracyPct, 25);

	const res39 = calculateStarRating(39);
	assert.equal(res39.stars, 0);
	assert.equal(res39.accuracyPct, 39);
});

// 5. calculateStarRating - boundary values: 0, 39, 40, 69, 70, 89, 90, 100
test("calculateStarRating handles exact boundary values (0, 39, 40, 69, 70, 89, 90, 100)", () => {
	const boundaries = [
		{ val: 0, expectedStars: 0 },
		{ val: 39, expectedStars: 0 },
		{ val: 40, expectedStars: 1 },
		{ val: 69, expectedStars: 1 },
		{ val: 70, expectedStars: 2 },
		{ val: 89, expectedStars: 2 },
		{ val: 90, expectedStars: 3 },
		{ val: 100, expectedStars: 3 },
	];

	for (const { val, expectedStars } of boundaries) {
		const res = calculateStarRating(val);
		assert.equal(
			res.stars,
			expectedStars,
			`Boundary ${val} expected ${expectedStars} stars, got ${res.stars}`,
		);
		assert.equal(res.accuracyPct, val);
	}
});

// 6. calculateStarRating - edge case: negative values clamp to 0
test("calculateStarRating clamps negative accuracy values to 0 and 0 stars", () => {
	const resNeg1 = calculateStarRating(-1);
	assert.equal(resNeg1.stars, 0);
	assert.equal(resNeg1.accuracyPct, 0);

	const resNeg50 = calculateStarRating(-50);
	assert.equal(resNeg50.stars, 0);
	assert.equal(resNeg50.accuracyPct, 0);
});

// 7. calculateStarRating - edge case: values > 100 clamp to 100
test("calculateStarRating clamps accuracy values > 100 to 100 and 3 stars", () => {
	const res105 = calculateStarRating(105);
	assert.equal(res105.stars, 3);
	assert.equal(res105.accuracyPct, 100);

	const res999 = calculateStarRating(999);
	assert.equal(res999.stars, 3);
	assert.equal(res999.accuracyPct, 100);
});

// 8. calculateStarRating - edge case: NaN, null, undefined
test("calculateStarRating gracefully handles NaN, null, and undefined", () => {
	const resNan = calculateStarRating(Number.NaN);
	assert.equal(resNan.stars, 0);
	assert.equal(resNan.accuracyPct, 0);

	const resNull = calculateStarRating(null);
	assert.equal(resNull.stars, 0);
	assert.equal(resNull.accuracyPct, 0);

	const resUndef = calculateStarRating(undefined);
	assert.equal(resUndef.stars, 0);
	assert.equal(resUndef.accuracyPct, 0);
});

// 9. calculateStarRating - edge case: numeric strings and invalid strings
test("calculateStarRating parses numeric strings and handles invalid strings", () => {
	const resStr85 = calculateStarRating("85");
	assert.equal(resStr85.stars, 2);
	assert.equal(resStr85.accuracyPct, 85);

	const resStr95 = calculateStarRating("95%");
	assert.equal(resStr95.stars, 3);
	assert.equal(resStr95.accuracyPct, 95);

	const resStrInvalid = calculateStarRating("not-a-number");
	assert.equal(resStrInvalid.stars, 0);
	assert.equal(resStrInvalid.accuracyPct, 0);

	const resStrEmpty = calculateStarRating("");
	assert.equal(resStrEmpty.stars, 0);
	assert.equal(resStrEmpty.accuracyPct, 0);
});

// 10. calculateStarRating - sanitizes avgTimeMs properly
test("calculateStarRating sanitizes avgTimeMs and handles non-numeric/negative times gracefully", () => {
	const res1 = calculateStarRating(92, 4500);
	assert.equal(res1.stars, 3);

	const res2 = calculateStarRating(85, "3200");
	assert.equal(res2.stars, 2);

	const res3 = calculateStarRating(75, -500);
	assert.equal(res3.stars, 2);

	const res4 = calculateStarRating(75, Number.NaN);
	assert.equal(res4.stars, 2);

	const res5 = calculateStarRating(75, "invalid");
	assert.equal(res5.stars, 2);
});

// 11. renderProgressSvg - 0 sessions (empty state)
test("renderProgressSvg renders an accessible empty-state SVG when sessions list is empty or null", () => {
	const emptySvg = renderProgressSvg([]);
	assert.match(emptySvg, /<svg\b[^>]*\brole="img"/);
	assert.match(emptySvg, /aria-label="[^"]*אין עדיין נתוני אימון/);
	assert.match(emptySvg, /viewBox="0 0 320 160"/);
	assert.match(emptySvg, /אין עדיין נתוני אימון/);
	// No session progress bars should be present in empty state
	assert.ok(!emptySvg.includes('class="progress-bar"'));

	const nullSvg = renderProgressSvg(null);
	assert.match(nullSvg, /<svg\b[^>]*\brole="img"/);
	assert.ok(!nullSvg.includes('class="progress-bar"'));

	const undefSvg = renderProgressSvg(undefined);
	assert.match(undefSvg, /<svg\b[^>]*\brole="img"/);
	assert.ok(!undefSvg.includes('class="progress-bar"'));
});

// 12. renderProgressSvg - 1 session
test("renderProgressSvg renders exactly 1 session bar for 1 valid session", () => {
	const sessions = [{ accuracyPct: 80 }];
	const svg = renderProgressSvg(sessions);

	assert.match(svg, /<svg\b[^>]*\brole="img"/);
	const bars = svg.match(/<rect[^>]*class="progress-bar"[^>]*>/g) || [];
	assert.equal(bars.length, 1);
	assert.match(svg, /data-accuracy="80"/);
	assert.match(svg, /80%/);
	assert.match(svg, /#1/);
});

// 13. renderProgressSvg - 5 sessions
test("renderProgressSvg renders exactly 5 session bars for 5 sessions", () => {
	const sessions = [
		{ accuracyPct: 50 },
		{ accuracyPct: 65 },
		{ accuracyPct: 75 },
		{ accuracyPct: 90 },
		{ accuracyPct: 100 },
	];
	const svg = renderProgressSvg(sessions);

	assert.match(svg, /<svg\b[^>]*\brole="img"/);
	const bars = svg.match(/<rect[^>]*class="progress-bar"[^>]*>/g) || [];
	assert.equal(bars.length, 5);
	assert.match(svg, /#1/);
	assert.match(svg, /#5/);
	assert.match(svg, /100%/);
});

// 14. renderProgressSvg - >5 sessions (only last 5 rendered)
test("renderProgressSvg clamps to the most recent 5 sessions when more than 5 are provided", () => {
	const sessions = [
		{ accuracyPct: 10 },
		{ accuracyPct: 20 },
		{ accuracyPct: 30 },
		{ accuracyPct: 40 },
		{ accuracyPct: 50 },
		{ accuracyPct: 60 },
		{ accuracyPct: 70 },
		{ accuracyPct: 80 },
	];
	const svg = renderProgressSvg(sessions);

	const bars = svg.match(/<rect[^>]*class="progress-bar"[^>]*>/g) || [];
	assert.equal(bars.length, 5, "Expected exactly 5 bars rendered");

	// The last 5 sessions are 40, 50, 60, 70, 80
	assert.match(svg, /data-accuracy="40"/);
	assert.match(svg, /data-accuracy="80"/);
	// Earlier sessions (10, 20, 30) should not be among the 5 rendered bar data
	assert.doesNotMatch(svg, /data-accuracy="10"/);
	assert.doesNotMatch(svg, /data-accuracy="20"/);
	assert.doesNotMatch(svg, /data-accuracy="30"/);
});

// 15. renderProgressSvg - filters out invalid/NaN entries and missing fields
test("renderProgressSvg filters out invalid objects, NaN accuracy, and missing fields", () => {
	const mixedSessions = [
		null,
		undefined,
		{},
		{ accuracyPct: Number.NaN },
		{ accuracy: "not-a-number" },
		{ score: "none", total: 10 },
		{ score: 5, total: 0 },
		{ accuracyPct: 85 }, // valid #1
		"string-item",
		123,
		{ score: 9, total: 10 }, // valid #2 (90%)
	];

	const svg = renderProgressSvg(mixedSessions);
	const bars = svg.match(/<rect[^>]*class="progress-bar"[^>]*>/g) || [];
	assert.equal(bars.length, 2, "Only 2 valid sessions should be rendered");
	assert.match(svg, /data-accuracy="85"/);
	assert.match(svg, /data-accuracy="90"/);
});

// 16. renderProgressSvg - extracts accuracy from various session formats
test("renderProgressSvg supports accuracyPct, fractional accuracy, and score/total fields", () => {
	const sessions = [
		{ accuracyPct: 72 },
		{ accuracy: 0.88, total: 20 }, // fractional accuracy (88%)
		{ score: 18, total: 20 }, // 90%
		{ accuracy: 95 }, // direct accuracy percentage
	];

	const svg = renderProgressSvg(sessions);
	const bars = svg.match(/<rect[^>]*class="progress-bar"[^>]*>/g) || [];
	assert.equal(bars.length, 4);
	assert.match(svg, /data-accuracy="72"/);
	assert.match(svg, /data-accuracy="88"/);
	assert.match(svg, /data-accuracy="90"/);
	assert.match(svg, /data-accuracy="95"/);
});

// 17. renderProgressSvg - accessible SVG attributes
test("renderProgressSvg outputs accessible SVG attributes (role='img', aria-label, viewBox, rect bars)", () => {
	const svg = renderProgressSvg([{ accuracyPct: 85 }], {
		ariaLabel: "תוצאות אימון אחרון: 85% דיוק",
	});

	assert.match(svg, /\brole="img"/);
	assert.match(svg, /\baria-label="תוצאות אימון אחרון: 85% דיוק"/);
	assert.match(svg, /\bviewBox="0 0 320 160"/);
	assert.match(svg, /<rect[^>]*class="progress-bar"/);
	assert.match(svg, /<rect[^>]*class="bar-track"/);
	assert.match(svg, /aria-hidden="true"/);
});

// 18. renderProgressSvg - respects custom options (width, height, colors)
test("renderProgressSvg respects custom dimensions and WCAG AA contrast colors in options", () => {
	const svg = renderProgressSvg([{ accuracyPct: 75 }], {
		width: 400,
		height: 200,
		bgColor: "#1B1446",
		barColor: "#2ED3A8",
		starColor: "#FFC93C",
	});

	assert.match(svg, /viewBox="0 0 400 200"/);
	assert.match(svg, /width="400"/);
	assert.match(svg, /height="200"/);
	assert.match(svg, /fill="#1B1446"/);
	assert.match(svg, /fill="#2ED3A8"/);
	assert.match(svg, /fill="#FFC93C"/);
});

// 19. UMD export pattern in Node and browser-like environments
test("UMD export pattern works in both Node CommonJS and browser global environments", () => {
	const vm = require("node:vm");

	// CommonJS in Node
	const cjs = require("../src/lib/starProgressCard.js");
	assert.equal(typeof cjs.calculateStarRating, "function");
	assert.equal(typeof cjs.renderProgressSvg, "function");

	// Browser global simulation via VM context
	const fakeWindow = {};
	const code = fs.readFileSync(
		path.join(__dirname, "../src/lib/starProgressCard.js"),
		"utf8",
	);
	vm.runInNewContext(code, fakeWindow);

	assert.ok(
		fakeWindow.MM_STAR_PROGRESS_CARD,
		"Global MM_STAR_PROGRESS_CARD should be defined",
	);
	assert.equal(
		typeof fakeWindow.MM_STAR_PROGRESS_CARD.calculateStarRating,
		"function",
	);
	assert.equal(
		typeof fakeWindow.MM_STAR_PROGRESS_CARD.renderProgressSvg,
		"function",
	);
});
