const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const validator = require("../pilot/js/exportValidator.js");

test("isAnonymousName accepts all allowlist examples", () => {
	const allowlist = [
		1,
		40,
		"#1",
		"תלמיד 3",
		"תלמידה 5",
		"ילד/ה 7",
		"ילד 2",
		"נמר7",
		"כוכב",
		"תלמיד/ה לדוגמה",
		"מורה לדוגמה",
	];

	for (const name of allowlist) {
		assert.equal(
			validator.isAnonymousName(name),
			true,
			`Expected "${name}" to be allowed as anonymous`,
		);
	}

	// Additional valid examples
	assert.equal(validator.isAnonymousName("ילד/ה 1"), true);
	assert.equal(validator.isAnonymousName("#40"), true);
	assert.equal(validator.isAnonymousName("כוכב3"), true);
	assert.equal(validator.isAnonymousName("שמש"), true);
	assert.equal(validator.isAnonymousName("ירח"), true);
});

test("isAnonymousName rejects all blocklist examples", () => {
	const blocklist = [
		"student@school.edu",
		"teacher@melodymath.org.il",
		"050-1234567",
		"0541234567",
		"1234567",
		"123456789",
		"ישראל ישראלי",
		"יוסי כהן",
	];

	for (const name of blocklist) {
		assert.equal(
			validator.isAnonymousName(name),
			false,
			`Expected "${name}" to be blocked`,
		);
	}

	// Edge cases
	assert.equal(validator.isAnonymousName(""), false);
	assert.equal(validator.isAnonymousName(null), false);
	assert.equal(validator.isAnonymousName(undefined), false);
	assert.equal(validator.isAnonymousName(0), false);
	assert.equal(validator.isAnonymousName(41), false);
});

test("validateExportRow rejects scores -1, 101, NaN and accepts 0, 100", () => {
	const validRow0 = {
		student: "ילד 2",
		unit: "music-1",
		pre: { score: 0, total: 3, at: Date.now() },
		post: { score: 100, total: 3, at: Date.now() },
	};
	const res0 = validator.validateExportRow(validRow0);
	assert.equal(res0.valid, true);
	assert.deepEqual(res0.errors, []);

	const invalidRowNeg = {
		student: "ילד 2",
		unit: "music-1",
		pre: { score: -1, total: 3 },
	};
	const resNeg = validator.validateExportRow(invalidRowNeg);
	assert.equal(resNeg.valid, false);
	assert.ok(resNeg.errors.length > 0);

	const invalidRowOver = {
		student: "ילד 2",
		unit: "music-1",
		pre: { score: 101, total: 3 },
	};
	const resOver = validator.validateExportRow(invalidRowOver);
	assert.equal(resOver.valid, false);
	assert.ok(resOver.errors.length > 0);

	const invalidRowNaN = {
		student: "ילד 2",
		unit: "music-1",
		pre: { score: Number.NaN, total: 3 },
	};
	const resNaN = validator.validateExportRow(invalidRowNaN);
	assert.equal(resNaN.valid, false);
	assert.ok(resNaN.errors.length > 0);
});

test("validateExportRow enforces valid group_type values", () => {
	const rowControl = {
		student: "ילד 2",
		group_type: "control",
	};
	assert.equal(validator.validateExportRow(rowControl).valid, true);

	const rowIntervention = {
		student: "ילד 2",
		group_type: "intervention",
	};
	assert.equal(validator.validateExportRow(rowIntervention).valid, true);

	const rowInvalidGroup = {
		student: "ילד 2",
		group_type: "unknown",
	};
	const resInvalid = validator.validateExportRow(rowInvalidGroup);
	assert.equal(resInvalid.valid, false);
	assert.ok(
		resInvalid.errors.some(
			(e) => e.includes("group_type") || e.includes("קבוצה"),
		),
	);
});

test("validateExportRow rejects bad timestamps and accepts valid dates", () => {
	const rowGoodDate = {
		student: "ילד 2",
		pre: { score: 10, at: "2025-01-01T10:00:00.000Z" },
	};
	assert.equal(validator.validateExportRow(rowGoodDate).valid, true);

	const rowBadDate = {
		student: "ילד 2",
		pre: { score: 10, at: "not-a-valid-date" },
	};
	const resBadDate = validator.validateExportRow(rowBadDate);
	assert.equal(resBadDate.valid, false);
	assert.ok(resBadDate.errors.some((e) => e.includes("תאריך")));
});

test("validateExportDataset prefixes errors with row numbers and handles arrays", () => {
	// Empty dataset -> valid
	assert.deepEqual(validator.validateExportDataset([]), {
		valid: true,
		errors: [],
	});

	// Non-array -> invalid with 1 error
	const nonArrayRes = validator.validateExportDataset(null);
	assert.equal(nonArrayRes.valid, false);
	assert.equal(nonArrayRes.errors.length, 1);

	// Errors carry row numbers
	const rows = [
		{ student: "ילד 1", pre: { score: 10 } },
		{ student: "ישראל ישראלי", pre: { score: 10 } },
		{ student: "ילד 3", pre: { score: 150 } },
	];
	const datasetRes = validator.validateExportDataset(rows);
	assert.equal(datasetRes.valid, false);
	assert.equal(datasetRes.errors.length, 2);
	assert.ok(datasetRes.errors[0].startsWith("שורה 2:"));
	assert.ok(datasetRes.errors[1].startsWith("שורה 3:"));
});

test("inputs are not mutated by validator functions", () => {
	const originalRow = Object.freeze({
		student: "תלמיד 3",
		unit: "music-1",
		group_type: "intervention",
		pre: Object.freeze({ score: 80, total: 3, at: 1712345678900 }),
		post: Object.freeze({ score: 90, total: 3, at: 1712345699900 }),
	});

	const dataset = Object.freeze([originalRow]);

	assert.doesNotThrow(() => {
		validator.validateExportRow(originalRow);
		validator.validateExportDataset(dataset);
	});
});

