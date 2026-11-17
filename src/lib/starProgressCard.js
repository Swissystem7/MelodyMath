((root, factory) => {
	const api = factory();
	if (typeof module === "object" && module.exports) {
		module.exports = api;
	}
	if (typeof root === "object" && root !== null) {
		root.MM_STAR_PROGRESS_CARD = api;
	}
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
	/**
	 * Escapes XML/SVG special characters to prevent markup injection.
	 * @param {*} str - Input value
	 * @returns {string} XML-safe escaped string
	 */
	function escapeXml(str) {
		return String(str == null ? "" : str).replace(/[<>&"']/g, (c) => {
			switch (c) {
				case "<":
					return "&lt;";
				case ">":
					return "&gt;";
				case "&":
					return "&amp;";
				case '"':
					return "&quot;";
				case "'":
					return "&apos;";
				default:
					return c;
			}
		});
	}

	/**
	 * Returns child-friendly Hebrew encouragement label for a star rating.
	 * @param {number} stars - Number of stars earned (0-3)
	 * @returns {string}
	 */
	function getStarLabel(stars) {
		if (stars === 3) return "מצוין! 3 כוכבים";
		if (stars === 2) return "כל הכבוד! 2 כוכבים";
		if (stars === 1) return "התחלה טובה! כוכב 1";
		return "ממשיכים לתרגל! 0 כוכבים";
	}

	/**
	 * Calculates star rating (0-3) based on accuracy percentage.
	 * Validates and sanitizes numeric inputs; handles non-numeric, null, undefined,
	 * negative, >100, and NaN gracefully.
	 *
	 * @param {number|string} accuracyPct - Accuracy percentage (0-100)
	 * @param {number|string} [avgTimeMs] - Average time per question in milliseconds
	 * @returns {{ stars: number, maxStars: 3, accuracyPct: number, label: string }}
	 */
	function calculateStarRating(accuracyPct, avgTimeMs) {
		let cleanAcc = 0;
		if (typeof accuracyPct === "number") {
			cleanAcc = Number.isFinite(accuracyPct) ? accuracyPct : 0;
		} else if (typeof accuracyPct === "string") {
			const parsed = Number.parseFloat(accuracyPct);
			cleanAcc = Number.isFinite(parsed) ? parsed : 0;
		}

		// Clamp accuracy between 0 and 100
		if (cleanAcc < 0) {
			cleanAcc = 0;
		} else if (cleanAcc > 100) {
			cleanAcc = 100;
		} else {
			cleanAcc = Math.round(cleanAcc);
		}

		// Sanitize avgTimeMs if provided
		let cleanTime = 0;
		if (
			typeof avgTimeMs === "number" &&
			Number.isFinite(avgTimeMs) &&
			avgTimeMs > 0
		) {
			cleanTime = Math.round(avgTimeMs);
		} else if (typeof avgTimeMs === "string") {
			const parsedTime = Number.parseFloat(avgTimeMs);
			cleanTime =
				Number.isFinite(parsedTime) && parsedTime > 0
					? Math.round(parsedTime)
					: 0;
		}
		// avgTimeMs is validated and sanitized above (available for future metrics)
		void cleanTime;

		let stars = 0;
		if (cleanAcc >= 90) {
			stars = 3;
		} else if (cleanAcc >= 70) {
			stars = 2;
		} else if (cleanAcc >= 40) {
			stars = 1;
		} else {
			stars = 0;
		}

		return {
			stars,
			maxStars: 3,
			accuracyPct: cleanAcc,
			label: getStarLabel(stars),
		};
	}

	/**
	 * Extracts a sanitized accuracy percentage (0-100) from a session record.
	 * Supports session.accuracyPct, session.accuracy, or session.score / session.total.
	 * Returns null if the record is invalid or missing accuracy data.
	 *
	 * @param {*} s - Session record object
	 * @returns {number|null}
	 */
	function extractSessionAccuracy(s) {
		if (!s || typeof s !== "object" || Array.isArray(s)) return null;

		// 1. Direct accuracyPct property
		if (s.accuracyPct !== undefined && s.accuracyPct !== null) {
			const val =
				typeof s.accuracyPct === "string"
					? Number.parseFloat(s.accuracyPct)
					: Number(s.accuracyPct);
			if (Number.isFinite(val) && !Number.isNaN(val)) {
				return Math.max(0, Math.min(100, Math.round(val)));
			}
			return null;
		}

		// 2. Direct accuracy property (could be 0-1 ratio or 0-100 percentage)
		if (s.accuracy !== undefined && s.accuracy !== null) {
			const val =
				typeof s.accuracy === "string"
					? Number.parseFloat(s.accuracy)
					: Number(s.accuracy);
			if (Number.isFinite(val) && !Number.isNaN(val)) {
				const pct = val <= 1 && val > 0 && s.total !== 1 ? val * 100 : val;
				return Math.max(0, Math.min(100, Math.round(pct)));
			}
			return null;
		}

		// 3. Computed from score and total
		if (
			s.score !== undefined &&
			s.score !== null &&
			s.total !== undefined &&
			s.total !== null
		) {
			const score =
				typeof s.score === "string"
					? Number.parseFloat(s.score)
					: Number(s.score);
			const total =
				typeof s.total === "string"
					? Number.parseFloat(s.total)
					: Number(s.total);
			if (
				Number.isFinite(score) &&
				Number.isFinite(total) &&
				total > 0 &&
				score >= 0
			) {
				return Math.max(0, Math.min(100, Math.round((score / total) * 100)));
			}
			return null;
		}

		return null;
	}

	/**
	 * Renders an accessible, child-friendly SVG progress card with a lightweight
	 * bar chart for recent sessions.
	 *
	 * @param {Array<Object>} sessions - Session records
	 * @param {Object} [options] - Configuration options
	 * @param {number} [options.width=320] - SVG width in px
	 * @param {number} [options.height=160] - SVG height in px
	 * @param {string} [options.ariaLabel] - Custom aria-label override
	 * @param {string} [options.bgColor='#1B1446'] - Background color
	 * @param {string} [options.barColor='#2ED3A8'] - Progress bar fill color
	 * @param {string} [options.starColor='#FFC93C'] - Star accent color
	 * @param {string} [options.trackColor='#5B3FD9'] - Background track color
	 * @returns {string} SVG markup string
	 */
	function renderProgressSvg(sessions, options) {
		const opts = options && typeof options === "object" ? options : {};
		const width =
			typeof opts.width === "number" && opts.width > 0 ? opts.width : 320;
		const height =
			typeof opts.height === "number" && opts.height > 0 ? opts.height : 160;

		const bgColor = opts.bgColor || "#1B1446";
		const barColor = opts.barColor || "#2ED3A8";
		const starColor = opts.starColor || "#FFC93C";
		const trackColor = opts.trackColor || "#5B3FD9";
		const textColor = opts.textColor || "#FFFFFF";
		const mutedTextColor = opts.mutedTextColor || "#D8D3F8";

		// Filter out invalid/NaN entries
		const validSessions = [];
		if (Array.isArray(sessions)) {
			for (let i = 0; i < sessions.length; i++) {
				const acc = extractSessionAccuracy(sessions[i]);
				if (acc !== null) {
					validSessions.push({
						accuracyPct: acc,
						raw: sessions[i],
					});
				}
			}
		}

		// Slice to the most recent 5 sessions
		const recent = validSessions.slice(-5);

		// Render empty state if no valid sessions exist
		if (recent.length === 0) {
			const emptyLabel =
				opts.ariaLabel ||
				"התקדמות אימונים: אין עדיין נתוני אימון — התחילו לתרגל!";
			return (
				`<svg role="img" aria-label="${escapeXml(emptyLabel)}" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
				`<rect width="${width}" height="${height}" rx="12" fill="${bgColor}" />` +
				`<text x="${width / 2}" y="${height / 2 - 12}" fill="${starColor}" font-size="26" text-anchor="middle" font-weight="bold" aria-hidden="true">★ ★ ★</text>` +
				`<text x="${width / 2}" y="${height / 2 + 18}" fill="${textColor}" font-size="14" font-weight="bold" text-anchor="middle" font-family="system-ui, sans-serif">אין עדיין נתוני אימון</text>` +
				`<text x="${width / 2}" y="${height / 2 + 38}" fill="${mutedTextColor}" font-size="12" text-anchor="middle" font-family="system-ui, sans-serif">התחילו לתרגל כדי לראות התקדמות!</text>` +
				`</svg>`
			);
		}

		// Calculate summary metrics for accessibility label & header
		const avgAccuracy = Math.round(
			recent.reduce((sum, s) => sum + s.accuracyPct, 0) / recent.length,
		);
		const summaryRating = calculateStarRating(avgAccuracy);
		const chartAriaLabel =
			opts.ariaLabel ||
			`התקדמות אימונים: ${recent.length} אימונים אחרונים, ממוצע ${avgAccuracy}% (${summaryRating.stars} כוכבים)`;

		const starsSymbol =
			"★".repeat(summaryRating.stars) + "☆".repeat(3 - summaryRating.stars);

		// Chart layout boundaries
		const chartTop = 44;
		const chartBottom = height - 28;
		const maxBarHeight = chartBottom - chartTop;

		const leftPad = 24;
		const rightPad = 24;
		const availWidth = width - leftPad - rightPad;
		const slotWidth = availWidth / recent.length;
		const barWidth = Math.min(36, Math.max(18, Math.round(slotWidth * 0.52)));

		let barsMarkup = "";
		for (let i = 0; i < recent.length; i++) {
			const s = recent[i];
			const pct = s.accuracyPct;
			const centerX = Math.round(leftPad + (i + 0.5) * slotWidth);
			const barX = Math.round(centerX - barWidth / 2);
			const barH = Math.max(0, Math.round((pct / 100) * maxBarHeight));
			const barY = chartBottom - barH;
			const labelY = Math.max(chartTop - 4, barY - 4);

			// Bar background track
			barsMarkup += `<rect class="bar-track" x="${barX}" y="${chartTop}" width="${barWidth}" height="${maxBarHeight}" rx="4" fill="${trackColor}" opacity="0.25" aria-hidden="true" />`;

			// Colored bar fill
			barsMarkup += `<rect class="progress-bar" data-session-index="${i}" data-accuracy="${pct}" x="${barX}" y="${barY}" width="${barWidth}" height="${barH}" rx="4" fill="${barColor}" aria-label="אימון ${i + 1}: ${pct}% דיוק" />`;

			// Percentage text on top
			barsMarkup += `<text class="bar-val" x="${centerX}" y="${labelY}" fill="${textColor}" font-size="10" font-weight="bold" text-anchor="middle" font-family="system-ui, sans-serif">${pct}%</text>`;

			// Session index below bar
			barsMarkup += `<text class="bar-idx" x="${centerX}" y="${height - 10}" fill="${mutedTextColor}" font-size="11" text-anchor="middle" font-family="system-ui, sans-serif">#${i + 1}</text>`;
		}

		return (
			`<svg role="img" aria-label="${escapeXml(chartAriaLabel)}" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
			`<rect width="${width}" height="${height}" rx="12" fill="${bgColor}" />` +
			`<text x="${leftPad}" y="25" fill="${starColor}" font-size="15" font-family="system-ui, sans-serif" aria-hidden="true">${starsSymbol}</text>` +
			`<text x="${width - rightPad}" y="24" fill="${mutedTextColor}" font-size="12" font-weight="bold" text-anchor="end" font-family="system-ui, sans-serif">אימונים אחרונים</text>` +
			`<line x1="${leftPad - 4}" y1="${chartBottom}" x2="${width - rightPad + 4}" y2="${chartBottom}" stroke="${trackColor}" stroke-width="1.5" stroke-linecap="round" opacity="0.6" />` +
			barsMarkup +
			`</svg>`
		);
	}

	return {
		calculateStarRating,
		renderProgressSvg,
	};
});
