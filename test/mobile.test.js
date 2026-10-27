const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

// Measured 28.9.2026 in Chromium at 390px: offer.html scrolled sideways to 432px
// (the one-pager URLs do not wrap) and curriculum.html to 414px (the coverage
// table is wider than its card). Teachers open these links on a phone.
test('the offer one-pager wraps its long URLs instead of widening the phone page', () => {
  assert.match(read('offer.html'), /\.onepager \.urls[^{]*\{[^}]*overflow-wrap:anywhere/);
});

test('the coverage table scrolls inside its card, not the whole page', () => {
  const css = read('curriculum.html');
  assert.match(css, /\.grade-block\{[^}]*overflow-x:auto/);
});

// Measured again 28.9.2026 at 390px: once the teacher fills name, school and grade,
// the letter preview (<pre>, white-space:pre-wrap) prints the demo and offer URLs,
// which do not break, and offer.html widens to 524px.
test('the principal-letter preview wraps its URLs on a phone', () => {
  assert.match(read('offer.html'), /#letterPreview\{[^}]*overflow-wrap:anywhere/);
});

// 807.html measured 392px at a 390px viewport: the answer input keeps its intrinsic
// min-width inside the flex row, so the row is 355px in a 316px box.
test('the 807 answer input can shrink inside its flex row', () => {
  assert.match(read('807.html'), /input\[type=text\]\{flex:1; min-width:0;/);
});

// The grade-ב regrouping group is 10 pads: 10x32px + 9x4px + 12px padding =
// 368px, wider than the 284px of card content a 360px phone has. Without a
// wrap the pad group pushes the whole page sideways (#103).
test('a pad group wraps inside its card instead of widening the phone page', () => {
  const css = read('index.html');
  assert.match(css, /\.g3-bar\{[^}]*flex-wrap:wrap/);
  assert.match(css, /\.g3-bar\{[^}]*max-width:100%/);
});

// The lessons tab row bled 18px against a 12px page padding: at 375px the row
// was 387px and body.scrollWidth was 381. The row may scroll; the page must not.
test('index.html scrollWidth stays within clientWidth at 375px', { timeout: 20000 }, async (t) => {
  const bin = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/local/bin/google-chrome'].find((p) => fs.existsSync(p));
  if (!bin) return t.skip('chrome is not installed');
  const port = 9400 + (process.pid % 500);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-phone-'));
  const chrome = spawn(bin, ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, 'about:blank'], { stdio: 'ignore' });
  const pending = new Map();
  let n = 0;
  try {
    let ver = '';
    for (let i = 0; i < 40 && !ver; i++) {
      try {
        ver = await new Promise((resolve, reject) => http.get(`http://127.0.0.1:${port}/json/version`, (res) => {
          let d = ''; res.on('data', (c) => { d += c; }); res.on('end', () => resolve(d));
        }).on('error', reject));
      } catch (e) { await new Promise((r) => setTimeout(r, 100)); }
    }
    assert.ok(ver, 'chrome did not open a debugging port');
    const ws = new WebSocket(JSON.parse(ver).webSocketDebuggerUrl);
    ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
    const send = (method, params, sessionId) => new Promise((resolve) => { const id = ++n; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params, sessionId })); });
    await new Promise((r) => ws.addEventListener('open', r));
    const sessionId = (await send('Target.attachToTarget', { targetId: (await send('Target.createTarget', { url: 'about:blank' })).result.targetId, flatten: true })).result.sessionId;
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 667, deviceScaleFactor: 1, mobile: true }, sessionId);
    await send('Page.enable', {}, sessionId);
    await send('Page.navigate', { url: 'file://' + path.join(__dirname, '..', 'index.html') }, sessionId);
    await new Promise((r) => setTimeout(r, 1500));
    const ev = await send('Runtime.evaluate', { expression: 'document.getElementById("tab-lessons").click();JSON.stringify([document.documentElement.scrollWidth,document.documentElement.clientWidth,document.body.scrollWidth,document.body.clientWidth])', returnByValue: true }, sessionId);
    const [dsw, dcw, bsw, bcw] = JSON.parse(ev.result.result.value);
    ws.close();
    assert.ok(dsw <= dcw && bsw <= bcw, `scrollWidth ${dsw}/${bsw} clientWidth ${dcw}/${bcw}`);
  } finally {
    chrome.kill('SIGKILL');
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
