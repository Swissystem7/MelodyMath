// MelodyMath — No-Music Mastery Check (Refs #681, Refs #665).
// Fades through sound → picture → symbol → plain check.
// Plain check has zero audio/musical cues ("עכשיו בלי להקה, רק אתם!").
// AudioContext is strictly suspended during plain check.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else {
    root.MelodyMathMasteryCheck = factory();
    if (typeof root.mountMasteryCheck === 'undefined') root.mountMasteryCheck = root.MelodyMathMasteryCheck.mountMasteryCheck;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STAGES = ['sound', 'picture', 'symbol', 'plain'];
  const STAGE_LABELS_HE = { sound: 'צליל ולהקה', picture: 'תמונה ודגם', symbol: 'סמל ומספר', plain: 'בלי להקה, רק אתם!' };

  function createTopicMastery(topicId, options) {
    const opts = options || {};
    return {
      topicId: String(topicId || ''), currentStage: opts.initialStage || 'sound',
      mastered: false, soundSolvedCount: 0, plainAttempts: 0, plainSuccesses: 0, history: []
    };
  }

  function recordAttempt(state, attempt) {
    const att = attempt || {};
    const stage = state.currentStage;
    const isCorrect = Boolean(att.correct);
    const isMuted = Boolean(att.muted);
    state.history.push({ stage, correct: isCorrect, muted: isMuted, timestamp: Date.now() });

    if (stage === 'sound') {
      if (isCorrect) {
        if (!isMuted) state.soundSolvedCount += 1;
        state.currentStage = 'picture';
        return { nextStage: 'picture', mastered: false, messageHe: 'מצוין! עכשיו בואו נראה את זה בתמונה' };
      }
      return { nextStage: 'sound', mastered: false, messageHe: 'בואו נקשיב שוב יחד' };
    }
    if (stage === 'picture') {
      if (isCorrect) {
        state.currentStage = 'symbol';
        return { nextStage: 'symbol', mastered: false, messageHe: 'יופי! עכשיו עם מספרים וסמלים' };
      }
      return { nextStage: 'picture', mastered: false, messageHe: 'נסתכל שוב על הדגם' };
    }
    if (stage === 'symbol') {
      if (isCorrect) {
        state.currentStage = 'plain';
        return { nextStage: 'plain', mastered: false, messageHe: 'נהדר! עכשיו בלי להקה, רק אתם!' };
      }
      return { nextStage: 'symbol', mastered: false, messageHe: 'נבדוק שוב את התרגיל' };
    }
    if (stage === 'plain') {
      state.plainAttempts += 1;
      if (isCorrect) {
        state.plainSuccesses += 1;
        state.mastered = true;
        return { nextStage: 'plain', mastered: true, messageHe: 'אלופים! פתרתם לגמרי בעצמכם!' };
      }
      state.mastered = false;
      state.currentStage = 'sound';
      return { nextStage: 'sound', mastered: false, messageHe: 'בואו ננגן את זה שוב עם הלהקה, ואז ננסה שוב בעצמכם!' };
    }
    return { nextStage: state.currentStage, mastered: state.mastered, messageHe: '' };
  }

  function getTopicReport(state) {
    const rate = state.plainAttempts > 0 ? state.plainSuccesses / state.plainAttempts : null;
    return {
      topicId: state.topicId, mastered: Boolean(state.mastered), currentStage: state.currentStage,
      soundSolvedCount: state.soundSolvedCount, hasSoundCoverage: state.soundSolvedCount > 0,
      plainAttempts: state.plainAttempts, plainSuccesses: state.plainSuccesses, plainSuccessRate: rate
    };
  }

  function renderPlainCheckHtml(item, options) {
    const opts = options || {}, it = item || {};
    const promptText = it.prompt || '';
    const choices = Array.isArray(it.choices) ? it.choices : [];
    if (opts.audioContext && typeof opts.audioContext.suspend === 'function') {
      try { opts.audioContext.suspend(); } catch (_) {}
    }
    let html = '<div class="mm-plain-mastery-check" role="region" aria-label="בדיקת שליטה ללא מוזיקה" dir="rtl">'
      + '<div class="plain-banner" style="background:#f1f5f9;padding:12px;border-radius:10px;margin-bottom:12px;border:1px solid #cbd5e1">'
      + '<h3 style="margin:0 0 4px;font-size:1.1rem;color:#0f172a">עכשיו בלי להקה, רק אתם!</h3>'
      + '<p style="margin:0;color:#475569;font-size:0.9rem">פתרו את התרגיל ללא צלילים או רמזים מוזיקליים</p></div>'
      + '<p class="plain-exercise-prompt" style="font-size:1.3rem;font-weight:700;margin:16px 0;text-align:center"><bdi dir="ltr">' + promptText + '</bdi></p>';
    if (choices.length > 0) {
      html += '<div class="plain-choices" role="group" aria-label="תשובות אפשריות" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">';
      choices.forEach(c => { html += '<button type="button" class="plain-choice-btn" data-plain-choice="' + c + '" style="min-width:48px;min-height:48px;padding:8px 16px;border-radius:8px;border:1px solid #94a3b8;background:#fff;font-size:1.1rem;cursor:pointer">' + c + '</button>'; });
      html += '</div>';
    } else {
      html += '<div class="plain-input-row" style="text-align:center;margin:12px 0">'
        + '<input type="text" class="plain-answer-input" aria-label="תשובה" style="font-size:1.2rem;padding:8px 12px;width:120px;text-align:center;border-radius:8px;border:1px solid #94a3b8" /> '
        + '<button type="button" class="plain-submit-btn primary" style="min-height:44px;padding:8px 16px;border-radius:8px;cursor:pointer">בדיקה</button></div>';
    }
    html += '</div>';
    return html;
  }

  function mountMasteryCheck(container, item, options) {
    if (!container) return null;
    const opts = options || {};
    if (opts.audioContext && typeof opts.audioContext.suspend === 'function') {
      try { opts.audioContext.suspend(); } catch (_) {}
    }
    container.innerHTML = renderPlainCheckHtml(item, opts);
    container.classList.remove('hidden');
    const input = container.querySelector('.plain-answer-input');
    const submit = container.querySelector('.plain-submit-btn');
    const choices = container.querySelectorAll('[data-plain-choice]');
    function answer(val) {
      const ok = (item && item.answer != null) ? String(val).trim() === String(item.answer).trim() : Boolean(val);
      if (typeof opts.onAnswer === 'function') opts.onAnswer(val, ok);
    }
    if (submit && input) {
      submit.onclick = () => answer(input.value);
      input.onkeydown = e => { if (e.key === 'Enter') answer(input.value); };
    }
    choices.forEach(btn => { btn.onclick = () => answer(btn.getAttribute('data-plain-choice')); });
    return { container, close: () => container.classList.add('hidden') };
  }

  function isTopicUnlocked(topicIdOrGrade, tracker, progModule, skillKey) {
    if (!progModule) return false;
    let links = null;
    const first = String(topicIdOrGrade || '');
    if (skillKey && typeof progModule.linksForSkill === 'function') links = progModule.linksForSkill(first, skillKey);
    else if (first.includes(':') && typeof progModule.linksForSkill === 'function') {
      const parts = first.split(':');
      links = progModule.linksForSkill(parts[0], parts[1]);
    } else if (typeof progModule.linksForTopic === 'function') links = progModule.linksForTopic(first);
    if (!links) return false;
    if (!Array.isArray(links.prereq) || links.prereq.length === 0) return true;
    return links.prereq.every(pId => tracker && tracker.isMastered(pId));
  }

  function orderTopics(topicList, progModule) {
    const list = Array.isArray(topicList) ? topicList.slice() : [];
    if (!list.length) return [];
    let prog = progModule;
    if (!prog && typeof root !== 'undefined' && root.MM_PROGRESSION) prog = root.MM_PROGRESSION;
    if (!prog && typeof require === 'function') {
      try { prog = require('./curriculum/progression.js'); } catch (_) {}
    }
    const keys = (prog && prog.PREREQ) ? Object.keys(prog.PREREQ) : [];
    if (!keys.length) return list;
    function idOf(it) {
      if (!it) return '';
      if (typeof it === 'string') return it;
      return String(it.topicId || it.id || '');
    }
    return list.sort((a, b) => {
      const ia = keys.indexOf(idOf(a));
      const ib = keys.indexOf(idOf(b));
      return (ia === -1 ? 9999 : ia) - (ib === -1 ? 9999 : ib);
    });
  }

  function getNextUnlockedTopics(tracker, progModule) {
    let prog = progModule;
    if (!prog && typeof root !== 'undefined' && root.MM_PROGRESSION) prog = root.MM_PROGRESSION;
    if (!prog && typeof require === 'function') {
      try { prog = require('./curriculum/progression.js'); } catch (_) {}
    }
    if (!prog || !prog.PREREQ) return [];
    const keys = Object.keys(prog.PREREQ);
    const result = [];
    for (let i = 0; i < keys.length; i++) {
      const tid = keys[i];
      const mastered = tracker && typeof tracker.isMastered === 'function' && tracker.isMastered(tid);
      if (!mastered && isTopicUnlocked(tid, tracker, prog)) result.push(tid);
    }
    return result;
  }

  function createMasteryTracker() {
    const topics = new Map();
    return {
      get: id => { if (!topics.has(id)) topics.set(id, createTopicMastery(id)); return topics.get(id); },
      record: function (id, attempt) { return recordAttempt(this.get(id), attempt); },
      isMastered: function (id) { return Boolean(this.get(id).mastered); },
      isUnlocked: function (id, progModule, skillKey) { return isTopicUnlocked(id, this, progModule, skillKey); },
      orderTopics: function (topicList, progModule) { return orderTopics(topicList, progModule); },
      getNextUnlocked: function (progModule) { return getNextUnlockedTopics(this, progModule); },
      getReport: function (id) { return getTopicReport(this.get(id)); },
      getAllReports: () => { const rep = []; topics.forEach(s => rep.push(getTopicReport(s))); return rep; }
    };
  }

  return {
    STAGES, STAGE_LABELS_HE, createTopicMastery, recordAttempt,
    getTopicReport, renderPlainCheckHtml, mountMasteryCheck,
    isTopicUnlocked, orderTopics, getNextUnlockedTopics, createMasteryTracker
  };
});
