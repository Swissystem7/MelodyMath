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

  function isTableMastered(arg1, arg2, arg3) {
    let rawTable = null;
    let history = null;
    let catalog = null;

    if (arg1 && typeof arg1 === 'object' && !Array.isArray(arg1) && ('table' in arg1 || 'history' in arg1)) {
      rawTable = arg1.table;
      history = arg1.history;
      catalog = arg1.catalog;
    } else {
      const args = [arg1, arg2, arg3];
      let tableIdx = -1;
      for (let i = 0; i < args.length; i++) {
        if (args[i] != null && !Array.isArray(args[i]) && asTable(args[i]) !== null) {
          rawTable = args[i];
          tableIdx = i;
          break;
        }
      }
      if (rawTable === null) {
        for (let i = 0; i < args.length; i++) {
          if (args[i] && typeof args[i] === 'object' && !Array.isArray(args[i]) && args[i].table != null) {
            rawTable = args[i].table;
            tableIdx = i;
            break;
          }
        }
      }

      const remaining = [];
      for (let i = 0; i < args.length; i++) {
        if (i !== tableIdx && args[i] != null) {
          remaining.push(args[i]);
        }
      }

      if (remaining.length === 1) {
        history = remaining[0];
      } else if (remaining.length >= 2) {
        const first = remaining[0];
        const second = remaining[1];
        const firstIsHistory = Array.isArray(first) && first.some(function (it) {
          return it && ('correct' in it || 'isCorrect' in it);
        });
        const secondIsHistory = Array.isArray(second) && second.some(function (it) {
          return it && ('correct' in it || 'isCorrect' in it);
        });

        if (firstIsHistory && !secondIsHistory) {
          history = first;
          catalog = second;
        } else if (secondIsHistory && !firstIsHistory) {
          history = second;
          catalog = first;
        } else {
          history = first;
          catalog = second;
        }
      }
    }

    const targetTable = asTable(rawTable);
    if (targetTable === null) return false;
    if (!Array.isArray(history)) return false;

    const byId = {};
    (Array.isArray(catalog) ? catalog : []).forEach(function (it) {
      if (it && it.id != null) byId[String(it.id)] = it;
    });

    const targetItemIds = new Set();
    (Array.isArray(catalog) ? catalog : []).forEach(function (it) {
      if (it && itemTable(it) === targetTable && it.id != null) {
        targetItemIds.add(String(it.id));
      }
    });

    if (targetItemIds.size === 0 && (!catalog || !Array.isArray(catalog) || catalog.length === 0)) {
      history.forEach(function (h) {
        if (!h) return;
        const it = (h.id != null && byId[String(h.id)]) || h.item || h;
        if (itemTable(it) === targetTable) {
          const id = (h.id != null ? h.id : (h.item && h.item.id != null ? h.item.id : null));
          if (id != null) targetItemIds.add(String(id));
        }
      });
    }

    if (targetItemIds.size === 0) return false;

    const correctIds = new Set();
    history.forEach(function (h) {
      if (!h) return;
      if (h.correct || h.isCorrect) {
        if (h.id != null) correctIds.add(String(h.id));
        if (h.item && h.item.id != null) correctIds.add(String(h.item.id));
      }
    });

    for (const id of targetItemIds) {
      if (!correctIds.has(id)) return false;
    }
    return true;
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
    isTableMastered: isTableMastered,
    gateItems: gateItems,
    withCoreIfNeeded: withCoreIfNeeded,
  };
});
