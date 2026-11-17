const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

test("index.html exposes accessibility toggle buttons", () => {
	assert.match(html, /id="btn-toggle-contrast"/);
	assert.match(html, /id="btn-toggle-font"/);
	assert.match(html, /id="btn-toggle-mute"/);
});

test("index.html defines theme-high-contrast and text-large CSS", () => {
	assert.match(html, /\.theme-high-contrast/);
	assert.match(html, /\.text-large/);
});

test("index.html wires contrast/font/mute listeners with sessionStorage", () => {
	assert.match(html, /classList\.toggle\('theme-high-contrast'/);
	assert.match(html, /classList\.toggle\('text-large'/);
	assert.match(html, /sessionStorage\.setItem/);
	assert.match(html, /btn-toggle-contrast/);
	assert.match(html, /__mmAudioMuted/);
});

test("welcomeHero structure remains present and unchanged id", () => {
	assert.match(html, /id="welcomeHero"/);
	assert.match(html, /class="card welcome-hero"/);
});

test("mute toggle script persists mm_a11y_mute in sessionStorage", () => {
	assert.match(html, /mm_a11y_mute/);
	assert.match(html, /btn-toggle-mute/);
	assert.match(html, /__mmAudioMuted/);
});
