((root, factory) => {
	const api = factory();
	if (typeof module === "object" && module.exports) module.exports = api;
	root.MMPilotAccessibilityContrast = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
	function getAccessibilityClassList(isHighContrast, isLargeText) {
		const classes = [];
		if (isHighContrast) classes.push("high-contrast");
		if (isLargeText) classes.push("large-text");
		return classes;
	}

	function channel(c) {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	}

	function calculateLuminance(r, g, b) {
		const rr = Number(r);
		const gg = Number(g);
		const bb = Number(b);
		if (![rr, gg, bb].every((n) => Number.isFinite(n) && n >= 0 && n <= 255)) {
			return null;
		}
		return 0.2126 * channel(rr) + 0.7152 * channel(gg) + 0.0722 * channel(bb);
	}

	function calculateContrastRatio(rgb1, rgb2) {
		if (!Array.isArray(rgb1) || !Array.isArray(rgb2)) return null;
		const l1 = calculateLuminance(rgb1[0], rgb1[1], rgb1[2]);
		const l2 = calculateLuminance(rgb2[0], rgb2[1], rgb2[2]);
		if (l1 === null || l2 === null) return null;
		const lighter = Math.max(l1, l2);
		const darker = Math.min(l1, l2);
		return (lighter + 0.05) / (darker + 0.05);
	}

	function isWcagAaCompliant(ratio, isLargeText = false) {
		const r = Number(ratio);
		if (!Number.isFinite(r) || r <= 0) return false;
		return isLargeText ? r >= 3 : r >= 4.5;
	}

	return {
		getAccessibilityClassList,
		calculateLuminance,
		calculateContrastRatio,
		isWcagAaCompliant,
	};
});
