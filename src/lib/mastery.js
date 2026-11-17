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

  function getDataWorlds() {
    if (typeof MM_DATA_WORLDS !== 'undefined') return MM_DATA_WORLDS;
    try { return typeof require === 'function' ? require('./music/dataWorlds') : null; } catch (e) { return null; }
  }

  function getCurriculum() {
    if (typeof MM_CURRICULUM !== 'undefined') return MM_CURRICULUM;
    try { return typeof require === 'function' ? require('./curriculum') : null; } catch (e) { return null; }
  }

  function topicMastery(history, topicOrStandard, catalog) {
    const list = Array.isArray(history) ? history : [];
    const target = topicOrStandard != null ? String(topicOrStandard).trim() : '';
    const cur = getCurriculum();
    const byId = {};
    (Array.isArray(catalog) ? catalog : []).forEach(function (it) {
      if (it && it.id != null) byId[String(it.id)] = it;
    });

    let attempts = 0;
    let correct = 0;

    list.forEach(function (h) {
      if (!h) return;
      const it = (h.id != null && byId[String(h.id)]) || h.item || h;
      const sec = cur && typeof cur.sectionForItem === 'function' ? cur.sectionForItem(it) : null;
      const itemTopic = it.topic || (sec && sec.topic) || h.topic;
      const matchesTopic = itemTopic === target ||
        it.topicId === target || h.topicId === target ||
        it.standard === target || h.standard === target ||
        it.skill === target || h.skill === target;
      if (target && !matchesTopic) return;
      attempts += 1;
      if (h.correct || h.isCorrect) correct += 1;
    });

    const accuracy = attempts > 0 ? correct / attempts : 0;
    const mastered = attempts >= 2 && accuracy >= 0.8;
    const status = (attempts === 0 || accuracy < 0.6) ? 'low' : mastered ? 'mastered' : 'practicing';

    return {
      topic: target,
      attempts: attempts,
      correct: correct,
      accuracy: accuracy,
      mastered: mastered,
      status: status,
      isLowMastery: status === 'low',
    };
  }

  function multiGradeProgress(history, catalog) {
    const cur = getCurriculum();
    const matrix = (cur && cur.MATRIX) || [];
    const grades = (cur && typeof cur.grades === 'function') ? cur.grades() : ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
    const summary = {};
    const lowMasteryTopics = [];
    const masteredTopics = [];
    const practicingTopics = [];
    let totalAttempts = 0;
    let totalCorrect = 0;

    grades.forEach(function (g) {
      summary[g] = { grade: g, topics: [] };
    });

    matrix.forEach(function (row) {
      const g = row.grade;
      const m = topicMastery(history, row.topic, catalog);
      totalAttempts += m.attempts;
      totalCorrect += m.correct;
      const item = {
        topic: row.topic,
        topicId: row.topicId,
        grade: row.grade,
        strand: row.strand,
        mastery: m,
      };
      if (summary[g]) summary[g].topics.push(item);
      if (m.status === 'low') lowMasteryTopics.push(item);
      else if (m.status === 'mastered') masteredTopics.push(item);
      else practicingTopics.push(item);
    });

    return {
      grades: summary,
      lowMasteryTopics: lowMasteryTopics,
      masteredTopics: masteredTopics,
      practicingTopics: practicingTopics,
      totalAttempts: totalAttempts,
      totalCorrect: totalCorrect,
    };
  }

  function buildReviewPath(history, catalog, options) {
    const opts = options || {};
    const book = Array.isArray(catalog) ? catalog : [];
    const dw = getDataWorlds();
    const cur = getCurriculum();

    if (opts.topicId && !opts.topic) {
      const tp = cur && typeof cur.topicReviewPath === 'function' ? cur.topicReviewPath(opts.topicId, history, catalog) : null;
      if (tp) return tp;
    }

    const progress = multiGradeProgress(history, book);

    let targetTopics = [];
    if (opts.topic) {
      targetTopics = [opts.topic];
    } else {
      let candidates = progress.lowMasteryTopics;
      if (opts.grade) candidates = candidates.filter(function (t) { return t.grade === opts.grade; });
      if (opts.strand) candidates = candidates.filter(function (t) { return t.strand === opts.strand; });
      targetTopics = candidates.map(function (t) { return t.topic; });
      if (!targetTopics.length && opts.strand === 'data' && cur && typeof cur.dataStrandTopics === 'function') {
        targetTopics = cur.dataStrandTopics(opts.grade);
      }
    }

    // Candidate items from catalog matching the topics or strand
    let candidates = book.filter(function (it) {
      if (!it) return false;
      if (opts.grade && it.grade !== opts.grade) return false;
      if (opts.strand && it.strand !== opts.strand) return false;
      return !targetTopics.length || targetTopics.some(function (t) {
        return it.topic === t || it.topicId === t || it.standard === t || (it.section && it.section.topic === t);
      });
    });

    if (!candidates.length && opts.strand) {
      candidates = book.filter(function (it) { return it && it.strand === opts.strand; });
    }
    if (!candidates.length) candidates = book.slice();

    // Prioritize dataWorlds items
    candidates.sort(function (a, b) {
      const aDw = dw && typeof dw.isDataWorldItem === 'function' && dw.isDataWorldItem(a) ? 1 : 0;
      const bDw = dw && typeof dw.isDataWorldItem === 'function' && dw.isDataWorldItem(b) ? 1 : 0;
      return bDw - aDw;
    });

    const tier1 = [];
    const tier2 = [];
    const tier3 = [];

    candidates.forEach(function (it) {
      const lv = it.level || 1;
      const copy = Object.assign({}, it);
      if (lv <= 1 && tier1.length < 3) {
        copy.tier = 1;
        if (dw && typeof dw.tierAuditoryFeedback === 'function') {
          copy.auditoryFeedback = dw.tierAuditoryFeedback(1, true);
        }
        if (dw && typeof dw.specForItem === 'function') copy.dataWorldSpec = dw.specForItem(it);
        tier1.push(copy);
      } else if (lv === 2 && tier2.length < 3) {
        copy.tier = 2;
        if (dw && typeof dw.tierAuditoryFeedback === 'function') {
          copy.auditoryFeedback = dw.tierAuditoryFeedback(2, true);
        }
        if (dw && typeof dw.specForItem === 'function') copy.dataWorldSpec = dw.specForItem(it);
        tier2.push(copy);
      } else if (lv >= 3 && tier3.length < 3) {
        copy.tier = 3;
        if (dw && typeof dw.tierAuditoryFeedback === 'function') {
          copy.auditoryFeedback = dw.tierAuditoryFeedback(3, true);
        }
        if (dw && typeof dw.specForItem === 'function') copy.dataWorldSpec = dw.specForItem(it);
        tier3.push(copy);
      }
    });

    const maxItems = opts.maxItems || 9;
    const path = tier1.concat(tier2).concat(tier3).slice(0, maxItems);

    return {
      topics: targetTopics,
      tiers: { 1: tier1, 2: tier2, 3: tier3 },
      path: path,
      auditoryGuided: true,
      auditoryFeedback: function (tier, isCorrect) {
        return dw && typeof dw.tierAuditoryFeedback === 'function' ? dw.tierAuditoryFeedback(tier, isCorrect) : [];
      },
    };
  }

  function gateItems(items, history, catalog, options) {
    if (options && options.review) {
      const rp = buildReviewPath(history, catalog || items, options);
      if (rp.path && rp.path.length) return rp.path;
    }
    const list = Array.isArray(items) ? items : [];
    const book = catalog || list;
    if (coreTablesMastered(history, book)) return list.slice();
    return list.filter(function (it) { return !isBlockedItem(it); });
  }

  // A direct topic link (?topic=) must always show a question: if the gate
  // would hide every exercise of the topic, fall back to all of them.
  function gateItemsOrAll(items, history, catalog) {
    const list = Array.isArray(items) ? items : [];
    const gated = gateItems(list, history, catalog);
    return gated.length ? gated : list.slice();
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
    gateItemsOrAll: gateItemsOrAll,
    withCoreIfNeeded: withCoreIfNeeded,
    topicMastery: topicMastery,
    multiGradeProgress: multiGradeProgress,
    buildReviewPath: buildReviewPath,
  };
});
