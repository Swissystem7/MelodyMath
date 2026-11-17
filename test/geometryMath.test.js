const test = require("node:test");
const assert = require("node:assert/strict");

const geometryMath = require("../src/lib/geometryMath.js");

test("classifyTriangleBySides classifies all triangle types correctly", () => {
	assert.equal(geometryMath.classifyTriangleBySides(3, 3, 3), "equilateral");
	assert.equal(geometryMath.classifyTriangleBySides(1, 1, 1), "equilateral");
	assert.equal(
		geometryMath.classifyTriangleBySides(4.5, 4.5, 4.5),
		"equilateral",
	);

	assert.equal(geometryMath.classifyTriangleBySides(3, 3, 2), "isosceles");
	assert.equal(geometryMath.classifyTriangleBySides(3, 2, 3), "isosceles");
	assert.equal(geometryMath.classifyTriangleBySides(2, 3, 3), "isosceles");
	assert.equal(geometryMath.classifyTriangleBySides(5, 5, 8), "isosceles");
	assert.equal(geometryMath.classifyTriangleBySides(7, 4, 7), "isosceles");

	assert.equal(geometryMath.classifyTriangleBySides(3, 4, 5), "scalene");
	assert.equal(geometryMath.classifyTriangleBySides(5, 12, 13), "scalene");
	assert.equal(geometryMath.classifyTriangleBySides(4, 5, 6), "scalene");
	assert.equal(geometryMath.classifyTriangleBySides(2.5, 3.5, 4.5), "scalene");
});

test("classifyTriangleBySides rejects triangle inequality violations", () => {
	// Degenerate triangles (sum of two sides equals the third)
	assert.equal(geometryMath.classifyTriangleBySides(1, 2, 3), "invalid");
	assert.equal(geometryMath.classifyTriangleBySides(3, 1, 2), "invalid");
	assert.equal(geometryMath.classifyTriangleBySides(2, 3, 5), "invalid");
	assert.equal(geometryMath.classifyTriangleBySides(10, 4, 6), "invalid");

	// Impossible triangles (sum of two sides is strictly less than the third)
	assert.equal(geometryMath.classifyTriangleBySides(1, 2, 4), "invalid");
	assert.equal(geometryMath.classifyTriangleBySides(2, 2, 5), "invalid");
	assert.equal(geometryMath.classifyTriangleBySides(5, 2, 2), "invalid");
	assert.equal(geometryMath.classifyTriangleBySides(2, 5, 2), "invalid");
	assert.equal(geometryMath.classifyTriangleBySides(10, 2, 3), "invalid");
});

test("classifyTriangleBySides rejects invalid or non-numeric inputs", () => {
	assert.equal(geometryMath.classifyTriangleBySides(0, 0, 0), "invalid");
	assert.equal(geometryMath.classifyTriangleBySides(0, 3, 3), "invalid");
	assert.equal(geometryMath.classifyTriangleBySides(-3, 3, 3), "invalid");
	assert.equal(geometryMath.classifyTriangleBySides(3, -3, 3), "invalid");
	assert.equal(geometryMath.classifyTriangleBySides(3, 3, -3), "invalid");
	assert.equal(geometryMath.classifyTriangleBySides(NaN, 3, 3), "invalid");
	assert.equal(geometryMath.classifyTriangleBySides(Infinity, 3, 3), "invalid");
	assert.equal(
		geometryMath.classifyTriangleBySides(-Infinity, 3, 3),
		"invalid",
	);
	assert.equal(geometryMath.classifyTriangleBySides("3", 3, 3), "invalid");
	assert.equal(geometryMath.classifyTriangleBySides(null, 3, 3), "invalid");
	assert.equal(
		geometryMath.classifyTriangleBySides(undefined, 3, 3),
		"invalid",
	);
	assert.equal(geometryMath.classifyTriangleBySides(3, 3), "invalid");
});

