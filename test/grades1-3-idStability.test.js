// MM-7xx late-items hook in banks.js (approved on #955 on the condition that
// no existing item id changes). grades1-3-idSnapshot.json holds every item id
// of master before the hook, with a hash of its prompt and answer. After the
// hook, every one of those ids must still exist and still mean the same
// question; the only new ids are late items with fixed keys.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const banks = require('../src/lib/banks');
const snap = require('./grades1-3-idSnapshot.json');

const hash = (it) => crypto.createHash('sha1').update(JSON.stringify([it.prompt, it.answer])).digest('hex').slice(0, 10);
const all = banks.allItems();
const byId = new Map(all.map((it) => [it.id, it]));

test('every id on master still exists, and still has the same prompt and answer', () => {
  assert.equal(Object.keys(snap.ids).length, snap.count);
  const missing = [];
  const changed = [];
  Object.keys(snap.ids).forEach((id) => {
    const it = byId.get(id);
    if (!it) missing.push(id);
    else if (hash(it) !== snap.ids[id]) changed.push(id);
  });
  assert.deepEqual(missing, []);
  assert.deepEqual(changed, []);
});

test('ids are unique, and every id that is new since master is a late item with a fixed key', () => {
  assert.equal(byId.size, all.length);
  const fresh = all.filter((it) => !Object.prototype.hasOwnProperty.call(snap.ids, it.id));
  assert.ok(fresh.length > 0);
  fresh.forEach((it) => {
    const key = Number(it.id.split('-').pop());
    assert.ok(Number.isInteger(key) && key >= 10000, it.id);
  });
  const maxOld = Math.max(...Object.keys(snap.ids).map((id) => Number(id.split('-').pop())));
  assert.ok(maxOld < 10000, 'RAW indexes stay below the late-key range');
});
