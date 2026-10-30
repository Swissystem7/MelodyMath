'use strict';
// Refs #609: beforeSend strips the Sentry user and request body, and redacts
// child names in messages, exception text, and breadcrumb data.
const test = require('node:test');
const assert = require('node:assert/strict');
const sentry = require('../src/lib/sentryLoader');

function fakeDoc(dsn) {
  const scripts = [];
  const meta = { getAttribute: () => dsn };
  return {
    scripts: scripts,
    querySelector: (sel) => (sel === 'meta[name="sentry-dsn"]' ? meta : null),
    createElement: () => { const el = { src: '' }; scripts.push(el); return el; },
    head: { appendChild() {} },
  };
}

function memoryStorage(map) {
  const keys = Object.keys(map);
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null),
    key: (i) => keys[i] || null,
    get length() { return keys.length; },
  };
}

test('scrubEvent removes the user and any request body', () => {
  const event = sentry.scrubEvent({
    user: { id: '9', username: 'נועה', email: 'child@school.test', name: 'נועה' },
    request: { url: 'https://tablet.local/play', data: { answer: '4', note: 'נועה' } },
    message: 'kept',
  }, ['נועה']);
  assert.equal('user' in event, false);
  assert.equal('data' in event.request, false);
  assert.equal(event.request.url, 'https://tablet.local/play');
  assert.equal(event.message, 'kept');

  const asText = sentry.scrubEvent({ request: { data: 'נועה ענתה 4' } }, []);
  assert.equal('data' in asText.request, false);
});

test('scrubEvent redacts child names inside breadcrumb messages', () => {
  const event = sentry.scrubEvent({
    breadcrumbs: [
      { category: 'ui', timestamp: 1, message: 'נועה כהן ענתה, ואז נועה שוב' },
      { category: 'ui', timestamp: 2, message: 'clicked play' },
      null,
      { message: 4 },
    ],
  }, ['נועה', 'נועה כהן']);
  assert.equal(event.breadcrumbs[0].message, '[name] ענתה, ואז [name] שוב');
  assert.equal(event.breadcrumbs[0].category, 'ui');
  assert.equal(event.breadcrumbs[0].timestamp, 1);
  assert.equal(event.breadcrumbs[1].message, 'clicked play');

  const wrapped = sentry.scrubEvent({
    breadcrumbs: { values: [{ message: 'דני לחץ' }] },
  }, ['דני']);
  assert.equal(wrapped.breadcrumbs.values[0].message, '[name] לחץ');
});

test('scrubEvent redacts child names in exception values', () => {
  const event = sentry.scrubEvent({
    exception: {
      values: [
        { type: 'ReferenceError', value: 'נועה is not defined' },
        { type: 'Error', value: 'clicked play' },
        { type: 'Error' },
        null,
      ],
    },
  }, ['נועה']);
  assert.equal(event.exception.values[0].value, '[name] is not defined');
  assert.equal(event.exception.values[0].type, 'ReferenceError');
  assert.equal(event.exception.values[1].value, 'clicked play');
  assert.equal('value' in event.exception.values[2], false);
});

test('scrubEvent redacts child names in the event message', () => {
  const named = sentry.scrubEvent({ message: 'נועה ענתה 4' }, ['נועה']);
  assert.equal(named.message, '[name] ענתה 4');
  const plain = sentry.scrubEvent({ message: 'clicked play' }, ['נועה']);
  assert.equal(plain.message, 'clicked play');
});

test('scrubEvent redacts string values in breadcrumb data', () => {
  const event = sentry.scrubEvent({
    breadcrumbs: [
      {
        category: 'console',
        message: 'log',
        data: { arguments: ['נועה', 4], logger: 'console', extra: { label: 'נועה' } },
      },
      { category: 'ui', data: { target: 'button' } },
    ],
  }, ['נועה']);
  assert.equal(event.breadcrumbs[0].data.arguments[0], '[name]');
  assert.equal(event.breadcrumbs[0].data.arguments[1], 4);
  assert.equal(event.breadcrumbs[0].data.logger, 'console');
  assert.equal(event.breadcrumbs[0].data.extra.label, '[name]');
  assert.equal(event.breadcrumbs[0].message, 'log');
  assert.equal(event.breadcrumbs[1].data.target, 'button');
});

test('scrubEvent ignores empty input and names that are not children', () => {
  assert.equal(sentry.scrubEvent(null, ['נועה']), null);
  assert.deepEqual(sentry.scrubEvent(undefined, []), undefined);
  const bare = {};
  assert.equal(sentry.scrubEvent(bare, null), bare);
  const event = sentry.scrubEvent({
    breadcrumbs: [{ message: 'א אמר constructor' }],
  }, ['א', 'constructor', 'נועה']);
  assert.equal(event.breadcrumbs[0].message, 'א אמר constructor');
});

test('namesFromStorage reads the current child and each roster, once', () => {
  const store = memoryStorage({
    'mm-who-v1': JSON.stringify({ classCode: 'א1', name: 'נועה' }),
    'mm-roster-v1:א1': '{"classCode":"א1","students":{"דני":{"name":"דניאל"},"constructor":{"name":"bad"},"א":{"name":"א"}}}',
    'mm-roster-v1:ב2': JSON.stringify({ classCode: 'ב2', students: { נועה: { name: 'נועה' } } }),
    'mm-other': 'skip',
  });
  const names = sentry.namesFromStorage(store).sort();
  assert.deepEqual(names, ['דני', 'דניאל', 'נועה'].sort());
  assert.deepEqual(sentry.namesFromStorage({ getItem: () => { throw new Error('blocked'); } }), []);
  assert.deepEqual(sentry.namesFromStorage(memoryStorage({})), []);
});

test('beforeSend on a real DSN strips user, request data, and known names', () => {
  const doc = fakeDoc('https://public@o1.ingest.sentry.io/1');
  const seen = [];
  const g = { Sentry: { init: (opts) => seen.push(opts) } };
  assert.deepEqual(sentry.initSentry(doc, g), { enabled: true });
  doc.scripts[0].onload();
  assert.equal(seen[0].sendDefaultPii, false);
  assert.equal(typeof seen[0].beforeSend, 'function');

  const plain = seen[0].beforeSend({
    user: { id: '1' },
    request: { data: 'typed answer' },
    breadcrumbs: [{ message: 'clicked play' }],
  });
  assert.equal('user' in plain, false);
  assert.equal('data' in plain.request, false);
  assert.equal(plain.breadcrumbs[0].message, 'clicked play');

  const previous = globalThis.localStorage;
  globalThis.localStorage = memoryStorage({
    'mm-who-v1': JSON.stringify({ classCode: 'א1', name: 'נועה' }),
  });
  try {
    const named = seen[0].beforeSend({
      user: { username: 'נועה' },
      request: { url: 'https://tablet.local/', data: 'נועה' },
      breadcrumbs: [{ message: 'נועה ענתה 4' }, { message: 'ok' }],
    });
    assert.equal('user' in named, false);
    assert.equal('data' in named.request, false);
    assert.equal(named.request.url, 'https://tablet.local/');
    assert.equal(named.breadcrumbs[0].message, '[name] ענתה 4');
    assert.equal(named.breadcrumbs[1].message, 'ok');
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
});
