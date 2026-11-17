((root, factory) => {
	const api = factory();
	if (typeof module === "object" && module.exports) module.exports = api;
	else Object.assign(root, api);
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
	/**
	 * Checks if a value is a finite number.
	 * @param {unknown} n
	 * @returns {boolean}
	 */
	function isFiniteNumber(n) {
		return typeof n === "number" && Number.isFinite(n);
	}

	/**
	 * Classifies a triangle by side lengths.
	 * @param {number} a - First side length
	 * @param {number} b - Second side length
	 * @param {number} c - Third side length
	 * @returns {'equilateral' | 'isosceles' | 'scalene' | 'invalid'}
	 */
	function classifyTriangleBySides(a, b, c) {
		if (
			!isFiniteNumber(a) ||
			!isFiniteNumber(b) ||
			!isFiniteNumber(c) ||
			a <= 0 ||
			b <= 0 ||
			c <= 0
		) {
			return "invalid";
		}

		if (a + b <= c || a + c <= b || b + c <= a) {
			return "invalid";
		}

		if (a === b && b === c) {
			return "equilateral";
		}
		if (a === b || b === c || a === c) {
			return "isosceles";
		}
		return "scalene";
	}

	/**
	 * Classifies an angle by duration in beats.
	 * 1.0 beat is a right angle; < 1.0 is acute; > 1.0 is obtuse.
	 * @param {number} beats - Beat duration (> 0)
	 * @returns {'right' | 'acute' | 'obtuse' | null}
	 */
	function classifyAngleByDuration(beats) {
		if (!isFiniteNumber(beats) || beats <= 0) {
			return null;
		}

		if (beats === 1) {
			return "right";
		}
		if (beats < 1) {
			return "acute";
		}
		return "obtuse";
	}

	/**
	 * Returns properties for a simple polygon with given number of sides.
	 * @param {number} sides - Number of sides (integer >= 3)
	 * @returns {{ sides: number, vertices: number } | null}
	 */
	function polygonProperties(sides) {
		if (!Number.isInteger(sides) || sides < 3) {
			return null;
		}
		return {
			sides,
			vertices: sides,
		};
	}

	/**
	 * Explains a triangle in Hebrew, linking side equality to equal note durations.
	 * @param {number} a - First side length
	 * @param {number} b - Second side length
	 * @param {number} c - Third side length
	 * @returns {string} Hebrew pedagogical explanation
	 */
	function explainTriangle(a, b, c) {
		const kind = classifyTriangleBySides(a, b, c);
		switch (kind) {
			case "equilateral":
				return "משולש שווה-צלעות: כל שלוש הצלעות שוות באורכן, כמו שלושה צלילים בעלי משך שווה.";
			case "isosceles":
				return "משולש שווה-שוקיים: שתי צלעות שוות באורכן וצלע אחת שונה, כמו שני צלילים בעלי משך שווה וצליל אחד בעל משך שונה.";
			case "scalene":
				return "משולש שונה-צלעות: כל שלוש הצלעות באורכים שונים, כמו שלושה צלילים שלכל אחד מהם משך שונה.";
			default:
				return "הצלעות אינן יוצרות משולש תקין: סכום שני משכים קצרים חייב להיות גדול מהמשך הארוך כדי שהמשולש ייסגר.";
		}
	}

	return {
		classifyTriangleBySides,
		classifyAngleByDuration,
		polygonProperties,
		explainTriangle,
	};
});
