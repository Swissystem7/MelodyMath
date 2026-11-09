function findMaxCategory(dataMap) {
	if (!dataMap || typeof dataMap !== "object" || Array.isArray(dataMap)) {
		return null;
	}
	let bestCat = null;
	let bestVal = -Infinity;
	let found = false;
	for (const [category, raw] of Object.entries(dataMap)) {
		const value = Number(raw);
		if (!Number.isFinite(value)) continue;
		found = true;
		if (value > bestVal) {
			bestVal = value;
			bestCat = category;
		}
	}
	if (!found) return null;
	return { category: bestCat, value: bestVal };
}

function categoryDifference(dataMap, catA, catB) {
	if (!dataMap || typeof dataMap !== "object" || Array.isArray(dataMap)) {
		return null;
	}
	const a = Number(dataMap[catA]);
	const b = Number(dataMap[catB]);
	if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
	return Math.abs(a - b);
}

function pictogramTotal(symbolCount, valuePerSymbol) {
	const n = Number(symbolCount);
	const v = Number(valuePerSymbol);
	if (!Number.isFinite(n) || !Number.isFinite(v) || n < 0) return null;
	return n * v;
}

function explainDataComparison(catA, valA, catB, valB) {
	const a = Number(valA);
	const b = Number(valB);
	const nameA = String(catA ?? "");
	const nameB = String(catB ?? "");
	if (!Number.isFinite(a) || !Number.isFinite(b)) return "";
	if (a === b) {
		return `${nameA} ו-${nameB} שווים עם ${a} כל אחד`;
	}
	if (a > b) {
		return `${nameA} גדול מ-${nameB} ב-${a - b}`;
	}
	return `${nameB} גדול מ-${nameA} ב-${b - a}`;
}

module.exports = {
	findMaxCategory,
	categoryDifference,
	pictogramTotal,
	explainDataComparison,
};
