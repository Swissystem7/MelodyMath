const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const stats = require("../pilot/js/analyticsStats.js");

test("calculatePooledStd computes correct pooled standard deviation for equal and unequal sample sizes", () => {
	// Equal sample sizes (n1=3, n2=3)
	// groupA = [10, 12, 14], mean=12, ss=8
	// groupB = [20, 22, 24], mean=22, ss=8
	// df = 4, pooledVar = 16 / 4 = 4, pooledStd = 2
	const res1 = stats.calculatePooledStd([10, 12, 14], [20, 22, 24]);
	assert.equal(res1, 2);

	// Unequal sample sizes (n1=3, n2=5)
	// groupA = [2, 4, 6], mean=4, ss=8
	// groupB = [10, 12, 14, 16, 18], mean=14, ss=40
	// df = 3 + 5 - 2 = 6, pooledVar = (8 + 40) / 6 = 8, pooledStd = Math.sqrt(8)
	const res2 = stats.calculatePooledStd([2, 4, 6], [10, 12, 14, 16, 18]);
	assert.ok(Math.abs(res2 - Math.sqrt(8)) < 1e-9);

	// Zero variance when all items identical
	const res3 = stats.calculatePooledStd([5, 5, 5], [10, 10, 10]);
	assert.equal(res3, 0);
});

test("calculateCohensD computes known Cohen d effect size values", () => {
	// d = (meanA - meanB) / pooledStd
	// Large effect: d = (15 - 10) / 5 = 1.0
	assert.equal(stats.calculateCohensD(15, 10, 5), 1);

	// Benchmark large threshold: d = (108 - 100) / 10 = 0.8
	assert.equal(stats.calculateCohensD(108, 100, 10), 0.8);

	// Benchmark medium threshold: d = (105 - 100) / 10 = 0.5
	assert.equal(stats.calculateCohensD(105, 100, 10), 0.5);

	// Benchmark small threshold: d = (102 - 100) / 10 = 0.2
	assert.equal(stats.calculateCohensD(102, 100, 10), 0.2);

	// Negligible: d = (101 - 100) / 10 = 0.1
	assert.equal(stats.calculateCohensD(101, 100, 10), 0.1);

	// Zero difference
	assert.equal(stats.calculateCohensD(100, 100, 10), 0);

	// Negative direction
	assert.equal(stats.calculateCohensD(95, 100, 10), -0.5);

	// Accepts numeric arrays as mean groups
	assert.equal(stats.calculateCohensD([110, 100], [100, 90], 10), 1);
});

test("classifyEffectSize categorizes effect size according to official thresholds", () => {
	// < 0.2 -> 'זניח'
	assert.equal(stats.classifyEffectSize(0), "זניח");
	assert.equal(stats.classifyEffectSize(0.1), "זניח");
	assert.equal(stats.classifyEffectSize(0.19), "זניח");
	assert.equal(stats.classifyEffectSize(-0.5), "זניח");

	// 0.2 <= d < 0.5 -> 'קטן'
	assert.equal(stats.classifyEffectSize(0.2), "קטן");
	assert.equal(stats.classifyEffectSize(0.35), "קטן");
	assert.equal(stats.classifyEffectSize(0.49), "קטן");

	// 0.5 <= d < 0.8 -> 'בינוני'
	assert.equal(stats.classifyEffectSize(0.5), "בינוני");
	assert.equal(stats.classifyEffectSize(0.65), "בינוני");
	assert.equal(stats.classifyEffectSize(0.79), "בינוני");

	// >= 0.8 -> 'גדול'
	assert.equal(stats.classifyEffectSize(0.8), "גדול");
	assert.equal(stats.classifyEffectSize(1.2), "גדול");
	assert.equal(stats.classifyEffectSize(3.0), "גדול");
});

