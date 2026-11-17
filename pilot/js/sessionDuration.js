((root, factory) => {
	const api = factory();
	if (typeof module === "object" && module.exports) module.exports = api;
	root.MMPilotSessionDuration = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
	function formatDurationHebrew(seconds) {
		const s = Number(seconds);
		if (!Number.isFinite(s) || s < 0) return "";
		if (s < 60) return "פחות מדקה";
		const mins = Math.floor(s / 60);
		const rem = Math.round(s % 60);
		if (rem === 0) return `${mins} דקות`;
		return `${mins} דק׳ ${rem} שנ׳`;
	}

	function isTargetDurationReached(elapsedSeconds, targetMinutes = 8) {
		const elapsed = Number(elapsedSeconds);
		const target = Number(targetMinutes);
		if (!Number.isFinite(elapsed) || !Number.isFinite(target)) return false;
		return elapsed >= target * 60;
	}

	function calculateAverageSessionMinutes(sessionsList) {
		if (!Array.isArray(sessionsList) || sessionsList.length === 0) return 0;
		let total = 0;
		let n = 0;
		for (const s of sessionsList) {
			if (!s) continue;
			const start = Date.parse(s.start);
			const end = Date.parse(s.end);
			if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue;
			total += (end - start) / 60000;
			n += 1;
		}
		if (!n) return 0;
		return Math.round(total / n);
	}

	return {
		formatDurationHebrew,
		isTargetDurationReached,
		calculateAverageSessionMinutes,
	};
});
