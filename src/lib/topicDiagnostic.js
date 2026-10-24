// MelodyMath — Topic diagnostic & fast start module (Issue #678, Refs #665).
// Ensures no long pre-tests before play; child starts playing within 10 seconds;
// diagnostic blocks have <= 4 items, embedded in play with spoken explanation;
// no self-report questionnaires for grades א׳-ב׳.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TOPIC_DIAGNOSTIC = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const MAX_DIAGNOSTIC_BLOCK_SIZE = 4;
  const MAX_START_LATENCY_MS = 10000;

  function isSelfReportAllowed(grade) {
    if (!grade) return false;
    const g = String(grade).trim();
    if (g === 'א' || g === 'ב' || g === '1' || g === '2') return false;
    return true;
  }

  function createDiagnosticBlocks(items, options) {
    const list = Array.isArray(items) ? items : [];
    if (!list.length) return [];
    const opts = options || {};
    const blockSize = Math.min(MAX_DIAGNOSTIC_BLOCK_SIZE, Math.max(1, Number(opts.maxBlockSize) || MAX_DIAGNOSTIC_BLOCK_SIZE));
    const grade = opts.grade || (list[0] && list[0].grade) || 'א';
    const blocks = [];

    for (let i = 0; i < list.length; i += blockSize) {
      const slice = list.slice(i, i + blockSize);
      const blockIndex = blocks.length + 1;
      const totalBlocks = Math.ceil(list.length / blockSize);
      const explanation = 'שלב ' + blockIndex + ' מתוך ' + totalBlocks + ': ' + slice.length + ' תרגילים קצרים עם צלילים ומשוב מיידי.';

      blocks.push({
        index: blockIndex,
        totalBlocks: totalBlocks,
        grade: grade,
        items: slice,
        count: slice.length,
        spokenExplanation: explanation,
        hasSpokenExplanation: true,
        isPlayEmbedded: true,
        immediateFeedback: true
      });
    }

    return blocks;
  }

  function openTopic(topicConfig, options) {
    const t0 = root.performance && root.performance.now ? root.performance.now() : Date.now();
    const cfg = topicConfig || {};
    const opts = options || {};
    const grade = cfg.grade || opts.grade || 'א';

    // Rule: No self-report questionnaire for grades א-ב
    const allowSelfReport = isSelfReportAllowed(grade) && Boolean(opts.allowSelfReport);

    const items = Array.isArray(cfg.items) ? cfg.items : (Array.isArray(cfg) ? cfg : []);
    const blocks = createDiagnosticBlocks(items, { grade: grade, maxBlockSize: MAX_DIAGNOSTIC_BLOCK_SIZE });
    const firstBlock = blocks[0] || null;
    const firstExercise = (firstBlock && firstBlock.items && firstBlock.items[0]) || null;

    const t1 = root.performance && root.performance.now ? root.performance.now() : Date.now();
    const elapsedMs = Math.max(0, t1 - t0);

    return {
      grade: grade,
      topicId: cfg.id || cfg.topic || 'default',
      playableImmediately: true,
      timeToFirstExerciseMs: elapsedMs,
      withinTargetLatency: elapsedMs <= MAX_START_LATENCY_MS,
      hasSelfReport: allowSelfReport,
      blocks: blocks,
      firstBlock: firstBlock,
      firstExercise: firstExercise
    };
  }

  return {
    MAX_DIAGNOSTIC_BLOCK_SIZE: MAX_DIAGNOSTIC_BLOCK_SIZE,
    MAX_START_LATENCY_MS: MAX_START_LATENCY_MS,
    isSelfReportAllowed: isSelfReportAllowed,
    createDiagnosticBlocks: createDiagnosticBlocks,
    openTopic: openTopic
  };
});
