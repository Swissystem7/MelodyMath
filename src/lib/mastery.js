// MelodyMath — grade-ב multiplication/division gate, and the BKT mastery model.
//
// The official programme: by the end of כיתה ב׳ students master the 2, 4, 5
// and 10 tables. Facts on 3, 6, 7, 8, 9 wait until that core is actually
// mastered. An item with no `table` is never gated.
//
// The gate above is a curriculum rule and stays a hard count. Separately,
// `bktUpdate` / `masteryFromHistory` estimate P(known) for one skill with
// standard Bayesian Knowledge Tracing, and adaptive.js picks the next
// difficulty from that estimate instead of from a raw streak.
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

  // ------------------------------------------------------------------
  // Bayesian Knowledge Tracing
  //
  // One latent binary skill. Each observation is a two-stage update:
  //
  //   1. evidence (Bayes rule on the answer)
  //        correct: P(K|obs) = P(1-pSlip) / [ P(1-pSlip) + (1-P)pGuess ]
  //        wrong:   P(K|obs) = P*pSlip    / [ P*pSlip    + (1-P)(1-pGuess) ]
  //   2. learning (the chance the attempt itself taught the skill)
  //        P_next = P(K|obs) + (1 - P(K|obs)) * pLearn
  //
  // Worked by hand for the defaults, one correct answer from pInit = 0.2:
  //        evidence: 0.2*0.9 / (0.2*0.9 + 0.8*0.25) = 0.18/0.38 = 9/19
  //                                                            = 0.4736842...
  //        learning: 9/19 + (10/19)*0.15 = 10.5/19 = 21/38     = 0.5526315...
  //   so P(known) after one correct answer is 0.5526 to four decimals.
  //
  // NOTE (2026-09-10): the escalation backlog pinned 0.5407 for exactly this
  // case. 0.5407 is not what the recurrence above produces with these
  // parameters — 21/38 is, and 21/38 = 0.55263157... The code keeps the
  // standard recurrence and the tests pin the computed value, not the
  // hand-written one. (0.4737 is the evidence stage alone; 0.6288 is what you
  // get if you apply the learning step before the evidence step. Neither is
  // 0.5407 either.)
  //
  // A second consequence of stage 2 worth stating out loud: the evidence stage
  // can never return less than 0, so P_next >= pLearn for every observation.
  // With pLearn = 0.15 the estimate cannot go below 0.15, and the wrong-answer
  // fixed point is 9/52 = 0.1730769... So the backlog line "ten wrong answers
  // stay below 0.1" is unreachable by construction, not a tuning problem.
  // ------------------------------------------------------------------
  const BKT_DEFAULTS = { pInit: 0.2, pLearn: 0.15, pSlip: 0.1, pGuess: 0.25 };

  // Difficulty bands on P(known), used by adaptive.js.
  const MASTERY_LOW = 0.4;
  const MASTERY_HIGH = 0.85;

  function clamp01(v, fallback) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(1, Math.max(0, n));
  }

  function bktParams(params) {
    const p = params || {};
    return {
      pInit: clamp01(p.pInit, BKT_DEFAULTS.pInit),
      pLearn: clamp01(p.pLearn, BKT_DEFAULTS.pLearn),
      pSlip: clamp01(p.pSlip, BKT_DEFAULTS.pSlip),
      pGuess: clamp01(p.pGuess, BKT_DEFAULTS.pGuess),
    };
  }

  // `state` is the carried P(known): a bare number, an object with `pKnown`
  // (or `p`), or null/undefined for "no observations yet" -> pInit.
  function priorOf(state, p) {
    if (state == null) return p.pInit;
    if (typeof state === 'number') return clamp01(state, p.pInit);
    if (typeof state === 'string') {
      // a value that round-tripped through localStorage comes back as text;
      // read it rather than silently restarting the learner at pInit
      return state.trim() === '' ? p.pInit : clamp01(state, p.pInit);
    }
    if (typeof state === 'object') {
      const v = state.pKnown != null ? state.pKnown : state.p;
      return clamp01(v, p.pInit);
    }
    return p.pInit;
  }

  // Stage 1 alone: the Bayes posterior given the answer, before learning.
  function bktPosterior(state, correct, params) {
    const p = bktParams(params);
    const prior = priorOf(state, p);
    const hit = !!correct;
    const num = hit ? prior * (1 - p.pSlip) : prior * p.pSlip;
    const den = hit
      ? prior * (1 - p.pSlip) + (1 - prior) * p.pGuess
      : prior * p.pSlip + (1 - prior) * (1 - p.pGuess);
    // Degenerate parameters (pGuess = 1 with pSlip = 0, say) can make both
    // branches impossible. Then the observation carries no information.
    if (!(den > 0)) return prior;
    return num / den;
  }

  // Stage 1 + stage 2: the P(known) the tutor carries into the next question.
  function bktUpdate(state, correct, params) {
    const p = bktParams(params);
    const post = bktPosterior(state, correct, p);
    return post + (1 - post) * p.pLearn;
  }

  // Fold a history into P(known). Entries may be plain booleans or the
  // {id, correct} records the session log already stores.
  function masteryFromHistory(history, params) {
    const p = bktParams(params);
    const log = Array.isArray(history) ? history : [];
    return log.reduce(function (P, entry) {
      const correct = (entry && typeof entry === 'object') ? !!entry.correct : !!entry;
      return bktUpdate(P, correct, p);
    }, p.pInit);
  }

  // < 0.4 easier, 0.4..0.85 same, > 0.85 harder.
  function masteryBand(pKnown) {
    const p = Number(pKnown);
    if (!Number.isFinite(p)) return 'same';
    if (p < MASTERY_LOW) return 'easier';
    if (p > MASTERY_HIGH) return 'harder';
    return 'same';
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
    BKT_DEFAULTS: BKT_DEFAULTS,
    MASTERY_LOW: MASTERY_LOW,
    MASTERY_HIGH: MASTERY_HIGH,
    bktParams: bktParams,
    bktPosterior: bktPosterior,
    bktUpdate: bktUpdate,
    masteryFromHistory: masteryFromHistory,
    masteryBand: masteryBand,
  };
});
