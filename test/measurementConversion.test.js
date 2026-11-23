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

test("centimetersToMeters divides by 100 and rejects invalid input", () => {
	assert.equal(mc.centimetersToMeters(100), 1);
	assert.equal(mc.centimetersToMeters(250), 2.5);
	assert.equal(mc.centimetersToMeters(0), null);
	assert.equal(mc.centimetersToMeters(-100), null);
	assert.equal(mc.centimetersToMeters(Number.NaN), null);
	assert.equal(mc.centimetersToMeters(Number.POSITIVE_INFINITY), null);
	assert.equal(mc.centimetersToMeters("100"), null);
});

test("millimetersToCentimeters divides by 10 and rejects invalid input", () => {
	assert.equal(mc.millimetersToCentimeters(10), 1);
	assert.equal(mc.millimetersToCentimeters(25), 2.5);
	assert.equal(mc.millimetersToCentimeters(0), null);
	assert.equal(mc.millimetersToCentimeters(-10), null);
	assert.equal(mc.millimetersToCentimeters(Number.NaN), null);
	assert.equal(mc.millimetersToCentimeters("10"), null);
});

test("meters to centimeters and back returns the original value", () => {
	for (const value of [0.25, 1, 2.5, 12]) {
		const centimeters = mc.metersToCentimeters(value);
		assert.equal(mc.centimetersToMeters(centimeters), value);
	}
});

test("centimeters to millimeters and back returns the original value", () => {
	for (const value of [0.25, 1, 2.5, 12]) {
		const millimeters = mc.centimetersToMillimeters(value);
		assert.equal(mc.millimetersToCentimeters(millimeters), value);
	}
});

test("full metric chain there and back keeps the value", () => {
	for (const value of [1, 2.5, 7]) {
		const centimeters = mc.metersToCentimeters(value);
		const millimeters = mc.centimetersToMillimeters(centimeters);
		assert.equal(mc.centimetersToMeters(mc.millimetersToCentimeters(millimeters)), value);
	}
});

test("explainMeasurement covers the inverse conversions", () => {
	assert.equal(
		mc.explainMeasurement("centimetersToMeters", 250),
		"250 סנטימטר הם 2.5 מטר — כל 100 סנטימטר הם מטר אחד.",
	);
	assert.equal(
		mc.explainMeasurement("millimetersToCentimeters", 25),
		"25 מילימטר הם 2.5 סנטימטר — כל 10 מילימטר הם סנטימטר אחד.",
	);
	assert.equal(mc.explainMeasurement("centimetersToMeters", 0), null);
	assert.equal(mc.explainMeasurement("millimetersToCentimeters", "10"), null);
});

test("explainMeasurement centimetersToMillimeters with 1 contains 10", () => {
	assert.match(mc.explainMeasurement("centimetersToMillimeters", 1), /10/);
});

test("metersToMillimeters multiplies by 1000 and rejects invalid input", () => {
	assert.equal(mc.metersToMillimeters(1), 1000);
	assert.equal(mc.metersToMillimeters(2.5), 2500);
	for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, "1", null, undefined]) {
		assert.equal(mc.metersToMillimeters(bad), null);
	}
});

test("millimetersToMeters divides by 1000 and rejects invalid input", () => {
	assert.equal(mc.millimetersToMeters(1000), 1);
	assert.equal(mc.millimetersToMeters(2500), 2.5);
	for (const bad of [0, -1000, Number.NaN, Number.POSITIVE_INFINITY, "1000"]) {
		assert.equal(mc.millimetersToMeters(bad), null);
	}
});

test("kilometersToMeters multiplies by 1000 and rejects invalid input", () => {
	assert.equal(mc.kilometersToMeters(1), 1000);
	assert.equal(mc.kilometersToMeters(0.25), 250);
	for (const bad of [0, -2, Number.NaN, "2"]) {
		assert.equal(mc.kilometersToMeters(bad), null);
	}
});

test("metersToKilometers divides by 1000 and rejects invalid input", () => {
	assert.equal(mc.metersToKilometers(1000), 1);
	assert.equal(mc.metersToKilometers(250), 0.25);
	for (const bad of [0, -500, Number.NaN, "1000"]) {
		assert.equal(mc.metersToKilometers(bad), null);
	}
});

test("meters to millimeters and back returns the original value", () => {
	for (const value of [0.25, 1, 2.5, 12]) {
		assert.equal(mc.millimetersToMeters(mc.metersToMillimeters(value)), value);
	}
});

test("kilometers to meters and back returns the original value", () => {
	for (const value of [0.25, 1, 2.5, 12]) {
		assert.equal(mc.metersToKilometers(mc.kilometersToMeters(value)), value);
	}
});

test("explainMeasurement covers the additional metric directions", () => {
	assert.equal(
		mc.explainMeasurement("metersToMillimeters", 1),
		"1 מטר הם 1000 מילימטר — מטר אחד הם 1000 מילימטר.",
	);
	assert.equal(
		mc.explainMeasurement("millimetersToMeters", 2500),
		"2500 מילימטר הם 2.5 מטר — 1000 מילימטר הם מטר אחד.",
	);
	assert.equal(
		mc.explainMeasurement("kilometersToMeters", 2),
		"2 קילומטר הם 2000 מטר — כל קילומטר הוא 1000 מטר.",
	);
	assert.equal(
		mc.explainMeasurement("metersToKilometers", 500),
		"500 מטר הם 0.5 קילומטר — כל 1000 מטר הם קילומטר אחד.",
	);
});

test("explainMeasurement rejects invalid input for every conversion direction", () => {
	const directions = [
		"metersToCentimeters", "centimetersToMeters",
		"centimetersToMillimeters", "millimetersToCentimeters",
		"metersToMillimeters", "millimetersToMeters",
		"kilometersToMeters", "metersToKilometers",
	];
	for (const type of directions) {
		assert.equal(mc.explainMeasurement(type, 0), null, type + " zero");
		assert.equal(mc.explainMeasurement(type, Number.NaN), null, type + " NaN");
		assert.equal(mc.explainMeasurement(type, "1"), null, type + " string");
	}
});

test("every conversion direction agrees with its explanation", () => {
	const cases = [
		["metersToCentimeters", 3, 300],
		["centimetersToMeters", 300, 3],
		["centimetersToMillimeters", 3, 30],
		["millimetersToCentimeters", 30, 3],
		["metersToMillimeters", 3, 3000],
		["millimetersToMeters", 3000, 3],
		["kilometersToMeters", 3, 3000],
		["metersToKilometers", 3000, 3],
	];
	for (const [type, input, expected] of cases) {
		assert.equal(mc.explainMeasurement(type, input).includes(String(expected)), true, type);
	}
});

test("explanations use the shared Hebrew strings table", () => {
	const {
		MEASUREMENT_UNIT_LABELS,
		MEASUREMENT_HINTS,
	} = require("../src/lib/measurementStrings");
	for (const type of [
		"metersToCentimeters", "centimetersToMeters",
		"centimetersToMillimeters", "millimetersToCentimeters",
		"metersToMillimeters", "millimetersToMeters",
		"kilometersToMeters", "metersToKilometers",
	]) {
		const explanation = mc.explainMeasurement(type, 3);
		assert.equal(explanation.includes(MEASUREMENT_HINTS[type]), true, type + " hint");
	}
	assert.equal(
		mc.explainMeasurement("centimetersToMeters", 300).includes(MEASUREMENT_UNIT_LABELS.meter),
		true,
	);
});
