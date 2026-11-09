const test = require("node:test");
const assert = require("node:assert/strict");
const mc = require("../src/lib/measurementConversion");

test("metersToCentimeters", () => {
	assert.equal(mc.metersToCentimeters(1), 100);
	assert.equal(mc.metersToCentimeters(2.5), 250);
	assert.equal(mc.metersToCentimeters(0), null);
	assert.equal(mc.metersToCentimeters(-1), null);
});

test("centimetersToMillimeters", () => {
	assert.equal(mc.centimetersToMillimeters(1), 10);
	assert.equal(mc.centimetersToMillimeters(0), null);
});

test("rectangle perimeter and area", () => {
	assert.equal(mc.rectanglePerimeter(3, 4), 14);
	assert.equal(mc.rectangleArea(3, 4), 12);
	assert.equal(mc.rectangleArea(0, 4), null);
});

test("square perimeter and area", () => {
	assert.equal(mc.squarePerimeter(5), 20);
	assert.equal(mc.squareArea(5), 25);
	assert.equal(mc.squarePerimeter(-2), null);
});

test("explainMeasurement Hebrew strings", () => {
	assert.match(mc.explainMeasurement("metersToCentimeters", 1), /100/);
	assert.match(mc.explainMeasurement("rectangle", 3, 4), /14/);
	assert.match(mc.explainMeasurement("square", 5), /25/);
	assert.equal(mc.explainMeasurement("nope", 1), null);
});

test("rejects non-finite", () => {
	assert.equal(mc.metersToCentimeters(Number.NaN), null);
	assert.equal(mc.rectanglePerimeter(1, Number.POSITIVE_INFINITY), null);
});

test("centimeters chain", () => {
	assert.equal(mc.centimetersToMillimeters(mc.metersToCentimeters(1)), 1000);
});

test("square equals rectangle with equal sides", () => {
	assert.equal(mc.squareArea(7), mc.rectangleArea(7, 7));
	assert.equal(mc.squarePerimeter(7), mc.rectanglePerimeter(7, 7));
});
