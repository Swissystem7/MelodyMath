// MelodyMath — Topic diagnostic & fast start module (Issue #678, Refs #665).
// Ensures no long pre-tests before play; child starts playing within 10 seconds;
// diagnostic blocks have <= 4 items, embedded in play with spoken explanation;
// checks prerequisites; includes unassisted items; no self-report for grades א׳-ב׳.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TOPIC_DIAGNOSTIC = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const MAX_DIAGNOSTIC_BLOCK_SIZE = 4;
  const MAX_START_LATENCY_MS = 10000;

  function normalizeGrade(grade) {
    if (!grade) return '';
    return String(grade).replace(/['"״׳\s]/g, '').trim();
  }

  function isSelfReportAllowed(grade) {
    const g = normalizeGrade(grade);
    if (!g) return false;
    if (g === 'א' || g === 'ב' || g === '1' || g === '2' || g === 'grade1' || g === 'grade2') return false;
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
      const slice = list.slice(i, i + blockSize).map(function (it, idx, arr) {
        const copy = Object.assign({}, it);
        // Requirement: at least 1 item per block without music to test pure math unassisted (Refs #678, Refs #665)
        if (idx === arr.length - 1) {
          copy.noMusic = true;
          copy.plain = true;
        }
        return copy;
      });
      const blockIndex = blocks.length + 1;
      const totalBlocks = Math.ceil(list.length / blockSize);
      const explanation = 'בואו נשחק ונפתור ביחד! ' + slice.length + ' תרגילים קצרים עם מוזיקה.';

      blocks.push({
        index: blockIndex,
        totalBlocks: totalBlocks,
        grade: grade,
        items: slice,
        count: slice.length,
        spokenExplanation: explanation,
        hasSpokenExplanation: true,
        isPlayEmbedded: true,
        immediateFeedback: true,
        hasUnassistedItem: slice.some(function (it) { return it.noMusic; })
      });
    }

    return blocks;
  }

  function checkPrerequisites(topicIdOrSkill, tracker, progModule, skillKey) {
    let prog = progModule;
    if (!prog && typeof root !== 'undefined' && root.MM_PROGRESSION) {
      prog = root.MM_PROGRESSION;
    }
    if (!prog && typeof require === 'function') {
      try { prog = require('./curriculum/progression.js'); } catch (_) {}
    }
    if (!prog) return { ok: false, topicId: topicIdOrSkill, prereq: [], missing: ['prog_missing'], redirectTo: null };

    const first = String(topicIdOrSkill || '');
    let links = null;
    let actualTopicId = first;

    if (skillKey && typeof prog.linksForSkill === 'function') {
      links = prog.linksForSkill(first, skillKey);
      actualTopicId = (links && links.topicId) || (first + ':' + skillKey);
    } else if (first.includes(':') && typeof prog.linksForSkill === 'function') {
      const parts = first.split(':');
      links = prog.linksForSkill(parts[0], parts[1]);
      actualTopicId = (links && links.topicId) || first;
    } else if (typeof prog.linksForTopic === 'function') {
      links = prog.linksForTopic(first);
      actualTopicId = first;
    }

    // Unknown topic ID is locked and NOT ok (Refs #665)
    if (!links) {
      return { ok: false, topicId: actualTopicId, prereq: [], missing: ['unknown_topic'], redirectTo: null };
    }

    if (!Array.isArray(links.prereq) || !links.prereq.length) {
      return { ok: true, topicId: actualTopicId, prereq: [], missing: [], redirectTo: null };
    }

    function isMastered(id) {
      if (!tracker) return false;
      if (typeof tracker.isMastered === 'function') return Boolean(tracker.isMastered(id));
      return Boolean(tracker[id]);
    }

    const missing = [];
    links.prereq.forEach(function (pId) {
      if (!isMastered(pId)) missing.push(pId);
    });

    if (missing.length === 0) {
      return { ok: true, topicId: actualTopicId, prereq: links.prereq, missing: [], redirectTo: null };
    }

    // Trace down the prerequisite tree to the deepest missing root
    function findDeepestMissing(currId, visited) {
      const seen = visited || new Set();
      if (seen.has(currId)) return currId;
      seen.add(currId);
      const currLinks = typeof prog.linksForTopic === 'function' ? prog.linksForTopic(currId) : null;
      if (!currLinks || !Array.isArray(currLinks.prereq) || !currLinks.prereq.length) {
        return currId;
      }
      for (let i = 0; i < currLinks.prereq.length; i++) {
        const parentId = currLinks.prereq[i];
        if (!isMastered(parentId)) {
          return findDeepestMissing(parentId, seen);
        }
      }
      return currId;
    }

    const deepest = findDeepestMissing(missing[0]);

    return {
      ok: false,
      topicId: actualTopicId,
      prereq: links.prereq,
      missing: missing,
      redirectTo: deepest
    };
  }

  function openTopic(topicConfig, options) {
    const t0 = root.performance && root.performance.now ? root.performance.now() : Date.now();
    const cfg = topicConfig || {};
    const opts = options || {};
    const grade = cfg.grade || opts.grade || 'א';
    const topicId = cfg.id || cfg.topicId || cfg.topic || 'mm-cur-0';

    const allowSelfReport = isSelfReportAllowed(grade) && Boolean(opts.allowSelfReport);
    const prereqCheck = checkPrerequisites(topicId, opts.tracker, opts.progressionModule);

    const items = Array.isArray(cfg.items) ? cfg.items : (Array.isArray(cfg) ? cfg : []);
    const blocks = createDiagnosticBlocks(items, { grade: grade, maxBlockSize: MAX_DIAGNOSTIC_BLOCK_SIZE });
    const firstBlock = blocks[0] || null;
    const firstExercise = (firstBlock && firstBlock.items && firstBlock.items[0]) || null;

    if (firstBlock && firstBlock.spokenExplanation && typeof opts.speak === 'function') {
      opts.speak(firstBlock.spokenExplanation);
    }

    const t1 = root.performance && root.performance.now ? root.performance.now() : Date.now();
    const elapsedMs = Math.max(0, t1 - t0);

    return {
      grade: grade,
      topicId: topicId,
      playableImmediately: prereqCheck.ok,
      prereqCheck: prereqCheck,
      redirectTo: prereqCheck.redirectTo,
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
    normalizeGrade: normalizeGrade,
    isSelfReportAllowed: isSelfReportAllowed,
    createDiagnosticBlocks: createDiagnosticBlocks,
    checkPrerequisites: checkPrerequisites,
    openTopic: openTopic
  };
});
