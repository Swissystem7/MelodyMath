// MM-610 — screenshots for the PR: the teacher's coverage map and two
// why-feedbacks (after a right and after a wrong answer), desktop and 360px.
//   cd pilot && node tools/capture-mm610.js   -> docs/MM-610/screenshots/*.png
// Local demo server only (serve.js on 127.0.0.1); every other host is aborted.
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { chromium } = require('@playwright/test');
const SEED = require('../seed/demo-accounts.js');
const K = require('../js/checks.js');

const PORT = Number(process.env.PILOT_PORT) || 8172;
const BASE = 'http://127.0.0.1:' + PORT;
const SHOTS = path.resolve(__dirname, '..', '..', 'docs', 'MM-610', 'screenshots');
const acc = (role) => SEED.accounts.find((a) => a.role === role);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(BASE + '/pilot/index.html'); if (r.ok) return; } catch (e) { /* not yet */ }
    await sleep(200);
  }
  throw new Error('demo server did not start');
}

async function signIn(page, role) {
  await page.getByTestId('login-username').fill(acc(role).username);
  await page.getByTestId('login-password').fill(acc(role).password);
  await page.getByTestId('login-submit').click();
}

async function check(page, unitId, phase) {
  for (const it of K.checkFor(unitId, phase)) await page.getByTestId('check-input-' + it.id).fill(String(it.answer));
  await page.getByTestId('check-submit').click();
}

async function typeAnswer(page, digits) {
  for (const d of String(digits)) await page.getByTestId('key-' + d).click();
  await page.getByTestId('check').click();
}

async function run(browser) {
  fs.mkdirSync(SHOTS, { recursive: true });
  for (const [name, viewport] of [['desktop', { width: 1280, height: 800 }], ['360', { width: 360, height: 740 }]]) {
    const ctx = await browser.newContext({ viewport, locale: 'he-IL', serviceWorkers: 'block', deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.route('**/*', (route) => (new URL(route.request().url()).host === '127.0.0.1:' + PORT ? route.continue() : route.abort()));
    await page.goto(BASE + '/pilot/index.html');

    // Teacher: the coverage map (the top of it: summary and grade א׳).
    await signIn(page, 'teacher');
    const map = page.getByTestId('coverage-map');
    await map.evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: path.join(SHOTS, '01-teacher-coverage-map-' + name + '.png') });
    await page.getByTestId('signout').click();

    // Student: times-1, exercise 1 right → why (right).
    await signIn(page, 'student');
    await page.getByTestId('open-unit-times-1').click();
    await check(page, 'times-1', 'pre');
    await page.getByTestId('lesson-continue').click();
    await typeAnswer(page, 12);
    await sleep(500);
    await page.getByTestId('why-feedback').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SHOTS, '02-why-right-' + name + '.png') });

    // Student: place-1, exercise 2 (38 + 25) wrong → why (wrong), no answer in it.
    await page.getByTestId('signout').click();
    await signIn(page, 'student');
    await page.getByTestId('open-unit-place-1').click();
    await check(page, 'place-1', 'pre');
    await page.getByTestId('lesson-continue').click();
    await typeAnswer(page, 342);
    await page.getByTestId('next').click();
    await typeAnswer(page, 53);
    await sleep(500);
    await page.getByTestId('why-feedback').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SHOTS, '03-why-wrong-' + name + '.png') });
    await ctx.close();
  }
}

(async () => {
  const server = spawn(process.execPath, [path.join(__dirname, '..', 'serve.js')], { env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: 'ignore' });
  try {
    await waitForServer();
    const browser = await chromium.launch();
    try { await run(browser); } finally { await browser.close(); }
    console.log('screenshots in ' + SHOTS);
  } finally { server.kill(); }
})().catch((e) => { console.error(e); process.exit(1); });
