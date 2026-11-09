((root, factory) => {
	const api = factory();
	if (typeof module === "object" && module.exports) module.exports = api;
	root.MMPilotClassCodeValidator = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
	const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	const CODE_RE = /^[A-HJ-NP-Z2-9]{5}$/;

	function cleanClassCode(input) {
		if (input == null) return "";
		return String(input)
			.toUpperCase()
			.replace(/[^A-HJ-NP-Z2-9]/g, "");
	}

	function formatClassCode(input) {
		return cleanClassCode(input).slice(0, 5);
	}

	function isValidClassCode(code) {
		return CODE_RE.test(cleanClassCode(code));
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
