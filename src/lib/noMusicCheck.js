// MelodyMath — which items the end-of-topic no-music check asks (Refs #747, Refs #758, Refs #665).
// Not a second check: it only picks the items and counts misses; the check itself is
// masteryCheck.js (#718, mountMasteryCheck + nextPlainItem).
// 1. missing_factor topics have their own items: answer × factor = product, no product twice in a topic.
// 2. Any other topic checks 3 items from the LAST level of its bank (the hardest the child practised).
// 3. Two misses in a row send the child back to the picture stage; one miss asks another question.
//    Faded worked examples: step back to the more supported stage when the learner fails,
//    Renkl & Atkinson (2003), doi:10.1207/S15326985EP3801_3.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_NO_MUSIC_CHECK = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const SOURCE = { cite: 'Renkl & Atkinson (2003)', url: 'https://doi.org/10.1207/S15326985EP3801_3' };
  const DEFAULT_COUNT = 3;
  const MISSES_TO_PICTURE = 2;
  function mf(topicId, n, factor, answer, extra) {
    const product = factor * answer;
    return Object.assign({
      id: topicId + ':nm' + n, topicId: topicId, kind: 'missing_factor', skill: 'missing_factor',
      prompt: factor + ' × ? = ' + product, factor: factor, product: product, answer: answer,
      hint: 'כמה פעמים ' + factor + ' נותן ' + product + '?', noMusic: true
    }, extra || {});
  }
  const ITEMS = {
    'mm-cur-18': [mf('mm-cur-18', 1, 4, 5, { grade: 'ב', buildsFrom: 'mm-cur-16' }), mf('mm-cur-18', 2, 3, 6), mf('mm-cur-18', 3, 2, 7)],
    'mm-cur-24': [mf('mm-cur-24', 1, 6, 8), mf('mm-cur-24', 2, 7, 6), mf('mm-cur-24', 3, 9, 9)],
    'mm-cur-25': [mf('mm-cur-25', 1, 8, 7), mf('mm-cur-25', 2, 6, 6), mf('mm-cur-25', 3, 9, 7)],
    'mm-cur-31': [mf('mm-cur-31', 1, 25, 40), mf('mm-cur-31', 2, 12, 12), mf('mm-cur-31', 3, 300, 20)]
  };
  function checkPool(topicId, items) {
    if (topicId && ITEMS[topicId]) return ITEMS[topicId];
    const list = (Array.isArray(items) ? items : []).filter(Boolean);
    if (!list.length) return [];
    const top = Math.max.apply(null, list.map(function (it) { return Number(it.level) || 1; }));
    return list.filter(function (it) { return (Number(it.level) || 1) === top; }).slice(0, DEFAULT_COUNT);
  }
  function pickCheckItem(topicId, items, used) {
    const pool = checkPool(topicId, items);
    if (!pool.length) return null;
    const M = root && root.MelodyMathMasteryCheck;
    const next = M && typeof M.nextPlainItem === 'function' ? M.nextPlainItem
      : (typeof require === 'function' ? require('./masteryCheck.js').nextPlainItem : null);
    return next ? next(pool, used) : pool[0];
  }
  // state: the practice step (or any object); keeps checkMisses on it.
  function afterAnswer(state, ok, tracker, topicId) {
    const st = state || {};
    if (ok) { st.checkMisses = 0; return 'pass'; }
    st.checkMisses = (st.checkMisses || 0) + 1;
    if (st.checkMisses < MISSES_TO_PICTURE) return 'retry';
    st.checkMisses = 0;
    if (tracker && topicId && typeof tracker.get === 'function') {
      tracker.get(topicId).currentStage = 'picture';
      if (typeof tracker.save === 'function') tracker.save();
    }
    return 'picture';
  }
  return { SOURCE, DEFAULT_COUNT, MISSES_TO_PICTURE, ITEMS, checkPool, pickCheckItem, afterAnswer };
});
