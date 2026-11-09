function toFiniteNumber(v) {
	if (v === null || v === undefined || typeof v === "boolean") return NaN;
	const n = Number(v);
	return Number.isFinite(n) ? n : NaN;
}

function verifyCommutativePair(a, b) {
	const x = toFiniteNumber(a);
	const y = toFiniteNumber(b);
	if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
	const total = x * y;
	return {
		total,
		formAB: `${x}×${y}=${total}`,
		formBA: `${y}×${x}=${total}`,
		commutative: true,
	};
}

function decomposeFactorByFive(factor) {
	const n = toFiniteNumber(factor);
	if (!Number.isFinite(n)) return null;
	if (n <= 5) return [n];
	return [5, n - 5];
}

function distributiveProductWithFive(a, b) {
	const x = toFiniteNumber(a);
	const y = toFiniteNumber(b);
	if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
	if (y > 5) return x * 5 + x * (y - 5);
	return x * y;
}

function explainCommutativity(a, b) {
	const x = toFiniteNumber(a);
	const y = toFiniteNumber(b);
	if (!Number.isFinite(x) || !Number.isFinite(y)) return "";
	const total = x * y;
	return `${x} כפול ${y} שווה ל-${y} כפול ${x}, והתוצאה ${total}`;
}

module.exports = {
	verifyCommutativePair,
	decomposeFactorByFive,
	distributiveProductWithFive,
	explainCommutativity,
};
