// MM-600 pilot — shared E2E helpers. Not a spec file (testMatch is *.spec.js).
'use strict';
const { expect } = require('@playwright/test');
const SEED = require('../seed/demo-accounts.js');

const PAGE = '/pilot/index.html';

function account(role) {
  const a = SEED.accounts.find((x) => x.role === role);
  if (!a) throw new Error('no ' + role + ' in the seed file');
  return a;
}

// No outside network: anything not on the local test server is aborted and recorded.
async function isolate(page, baseURL) {
  const local = new URL(baseURL).host;
  const blocked = [];
  await page.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.host === local && (u.protocol === 'http:' || u.protocol === 'https:')) return route.continue();
    if (u.protocol === 'data:' || u.protocol === 'blob:') return route.continue();
    blocked.push(u.href);
    return route.abort();
  });
  return blocked;
}

// Web Audio is stubbed: tests assert the feedback UI/state and that the shared
// engine scheduled notes, never that a speaker made a sound.
async function stubAudio(page) {
  await page.addInitScript(() => {
    const log = { contexts: 0, oscillators: 0, started: 0, freqs: [] };
    window.__mmAudio = log;
    const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} });
    const node = (extra) => Object.assign({ connect(n) { return n || this; }, disconnect() {} }, extra);
    class FakeAudioContext {
      constructor() { log.contexts++; this.state = 'running'; this.sampleRate = 44100; this.currentTime = 0; this.destination = node(); }
      resume() { this.state = 'running'; return Promise.resolve(); }
      close() { this.state = 'closed'; return Promise.resolve(); }
      createOscillator() {
        log.oscillators++;
        const freq = param();
        const orig = freq.setValueAtTime;
        freq.setValueAtTime = (v) => { log.freqs.push(Math.round(v)); return orig; };
        return node({ type: 'sine', frequency: freq, detune: param(), start() { log.started++; }, stop() {} });
      }
      createGain() { return node({ gain: param() }); }
      createBiquadFilter() { return node({ type: 'lowpass', frequency: param(), Q: param(), gain: param() }); }
      createBuffer(ch, len) { const d = new Float32Array(Math.max(1, len)); return { length: len, getChannelData: () => d }; }
      createBufferSource() { return node({ buffer: null, playbackRate: param(), start() {}, stop() {} }); }
    }
    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
  });
}

async function openDemo(page, baseURL) {
  const blocked = await isolate(page, baseURL);
  await stubAudio(page);
  await page.goto(PAGE);
  await expect(page.locator('html')).toHaveAttribute('data-ready', '1');
  return blocked;
}

async function signIn(page, role) {
  const a = account(role);
  await page.getByTestId('login-username').fill(a.username);
  await page.getByTestId('login-password').fill(a.password);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId(role === 'teacher' ? 'view-teacher' : 'view-student-home')).toBeVisible();
}

async function signOut(page) {
  await page.getByTestId('signout').click();
  await expect(page.getByTestId('view-login')).toBeVisible();
}

async function type(page, digits) {
  for (const d of String(digits)) await page.getByTestId('key-' + d).click();
  await expect(page.getByTestId('answer')).toHaveText(String(digits));
}

// Answer the current exercise; returns the feedback locator.
async function answer(page, digits) {
  await type(page, digits);
  await page.getByTestId('check').click();
  return page.getByTestId('feedback');
}

// MM-601: the fraction rhythm exercise is answered by picking a rhythm, not typing.
async function answerRhythm(page, choice) {
  await page.getByTestId('choice-' + choice).click();
  await expect(page.getByTestId('choice-' + choice)).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('check').click();
  return page.getByTestId('feedback');
}

// Test hook of pilot/js/music.js: every planned play, with its notes.
async function musicPlays(page) {
  return page.evaluate(() => (window.__mmPilotMusic ? window.__mmPilotMusic.plays : []));
}

async function lastPlay(page, id) {
  const plays = await musicPlays(page);
  const hit = plays.filter((p) => !id || p.id === id).pop();
  expect(hit, 'a play ' + (id || '') + ' was scheduled').toBeTruthy();
  return hit;
}

async function expectQuestion(page, qid) {
  await expect(page.getByTestId('view-exercise')).toHaveAttribute('data-qid', qid);
}

// 360px and desktop: no horizontal page scroll, every visible control at least 44×44.
async function expectMobileFriendly(page) {
  const r = await page.evaluate(() => {
    const doc = document.documentElement;
    const small = [];
    document.querySelectorAll('button, input, select, textarea, a[href]').forEach((el) => {
      const b = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      if (b.width === 0 || b.height === 0 || st.visibility === 'hidden' || b.bottom < 0 || b.right < 0) return; // hidden / off-screen skip link
      if (b.width < 44 || b.height < 44) small.push((el.getAttribute('data-testid') || el.tagName) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height));
    });
    return { scroll: doc.scrollWidth, client: doc.clientWidth, small };
  });
  expect(r.scroll, 'no horizontal scroll').toBeLessThanOrEqual(r.client);
  expect(r.small, 'touch targets under 44px').toEqual([]);
}

module.exports = { PAGE, account, isolate, stubAudio, openDemo, signIn, signOut, type, answer, answerRhythm, musicPlays, lastPlay, expectQuestion, expectMobileFriendly };
