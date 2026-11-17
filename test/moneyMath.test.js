const test = require("node:test");
const assert = require("node:assert/strict");
const {
	calculateTotalMoney,
	calculateChange,
	coinsEquivalent,
	explainMoneySum,
} = require("../src/lib/moneyMath.js");

test("total 99 example", () => {
	assert.equal(calculateTotalMoney({ bills: 50, coins: 48, halfShekels: 2 }), 99);
});
test("half shekel", () => assert.equal(calculateTotalMoney({ halfShekels: 1 }), 0.5));
test("change ok", () => assert.equal(calculateChange(100, 73.5), 26.5));
test("underpayment null", () => assert.equal(calculateChange(10, 20), null));
test("coinsEquivalent", () => assert.equal(coinsEquivalent(10, 2), 5));
test("coinsEquivalent invalid", () => assert.equal(coinsEquivalent(10, 0), null));
test("explain hebrew", () => assert.match(explainMoneySum(20, 5), /סה״כ 25/));
test("empty breakdown", () => assert.equal(calculateTotalMoney({}), 0));
