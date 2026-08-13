// MelodyMath — grade-ב multiplication/division gate.
//
// The official programme: by the end of כיתה ב׳ students master the 2, 4, 5
// and 10 tables. Facts on 3, 6, 7, 8, 9 wait until that core is actually
// mastered. An item with no `table` is never gated.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CORE_TABLES = [2, 4, 5, 10];
  const BLOCKED_TABLES = [3, 6, 7, 8, 9];
  const HITS_PER_TABLE = 2;

  function asTable(n) {
    const v = Math.round(Number(n));
    return Number.isFinite(v) ? v : null;
  }

  function itemTable(item) {
    if (!item) return null;
    return asTable(item.table);
  }

  function isCoreTable(n) {
    return CORE_TABLES.indexOf(asTable(n)) !== -1;
  }

  function isBlockedTable(n) {
    return BLOCKED_TABLES.indexOf(asTable(n)) !== -1;
  }

  function isBlockedItem(item) {
    return isBlockedTable(itemTable(item));
  }

  function hitsByCoreTable(history, catalog) {
    const byId = {};
    (Array.isArray(catalog) ? catalog : []).forEach(function (it) {
      if (it && it.id != null) byId[it.id] = it;
    });
    const hits = { 2: new Set(), 4: new Set(), 5: new Set(), 10: new Set() };
    (Array.isArray(history) ? history : []).forEach(function (h) {
      if (!h || !h.correct) return;
      const it = byId[h.id];
      const t = itemTable(it);
      if (hits[t]) hits[t].add(h.id);
    });
    return hits;
  }

  function coreTablesMastered(history, catalog) {
    const hits = hitsByCoreTable(history, catalog);
    return CORE_TABLES.every(function (t) {
      return hits[t].size >= HITS_PER_TABLE;
    });
  }

  function missingCoreTables(history, catalog) {
    const hits = hitsByCoreTable(history, catalog);
    return CORE_TABLES.filter(function (t) {
      return hits[t].size < HITS_PER_TABLE;
    });
  }

  function gateItems(items, history, catalog) {
    const list = Array.isArray(items) ? items : [];
    const book = catalog || list;
    if (coreTablesMastered(history, book)) return list.slice();
    return list.filter(function (it) { return !isBlockedItem(it); });
  }

  function withCoreIfNeeded(items, extraCore) {
    const list = Array.isArray(items) ? items.slice() : [];
    const extra = Array.isArray(extraCore) ? extraCore : [];
    const seen = {};
    list.forEach(function (it) { if (it && it.id != null) seen[it.id] = true; });
    extra.forEach(function (it) {
      if (!it || it.id == null || seen[it.id]) return;
      if (!isCoreTable(itemTable(it))) return;
      list.push(it);
      seen[it.id] = true;
    });
    return list;
  }

  return {
    CORE_TABLES: CORE_TABLES,
    BLOCKED_TABLES: BLOCKED_TABLES,
    HITS_PER_TABLE: HITS_PER_TABLE,
    itemTable: itemTable,
    isCoreTable: isCoreTable,
    isBlockedTable: isBlockedTable,
    isBlockedItem: isBlockedItem,
    hitsByCoreTable: hitsByCoreTable,
    coreTablesMastered: coreTablesMastered,
    missingCoreTables: missingCoreTables,
    gateItems: gateItems,
    withCoreIfNeeded: withCoreIfNeeded,
  };
});
