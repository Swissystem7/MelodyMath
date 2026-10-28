// Pattern / worked-example widget in a real browser via ?topic= (Refs #845 #665).
//
// The node tests render into a fake DOM whose `children` is a plain array, so
// `container.children.length = 0` passed there and threw on a real
// HTMLCollection: the child saw an empty widget. This file renders the widgets
// in Chromium and checks the sounds around them:
//   a. the exercise sound starts within 1 s of the widget opening;
//   b. the opening sound and a jamKit melody never overlap;
//   c. the "עכשיו לבד" round is silent: no jamKit melody, no reward melody.
//
// Like mobile.spec.mjs it skips itself when Playwright is not importable. To run:
//   NODE_PATH=<dir with playwright> node --test test/e2e/patternWidget.spec.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

let pw = null;
try { pw = createRequire(import.meta.url)('playwright'); } catch (e) { /* not installed */ }

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.join(root, rel);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

// Every source start, in page milliseconds (performance.now) when it sounds.
function recordSounds() {
  window.__snd = [];
  const P = AudioScheduledSourceNode.prototype, start = P.start;
  P.start = function (when) {
    const ahead = Math.max(0, (Number(when) || 0) - this.context.currentTime) * 1000;
    window.__snd.push({ at: performance.now() + ahead, calledAt: performance.now() });
    return start.apply(this, arguments);
  };
}

// A 4-second jamKit melody, as a game left running would be.
function longMelody() {
  const notes = [];
  for (let i = 0; i < 20; i++) notes.push({ at: i * 0.2, voice: 'woodBar', hz: 440 });
  window.__melody = MM_JAM.playNotes(notes);
  return performance.now();
}

// Opens ?topic= practice on its widget item (the topic draws its items at random)
// and returns the moment the exercise opened.
function openOn([topic, kind]) {
  startTopicPractice(topic);
  rmPlan = rmPlan.filter((st) => st.items.some((it) => it.kind === kind));
  rmPlan[0].items = rmPlan[0].items.filter((it) => it.kind === kind);
  rpStep = 0;
  const t = performance.now();
  rpRender();
  return t;
}

const BROWSER_ARGS = ['--autoplay-policy=no-user-gesture-required'];

async function openPage(browser, base, topic) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(recordSounds);
  // Topic practice starts by itself on DOMContentLoaded; the test opens it after audio is ready.
  await page.goto(base + 'index.html');
  await page.evaluate(() => getSharedAudioContext().resume());
  return { page, errors };
}

test('pattern widget renders on a real DOM and opens with a sound within 1 s', { skip: pw ? false : 'playwright not installed' }, async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await pw.chromium.launch({ args: BROWSER_ARGS });
  try {
    const { page, errors } = await openPage(browser, base);
    const t0 = await page.evaluate(openOn, ['mm-cur-6', 'pattern_completion']);
    const host = page.locator('#rmPlanWidget');
    await assert.doesNotReject(host.locator('.pattern-choice-btn').first().waitFor({ timeout: 2000 }));
    assert.equal(await host.locator('.pattern-choice-btn').count(), 3, 'three note choices');
    assert.match(await host.locator('.pattern-sequence').textContent(), /דו➔מי➔דו➔\?/);
    await page.waitForTimeout(1100);
    const first = await page.evaluate((t) => window.__snd.filter((s) => s.calledAt >= t).map((s) => s.at - t).sort((x, y) => x - y)[0], t0);
    assert.ok(first != null && first <= 1000, 'opening sound at ' + first + ' ms');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); server.close(); }
});

test('worked example: demo, הבנתי, completion, then a silent עכשיו לבד round', { skip: pw ? false : 'playwright not installed' }, async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await pw.chromium.launch({ args: BROWSER_ARGS });
  try {
    const { page, errors } = await openPage(browser, base);
    const t0 = await page.evaluate(openOn, ['mm-cur-3', 'worked_example']);
    const host = page.locator('#rmPlanWidget');
    await host.locator('.demo-proceed-btn').waitFor({ timeout: 2000 });
    assert.equal((await host.locator('.demo-proceed-btn').textContent()).trim(), 'הבנתי');
    await page.waitForTimeout(1100);
    const first = await page.evaluate((t) => window.__snd.filter((s) => s.calledAt >= t).map((s) => s.at - t).sort((x, y) => x - y)[0], t0);
    assert.ok(first != null && first <= 1000, 'opening sound at ' + first + ' ms');

    await host.locator('.demo-proceed-btn').click();
    await host.locator('.completion-tap-btn').click();
    // A jamKit melody still running when the silent round opens must stop with it.
    await page.evaluate(longMelody);
    await page.waitForFunction(() => document.getElementById('rmPlanWidget')._stage === 'independent');
    const tSilent = await page.evaluate(() => performance.now());
    assert.match(await host.textContent(), /עכשיו לבד/);
    assert.equal(await page.evaluate(() => window.__melody.stopped), true, 'jamKit melody stopped');

    await page.fill('#rmPlanAnswer', String(await page.evaluate(() => rmPlan[rpStep].current.answer)));
    await page.click('#rmPlanCheck');
    await page.waitForTimeout(1500);
    // Notes already queued before the round began (0.2 s look-ahead) are on the stopped melody's bus.
    const late = await page.evaluate((t) => window.__snd.filter((s) => s.calledAt > t + 250).length, tSilent);
    assert.equal(late, 0, 'no sound starts in the עכשיו לבד round, the reward included');
    assert.match(await page.locator('#rmPlanFeedback').textContent(), /יפה מאוד/);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); server.close(); }
});

test('the opening sound and a jamKit melody never overlap', { skip: pw ? false : 'playwright not installed' }, async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await pw.chromium.launch({ args: BROWSER_ARGS });
  try {
    const { page, errors } = await openPage(browser, base);
    await page.evaluate(longMelody);
    await page.waitForTimeout(300);
    const t0 = await page.evaluate(openOn, ['mm-cur-6', 'pattern_completion']);
    await page.locator('#rmPlanWidget .pattern-choice-btn').first().waitFor({ timeout: 2000 });
    await page.waitForTimeout(1100);
    const r = await page.evaluate((t) => ({
      stopped: window.__melody.stopped,
      opening: window.__snd.filter((s) => s.calledAt >= t).length,
    }), t0);
    assert.equal(r.stopped, true, 'the opening sound stops the running jamKit melody first');
    assert.ok(r.opening > 0, 'the exercise still opens with a sound');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); server.close(); }
});
