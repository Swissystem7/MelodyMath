// MM-601 pilot — screenshots and the 30-second demo recording for the PR.
//
//   cd pilot && npm ci && npx playwright install chromium
//   node tools/capture.js            -> docs/MM-601/screenshots/*.png and docs/MM-601/demo-30s.webm
//   node tools/capture.js shots      -> screenshots only
//   node tools/capture.js video      -> the recording only
//
// Uses the local demo server (serve.js on 127.0.0.1) and the demo accounts from
// seed/demo-accounts.js; every request to another host is aborted. Playwright's
// video has no audio track, so the recording shows the notes lighting up and
// the captions, not the sound.
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { chromium } = require('@playwright/test');
const SEED = require('../seed/demo-accounts.js');

const PORT = Number(process.env.PILOT_PORT) || 8171;
const BASE = 'http://127.0.0.1:' + PORT;
const OUT = path.resolve(__dirname, '..', '..', 'docs', 'MM-601');
const SHOTS = path.join(OUT, 'screenshots');
const what = process.argv[2] || 'all';

const acc = (role) => SEED.accounts.find((a) => a.role === role);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(BASE + '/pilot/index.html'); if (r.ok) return; } catch (e) { /* not yet */ }
    await sleep(200);
  }
  throw new Error('demo server did not start');
}

async function isolate(page) {
  await page.route('**/*', (route) => {
    const u = new URL(route.request().url());
    return u.host === '127.0.0.1:' + PORT ? route.continue() : route.abort();
  });
}

async function signIn(page, role) {
  await page.getByTestId('login-username').fill(acc(role).username);
  await page.getByTestId('login-password').fill(acc(role).password);
  await page.getByTestId('login-submit').click();
}

async function typeAnswer(page, digits, pause) {
  for (const d of String(digits)) { await page.getByTestId('key-' + d).click(); await sleep(pause || 0); }
  await page.getByTestId('check').click();
}

async function shots(browser) {
  fs.mkdirSync(SHOTS, { recursive: true });
  for (const [name, viewport] of [['desktop', { width: 1280, height: 800 }], ['360', { width: 360, height: 740 }]]) {
    const ctx = await browser.newContext({ viewport, locale: 'he-IL', serviceWorkers: 'block', deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await isolate(page);
    const shot = async (file, full) => page.screenshot({ path: path.join(SHOTS, file + '-' + name + '.png'), fullPage: !!full });
    await page.goto(BASE + '/pilot/index.html');
    await signIn(page, 'teacher');
    await page.getByTestId('assign-note').fill('לתרגל לפני יום ראשון');
    await page.getByTestId('assign-submit').click();
    await page.getByTestId('signout').click();
    await signIn(page, 'student');
    await page.getByTestId('open-unit').click();
    await page.getByTestId('lesson-continue').click();
    await sleep(900); // the melody plays and the notes light up
    await shot('01-student-music-caption');
    await typeAnswer(page, 7);
    await sleep(700);
    await shot('02-student-music-resolved');
    await page.getByTestId('next').click();
    for (const v of [13, 5, 9, 16, 10]) { await typeAnswer(page, v); await page.getByTestId('next').click(); }
    await sleep(300);
    await shot('03-fraction-rhythm');
    await page.getByTestId('choice-quarter').click();
    await page.getByTestId('check').click();
    await sleep(600);
    await shot('04-fraction-rhythm-hint');
    await page.getByTestId('choice-half').click();
    await page.getByTestId('check').click();
    await page.getByTestId('next').click();
    await page.getByTestId('signout').click();
    await signIn(page, 'teacher');
    await page.getByTestId('coverage').scrollIntoViewIfNeeded();
    await page.getByTestId('coverage').screenshot({ path: path.join(SHOTS, '05-teacher-coverage-' + name + '.png') });
    await page.getByTestId('report').screenshot({ path: path.join(SHOTS, '06-teacher-report-' + name + '.png') });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByTestId('why-open').click();
    await page.getByTestId('why').screenshot({ path: path.join(SHOTS, '07-why-it-works-' + name + '.png') });
    await ctx.close();
  }
}

async function video(browser) {
  fs.mkdirSync(OUT, { recursive: true });
  const tmp = path.join(OUT, '.video-tmp');
  const size = { width: 1280, height: 720 };
  const ctx = await browser.newContext({ viewport: size, locale: 'he-IL', serviceWorkers: 'block', recordVideo: { dir: tmp, size: { width: 1024, height: 576 } } }); // scaled down to keep the file small
  const page = await ctx.newPage();
  await isolate(page);
  const t0 = Date.now();
  await page.goto(BASE + '/pilot/index.html');
  await signIn(page, 'student');
  await sleep(700);
  await page.getByTestId('open-unit').click();
  await sleep(900);
  await page.getByTestId('lesson-play').click();
  await sleep(1600);
  await page.getByTestId('lesson-continue').click();
  await sleep(2000); // q1: 4 piano notes + 3 xylophone notes light up
  await typeAnswer(page, 7, 150);
  await sleep(2200); // the joined melody comes home
  await page.getByTestId('next').click();
  await sleep(500);
  await typeAnswer(page, 13, 100);
  await sleep(600);
  await page.getByTestId('next').click();
  await sleep(1800); // q3: 9 notes, 4 taken away
  await typeAnswer(page, 5, 150);
  await sleep(1400);
  await page.getByTestId('next').click();
  await sleep(400);
  await typeAnswer(page, 9, 100);
  await sleep(400);
  await page.getByTestId('next').click();
  await sleep(1400); // q5: ones on the xylophone, a ten on the organ
  await typeAnswer(page, 16, 100);
  await sleep(1000);
  await page.getByTestId('next').click();
  await sleep(400);
  await typeAnswer(page, 10, 100);
  await sleep(400);
  await page.getByTestId('next').click();
  await sleep(1500); // q7: the bar with 4 beats
  await page.getByTestId('choice-quarter').click();
  await sleep(400);
  await page.getByTestId('check').click();
  await sleep(2000); // a quarter leaves a silence before the bar line
  await page.getByTestId('choice-half').click();
  await sleep(300);
  await page.getByTestId('check').click();
  await sleep(2200);
  await page.getByTestId('next').click();
  await sleep(700);
  await page.getByTestId('signout').click();
  await signIn(page, 'teacher');
  await sleep(600);
  await page.getByTestId('why-open').click();
  await sleep(1800);
  await page.getByTestId('coverage').scrollIntoViewIfNeeded();
  await sleep(1400);
  await page.getByTestId('report').scrollIntoViewIfNeeded();
  await sleep(1400);
  const secs = (Date.now() - t0) / 1000;
  const v = page.video();
  await ctx.close();
  const src = await v.path();
  const dest = path.join(OUT, 'demo-30s.webm');
  fs.copyFileSync(src, dest);
  fs.rmSync(tmp, { recursive: true, force: true });
  const mb = fs.statSync(dest).size / 1e6;
  console.log('video: ' + dest + ' (' + secs.toFixed(1) + ' s, ' + mb.toFixed(2) + ' MB)');
}

(async () => {
  const server = spawn(process.execPath, [path.join(__dirname, '..', 'serve.js')], { env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: 'ignore' });
  try {
    await waitForServer();
    const browser = await chromium.launch();
    if (what === 'all' || what === 'shots') await shots(browser);
    if (what === 'all' || what === 'video') await video(browser);
    await browser.close();
  } finally {
    server.kill();
  }
})().catch((e) => { console.error(e); process.exit(1); });