test("calculateRetentionIndex computes proportion preserved between immediate and delayed tests", () => {
	// Baseline perfect retention
	assert.equal(stats.calculateRetentionIndex(100, 100), 1);
	assert.equal(stats.calculateRetentionIndex(80, 80), 1);

	// Standard decline
	assert.equal(stats.calculateRetentionIndex(100, 80), 0.8);
	assert.equal(stats.calculateRetentionIndex(80, 60), 0.75);
	assert.equal(stats.calculateRetentionIndex(80, 70), 0.88);

	// Array inputs (means)
	assert.equal(stats.calculateRetentionIndex([80, 80, 80], [60, 60, 60]), 0.75);
});

test("small and missing samples return null without throwing", () => {
	// calculatePooledStd: non-arrays, null, undefined
	assert.equal(stats.calculatePooledStd(null, [1, 2]), null);
	assert.equal(stats.calculatePooledStd([1, 2], undefined), null);
	assert.equal(stats.calculatePooledStd("abc", [1, 2]), null);

	// calculatePooledStd: samples with fewer than 2 observations
	assert.equal(stats.calculatePooledStd([], []), null);
	assert.equal(stats.calculatePooledStd([1], [2, 3]), null);
	assert.equal(stats.calculatePooledStd([1, 2], [3]), null);
	assert.equal(stats.calculatePooledStd(["a", "b"], [1, 2]), null);

	// calculateCohensD: invalid inputs and zero/negative pooledStd
	assert.equal(stats.calculateCohensD(null, 10, 5), null);
	assert.equal(stats.calculateCohensD(10, null, 5), null);
	assert.equal(stats.calculateCohensD(10, 8, null), null);
	assert.equal(stats.calculateCohensD(10, 8, 0), null);
	assert.equal(stats.calculateCohensD(10, 8, -2), null);
	assert.equal(stats.calculateCohensD(Number.NaN, 8, 5), null);
	assert.equal(stats.calculateCohensD([], [1, 2], 5), null);
	assert.equal(stats.calculateCohensD([1, 2], [], 5), null);

	// classifyEffectSize: invalid inputs
	assert.equal(stats.classifyEffectSize(null), null);
	assert.equal(stats.classifyEffectSize(undefined), null);
	assert.equal(stats.classifyEffectSize("0.5"), null);
	assert.equal(stats.classifyEffectSize(Number.NaN), null);

	// calculateRetentionIndex: invalid inputs, non-positive immediate, negative week
	assert.equal(stats.calculateRetentionIndex(null, 80), null);
	assert.equal(stats.calculateRetentionIndex(80, null), null);
	assert.equal(stats.calculateRetentionIndex(0, 80), null);
	assert.equal(stats.calculateRetentionIndex(-50, 80), null);
	assert.equal(stats.calculateRetentionIndex(80, -10), null);
	assert.equal(stats.calculateRetentionIndex([], [80]), null);
	assert.equal(stats.calculateRetentionIndex([80], []), null);
});

test("input arrays are not mutated by stats functions", () => {
	const a = Object.freeze([10, 20, 30]);
	const b = Object.freeze([40, 50, 60]);

	assert.doesNotThrow(() => {
		stats.calculatePooledStd(a, b);
		stats.calculateCohensD(a, b, 10);
		stats.calculateRetentionIndex(a, b);
	});
});

test("MMPilotAnalyticsStats registers on root global when in browser environment", () => {
	const fakeGlobal = {};
	const code = fs.readFileSync(
		path.join(__dirname, "..", "pilot", "js", "analyticsStats.js"),
		"utf8",
	);
	vm.runInNewContext(code, fakeGlobal);
	assert.ok(fakeGlobal.MMPilotAnalyticsStats);
	assert.equal(
		typeof fakeGlobal.MMPilotAnalyticsStats.calculatePooledStd,
		"function",
	);
	assert.equal(
		typeof fakeGlobal.MMPilotAnalyticsStats.calculateCohensD,
		"function",
	);
	assert.equal(
		typeof fakeGlobal.MMPilotAnalyticsStats.classifyEffectSize,
		"function",
	);
	assert.equal(
		typeof fakeGlobal.MMPilotAnalyticsStats.calculateRetentionIndex,
		"function",
	);
});

