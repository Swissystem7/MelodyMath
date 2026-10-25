// MelodyMath — Topic diagnostic & fast start module (Issue #678, Refs #665).
// Ensures no long pre-tests before play; child starts playing within 10 seconds;
// diagnostic blocks have <= 4 items, embedded in play with spoken explanation;
// checks prerequisites; includes unassisted items; no self-report for grades א׳-ב׳;
// topic and item order strictly matches progression.js (no topic before its prerequisite).
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TOPIC_DIAGNOSTIC = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const MAX_DIAGNOSTIC_BLOCK_SIZE = 4;
  const MAX_START_LATENCY_MS = 10000;

  function normalizeGrade(g) { return g ? String(g).replace(/['"״׳\s]/g, '').trim() : ''; }

  function isSelfReportAllowed(grade) {
    const g = normalizeGrade(grade);
    return Boolean(g && !['א', 'ב', '1', '2', 'grade1', 'grade2'].includes(g));
  }

  function topicTitle(id, curModule) {
    if (!id) return '';
    let cur = curModule || (typeof root !== 'undefined' && root.curriculum);
    if (!cur && typeof require === 'function') { try { cur = require('./curriculum.js'); } catch (_) {} }
    const row = (cur && typeof cur.topicById === 'function') ? cur.topicById(id) : null;
    return (row && row.topic) ? row.topic : '';
  }

  function topicIdForItem(it, curModule, progModule) {
    if (!it) return null;
    if (it.topicId) return it.topicId;
    let cur = curModule || (typeof root !== 'undefined' && root.curriculum);
    if (!cur && typeof require === 'function') { try { cur = require('./curriculum.js'); } catch (_) {} }
    if (cur && typeof cur.sectionForItem === 'function' && Array.isArray(cur.MATRIX)) {
      const sec = cur.sectionForItem(it);
      if (sec && sec.topic) {
        const row = cur.MATRIX.find(r => r.grade === it.grade && r.topic === sec.topic);
        if (row && row.topicId) return row.topicId;
      }
    }
    let prog = progModule || (typeof root !== 'undefined' && root.MM_PROGRESSION);
    if (!prog && typeof require === 'function') { try { prog = require('./curriculum/progression.js'); } catch (_) {} }
    if (prog && typeof prog.linksForSkill === 'function') {
      const lk = prog.linksForSkill(it.grade, it.standard || it.skill);
      if (lk && lk.topicId) return lk.topicId;
    }
    return null;
  }

  function orderTopics(topicList, progModule) {
    const list = Array.isArray(topicList) ? topicList.slice() : [];
    if (!list.length) return [];
    let prog = progModule || (typeof root !== 'undefined' && root.MM_PROGRESSION);
    if (!prog && typeof require === 'function') { try { prog = require('./curriculum/progression.js'); } catch (_) {} }
    const keys = (prog && prog.PREREQ) ? Object.keys(prog.PREREQ) : [];
    if (!keys.length) return list;
    const idOf = it => (!it ? '' : typeof it === 'string' ? it : String(it.topicId || it.id || ''));
    return list.sort((a, b) => {
      const ia = keys.indexOf(idOf(a)), ib = keys.indexOf(idOf(b));
      return (ia === -1 ? 9999 : ia) - (ib === -1 ? 9999 : ib);
    });
  }

  function sortItemsByProgression(items, progModule, curModule) {
    const list = Array.isArray(items) ? items.slice() : [];
    if (!list.length) return [];
    let prog = progModule || (typeof root !== 'undefined' && root.MM_PROGRESSION);
    if (!prog && typeof require === 'function') { try { prog = require('./curriculum/progression.js'); } catch (_) {} }
    const keys = (prog && prog.PREREQ) ? Object.keys(prog.PREREQ) : [];
    if (!keys.length) return list;
    return list.sort((a, b) => {
      const ta = topicIdForItem(a, curModule, prog), tb = topicIdForItem(b, curModule, prog);
      const ia = ta ? keys.indexOf(ta) : -1, ib = tb ? keys.indexOf(tb) : -1;
      return (ia === -1 ? 9999 : ia) - (ib === -1 ? 9999 : ib);
    });
  }

  function createDiagnosticBlocks(items, options) {
    const rawList = Array.isArray(items) ? items : [];
    if (!rawList.length) return [];
    const opts = options || {};
    const list = sortItemsByProgression(rawList, opts.progressionModule, opts.curriculumModule);
    const blockSize = Math.min(MAX_DIAGNOSTIC_BLOCK_SIZE, Math.max(1, Number(opts.maxBlockSize) || MAX_DIAGNOSTIC_BLOCK_SIZE));
    const grade = opts.grade || (list[0] && list[0].grade) || 'א', blocks = [];

    for (let i = 0; i < list.length; i += blockSize) {
      const slice = list.slice(i, i + blockSize).map(function (it, idx, arr) {
        const copy = Object.assign({}, it);
        if (idx === arr.length - 1) { copy.noMusic = true; copy.plain = true; }
        return copy;
      });
      blocks.push({
        index: blocks.length + 1, totalBlocks: Math.ceil(list.length / blockSize), grade: grade, items: slice, count: slice.length,
        spokenExplanation: 'בואו נשחק ונפתור ביחד! ' + slice.length + ' תרגילים קצרים עם מוזיקה.',
        hasSpokenExplanation: true, isPlayEmbedded: true, immediateFeedback: true, hasUnassistedItem: slice.some(it => it.noMusic)
      });
    }
    return blocks;
  }

  function checkPrerequisites(topicIdOrSkill, tracker, progModule, skillKey, curModule) {
    let prog = progModule || (typeof root !== 'undefined' && root.MM_PROGRESSION);
    if (!prog && typeof require === 'function') { try { prog = require('./curriculum/progression.js'); } catch (_) {} }
    if (!prog) return { ok: false, topicId: topicIdOrSkill, prereq: [], missing: ['prog_missing'], redirectTo: null, redirectTopicTitle: '' };

    const first = String(topicIdOrSkill || '');
    let links = null, actualTopicId = first;
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

    if (!links) return { ok: false, topicId: actualTopicId, prereq: [], missing: ['unknown_topic'], redirectTo: null, redirectTopicTitle: '' };
    if (!Array.isArray(links.prereq) || !links.prereq.length) return { ok: true, topicId: actualTopicId, prereq: [], missing: [], redirectTo: null, redirectTopicTitle: '' };

    const isMastered = id => Boolean(tracker && (typeof tracker.isMastered === 'function' ? tracker.isMastered(id) : tracker[id]));
    const missing = links.prereq.filter(pId => !isMastered(pId));
    if (missing.length === 0) return { ok: true, topicId: actualTopicId, prereq: links.prereq, missing: [], redirectTo: null, redirectTopicTitle: '' };

    const sortedMissing = orderTopics(missing, prog);
    function findDeepestMissing(currId, visited) {
      const seen = visited || new Set();
      if (seen.has(currId)) return currId;
      seen.add(currId);
      const currLinks = typeof prog.linksForTopic === 'function' ? prog.linksForTopic(currId) : null;
      if (!currLinks || !Array.isArray(currLinks.prereq) || !currLinks.prereq.length) return currId;
      for (let i = 0; i < currLinks.prereq.length; i++) {
        const parentId = currLinks.prereq[i];
        if (!isMastered(parentId)) return findDeepestMissing(parentId, seen);
      }
      return currId;
    }

    const deepest = findDeepestMissing(sortedMissing[0]);
    return { ok: false, topicId: actualTopicId, prereq: links.prereq, missing: missing, redirectTo: deepest, redirectTopicTitle: topicTitle(deepest, curModule) };
  }

  function openTopic(topicConfig, options) {
    const t0 = root.performance && root.performance.now ? root.performance.now() : Date.now();
    const cfg = topicConfig || {}, opts = options || {}, grade = cfg.grade || opts.grade || 'א';
    const topicId = cfg.id || cfg.topicId || cfg.topic || 'mm-cur-0';
    const prereqCheck = checkPrerequisites(topicId, opts.tracker, opts.progressionModule, null, opts.curriculumModule);
    const items = Array.isArray(cfg.items) ? cfg.items : (Array.isArray(cfg) ? cfg : []);
    const blocks = createDiagnosticBlocks(items, {
      grade: grade, maxBlockSize: MAX_DIAGNOSTIC_BLOCK_SIZE,
      progressionModule: opts.progressionModule, curriculumModule: opts.curriculumModule
    });
    const firstBlock = blocks[0] || null;
    if (firstBlock && firstBlock.spokenExplanation && typeof opts.speak === 'function') opts.speak(firstBlock.spokenExplanation);

    const elapsedMs = Math.max(0, (root.performance && root.performance.now ? root.performance.now() : Date.now()) - t0);
    return {
      grade: grade, topicId: topicId, playableImmediately: prereqCheck.ok, prereqCheck: prereqCheck,
      redirectTo: prereqCheck.redirectTo, redirectTopicTitle: prereqCheck.redirectTopicTitle || topicTitle(prereqCheck.redirectTo, opts.curriculumModule),
      timeToFirstExerciseMs: elapsedMs, withinTargetLatency: elapsedMs <= MAX_START_LATENCY_MS,
      hasSelfReport: isSelfReportAllowed(grade) && Boolean(opts.allowSelfReport),
      blocks: blocks, firstBlock: firstBlock, firstExercise: (firstBlock && firstBlock.items && firstBlock.items[0]) || null,
      allItems: blocks.reduce((acc, b) => acc.concat(b.items), [])
    };
  }

  return {
    MAX_DIAGNOSTIC_BLOCK_SIZE, MAX_START_LATENCY_MS, normalizeGrade, isSelfReportAllowed,
    topicTitle, topicIdForItem, orderTopics, sortItemsByProgression, createDiagnosticBlocks, checkPrerequisites, openTopic
  };
});
