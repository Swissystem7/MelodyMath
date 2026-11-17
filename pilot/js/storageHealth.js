((root, factory) => {
	const api = factory();
	if (typeof module === "object" && module.exports) module.exports = api;
	root.MMPilotStorageHealth = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
	function estimateStorageBytes(storageMap) {
		if (!storageMap || typeof storageMap !== "object") return 0;
		try {
			return new TextEncoder().encode(JSON.stringify(storageMap)).length;
		} catch {
			return 0;
		}
	}

	function isStorageQuotaSafe(usedBytes, maxSafeBytes = 3 * 1024 * 1024) {
		const used = Number(usedBytes);
		const max = Number(maxSafeBytes);
		if (!Number.isFinite(used) || !Number.isFinite(max) || used < 0 || max < 0) {
			return false;
		}
		return used <= max;
	}

	function formatBytesHebrew(bytes) {
		const n = Number(bytes);
		if (!Number.isFinite(n) || n < 0) return "";
		if (n < 1024) return `${Math.round(n)} בתים`;
		if (n < 1024 * 1024) {
			const kb = Math.round((n / 1024) * 10) / 10;
			return `${kb} ק״ב`;
		}
		const mb = Math.round((n / (1024 * 1024)) * 10) / 10;
		return `${mb} מ״ב`;
	}

	function isBackupRecommended(daysSinceLastBackup, thresholdDays = 7) {
		if (daysSinceLastBackup === null || daysSinceLastBackup === undefined) {
			return true;
		}
		const days = Number(daysSinceLastBackup);
		const thr = Number(thresholdDays);
		if (!Number.isFinite(days) || !Number.isFinite(thr)) return true;
		if (days < 0) return true;
		return days >= thr;
	}

	return {
		estimateStorageBytes,
		isStorageQuotaSafe,
		formatBytesHebrew,
		isBackupRecommended,
	};
});
