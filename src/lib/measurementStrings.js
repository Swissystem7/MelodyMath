// Hebrew copy for metric-conversion practice cards. Kept apart from the math so
// wording and hints can be edited without touching conversion logic.
const MEASUREMENT_UNIT_LABELS = {
	millimeter: "מילימטר",
	centimeter: "סנטימטר",
	meter: "מטר",
	kilometer: "קילומטר",
};

const MEASUREMENT_HINTS = {
	metersToCentimeters: "כל מטר מחולק ל־100 חלקים שווים.",
	centimetersToMeters: "כל 100 סנטימטר הם מטר אחד.",
	centimetersToMillimeters: "כל סנטימטר מחולק ל־10.",
	millimetersToCentimeters: "כל 10 מילימטר הם סנטימטר אחד.",
	metersToMillimeters: "מטר אחד הם 1000 מילימטר.",
	millimetersToMeters: "1000 מילימטר הם מטר אחד.",
	kilometersToMeters: "כל קילומטר הוא 1000 מטר.",
	metersToKilometers: "כל 1000 מטר הם קילומטר אחד.",
};

module.exports = { MEASUREMENT_UNIT_LABELS, MEASUREMENT_HINTS };
