((root, factory) => {
	const api = factory();
	if (typeof module === "object" && module.exports) {
		module.exports = api;
	}
	root.MMPilotSessionEnd = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
	const TITLE = "עבדת יפה היום.";
	const SUBTITLE = "אפשר לסיים, ואפשר עוד סבב.";
	const DONE_LABEL = "סיימתי להיום";
	const AGAIN_LABEL = "עוד סבב";
	const FORBIDDEN = Object.freeze(["נכשלת", "טעית", "שגית", "פספסת"]);

	function esc(s) {
		return String(s == null ? "" : s).replace(
			/[&<>"']/g,
			(c) =>
				({
					"&": "&amp;",
					"<": "&lt;",
					">": "&gt;",
					'"': "&quot;",
					"'": "&#39;",
				})[c],
		);
	}

	function topicLabel(topicName) {
		const name = String(topicName == null ? "" : topicName).trim() || "הנושא";
		return `היום תרגלנו: ${name} ♫`;
	}

	function renderSessionEnd(opts) {
		const o = opts && typeof opts === "object" ? opts : {};
		const topic = topicLabel(o.topicName);
		const html =
			'<section class="mm-view" data-testid="view-session-end" data-screen="AG11">' +
			'<div class="mm-card" style="align-items:center;text-align:center">' +
			`<h2 data-testid="session-end-title">${esc(TITLE)}</h2>` +
			`<p class="mm-sub" data-testid="session-end-subtitle">${esc(SUBTITLE)}</p>` +
			"</div>" +
			`<div class="mm-card" data-testid="session-end-topic" style="text-align:center">${esc(topic)}</div>` +
			'<div class="mm-row-actions" style="display:flex;gap:12px;justify-content:center">' +
			`<button type="button" class="mm-btn" data-act="session-done" data-testid="session-done" style="min-height:48px;flex:1">${esc(DONE_LABEL)}</button>` +
			`<button type="button" class="mm-btn mm-btn--mint" data-act="session-again" data-testid="session-again" style="min-height:48px;flex:1">${esc(AGAIN_LABEL)}</button>` +
			"</div>" +
			"</section>";
		for (const bad of FORBIDDEN) {
			if (html.includes(bad)) {
				throw new Error("forbidden copy: " + bad);
			}
		}
		if (/\d+\s*%/.test(html) || /countdown|auto-advance/i.test(html)) {
			throw new Error("forbidden score or auto-advance copy");
		}
		return html;
	}

	function isSessionEndAction(act) {
		return act === "session-done" || act === "session-again";
	}

	return {
		TITLE,
		SUBTITLE,
		DONE_LABEL,
		AGAIN_LABEL,
		FORBIDDEN,
		topicLabel,
		renderSessionEnd,
		isSessionEndAction,
	};
});
