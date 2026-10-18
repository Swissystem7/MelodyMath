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

test('when localStorage is unavailable, shouldShowOnboard must return false', () => {
  // Create a storage that throws when accessed, simulating private browsing mode
  const brokenStorage = {
    getItem: () => { throw new Error('localStorage not available'); },
    setItem: () => { throw new Error('localStorage not available'); },
    removeItem: () => { throw new Error('localStorage not available'); },
  };
  
  // The function should return false even though normalizeState({}) returns { dismissed: false, step: 0 }
  assert.equal(onboard.shouldShowOnboard(brokenStorage), false);
});

test('escapeHtml should escape the Euro sign Unicode character to its HTML entity', () => {
  assert.equal(onboard.escapeHtml('Price: €100'), 'Price: &euro;100');
});

test('demo video walkthrough has 4 Hebrew scenes, צפו בסרטון link, and demo.html page (#355)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const scenes = onboard.demoVideoScenes();
  assert.equal(scenes.length, 4);
  assert.deepEqual(scenes.map((s) => s.id), ['intro', 'diagnostic', 'adaptive', 'teacher']);
  const onboardHtml = onboard.renderOnboardHtml({ step: 0, dismissed: false });
  assert.match(onboardHtml, /href="demo\.html"[^>]*>צפו בסרטון<\/a>/);
  const playerHtml = onboard.renderDemoVideoHtml(1);
  assert.match(playerHtml, /id="demoVideoPlayer"/);
  assert.match(playerHtml, /אבחון קצר לפי שכבה/);
  assert.doesNotMatch(playerHtml, /טיפול|משפר מתמטיקה|סוגר פערים/);

  const appended = [];
  const fakeDoc = {
    querySelector: (sel) => (sel === 'a[href="demo.html"]' ? null : { appendChild: (el) => appended.push(el) }),
    createElement: (tag) => ({ tagName: tag, href: '', className: '', textContent: '' }),
  };
  assert.equal(onboard.injectDemoVideoHeaderLink(fakeDoc), true);
  assert.equal(appended.length, 1);
  assert.equal(appended[0].href, 'demo.html');
  assert.equal(appended[0].textContent, 'צפו בסרטון');

  const demoPage = fs.readFileSync(path.join(__dirname, '..', 'demo.html'), 'utf8');
  assert.match(demoPage, /lang="he"/);
  assert.match(demoPage, /dir="rtl"/);
  assert.match(demoPage, /צפו בסרטון ההדגמה/);
  assert.doesNotMatch(demoPage, /סוגרים פערים במתמטיקה|ADHD|דיסקלקול/i);
});

