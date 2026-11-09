((root, factory) => {
	const api = factory();
	if (typeof module === "object" && module.exports) module.exports = api;
	else Object.assign(root, api);
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
	/**
	 * Adds minutes to a 24-hour time and wraps around midnight.
	 * @param {number} h - Hour integer 0-23
	 * @param {number} m - Minute integer 0-59
	 * @param {number} deltaMinutes - Delta in minutes (may be negative)
	 * @returns {{ h: number, m: number } | null} Wrapped time or null if invalid
	 */
	function addMinutes(h, m, deltaMinutes) {
		if (!Number.isInteger(h) || h < 0 || h > 23) return null;
		if (!Number.isInteger(m) || m < 0 || m > 59) return null;
		if (!Number.isInteger(deltaMinutes)) return null;

		const total = h * 60 + m + deltaMinutes;
		const mod = ((total % 1440) + 1440) % 1440;
		return {
			h: Math.floor(mod / 60),
			m: mod % 60,
		};
	}

	/**
	 * Calculates minutes between two 24-hour clock times moving forward.
	 * @param {number} h1 - Start hour 0-23
	 * @param {number} m1 - Start minute 0-59
	 * @param {number} h2 - End hour 0-23
	 * @param {number} m2 - End minute 0-59
	 * @returns {number | null} Minutes forward (0-1439) or null if invalid
	 */
	function minutesBetween(h1, m1, h2, m2) {
		if (!Number.isInteger(h1) || h1 < 0 || h1 > 23) return null;
		if (!Number.isInteger(m1) || m1 < 0 || m1 > 59) return null;
		if (!Number.isInteger(h2) || h2 < 0 || h2 > 23) return null;
		if (!Number.isInteger(m2) || m2 < 0 || m2 > 59) return null;

		const t1 = h1 * 60 + m1;
		const t2 = h2 * 60 + m2;
		return (t2 - t1 + 1440) % 1440;
	}

	/**
	 * Converts a 12-hour format hour with AM/PM flag to 'HH:00' digital string.
	 * @param {number} h - Hour integer 1-12
	 * @param {boolean} isPm - True for PM, false for AM
	 * @returns {string | null} 'HH:00' or null if invalid
	 */
	function toDigital24(h, isPm) {
		if (!Number.isInteger(h) || h < 1 || h > 12) return null;
		if (typeof isPm !== "boolean") return null;

		let hour24;
		if (h === 12) {
			hour24 = isPm ? 12 : 0;
		} else {
			hour24 = isPm ? h + 12 : h;
		}
		const hh = hour24 < 10 ? `0${hour24}` : `${hour24}`;
		return `${hh}:00`;
	}

	/**
	 * Returns fraction and musical bar analogy for clock quarters.
	 * @param {number} m - Minute integer (0, 15, 30, 45)
	 * @returns {{ fraction: '0' | '1/4' | '1/2' | '3/4', nameHe: string, barHe: string } | null}
	 */
	function clockFraction(m) {
		if (!Number.isInteger(m)) return null;

		switch (m) {
			case 0:
				return {
					fraction: "0",
					nameHe: "שעה שלמה",
					barHe: "תיבה שלמה",
				};
			case 15:
				return {
					fraction: "1/4",
					nameHe: "רבע",
					barHe: "רבע תיבה",
				};
			case 30:
				return {
					fraction: "1/2",
					nameHe: "חצי",
					barHe: "חצי תיבה",
				};
			case 45:
				return {
					fraction: "3/4",
					nameHe: "שלושה רבעים",
					barHe: "שלושה רבעי תיבה",
				};
			default:
				return null;
		}
	}

	/**
	 * Short Hebrew explanation for a time step.
	 * @param {number} h - Hour integer 0-23
	 * @param {number} m - Minute integer 0-59
	 * @returns {string} Hebrew explanation
	 */
	function explainTimeStep(h, m) {
		if (
			!Number.isInteger(h) ||
			h < 0 ||
			h > 23 ||
			!Number.isInteger(m) ||
			m < 0 ||
			m > 59
		) {
			return "שעה לא תקינה.";
		}

		const mm = m < 10 ? `0${m}` : `${m}`;
		if (m === 0) {
			return `השעה ${h}:${mm} — שעה שלמה, כמו תיבה שלמה בשעון.`;
		}
		if (m === 15) {
			return `השעה ${h}:${mm} — רבע שעה אחרי ${h}, כמו רבע תיבה בשעון.`;
		}
		if (m === 30) {
			return `השעה ${h}:${mm} — חצי שעה אחרי ${h}, כמו חצי תיבה בשעון.`;
		}
		if (m === 45) {
			return `השעה ${h}:${mm} — שלושה רבעי שעה אחרי ${h}, כמו שלושה רבעי תיבה בשעון.`;
		}
		return `השעה ${h}:${mm}`;
	}

	return {
		addMinutes,
		minutesBetween,
		toDigital24,
		clockFraction,
		explainTimeStep,
	};
});