test("classifyAngleByDuration classifies 0.5, 1.0, 2.0 and other durations", () => {
	assert.equal(geometryMath.classifyAngleByDuration(0.5), "acute");
	assert.equal(geometryMath.classifyAngleByDuration(1.0), "right");
	assert.equal(geometryMath.classifyAngleByDuration(2.0), "obtuse");

	assert.equal(geometryMath.classifyAngleByDuration(0.25), "acute");
	assert.equal(geometryMath.classifyAngleByDuration(0.75), "acute");
	assert.equal(geometryMath.classifyAngleByDuration(1), "right");
	assert.equal(geometryMath.classifyAngleByDuration(1.5), "obtuse");
	assert.equal(geometryMath.classifyAngleByDuration(4.0), "obtuse");
});

test("classifyAngleByDuration returns null for non-positive or invalid inputs", () => {
	assert.equal(geometryMath.classifyAngleByDuration(0), null);
	assert.equal(geometryMath.classifyAngleByDuration(-0.5), null);
	assert.equal(geometryMath.classifyAngleByDuration(-1.0), null);
	assert.equal(geometryMath.classifyAngleByDuration(NaN), null);
	assert.equal(geometryMath.classifyAngleByDuration(Infinity), null);
	assert.equal(geometryMath.classifyAngleByDuration(-Infinity), null);
	assert.equal(geometryMath.classifyAngleByDuration("1.0"), null);
	assert.equal(geometryMath.classifyAngleByDuration(null), null);
	assert.equal(geometryMath.classifyAngleByDuration(undefined), null);
	assert.equal(geometryMath.classifyAngleByDuration(), null);
});

test("polygonProperties returns sides and vertices for integer n >= 3", () => {
	assert.deepEqual(geometryMath.polygonProperties(3), {
		sides: 3,
		vertices: 3,
	});
	assert.deepEqual(geometryMath.polygonProperties(4), {
		sides: 4,
		vertices: 4,
	});
	assert.deepEqual(geometryMath.polygonProperties(5), {
		sides: 5,
		vertices: 5,
	});
	assert.deepEqual(geometryMath.polygonProperties(6), {
		sides: 6,
		vertices: 6,
	});
	assert.deepEqual(geometryMath.polygonProperties(8), {
		sides: 8,
		vertices: 8,
	});
	assert.deepEqual(geometryMath.polygonProperties(12), {
		sides: 12,
		vertices: 12,
	});
});

test("polygonProperties returns null for non-integers or n < 3", () => {
	assert.equal(geometryMath.polygonProperties(2), null);
	assert.equal(geometryMath.polygonProperties(1), null);
	assert.equal(geometryMath.polygonProperties(0), null);
	assert.equal(geometryMath.polygonProperties(-3), null);
	assert.equal(geometryMath.polygonProperties(3.5), null);
	assert.equal(geometryMath.polygonProperties(4.1), null);
	assert.equal(geometryMath.polygonProperties("3"), null);
	assert.equal(geometryMath.polygonProperties(null), null);
	assert.equal(geometryMath.polygonProperties(undefined), null);
	assert.equal(geometryMath.polygonProperties(NaN), null);
	assert.equal(geometryMath.polygonProperties(Infinity), null);
	assert.equal(geometryMath.polygonProperties(), null);
});

test("explainTriangle returns Hebrew pedagogical string linking side equality to note durations", () => {
	const eqExplanation = geometryMath.explainTriangle(3, 3, 3);
	assert.match(eqExplanation, /שווה-צלעות/);
	assert.match(eqExplanation, /משך שווה|צלילים/);

	const isoExplanation = geometryMath.explainTriangle(3, 3, 2);
	assert.match(isoExplanation, /שווה-שוקיים/);
	assert.match(isoExplanation, /משך שווה|צלילים/);

	const scaExplanation = geometryMath.explainTriangle(3, 4, 5);
	assert.match(scaExplanation, /שונה-צלעות/);
	assert.match(scaExplanation, /צלילים/);

	const invExplanation = geometryMath.explainTriangle(1, 2, 4);
	assert.match(invExplanation, /אינן יוצרות משולש|משולש/);
	assert.match(invExplanation, /משכים/);

	const badInputExplanation = geometryMath.explainTriangle(-1, 2, 2);
	assert.match(badInputExplanation, /אינן יוצרות משולש|משולש/);
});
