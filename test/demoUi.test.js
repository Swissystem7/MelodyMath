const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const onboard = require('../src/lib/onboard');

const root = path.join(__dirname, '..');
const demoHtml = fs.readFileSync(path.join(root, 'demo.html'), 'utf8');

test('demo.html has valid document semantics, RTL Hebrew, and skip link to focusable main', () => {
  assert.match(demoHtml, /<html\s+lang="he"\s+dir="rtl">/);
  assert.match(demoHtml, /<a\s+class="mm-skip"\s+href="#main">דילוג לתוכן הראשי<\/a>/);
  assert.match(demoHtml, /<main[^>]*id="main"[^>]*tabindex="-1"/);
});

test('demo video card defines accessible canvas, overlay live-region, and announcer', () => {
  const rendered = onboard.renderDemoVideoHtml(0);
  assert.match(rendered, /<section[^>]*id="demoVideoPlayer"[^>]*dir="rtl"[^>]*aria-label="סרטון הדגמה מודרך"/);
  assert.match(rendered, /<canvas[^>]*id="demoVideoCanvas"[^>]*role="img"[^>]*aria-label="לוח אנימציה של סרטון ההדגמה"/);
  assert.match(rendered, /class="demo-video-overlay"[^>]*aria-live="polite"/);
  assert.match(rendered, /id="demoLiveAnnouncer"[^>]*role="status"[^>]*aria-live="polite"/);
});

test('demo video controls define a role="toolbar", aria-label, and play/pause toggle with aria-pressed', () => {
  const rendered = onboard.renderDemoVideoHtml(0);
  assert.match(rendered, /class="demo-video-controls"[^>]*role="toolbar"[^>]*aria-label="בקרת הפעלת הסרטון"/);
  assert.match(rendered, /id="demoPlayBtn"[^>]*aria-pressed="false"[^>]*aria-label="הפעלת סרטון ההדגמה/);
  assert.match(rendered, /id="demoPrevSceneBtn"[^>]*aria-label="מעבר לפרק הקודם">הפרק הקודם<\/button>/);
  assert.match(rendered, /id="demoNextSceneBtn"[^>]*aria-label="מעבר לפרק הבא">הפרק הבא<\/button>/);
});

test('demo scene list defines role="group", aria-label, and accessible scene buttons with aria-pressed', () => {
  const rendered = onboard.renderDemoVideoHtml(1);
  assert.match(rendered, /class="demo-scene-list"[^>]*role="group"[^>]*aria-label="פרקי סרטון ההדגמה"/);
  const scenes = onboard.demoVideoScenes();
  assert.equal(scenes.length, 4);
  scenes.forEach((s, idx) => {
    const isCurrent = idx === 1;
    const expectedPressed = isCurrent ? 'true' : 'false';
    assert.match(rendered, new RegExp('data-scene="' + idx + '"[^>]*aria-pressed="' + expectedPressed + '"'));
  });
});

test('demo.html controls and footer links meet touch target and focus visible criteria', () => {
  assert.match(demoHtml, /\.top-links a, \.secondary, \.primary, \.demo-scene-btn \{ min-height: 44px;/);
  assert.match(demoHtml, /footer a \{ min-height: 44px; min-width: 44px; display: inline-flex; align-items: center;/);
  assert.match(demoHtml, /footer a:focus-visible \{ outline: 3px solid var\(--accent\); outline-offset: 2px; \}/);
  assert.match(demoHtml, /:focus-visible \{ outline: 3px solid var\(--accent\); outline-offset: 2px; \}/);
});

test('demo.html footer provides reciprocal navigation across MelodyMath pages', () => {
  assert.match(demoHtml, /<footer>[\s\S]*href="index\.html"[\s\S]*חזרה לתרגול[\s\S]*<\/footer>/);
  assert.match(demoHtml, /<footer>[\s\S]*href="curriculum\.html"[\s\S]*כיסוי תוכנית[\s\S]*<\/footer>/);
  assert.match(demoHtml, /<footer>[\s\S]*href="check\.html"[\s\S]*בדיקת יחידה[\s\S]*<\/footer>/);
  assert.match(demoHtml, /<footer>[\s\S]*href="offer\.html"[\s\S]*בקשת ניסוי כיתתי[\s\S]*<\/footer>/);
  assert.match(demoHtml, /<footer>[\s\S]*href="landing\.html"[\s\S]*אודות[\s\S]*<\/footer>/);
});

test('demo.html and onboard demo video adhere to honesty guidelines without therapy claims', () => {
  assert.doesNotMatch(demoHtml, /סוגרים פערים במתמטיקה|טיפול|קליני|ADHD|דיסקלקול/i);
  const rendered = onboard.renderDemoVideoHtml(0);
  assert.match(rendered, /ללא הבטחת הישגים, ללא רישום וללא שמירת נתונים בענן/);
  assert.doesNotMatch(rendered, /טיפול|קליני|ADHD|דיסקלקול/i);
});

test('demo.html binds previous scene button, updates play button aria-pressed state, and wires RTL arrow keys', () => {
  assert.match(demoHtml, /function updatePlayButtonState\(isPlaying\)/);
  assert.match(demoHtml, /btn\.setAttribute\('aria-pressed',\s*isPlaying \? 'true' : 'false'\);/);
  assert.match(demoHtml, /var prevBtn = document\.getElementById\('demoPrevSceneBtn'\);/);
  assert.match(demoHtml, /prevBtn\.onclick = function \(\) \{/);
  assert.match(demoHtml, /e\.key === 'ArrowLeft' \|\| e\.key === 'ArrowDown'/);
  assert.match(demoHtml, /e\.key === 'ArrowRight' \|\| e\.key === 'ArrowUp'/);
});
