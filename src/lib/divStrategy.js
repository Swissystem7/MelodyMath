((root, factory) => {
	const api = factory();
	if (typeof module === "object" && module.exports) module.exports = api;
	else Object.assign(root, api);
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
	function isNonNegativeInteger(n) {
		return Number.isInteger(n) && n >= 0;
	}

	function isPositiveInteger(n) {
		return Number.isInteger(n) && n >= 1;
	}

	function divideBeatsEqually(totalBeats, groups) {
		if (!isNonNegativeInteger(totalBeats) || !isPositiveInteger(groups))
			return null;
		if (totalBeats % groups !== 0) return null;
		return totalBeats / groups;
	}

	function divisionAsInverseMult(dividend, divisor) {
		const quotient = divideBeatsEqually(dividend, divisor);
		if (quotient === null) return null;
		return {
			dividend,
			divisor,
			quotient,
			multiplication: { a: divisor, b: quotient, product: dividend },
			divisionText: `${dividend} ÷ ${divisor} = ${quotient}`,
			multiplicationText: `${divisor} × ${quotient} = ${dividend}`,
		};
	}

	function explainDivisionStep(dividend, divisor) {
		if (divisor === 0) return "אי אפשר לחלק באפס.";
		const quotient = divideBeatsEqually(dividend, divisor);
		if (quotient === null)
			return "אי אפשר לחלק כך: צריך מספרים שלמים שהחלוקה בהם שווה בשווה.";
		return `מחלקים ${dividend} פעימות שווה בשווה ל-${divisor} נגנים: כל נגן מקבל ${quotient} פעימות, כי ${divisor} × ${quotient} = ${dividend}.`;
	}

	return { divideBeatsEqually, divisionAsInverseMult, explainDivisionStep };
});
