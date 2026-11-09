((root, factory) => {
	const api = factory();
	if (typeof module === "object" && module.exports) {
		module.exports = api;
	} else {
		root.MMPilotExportValidator = api;
	}
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
	const SYSTEM_WORDS = new Set([
		"ילד",
		"ילדה",
		"ילד/ה",
		"תלמיד",
		"תלמידה",
		"תלמיד/ה",
		"מורה",
		"לדוגמה",
		"דמו",
		"demo",
		"כוכב",
		"נמר",
		"שמש",
		"ירח",
	]);

	const cleanWord = (w) =>
		w.replace(/^[#«"']+|[»"',.!?:;]+$/g, "").toLowerCase();

	const isAnonymousName = (name) => {
		if (name === null || name === undefined) {
			return false;
		}
		if (typeof name !== "string" && typeof name !== "number") {
			return false;
		}
		const raw = String(name).trim();
		if (!raw) {
			return false;
		}
		const str = raw.replace(/^[«"']+|[»"']+$/g, "").trim();
		if (!str) {
			return false;
		}

		// BLOCK 1: Email (@ + domain)
		if (/[^\s@]+@[^\s@]+\.[^\s@]+/i.test(str)) {
			return false;
		}

		// BLOCK 2: Phone (7-10 digits in a row, or a 05x prefix, also with dashes/spaces) / Israeli ID (9 digits)
		const digitsOnly = str.replace(/\D/g, "");
		if (digitsOnly.length >= 7) {
			return false;
		}
		if (/(?:^|[^\d])05\d[\s-]*\d/.test(str)) {
			return false;
		}

		// Words breakdown
		const words = str.split(/\s+/).filter(Boolean);

		// BLOCK 3: 2+ words where none is a system word ('ישראל ישראלי', 'יוסי כהן')
		if (words.length >= 2) {
			const hasSystemWord = words.some((w) => SYSTEM_WORDS.has(cleanWord(w)));
			if (!hasSystemWord) {
				return false;
			}
		}

		// ALLOW:
		// 1. Single word cases
		if (words.length === 1) {
			// student number 1-40 alone or '#N'
			const numMatch = /^#?(\d+)$/.exec(str);
			if (numMatch) {
				const n = Number(numMatch[1]);
				return n >= 1 && n <= 40;
			}
			// system word
			if (SYSTEM_WORDS.has(cleanWord(str))) {
				return true;
			}
			// single word nickname or word+number ('נמר7', 'כוכב3')
			if (/^[\p{L}\p{M}/]+(?:-?#?\d+)?$/u.test(str)) {
				return true;
			}
			return false;
		}

		// 2. Multi-word cases:
		// Must be made of system words and numbers
		const allSystemOrNumber = words.every((w) => {
			const cw = cleanWord(w);
			if (SYSTEM_WORDS.has(cw)) {
				return true;
			}
			return /^#?\d+$/.test(w);
		});

		return allSystemOrNumber;
	};

	const isScoreValid = (val) => {
		if (typeof val === "number") {
			return Number.isFinite(val) && val >= 0 && val <= 100;
		}
		if (typeof val === "string" && val.trim() !== "") {
			const num = Number(val);
			return Number.isFinite(num) && num >= 0 && num <= 100;
		}
		return false;
	};

	const checkScore = (val, label, errors) => {
		if (val !== undefined && val !== null && val !== "") {
			if (!isScoreValid(val)) {
				const desc = label ? ` (${label})` : "";
				errors.push(`ציון${desc} אינו תקין: יש להזין מספר סופי בין 0 ל-100`);
			}
		}
	};

	const checkGroup = (val, errors) => {
		if (val !== undefined && val !== null && val !== "") {
			if (val !== "control" && val !== "intervention") {
				errors.push("סוג קבוצה אינו תקין: מותר רק 'control' או 'intervention'");
			}
		}
	};

	const isValidDate = (val) => {
		if (val instanceof Date) {
			return !Number.isNaN(val.getTime());
		}
		if (typeof val === "number") {
			return Number.isFinite(val) && !Number.isNaN(new Date(val).getTime());
		}
		if (typeof val === "string") {
			const trimmed = val.trim();
			if (!trimmed) {
				return false;
			}
			const d = new Date(trimmed);
			return !Number.isNaN(d.getTime());
		}
		return false;
	};

	const checkDate = (val, label, errors) => {
		if (val !== undefined && val !== null && val !== "") {
			if (!isValidDate(val)) {
				errors.push(`תאריך (${label}) אינו תקין`);
			}
		}
	};

	const validateExportRow = (row) => {
		if (!row || typeof row !== "object") {
			return {
				valid: false,
				errors: ["שורת הנתונים אינה תקינה"],
			};
		}
		const errors = [];
		const student = row.student !== undefined ? row.student : row.name;
		if (!isAnonymousName(student)) {
			errors.push("שם התלמיד/ה אינו אנונימי או שאינו תקין");
		}

		// Scores
		if (row.pre !== undefined && row.pre !== null) {
			if (typeof row.pre === "object") {
				checkScore(row.pre.score, "לפני", errors);
			} else {
				checkScore(row.pre, "לפני", errors);
			}
		}
		if (row.post !== undefined && row.post !== null) {
			if (typeof row.post === "object") {
				checkScore(row.post.score, "אחרי", errors);
			} else {
				checkScore(row.post, "אחרי", errors);
			}
		}
		if (row.later !== undefined && row.later !== null) {
			if (typeof row.later === "object") {
				checkScore(row.later.score, "המשך", errors);
			} else {
				checkScore(row.later, "המשך", errors);
			}
		}
		checkScore(row.score, "", errors);
		checkScore(row.pre_score, "לפני", errors);
		checkScore(row.post_score, "אחרי", errors);
		checkScore(row.later_score, "המשך", errors);

		// group_type
		checkGroup(row.group_type, errors);
		checkGroup(row.group, errors);
		if (typeof row.pre === "object" && row.pre !== null) {
			checkGroup(row.pre.group, errors);
			checkGroup(row.pre.group_type, errors);
		}
		if (typeof row.post === "object" && row.post !== null) {
			checkGroup(row.post.group, errors);
			checkGroup(row.post.group_type, errors);
		}

		// Dates
		if (typeof row.pre === "object" && row.pre !== null) {
			checkDate(row.pre.at, "לפני", errors);
		}
		if (typeof row.post === "object" && row.post !== null) {
			checkDate(row.post.at, "אחרי", errors);
		}
		if (typeof row.later === "object" && row.later !== null) {
			checkDate(row.later.at, "המשך", errors);
		}

		const dateKeyRegex = /(?:_at|At|timestamp|date)$/i;
		for (const key of Object.keys(row)) {
			if (key === "at" || dateKeyRegex.test(key)) {
				checkDate(row[key], key, errors);
			}
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	};

	const validateExportDataset = (rows) => {
		if (!Array.isArray(rows)) {
			return {
				valid: false,
				errors: ["קובץ הנתונים אינו מערך תקין"],
			};
		}
		if (rows.length === 0) {
			return {
				valid: true,
				errors: [],
			};
		}
		const allErrors = [];
		for (let i = 0; i < rows.length; i += 1) {
			const row = rows[i];
			const res = validateExportRow(row);
			if (!res.valid) {
				for (const err of res.errors) {
					allErrors.push(`שורה ${i + 1}: ${err}`);
				}
			}
		}
		return {
			valid: allErrors.length === 0,
			errors: allErrors,
		};
	};

	return {
		isAnonymousName,
		validateExportRow,
		validateExportDataset,
	};
});
