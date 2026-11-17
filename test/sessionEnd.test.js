const test = require("node:test");
const assert = require("node:assert/strict");
const SE = require("../pilot/js/sessionEnd.js");

test("renderSessionEnd: AG11 title and subtitle", () => {
	const html = SE.renderSessionEnd({ topicName: "מקצב" });
	assert.match(html, /data-screen="AG11"/);
	assert.match(html, /עבדת יפה היום\./);
	assert.match(html, /אפשר לסיים, ואפשר עוד סבב\./);
});

test("renderSessionEnd: topic card with music mark", () => {
	const html = SE.renderSessionEnd({ topicName: "תווים" });
	assert.match(html, /היום תרגלנו: תווים ♫/);
});

test("renderSessionEnd: two equal min-height 48px buttons", () => {
	const html = SE.renderSessionEnd({ topicName: "x" });
	assert.match(html, /data-act="session-done"[^>]*style="[^"]*min-height:48px/);
	assert.match(
		html,
		/data-act="session-again"[^>]*style="[^"]*min-height:48px/,
	);
	assert.match(html, /סיימתי להיום/);
	assert.match(html, /עוד סבב/);
});

test("renderSessionEnd: no forbidden failure words", () => {
	const html = SE.renderSessionEnd({ topicName: "נושא" });
	for (const bad of SE.FORBIDDEN) {
		assert.equal(html.includes(bad), false);
	}
});

test("renderSessionEnd: no percent score", () => {
	const html = SE.renderSessionEnd({ topicName: "נושא" });
	assert.equal(/\d+\s*%/.test(html), false);
	assert.equal(html.includes("כוכבים"), false);
});

test("renderSessionEnd: escapes topic HTML", () => {
	const html = SE.renderSessionEnd({
		topicName: "<img src=x onerror=alert(1)>",
	});
	assert.equal(html.includes("<img"), false);
	assert.match(html, /&lt;img/);
});

test("topicLabel: default when empty", () => {
	assert.equal(SE.topicLabel(""), "היום תרגלנו: הנושא ♫");
});

test("isSessionEndAction", () => {
	assert.equal(SE.isSessionEndAction("session-done"), true);
	assert.equal(SE.isSessionEndAction("session-again"), true);
	assert.equal(SE.isSessionEndAction("home"), false);
});
