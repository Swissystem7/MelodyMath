((root, factory) => {
	const api = factory();
	if (typeof module === "object" && module.exports) module.exports = api;
	root.MMPilotAnonymousNames = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
	const ALLOWED = Object.freeze([
		"נמר",
		"כוכב",
		"שמש",
		"ירח",
		"דולפין",
		"אייל",
		"פרפר",
		"צבי",
	]);
	function sanitizeNickname(input) {
		if (input == null) return "";
		return String(input)
			.replace(/[<>&"'`]/g, "")
			.replace(/\s+/g, " ")
			.trim();
	}
	function isValidAnonymousNickname(name) {
		const raw = sanitizeNickname(name);
		if (raw.length < 2 || raw.length > 16) return false;
		if (raw.includes("@")) return false;
		if (/\d{5,}/.test(raw)) return false;
		const words = raw.split(" ").filter(Boolean);
		if (words.length >= 2) {
			const nonAllowed = words.filter(
				(w) => !ALLOWED.includes(w) && !/^\d+$/.test(w),
			);
			if (nonAllowed.length >= 2) return false;
		}
		return true;
	}
	function generateAnonymousNickname(existingList = []) {
		const existing = new Set(
			(Array.isArray(existingList) ? existingList : []).map((x) =>
				sanitizeNickname(x),
			),
		);
		for (const base of ALLOWED) {
			for (let n = 1; n <= 9; n++) {
				const cand = `${base}${n}`;
				if (!existing.has(cand)) return cand;
			}
		}
		return "כוכב1";
	}
	return {
		ALLOWED,
		sanitizeNickname,
		isValidAnonymousNickname,
		generateAnonymousNickname,
	};
});
