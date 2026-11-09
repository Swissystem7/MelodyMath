((root, factory) => {
	const api = factory();
	if (typeof module === "object" && module.exports) module.exports = api;
	else Object.assign(root, api);
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
	/**
	 * Calculates greatest common divisor of two non-negative integers.
	 * @param {number} a
	 * @param {number} b
	 * @returns {number}
	 */
	function gcd(a, b) {
		let x = a;
		let y = b;
		while (y !== 0) {
			const temp = y;
			y = x % y;
			x = temp;
		}
		return x;
	}

	/**
	 * Checks whether denominator is one of the allowed musical note values (halves, quarters, eighths).
	 * @param {number} d
	 * @returns {boolean}
	 */
	function isAllowedDenominator(d) {
		return d === 2 || d === 4 || d === 8;
	}

	/**
	 * Formats a fraction name using musical bar terminology.
	 * @param {number} n - Numerator
	 * @param {number} d - Denominator
	 * @returns {string} Hebrew name for note length in a bar
	 */
	function fractionBarName(n, d) {
		if (n === 1 && d === 2) return "חצי תיבה";
		if (n === 1 && d === 4) return "רבע תיבה";
		if (n === 3 && d === 4) return "שלושה רבעי תיבה";
		if (n === 1 && d === 8) return "שמינית תיבה";
		if (n === 1 && d === 1) return "תיבה שלמה";
		return `${n}/${d} תיבה`;
	}

	/**
	 * Attaches the Hebrew preposition 'ל' to a fraction name.
	 * @param {string} name
	 * @returns {string}
	 */
	function withPreposition(name) {
		if (/^\d/.test(name)) {
			return `ל-${name}`;
		}
		return `ל${name}`;
	}

	/**
	 * Reduces a fraction by its greatest common divisor.
	 * @param {number} n - Numerator integer >= 0
	 * @param {number} d - Denominator positive integer
	 * @returns {{ n: number, d: number } | null} Simplified fraction or null if invalid
	 */
	function simplifyFraction(n, d) {
		if (!Number.isInteger(n) || n < 0) return null;
		if (!Number.isInteger(d) || d <= 0) return null;

		const g = gcd(n, d);
		return {
			n: n / g,
			d: d / g,
		};
	}

	/**
	 * Adds two fractions with denominators 2, 4, or 8, returning reduced sum.
	 * @param {number} n1 - First numerator integer >= 0
	 * @param {number} d1 - First denominator (2, 4, or 8)
	 * @param {number} n2 - Second numerator integer >= 0
	 * @param {number} d2 - Second denominator (2, 4, or 8)
	 * @returns {{ n: number, d: number } | null} Reduced sum or null if invalid
	 */
	function addFractions(n1, d1, n2, d2) {
		if (!Number.isInteger(n1) || n1 < 0 || !isAllowedDenominator(d1)) {
			return null;
		}
		if (!Number.isInteger(n2) || n2 < 0 || !isAllowedDenominator(d2)) {
			return null;
		}

		const num = n1 * d2 + n2 * d1;
		const den = d1 * d2;
		return simplifyFraction(num, den);
	}

	/**
	 * Converts a fraction to beat count in a bar.
	 * @param {number} n - Numerator integer >= 0
	 * @param {number} d - Denominator positive integer
	 * @param {number} [beatsPerMeasure=4] - Beats in a measure (positive integer)
	 * @returns {number | null} Beats count or null if invalid
	 */
	function fractionToBeats(n, d, beatsPerMeasure = 4) {
		if (!Number.isInteger(n) || n < 0) return null;
		if (!Number.isInteger(d) || d <= 0) return null;
		if (!Number.isInteger(beatsPerMeasure) || beatsPerMeasure <= 0) {
			return null;
		}

		return (n / d) * beatsPerMeasure;
	}

	/**
	 * Short Hebrew explanation of fraction addition in a bar.
	 * @param {number} n1 - First numerator integer >= 0
	 * @param {number} d1 - First denominator (2, 4, or 8)
	 * @param {number} n2 - Second numerator integer >= 0
	 * @param {number} d2 - Second denominator (2, 4, or 8)
	 * @returns {string} Hebrew explanation
	 */
	function explainFractionAddition(n1, d1, n2, d2) {
		const sum = addFractions(n1, d1, n2, d2);
		if (!sum) {
			return "שברים לא תקינים.";
		}

		const name1 = fractionBarName(n1, d1);
		const name2 = fractionBarName(n2, d2);
		const sumName = fractionBarName(sum.n, sum.d);
		const target = withPreposition(sumName);
		const moreThanBar = sum.n > sum.d ? " — יותר מתיבה שלמה" : "";

		return `${name1} ועוד ${name2} שווים ${target}${moreThanBar}`;
	}

	return {
		simplifyFraction,
		addFractions,
		fractionToBeats,
		explainFractionAddition,
	};
});
