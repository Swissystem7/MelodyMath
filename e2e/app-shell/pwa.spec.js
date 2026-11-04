// MM-720 — PWA polish (audit m2): the installed app matches the page theme.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (/^https?:$/.test(u.protocol) && u.hostname !== '127.0.0.1') return route.abort();
    return route.continue();
  });
});

test('manifest: maskable icons that load, theme matching the page', async ({ page, request }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  const href = await page.getAttribute('link[rel=manifest]', 'href');
  const m = await (await request.get(new URL(href, page.url()).href)).json();
  expect(m.id).toBeTruthy();
  const mask = m.icons.filter((i) => /maskable/.test(i.purpose || ''));
  expect(mask.length).toBe(2);
  for (const i of mask) expect((await request.get(new URL(i.src, page.url()).href)).status()).toBe(200);
  const metas = await page.$$eval('meta[name=theme-color]', (els) => els.map((e) => e.content.toLowerCase()));
  expect(metas).toEqual([m.theme_color.toLowerCase()]);
});

test('the service worker takes control and the page reloads offline', async ({ page, context }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload({ waitUntil: 'networkidle' });
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('#qsStartBtn')).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
