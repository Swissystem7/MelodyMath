((root, factory) => {
	const api = factory();
	if (typeof module === "object" && module.exports) {
		module.exports = api;
	}
	// Also expose on the root (browser window / globalThis) so pilots can call it without a bundler.
	root.MMPilotAnalyticsStats = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
	const calculatePooledStd = (groupA, groupB) => {
		if (!Array.isArray(groupA) || !Array.isArray(groupB)) {
			return null;
		}
		const cleanA = groupA.filter(
			(x) => typeof x === "number" && Number.isFinite(x),
		);
		const cleanB = groupB.filter(
			(x) => typeof x === "number" && Number.isFinite(x),
		);
		if (cleanA.length < 2 || cleanB.length < 2) {
			return null;
		}
		const nA = cleanA.length;
		const nB = cleanB.length;
		const meanA = cleanA.reduce((sum, x) => sum + x, 0) / nA;
		const meanB = cleanB.reduce((sum, x) => sum + x, 0) / nB;
		const ssA = cleanA.reduce((sum, x) => sum + (x - meanA) ** 2, 0);
		const ssB = cleanB.reduce((sum, x) => sum + (x - meanB) ** 2, 0);
		const df = nA + nB - 2;
		if (df <= 0) {
			return null;
		}
		const pooledVar = (ssA + ssB) / df;
		if (pooledVar < 0) {
			return null;
		}
		return Math.sqrt(pooledVar);
	};

	const calculateCohensD = (meanA, meanB, pooledStd) => {
		let a = meanA;
		let b = meanB;
		if (Array.isArray(a)) {
			const nums = a.filter((x) => typeof x === "number" && Number.isFinite(x));
			if (nums.length === 0) {
				return null;
			}
			a = nums.reduce((sum, x) => sum + x, 0) / nums.length;
		}
		if (Array.isArray(b)) {
			const nums = b.filter((x) => typeof x === "number" && Number.isFinite(x));
			if (nums.length === 0) {
				return null;
			}
			b = nums.reduce((sum, x) => sum + x, 0) / nums.length;
		}
		if (
			typeof a !== "number" ||
			typeof b !== "number" ||
			typeof pooledStd !== "number" ||
			!Number.isFinite(a) ||
			!Number.isFinite(b) ||
			!Number.isFinite(pooledStd) ||
			pooledStd <= 0
		) {
			return null;
		}
		const d = (a - b) / pooledStd;
		return Math.round(d * 100) / 100;
	};

	const classifyEffectSize = (d) => {
		if (typeof d !== "number" || !Number.isFinite(d)) {
			return null;
		}
		if (d < 0.2) {
			return "זניח";
		}
		if (d < 0.5) {
			return "קטן";
		}
		if (d < 0.8) {
			return "בינוני";
		}
		return "גדול";
	};

	const calculateRetentionIndex = (postImmediate, postOneWeek) => {
		let imm = postImmediate;
		let week = postOneWeek;
		if (Array.isArray(imm)) {
			const nums = imm.filter(
				(x) => typeof x === "number" && Number.isFinite(x),
			);
			if (nums.length === 0) {
				return null;
			}
			imm = nums.reduce((sum, x) => sum + x, 0) / nums.length;
		}
		if (Array.isArray(week)) {
			const nums = week.filter(
				(x) => typeof x === "number" && Number.isFinite(x),
			);
			if (nums.length === 0) {
				return null;
			}
			week = nums.reduce((sum, x) => sum + x, 0) / nums.length;
		}
		if (
			typeof imm !== "number" ||
			typeof week !== "number" ||
			!Number.isFinite(imm) ||
			!Number.isFinite(week) ||
			imm <= 0 ||
			week < 0
		) {
			return null;
		}
		const ratio = week / imm;
		return Math.round(ratio * 100) / 100;
	};

	return {
		calculatePooledStd,
		calculateCohensD,
		classifyEffectSize,
		calculateRetentionIndex,
	};
});
