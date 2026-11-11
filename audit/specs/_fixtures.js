// Shared fixtures for the MM-701 regression suite.
//
// - Every request to a host other than the target is aborted (deterministic,
//   and nothing is ever sent to Google Forms, mail or chat services).
// - Fake local names only (AUDIT-TEST, kid-1). No sign-in, no accounts, no forms submitted.
'use strict';
const base = require('@playwright/test');

const test = base.test.extend({
  context: async ({ context, baseURL }, use) => {
    const host = new URL(baseURL).host;
    await context.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (/^https?:$/.test(u.protocol) && u.host !== host) return route.abort();
      return route.continue();
    });
    await use(context);
  },
});
const { expect } = base;

const PAGES = ['index.html', 'program.html', 'curriculum.html', 'check.html', 'offer.html', 'landing.html',
  'privacy.html', 'frequency.html', 'functions.html', '807.html', 'demo.html', 'exercise.html'];
// index.html tabs open to everyone (the teacher tab is adult-gated and handled separately).
const TABS = ['remediation', 'lessons', 'practice', 'playground', 'musicGames', 'classMode', 'beatMode'];

// Collects page errors, console errors and same-origin HTTP errors.
// Aborted third-party requests are expected and ignored.
function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/net::ERR_FAILED|ERR_BLOCKED|Failed to load resource/.test(t)) return; // blocked third-party
    errors.push('console: ' + t);
  });
  page.on('response', (r) => {
    try {
      if (r.status() >= 400 && new URL(r.url()).host === new URL(page.url()).host) errors.push(r.status() + ' ' + r.url());
    } catch { /* about:blank */ }
  });
  return errors;
}

// Quick start: start → grade → first instrument → launch. Leaves #rmQuiz on screen.
async function quickStart(page, gradeLabel) {
  await page.click('#qsStartBtn');
  await page.click(`#qsGradePills button:has-text("${gradeLabel}")`);
  await page.click('#qsInstPills button >> nth=0');
  await page.click('#qsLaunchBtn');
  await expect(page.locator('#rmQuiz')).toBeVisible();
}

// Answers n diagnostic items with a fixed (usually wrong) answer.
async function answerItems(page, n, value = '7') {
  for (let i = 0; i < n; i++) {
    await page.fill('#rmAnswer', value);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
  }
}

// Sums layout-shift entries (ignoring ones caused by input), like CLS without session windows.
async function installClsObserver(page) {
  await page.addInitScript(() => {
    window.__auditCls = 0;
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) window.__auditCls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    } catch { /* not supported */ }
  });
}

module.exports = { test, expect, PAGES, TABS, collectErrors, quickStart, answerItems, installClsObserver };
