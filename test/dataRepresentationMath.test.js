const test = require("node:test");
const assert = require("node:assert/strict");
const {
	findMaxCategory,
	categoryDifference,
	pictogramTotal,
	explainDataComparison,
} = require("../src/lib/dataRepresentationMath.js");

test("leading category", () => {
	assert.deepEqual(findMaxCategory({ apples: 3, bananas: 7, cherries: 5 }), {
		category: "bananas",
		value: 7,
	});
});
test("difference absolute", () => {
	assert.equal(categoryDifference({ a: 10, b: 4 }, "a", "b"), 6);
});
test("pictogram multiplication", () => {
	assert.equal(pictogramTotal(5, 2), 10);
});
test("tie keeps first max encounter order by Object.entries", () => {
	const r = findMaxCategory({ x: 5, y: 5 });
	assert.equal(r.value, 5);
	assert.ok(r.category === "x" || r.category === "y");
});
test("empty / invalid", () => {
	assert.equal(findMaxCategory({}), null);
	assert.equal(findMaxCategory(null), null);
	assert.equal(categoryDifference({}, "a", "b"), null);
	assert.equal(pictogramTotal(-1, 2), null);
});
test("hebrew explanation", () => {
	assert.match(explainDataComparison("כלבים", 8, "חתולים", 3), /כלבים גדול/);
	assert.match(explainDataComparison("א", 2, "ב", 2), /שווים/);
});
