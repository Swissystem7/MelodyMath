// MelodyMath — interleaved rounds for PatternEcho (#591, proposal 4/5).
//
// Mixed practice of problem kinds (Rohrer & Taylor 2007, cited in the
// proposal): every round of 6 items holds at least 2 pattern types. Items
// are { type, ... }; interleave() keeps every item and deals them into
// rounds of `size`, the smallest types first and one item per round in
// turn, so the scarce types reach as many rounds as they can and the
// biggest type fills what is left. Inside a round, types alternate.
// ok is false when the items cannot meet the rule (one type only, or one
// type far larger than the rest); roundsOk() checks any given rounds.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_INTERLEAVE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ROUND_SIZE = 6;
  const MIN_TYPES = 2;

  function typesIn(round) {
    const seen = {};
    round.forEach(function (it) { seen[it.type] = true; });
    return Object.keys(seen).length;
  }

  // A round of one item cannot mix; every round of 2+ items needs minTypes.
  function roundsOk(rounds, minTypes) {
    const need = minTypes || MIN_TYPES;
    return rounds.every(function (r) { return r.length < 2 || typesIn(r) >= Math.min(need, r.length); });
  }

  // Order a round so the same type does not come twice in a row when it can
  // be avoided (most-left type first, never the type just played).
  function alternate(round) {
    const pools = {};
    const order = [];
    round.forEach(function (it) {
      if (!pools[it.type]) { pools[it.type] = []; order.push(it.type); }
      pools[it.type].push(it);
    });
    const out = [];
    while (out.length < round.length) {
      const last = out.length ? out[out.length - 1].type : null;
      const r = order.filter(function (t) { return pools[t].length; })
        .sort(function (a, b) { return pools[b].length - pools[a].length || order.indexOf(a) - order.indexOf(b); });
      const t = r.length > 1 && r[0] === last ? r[1] : r[0];
      out.push(pools[t].shift());
    }
    return out;
  }

  function interleave(items, opts) {
    const o = opts || {};
    const size = o.size || ROUND_SIZE;
    const need = o.minTypes || MIN_TYPES;
    const list = items || [];
    const pools = {};
    const order = [];
    list.forEach(function (it) {
      if (!pools[it.type]) { pools[it.type] = []; order.push(it.type); }
      pools[it.type].push(it);
    });
    const count = Math.ceil(list.length / size);
    const rounds = [];
    const caps = [];
    for (let i = 0; i < count; i++) {
      rounds.push([]);
      caps.push(i < count - 1 ? size : list.length - size * (count - 1));
    }
    // Smallest type first; deal from the last (shortest) round backwards.
    const byFew = order.slice().sort(function (a, b) { return pools[a].length - pools[b].length || order.indexOf(a) - order.indexOf(b); });
    let at = count - 1;
    byFew.forEach(function (t) {
      pools[t].forEach(function (it) {
        while (rounds[at].length >= caps[at]) at = (at - 1 + count) % count;
        rounds[at].push(it);
        at = (at - 1 + count) % count;
      });
    });
    const out = rounds.map(alternate);
    return { rounds: out, ok: roundsOk(out, need) };
  }

  return {
    ROUND_SIZE: ROUND_SIZE,
    MIN_TYPES: MIN_TYPES,
    typesIn: typesIn,
    roundsOk: roundsOk,
    interleave: interleave,
  };
});
