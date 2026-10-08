// A tablet that opened MelodyMath once keeps serving every page and script
// from the service-worker cache. Until this change the fetch handler was
// cache-first with no revalidation, so a fix merged to the site reached a
// returning tablet only when someone also bumped CACHE in sw.js. Seven fixes
// (#65-#71) changed cached files after v7 was set and none of them bumped it,
// so every tablet that had visited before kept running the old teacherStore.
// The handler now answers from the cache and refreshes the stored copy in the
// background, so the next visit runs the current files. Offline behaviour is
// unchanged: cached files are served, an uncached navigation falls back to
// index.html.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ORIGIN = 'https://tablet.test';
const swSource = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

function response(body, extra) {
  const res = Object.assign({ status: 200, type: 'basic', body: body }, extra || {});
  res.clone = function () { return response(body, extra); };
  return res;
}

function urlOf(key) {
  if (typeof key !== 'string') return key.url;
  return ORIGIN + '/' + key.replace(/^\.\//, '');
}

function request(rel, extra) {
  return Object.assign({ url: urlOf(rel), method: 'GET', mode: 'no-cors' }, extra || {});
}

function loadSw(opts) {
  const o = opts || {};
  const handlers = {};
  const store = new Map();
  Object.keys(o.cached || {}).forEach(function (rel) {
    store.set(urlOf(rel), response(o.cached[rel]));
  });
  const puts = [];
  const deleted = [];
  const fetchCalls = [];
  const cache = {
    addAll: async function (list) {
      list.forEach(function (rel) { store.set(urlOf(rel), response('precached ' + rel)); });
    },
    put: async function (req, res) {
      puts.push(urlOf(req));
      store.set(urlOf(req), res);
    },
  };
  const sandbox = {
    self: {
      addEventListener: function (name, fn) { handlers[name] = fn; },
      location: { origin: ORIGIN },
      skipWaiting: async function () { sandbox.skipped = true; },
      clients: { claim: async function () { sandbox.claimed = true; } },
    },
    caches: {
      open: async function () { return cache; },
      match: async function (req) { return store.get(urlOf(req)); },
      keys: async function () { return o.cacheNames || []; },
      delete: async function (name) { deleted.push(name); return true; },
    },
    fetch: function (req) {
      fetchCalls.push(req.url);
      return o.network ? o.network(req) : Promise.reject(new TypeError('offline'));
    },
    URL: URL,
    console: console,
  };
  vm.runInNewContext(swSource, sandbox, { filename: 'sw.js' });
  return { handlers: handlers, store: store, puts: puts, deleted: deleted, fetchCalls: fetchCalls, sandbox: sandbox };
}

async function dispatchFetch(sw, req) {
  const ev = {
    request: req,
    waited: [],
    responded: false,
    response: undefined,
    respondWith: function (p) { this.responded = true; this.response = p; },
    waitUntil: function (p) { this.waited.push(p); },
  };
  sw.handlers.fetch(ev);
  const res = ev.responded ? await ev.response : undefined;
  await Promise.all(ev.waited);
  return { ev: ev, res: res };
}

async function dispatchLifecycle(sw, name) {
  const waited = [];
  sw.handlers[name]({ waitUntil: function (p) { waited.push(p); } });
  await Promise.all(waited);
}

test('a cached script is served at once and the network copy replaces it for the next visit', async () => {
  const sw = loadSw({
    cached: { './index.html': 'old index', './src/lib/teacherStore.js': 'old store' },
    network: async () => response('new store'),
  });
  const out = await dispatchFetch(sw, request('./src/lib/teacherStore.js'));
  assert.equal(out.res.body, 'old store', 'the visit itself still runs the cached copy');
  assert.deepEqual(sw.fetchCalls, [urlOf('./src/lib/teacherStore.js')], 'the network is asked in the background');
  assert.ok(out.ev.waited.length >= 1, 'the refresh is registered with waitUntil so the worker stays alive');
  assert.equal(sw.store.get(urlOf('./src/lib/teacherStore.js')).body, 'new store', 'the next visit gets the new file');
});

test('a file that is not cached yet comes from the network and is stored', async () => {
  const sw = loadSw({ cached: {}, network: async () => response('fresh') });
  const out = await dispatchFetch(sw, request('./src/lib/measure.js'));
  assert.equal(out.res.body, 'fresh');
  assert.deepEqual(sw.puts, [urlOf('./src/lib/measure.js')]);
});

test('offline: a cached file is still served and nothing is overwritten', async () => {
  const sw = loadSw({ cached: { './src/lib/banks.js': 'cached banks' } });
  const out = await dispatchFetch(sw, request('./src/lib/banks.js'));
  assert.equal(out.res.body, 'cached banks');
  assert.equal(sw.puts.length, 0);
  assert.equal(sw.store.get(urlOf('./src/lib/banks.js')).body, 'cached banks');
});

test('offline: a navigation to an uncached page falls back to the cached index', async () => {
  const sw = loadSw({ cached: { './index.html': 'cached index' } });
  const out = await dispatchFetch(sw, request('./curriculum.html', { mode: 'navigate' }));
  assert.equal(out.res.body, 'cached index');
});

test('a non-200 network answer is passed through and not cached', async () => {
  const sw = loadSw({ cached: {}, network: async () => response('missing', { status: 404 }) });
  const out = await dispatchFetch(sw, request('./nope.js'));
  assert.equal(out.res.status, 404);
  assert.equal(sw.puts.length, 0);
});

test('a stale cache hit is not replaced by a failed or opaque network answer', async () => {
  const sw = loadSw({
    cached: { './src/lib/core.js': 'cached core' },
    network: async () => response('', { status: 503 }),
  });
  const out = await dispatchFetch(sw, request('./src/lib/core.js'));
  assert.equal(out.res.body, 'cached core');
  assert.equal(sw.puts.length, 0);
  assert.equal(sw.store.get(urlOf('./src/lib/core.js')).body, 'cached core');
});

test('POST and cross-origin requests are left to the browser', async () => {
  const sw = loadSw({ cached: {}, network: async () => response('x') });
  const post = await dispatchFetch(sw, request('./index.html', { method: 'POST' }));
  assert.equal(post.ev.responded, false);
  const other = await dispatchFetch(sw, { url: 'https://fonts.example/a.css', method: 'GET', mode: 'no-cors' });
  assert.equal(other.ev.responded, false);
  assert.equal(sw.fetchCalls.length, 0);
});

test('install precaches the asset list and activate drops the previous cache', async () => {
  // Read the live name so bumping CACHE in sw.js does not break this test.
  const current = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'sw.js'), 'utf8')
    .match(/const CACHE = '([^']+)'/)[1];
  const sw = loadSw({ cacheNames: ['melodymath-offline-v7', current, 'melodymath-offline-v6'] });
  await dispatchLifecycle(sw, 'install');
  assert.ok(sw.store.has(urlOf('./index.html')));
  assert.ok(sw.store.has(urlOf('./src/lib/teacherStore.js')));
  assert.equal(sw.sandbox.skipped, true);
  await dispatchLifecycle(sw, 'activate');
  assert.deepEqual(sw.deleted.sort(), ['melodymath-offline-v6', 'melodymath-offline-v7']);
  assert.equal(sw.sandbox.claimed, true);
});
