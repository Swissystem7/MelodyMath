const test = require("node:test");
const assert = require("node:assert/strict");

const K = require("../pilot/js/checks.js");

const EXPANDED_UNITS = [
	"mult-5-strategy",
	"mult-9-strategy",
	"fractions-bar-intro",
];

test("expanded assessment units have exactly 4 pre and 4 post items with unique ids", () => {
	for (const unitId of EXPANDED_UNITS) {
		const pre = K.checkFor(unitId, "pre");
		const post = K.checkFor(unitId, "post");

		assert.equal(
			pre.length,
			4,
			`${unitId} pre check must have exactly 4 items`,
		);
		assert.equal(
			post.length,
			4,
			`${unitId} post check must have exactly 4 items`,
		);

		const allItems = [...pre, ...post];
		const ids = new Set();
		for (const item of allItems) {
			assert.ok(!ids.has(item.id), `duplicate id ${item.id} in ${unitId}`);
			ids.add(item.id);
		}
	}
});

test("parallel items share topic but never repeat question text, and new/mult items differ in answer", () => {
	for (const unitId of EXPANDED_UNITS) {
		const pre = K.checkFor(unitId, "pre");
		const post = K.checkFor(unitId, "post");

		for (let k = 0; k < 4; k++) {
			const preItem = pre[k];
			const postItem = post[k];

			assert.equal(
				postItem.skill,
				preItem.skill,
				`${unitId} item ${k} must share topic (${preItem.skill} vs ${postItem.skill})`,
			);
			assert.notEqual(
				postItem.q,
				preItem.q,
				`${unitId} item ${k} post question must not equal pre question`,
			);
			if (k >= 2 || unitId !== "fractions-bar-intro") {
				assert.notEqual(
					postItem.answer,
					preItem.answer,
					`${unitId} item ${k} post answer must not equal pre answer`,
				);
			}
		}
	}
});

test('multiplication check items are mathematically correct when parsing "a × b"', () => {
	for (const unitId of ["mult-5-strategy", "mult-9-strategy"]) {
		const pre = K.checkFor(unitId, "pre");
		const post = K.checkFor(unitId, "post");

		for (const item of [...pre, ...post]) {
			const match = item.q.match(/(\d+)\s*×\s*(\d+)/);
			assert.ok(match, `${item.id} question "${item.q}" must parse as "a × b"`);
			const a = Number(match[1]);
			const b = Number(match[2]);
			assert.equal(
				item.answer,
				a * b,
				`${item.id} answer ${item.answer} must equal ${a} × ${b}`,
			);
		}
	}
});

test("score gives 0, 25, 50, 75, 100 percent for 0-4 right answers on 4-item checks", () => {
	const expectedPcts = [0, 25, 50, 75, 100];

	for (const unitId of EXPANDED_UNITS) {
		for (const phase of ["pre", "post"]) {
			const items = K.checkFor(unitId, phase);
			assert.equal(items.length, 4, `${unitId} ${phase} has 4 items`);

			for (let rightCount = 0; rightCount <= 4; rightCount++) {
				const answers = {};
				for (let i = 0; i < 4; i++) {
					answers[items[i].id] = i < rightCount ? String(items[i].answer) : "0";
				}
				const res = K.score(unitId, phase, answers);
				assert.equal(res.score, rightCount);
				assert.equal(res.total, 4);
				const percent = (res.score / res.total) * 100;
				assert.equal(
					percent,
					expectedPcts[rightCount],
					`${unitId} ${phase} with ${rightCount} right must score ${expectedPcts[rightCount]}%`,
				);
			}
		}
	}
});

test("other units checks keep their original lengths", () => {
	const expectedLengths = {
		"music-1": 3,
		"line-1": 3,
		"pattern-1": 3,
		"place-1": 3,
		"times-1": 3,
		"divide-1": 3,
		"shapes-1": 3,
		"measure-1": 3,
		"clock-1": 3,
		"money-1": 3,
		"data-1": 3,
		"order-1": 3,
		"attr-1": 3,
		"laws-1": 3,
		"solids-1": 3,
		"rules-1": 3,
		"ops-1": 3,
		"frac-4": 3,
		"parity-rhythm": 2,
	};

	for (const [unitId, len] of Object.entries(expectedLengths)) {
		const pre = K.checkFor(unitId, "pre");
		const post = K.checkFor(unitId, "post");
		assert.equal(pre.length, len, `${unitId} pre length must remain ${len}`);
		assert.equal(post.length, len, `${unitId} post length must remain ${len}`);
	}
});
