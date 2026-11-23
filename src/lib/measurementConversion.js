// Metric conversion helpers for the practice cards. The factor and direction
// live in one table while the Hebrew wording lives in measurementStrings.js,
// so a hint can never drift away from the arithmetic the learner is taught.

const {
	MEASUREMENT_UNIT_LABELS,
	MEASUREMENT_HINTS,
} = require("./measurementStrings");

function positiveFinite(...vals) {
	return vals.every(
		(v) => typeof v === "number" && Number.isFinite(v) && v > 0,
	);
}

// Each entry describes one directed conversion: how many `to` units there are
// in one `from` unit (factor) and whether we multiply or divide by it.
const MEASUREMENT_CONVERSIONS = {
	metersToCentimeters: {
		from: MEASUREMENT_UNIT_LABELS.meter,
		to: MEASUREMENT_UNIT_LABELS.centimeter,
		factor: 100,
		direction: "multiply",
		hint: MEASUREMENT_HINTS.metersToCentimeters,
	},
	centimetersToMeters: {
		from: MEASUREMENT_UNIT_LABELS.centimeter,
		to: MEASUREMENT_UNIT_LABELS.meter,
		factor: 100,
		direction: "divide",
		hint: MEASUREMENT_HINTS.centimetersToMeters,
	},
	centimetersToMillimeters: {
		from: MEASUREMENT_UNIT_LABELS.centimeter,
		to: MEASUREMENT_UNIT_LABELS.millimeter,
		factor: 10,
		direction: "multiply",
		hint: MEASUREMENT_HINTS.centimetersToMillimeters,
	},
	millimetersToCentimeters: {
		from: MEASUREMENT_UNIT_LABELS.millimeter,
		to: MEASUREMENT_UNIT_LABELS.centimeter,
		factor: 10,
		direction: "divide",
		hint: MEASUREMENT_HINTS.millimetersToCentimeters,
	},
	metersToMillimeters: {
		from: MEASUREMENT_UNIT_LABELS.meter,
		to: MEASUREMENT_UNIT_LABELS.millimeter,
		factor: 1000,
		direction: "multiply",
		hint: MEASUREMENT_HINTS.metersToMillimeters,
	},
	millimetersToMeters: {
		from: MEASUREMENT_UNIT_LABELS.millimeter,
		to: MEASUREMENT_UNIT_LABELS.meter,
		factor: 1000,
		direction: "divide",
		hint: MEASUREMENT_HINTS.millimetersToMeters,
	},
	kilometersToMeters: {
		from: MEASUREMENT_UNIT_LABELS.kilometer,
		to: MEASUREMENT_UNIT_LABELS.meter,
		factor: 1000,
		direction: "multiply",
		hint: MEASUREMENT_HINTS.kilometersToMeters,
	},
	metersToKilometers: {
		from: MEASUREMENT_UNIT_LABELS.meter,
		to: MEASUREMENT_UNIT_LABELS.kilometer,
		factor: 1000,
		direction: "divide",
		hint: MEASUREMENT_HINTS.metersToKilometers,
	},
};

function conversionSpec(type) {
	return Object.prototype.hasOwnProperty.call(MEASUREMENT_CONVERSIONS, type)
		? MEASUREMENT_CONVERSIONS[type]
		: null;
}

// A single validated arithmetic path for every conversion, including the two
// inverse helpers added for the practice cards.
function convertMeasurement(type, value) {
	if (!positiveFinite(value)) return null;
	const spec = conversionSpec(type);
	if (!spec) return null;
	return spec.direction === "divide" ? value / spec.factor : value * spec.factor;
}

// Shared explanatory sentence builder: reuses the same conversion above, so
// the number printed in a hint always matches the number a card accepts.
function describeConversion(type, value) {
	const spec = conversionSpec(type);
	if (!spec || !positiveFinite(value)) return null;
	return `${value} ${spec.from} הם ${convertMeasurement(type, value)} ${spec.to} — ${spec.hint}`;
}

function metersToCentimeters(m) {
	return convertMeasurement("metersToCentimeters", m);
}

function centimetersToMeters(cm) {
	return convertMeasurement("centimetersToMeters", cm);
}

function centimetersToMillimeters(cm) {
	return convertMeasurement("centimetersToMillimeters", cm);
}

function millimetersToCentimeters(mm) {
	return convertMeasurement("millimetersToCentimeters", mm);
}

function metersToMillimeters(m) {
	return convertMeasurement("metersToMillimeters", m);
}

function millimetersToMeters(mm) {
	return convertMeasurement("millimetersToMeters", mm);
}

function kilometersToMeters(km) {
	return convertMeasurement("kilometersToMeters", km);
}

function metersToKilometers(m) {
	return convertMeasurement("metersToKilometers", m);
}

function rectanglePerimeter(length, width) {
	if (!positiveFinite(length, width)) return null;
	return 2 * (length + width);
}

function rectangleArea(length, width) {
	if (!positiveFinite(length, width)) return null;
	return length * width;
}

function squarePerimeter(side) {
	if (!positiveFinite(side)) return null;
	return 4 * side;
}

function squareArea(side) {
	if (!positiveFinite(side)) return null;
	return side * side;
}

// Every conversion direction gets its own explanation branch. The shape
// branches keep their original wording and validation.
function explainMeasurement(type, val1, val2) {
	switch (type) {
		case "metersToCentimeters":
		case "centimetersToMeters":
		case "centimetersToMillimeters":
		case "millimetersToCentimeters":
		case "metersToMillimeters":
		case "millimetersToMeters":
		case "kilometersToMeters":
		case "metersToKilometers":
			return describeConversion(type, val1);
		case "rectangle":
			if (!positiveFinite(val1, val2)) return null;
			return `מלבן באורך ${val1} ורוחב ${val2}: היקף ${rectanglePerimeter(val1, val2)}, שטח ${rectangleArea(val1, val2)}.`;
		case "square":
			if (!positiveFinite(val1)) return null;
			return `ריבוע עם צלע ${val1}: היקף ${squarePerimeter(val1)}, שטח ${squareArea(val1)}.`;
		default:
			return null;
	}
}

module.exports = {
	metersToCentimeters,
	centimetersToMeters,
	centimetersToMillimeters,
	millimetersToCentimeters,
	metersToMillimeters,
	millimetersToMeters,
	kilometersToMeters,
	metersToKilometers,
	rectanglePerimeter,
	rectangleArea,
	squarePerimeter,
	squareArea,
	explainMeasurement,
};
