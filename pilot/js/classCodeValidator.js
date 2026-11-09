((root, factory) => {
	const api = factory();
	if (typeof module === "object" && module.exports) module.exports = api;
	root.MMPilotClassCodeValidator = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
	// Figma MM-506: 5 chars from [A-HJ-NP-Z2-9] (no O,I,0,1)
	const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	const CODE_RE = /^[A-HJ-NP-Z2-9]{5}$/;

	function formatClassCode(input) {
		if (input == null) return "";
		return String(input)
			.toUpperCase()
			.replace(/[^A-HJ-NP-Z2-9]/g, "")
			.slice(0, 5);
	}

	function isValidClassCode(code) {
		const normalized = formatClassCode(code);
		return CODE_RE.test(normalized) && normalized.length === 5;
	}

	function generateRandomClassCode() {
		let out = "";
		for (let i = 0; i < 5; i++) {
			out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
		}
		return out;
	}

	return {
		ALPHABET,
		CODE_RE,
		isValidClassCode,
		formatClassCode,
		generateRandomClassCode,
	};
});