test("exportChecks in pilot/js/app.js calls validateExportDataset before downloading CSV", () => {
	const appPath = path.join(__dirname, "..", "pilot", "js", "app.js");
	const appSource = fs.readFileSync(appPath, "utf8");

	// Verify validateExportDataset is referenced and called in exportChecks
	assert.match(
		appSource,
		/validateExportDataset/,
		"app.js must reference validateExportDataset",
	);
	assert.match(
		appSource,
		/MMPilotExportValidator\?\.validateExportDataset/,
		"app.js must call validateExportDataset on MMPilotExportValidator",
	);

	// Extract exportChecks function body
	const match = /function exportChecks\(\) \{([\s\S]*?)\n {2}\}/.exec(
		appSource,
	);
	assert.ok(match, "exportChecks function found in app.js");
	const fnBody = match[1];

	assert.match(
		fnBody,
		/validateExportDataset\(/,
		"validateExportDataset must be invoked inside exportChecks",
	);
	assert.match(
		fnBody,
		/return;/,
		"exportChecks must return early to stop download on validation failure",
	);
});

test("MMPilotExportValidator registers on root global when in browser environment", () => {
	const fakeGlobal = {};
	const code = fs.readFileSync(
		path.join(__dirname, "..", "pilot", "js", "exportValidator.js"),
		"utf8",
	);
	vm.runInNewContext(code, fakeGlobal);
	assert.ok(fakeGlobal.MMPilotExportValidator);
	assert.equal(
		typeof fakeGlobal.MMPilotExportValidator.validateExportDataset,
		"function",
	);
});

// codecov gap fill — hit remaining branches in exportValidator.js
test("isAnonymousName rejects non-string non-number and quote-only shells", () => {
	assert.equal(validator.isAnonymousName({}), false);
	assert.equal(validator.isAnonymousName([]), false);
	assert.equal(validator.isAnonymousName("«»"), false);
	assert.equal(validator.isAnonymousName('""'), false);
});

test("isAnonymousName rejects tokens that fail the single-word nickname pattern", () => {
	// punctuation mid-token fails /^[\p{L}\p{M}/]+(?:-?#?\d+)?$/u -> hits return false
	assert.equal(validator.isAnonymousName("כוכב_7"), false);
	assert.equal(validator.isAnonymousName("a.b"), false);
});

test("validateExportRow rejects null/non-object rows", () => {
	assert.equal(validator.validateExportRow(null).valid, false);
	assert.equal(validator.validateExportRow(undefined).valid, false);
	assert.equal(validator.validateExportRow("x").valid, false);
	assert.match(validator.validateExportRow(null).errors[0], /שורת הנתונים/);
});

test("validateExportRow accepts string scores and Date timestamps", () => {
	const row = {
		student: "כוכב",
		group_type: "control",
		pre: "80",
		post: "90",
		later: "85",
		pre_score: "70",
		at: new Date("2026-01-15T10:00:00Z"),
	};
	const res = validator.validateExportRow(row);
	assert.equal(res.valid, true, res.errors.join("; "));
});

test("validateExportRow checks scalar pre/post/later and nested later.at", () => {
	const bad = {
		student: "נמר",
		group_type: "intervention",
		pre: 101,
		post: -1,
		later: { score: 50, at: "not-a-date" },
		session_at: "also-bad",
	};
	const res = validator.validateExportRow(bad);
	assert.equal(res.valid, false);
	assert.ok(res.errors.length >= 3);
});

test("validateExportRow accepts nested pre/post objects with scores and dates", () => {
	const row = {
		name: "שמש",
		group: "control",
		pre: { score: 40, at: "2026-02-01" },
		post: { score: 55, at: 1700000000000 },
		later: { score: 60, at: "2026-03-01T12:00:00Z" },
	};
	const res = validator.validateExportRow(row);
	assert.equal(res.valid, true, res.errors.join("; "));
});

test("isValidDate paths via empty string and unsupported types on date keys", () => {
	const row = {
		student: "ירח",
		group_type: "control",
		created_at: "   ",
		updatedAt: { nope: true },
	};
	const res = validator.validateExportRow(row);
	assert.equal(res.valid, false);
});

test("browser global registration path can be exercised without module.exports", () => {
	const fs = require("node:fs");
	const path = require("node:path");
	const vm = require("node:vm");
	const src = fs.readFileSync(
		path.join(__dirname, "..", "pilot", "js", "exportValidator.js"),
		"utf8",
	);
	const sandbox = { globalThis: {} };
	// Do not provide `module` so the UMD else-branch assigns root.MMPilotExportValidator.
	vm.createContext(sandbox);
	vm.runInContext(src, sandbox);
	assert.equal(
		typeof sandbox.globalThis.MMPilotExportValidator.validateExportDataset,
		"function",
	);
});

test("isAnonymousName rejects 05x phone-shaped tokens and isScoreValid rejects blank/non-numeric strings", () => {
	// fewer than 7 digits so the dedicated 05x branch runs (not the digitsOnly>=7 branch)
	assert.equal(validator.isAnonymousName("050-1"), false);
	assert.equal(validator.isAnonymousName("a050-1"), false);
	const rowOk = { student: "כוכב", group_type: "control" };
	assert.equal(validator.validateExportRow(rowOk).valid, true);
	const row2 = { student: "כוכב", group_type: "control", score: true };
	assert.equal(validator.validateExportRow(row2).valid, false);
	const rowBlank = { student: "כוכב", group_type: "control", score: "   " };
	assert.equal(validator.validateExportRow(rowBlank).valid, false);
});
