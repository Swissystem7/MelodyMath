function positiveFinite(...vals) {
	return vals.every(
		(v) => typeof v === "number" && Number.isFinite(v) && v > 0,
	);
}

function metersToCentimeters(m) {
	if (!positiveFinite(m)) return null;
	return m * 100;
}

function centimetersToMillimeters(cm) {
	if (!positiveFinite(cm)) return null;
	return cm * 10;
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

function explainMeasurement(type, val1, val2) {
	switch (type) {
		case "metersToCentimeters":
			if (!positiveFinite(val1)) return null;
			return `${val1} מטר הם ${metersToCentimeters(val1)} סנטימטר — כל מטר מחולק ל־100 חלקים שווים.`;
		case "centimetersToMillimeters":
			if (!positiveFinite(val1)) return null;
			return `${val1} סנטימטר הם ${centimetersToMillimeters(val1)} מילימטר — כל סנטימטר מחולק ל־10.`;
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
	centimetersToMillimeters,
	rectanglePerimeter,
	rectangleArea,
	squarePerimeter,
	squareArea,
	explainMeasurement,
};
