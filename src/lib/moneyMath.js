function calculateTotalMoney(breakdown) {
	const b = breakdown && typeof breakdown === "object" ? breakdown : {};
	const bills = Number(b.bills) || 0;
	const coins = Number(b.coins) || 0;
	const half = Number(b.halfShekels) || 0;
	return bills + coins + half * 0.5;
}

function calculateChange(paid, cost) {
	const p = Number(paid);
	const c = Number(cost);
	if (!Number.isFinite(p) || !Number.isFinite(c)) return null;
	if (p < c) return null;
	return Math.round((p - c) * 100) / 100;
}

function coinsEquivalent(targetValue, coinValue) {
	const t = Number(targetValue);
	const v = Number(coinValue);
	if (!Number.isFinite(t) || !Number.isFinite(v) || v <= 0) return null;
	return Math.round(t / v);
}

function explainMoneySum(bills, coins) {
	const b = Number(bills) || 0;
	const c = Number(coins) || 0;
	const total = b + c;
	return `יש ${b} שקלים בשטרות ו-${c} בשקלים במטבעות, סה״כ ${total} שקלים`;
}

module.exports = {
	calculateTotalMoney,
	calculateChange,
	coinsEquivalent,
	explainMoneySum,
};
