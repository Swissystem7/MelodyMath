const test = require('node:test');
const assert = require('node:assert/strict');
const onboard = require('../src/lib/onboard');

function memory() {
  const m = Object.create(null);
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
  };
}

test('a new device shows the walkthrough until the teacher dismisses it', () => {
  const ls = memory();
  assert.equal(onboard.shouldShowOnboard(ls), true);
  assert.equal(onboard.loadOnboard(ls).dismissed, false);
  onboard.dismissOnboard(ls);
  assert.equal(onboard.shouldShowOnboard(ls), false);
});

test('there are five Hebrew steps and no mastery promise', () => {
  const steps = onboard.onboardSteps();
  assert.equal(steps.length, 5);
  assert.equal(steps[0].id, 'who');
  assert.equal(steps[2].id, 'try');
  const blob = steps.map((s) => s.titleHe + s.bodyHe).join(' ');
  assert.match(blob, /נגישות/);
  assert.match(blob, /על הפעימה/);
  assert.match(blob, /לא ציון/);
  assert.doesNotMatch(blob, /טיפול|משפר מתמטיקה|סוגר פערים|שליטה מצוינת/);
});

test('step index is clamped and the HTML is escaped', () => {
  const ls = memory();
  assert.equal(onboard.setOnboardStep(99, ls).step, 4);
  assert.equal(onboard.setOnboardStep(-3, ls).step, 0);
  const html = onboard.renderOnboardHtml({ step: 0, dismissed: false });
  assert.match(html, /פעם ראשונה במכשיר הזה/);
  assert.match(html, /id="onboardSkip"/);
  assert.equal(html.includes('<script'), false);
  assert.equal(onboard.escapeHtml('3 < 4'), '3 &lt; 4');
});

test('garbage in storage does not crash the first-run gate', () => {
  const ls = memory();
  ls.setItem(onboard.ONBOARD_KEY, '{');
  assert.equal(onboard.shouldShowOnboard(ls), true);
  ls.setItem(onboard.ONBOARD_KEY, '{"dismissed":1}');
  assert.equal(onboard.shouldShowOnboard(ls), false);
});
