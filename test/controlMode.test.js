const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const MMPilotStore = require("../pilot/js/store.js");

function storage() {
	const data = {};
	return {
		getItem: (key) => (key in data ? data[key] : null),
		setItem: (key, value) => {
			data[key] = String(value);
		},
		removeItem: (key) => {
			delete data[key];
		},
	};
}

test("control mode defaults off, persists, and reset clears it", () => {
	const saved = storage();
	const store = MMPilotStore.create(saved);
	assert.equal(store.controlMode(), false);
	store.setControlMode(true);
	assert.equal(MMPilotStore.create(saved).controlMode(), true);
	store.resetAll();
	assert.equal(store.controlMode(), false);
});

test("control mode tags only progress saved while enabled", () => {
	const store = MMPilotStore.create();
	const row = { lessonDone: true, index: 1 };
	store.saveProgress("student", "unit", row);
	assert.equal(store.progress("student", "unit").controlMode, undefined);
	store.setControlMode(true);
	store.saveProgress("student", "unit", row);
	assert.equal(store.progress("student", "unit").controlMode, true);
	store.setControlMode(false);
	store.saveProgress("student", "unit", { lessonDone: true, index: 2 });
	assert.equal(store.progress("student", "unit").controlMode, undefined);
});

test("index wiring blocks audio and adds CSV group type", () => {
	const html = fs.readFileSync(require.resolve("../pilot/index.html"), "utf8");
	const script = html
		.match(/<script>\s*\/\/ MM-705[\s\S]*?<\/script>/)[0]
		.replace(/^<script>|<\/script>$/g, "");
	const listeners = {};
	const checkbox = {
		checked: false,
		addEventListener: (name, fn) => {
			listeners[name] = fn;
		},
	};
	const status = { hidden: true };
	const panel = {
		id: "",
		style: {},
		innerHTML: "",
		querySelector: (selector) =>
			selector.includes("control-mode") ? checkbox : status,
	};
	const document = {
		body: { appendChild: () => {} },
		createElement: () => panel,
		getElementById: () => null,
	};
	const store = MMPilotStore.create();
	let muted = false;
	const music = {
		setMuted: (value) => {
			muted = !!value;
		},
		isMuted: () => muted,
	};
	const checks = { toCsv: () => "student,unit\ns,u\n" };
	vm.runInNewContext(script, {
		MMPilotStore: { create: () => store },
		MMPilotMusic: music,
		MMPilotChecks: checks,
		document,
		localStorage: storage(),
	});
	checkbox.checked = true;
	listeners.change();
	music.setMuted(false);
	assert.equal(muted, true);
	assert.match(checks.toCsv([]), /group_type\ns,u,control\n/);
	checkbox.checked = false;
	listeners.change();
	assert.match(checks.toCsv([]), /group_type\ns,u,intervention\n/);
});
