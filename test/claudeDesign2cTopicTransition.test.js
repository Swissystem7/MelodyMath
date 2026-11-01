const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/components/TopicTransitionScreen.js');

test('Screen 2c Topic Transition renders faithful Claude Design bridge screen', () => {
  const st = S.createState();
  const html = S.renderHtml(st);

  // Chassis
  assert.match(html, /width:390px/);
  assert.match(html, /background:#FFC93C/);
  assert.match(html, /border:10px solid #15102E/);
  assert.match(html, /border-radius:52px/);

  // Status bar
  assert.match(html, /9:41/);

  // Header and comparison cards
  assert.match(html, /מעבר נושא/);
  assert.match(html, /סיימתם/);
  assert.match(html, /שטח/);
  assert.match(html, /הבא בתור/);
  assert.match(html, /נפח/);
  assert.match(html, /בונים בשכבות/);

  // Heading & Play button
  assert.match(html, /כל הכבוד!<br>עכשיו — נפח/);
  assert.match(html, /data-act="play"/);
  assert.match(html, /▶/);

  // Status text & continue
  assert.match(html, /הקשיבו למנגינת המעבר/);
  assert.match(html, /המנגינה תמיד נעצרת לפני שהתרגיל מתחיל/);
  assert.match(html, /data-act="continue"/);
  assert.match(html, /המשך ←/);
});

test('Screen 2c melody playing state and next exercise view', () => {
  let st = S.createState();

  // Playing note 0
  st = S.setStep(st, 0);
  assert.equal(st.bp, 0);
  assert.equal(st.bDone, false);

  let playHtml = S.renderHtml(st);
  assert.match(playHtml, /■/);
  assert.match(playHtml, /המנגינה מתנגנת… התרגיל יתחיל אחריה/);

  // Melody finishes
  st = S.setStep(st, 7);
  assert.equal(st.bp, -1);
  assert.equal(st.bDone, true);

  let doneHtml = S.renderHtml(st);
  assert.match(doneHtml, /המנגינה הסתיימה — מוכנים\?/);

  // Transition to next exercise
  st = S.transitionToNext(st);
  assert.equal(st.bView, 'next');

  let nextHtml = S.renderHtml(st);
  assert.match(nextHtml, /תרגיל 1 · נפח/);
  assert.match(nextHtml, /בנו מגדל של 2 שורות, 2 עמודות ו־3 שכבות/);
  assert.match(nextHtml, /מנגינת המעבר נעצרה. התרגיל מתחיל בשקט./);
  assert.match(nextHtml, /data-act="back"/);

  // Return to bridge
  st = S.backToBridge(st);
  assert.equal(st.bView, 'bridge');
  assert.equal(st.bp, -1);
});