test("browser global registration works even without module.exports", () => {
	const fakeWindow = {};
	const code = fs.readFileSync(
		path.join(__dirname, "..", "pilot", "js", "analyticsStats.js"),
		"utf8",
	);
	// Run in sandbox where module is undefined
	const script = new vm.Script(code);
	const ctx = vm.createContext(fakeWindow);
	script.runInContext(ctx);
	assert.ok(fakeWindow.MMPilotAnalyticsStats);
	assert.equal(
		typeof fakeWindow.MMPilotAnalyticsStats.calculateCohensD,
		"function",
	);
});

test("pilot/js/app.js wires MMPilotAnalyticsStats into classGainCard for >10 students only", () => {
	const appPath = path.join(__dirname, "..", "pilot", "js", "app.js");
	const appSource = fs.readFileSync(appPath, "utf8");

	// Verify computeClassCohenD is defined and references MMPilotAnalyticsStats
	assert.match(
		appSource,
		/function computeClassCohenD\(/,
		"app.js must define computeClassCohenD",
	);
	assert.match(
		appSource,
		/G\.MMPilotAnalyticsStats/,
		"app.js must check G.MMPilotAnalyticsStats",
	);
	assert.match(
		appSource,
		/calculatePooledStd/,
		"app.js must use calculatePooledStd",
	);
	assert.match(
		appSource,
		/calculateCohensD/,
		"app.js must use calculateCohensD",
	);
	assert.match(
		appSource,
		/classifyEffectSize/,
		"app.js must use classifyEffectSize",
	);
	assert.match(
		appSource,
		/children <= 10/,
		"app.js must gate Cohen d to >10 students",
	);
});

test("computeClassCohenD in app.js returns null for <=10 students and computes Cohen's d for >10 students", () => {
	const appPath = path.join(__dirname, "..", "pilot", "js", "app.js");
	const appSource = fs.readFileSync(appPath, "utf8");
	const match = /function computeClassCohenD\([\s\S]*?\n {2}\}/.exec(appSource);
	assert.ok(match, "computeClassCohenD function found in app.js");

	const fnCode = `(${match[0]})`;
	const fakeContext = {
		G: { MMPilotAnalyticsStats: stats },
		K: {},
	};
	const computeFn = vm.runInNewContext(fnCode, fakeContext);

	// Test 1: returns null when rows is missing or empty
	assert.equal(computeFn(null), null);
	assert.equal(computeFn([]), null);

	// Test 2: returns null when <= 10 students
	const tenRows = [];
	for (let i = 1; i <= 10; i += 1) {
		tenRows.push({
			student: `תלמיד ${i}`,
			unit: "u1",
			pre: { score: 1, total: 2 },
			post: { score: 2, total: 2 },
		});
	}
	assert.equal(
		computeFn(tenRows, { all: { children: 10, pre: 50, post: 100 } }),
		null,
	);

	// Test 3: computes Cohen's d when > 10 students (e.g. 12 students)
	const twelveRows = [];
	for (let i = 1; i <= 12; i += 1) {
		twelveRows.push({
			student: `תלמיד ${i}`,
			unit: "u1",
			pre: { score: i % 2 === 0 ? 1 : 2, total: 3 },
			post: { score: 3, total: 3 },
		});
	}
	const result = computeFn(twelveRows, {
		all: { children: 12, pre: 50, post: 100 },
	});
	assert.equal(typeof result, "number");
	assert.ok(Number.isFinite(result));
	assert.ok(result > 0);

	// Test 4: returns null without throwing when Stats is missing
	fakeContext.G.MMPilotAnalyticsStats = null;
	assert.equal(
		computeFn(twelveRows, { all: { children: 12, pre: 50, post: 100 } }),
		null,
	);
});
