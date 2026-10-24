// MelodyMath — No-Music Mastery Check (Refs #681, Refs #665).
// Each topic fades through sound → picture → symbol → plain check.
// Plain check has zero audio/musical cues ("עכשיו בלי להקה, רק אתה!").
// Mastery is only awarded after passing the plain check.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MelodyMathMasteryCheck = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STAGES = ['sound', 'picture', 'symbol', 'plain'];

  const STAGE_LABELS_HE = {
    sound: 'צליל ולהקה',
    picture: 'תמונה ודגם',
    symbol: 'סמל ומספר',
    plain: 'בלי להקה, רק אתה!'
  };

  function createTopicMastery(topicId, options) {
    const opts = options || {};
    return {
      topicId: String(topicId || ''),
      currentStage: opts.initialStage || 'sound',
      mastered: false,
      soundSolvedCount: 0,
      plainAttempts: 0,
      plainSuccesses: 0,
      history: []
    };
  }

  function recordAttempt(state, attempt) {
    const att = attempt || {};
    const stage = att.stage || state.currentStage;
    const isCorrect = !!att.correct;
    const isMuted = !!att.muted;

    const record = {
      stage: stage,
      correct: isCorrect,
      muted: isMuted,
      timestamp: Date.now()
    };
    state.history.push(record);

    if (stage === 'sound') {
      if (isCorrect) {
        if (!isMuted) {
          state.soundSolvedCount += 1;
        }
        state.currentStage = 'picture';
        return {
          nextStage: 'picture',
          mastered: false,
          messageHe: 'מצוין! עכשיו בוא נראה את זה בתמונה'
        };
      }
      return {
        nextStage: 'sound',
        mastered: false,
        messageHe: 'בוא נקשיב שוב יחד'
      };
    }

    if (stage === 'picture') {
      if (isCorrect) {
        state.currentStage = 'symbol';
        return {
          nextStage: 'symbol',
          mastered: false,
          messageHe: 'יופי! עכשיו עם מספרים וסמלים'
        };
      }
      return {
        nextStage: 'picture',
        mastered: false,
        messageHe: 'נסתכל שוב על הדגם'
      };
    }

    if (stage === 'symbol') {
      if (isCorrect) {
        state.currentStage = 'plain';
        return {
          nextStage: 'plain',
          mastered: false,
          messageHe: 'נהדר! עכשיו בלי להקה, רק אתה!'
        };
      }
      return {
        nextStage: 'symbol',
        mastered: false,
        messageHe: 'נבדוק שוב את התרגיל'
      };
    }

    if (stage === 'plain') {
      state.plainAttempts += 1;
      if (isCorrect) {
        state.plainSuccesses += 1;
        state.mastered = true;
        return {
          nextStage: 'plain',
          mastered: true,
          messageHe: 'אלופים! פתרתם לגמרי בעצמכם!'
        };
      }
      // Failure routes back to musical version, never scolding or failing
      state.mastered = false;
      state.currentStage = 'sound';
      return {
        nextStage: 'sound',
        mastered: false,
        messageHe: 'בוא ננגן את זה שוב עם הלהקה, ואז ננסה שוב בעצמך!'
      };
    }

    return { nextStage: state.currentStage, mastered: state.mastered, messageHe: '' };
  }

  function getTopicReport(state) {
    const rate = state.plainAttempts > 0 ? state.plainSuccesses / state.plainAttempts : null;
    return {
      topicId: state.topicId,
      mastered: !!state.mastered,
      currentStage: state.currentStage,
      soundSolvedCount: state.soundSolvedCount,
      hasSoundCoverage: state.soundSolvedCount > 0,
      plainAttempts: state.plainAttempts,
      plainSuccesses: state.plainSuccesses,
      plainSuccessRate: rate
    };
  }

  function renderPlainCheckHtml(item, options) {
    const opts = options || {};
    const it = item || {};
    const promptText = it.prompt || '';
    const choices = Array.isArray(it.choices) ? it.choices : [];

    // Audio context must be suspended during plain check
    if (opts.audioContext && typeof opts.audioContext.suspend === 'function') {
      try { opts.audioContext.suspend(); } catch (_) {}
    }

    let html = '<div class="mm-plain-mastery-check" role="region" aria-label="בדיקת שליטה ללא מוזיקה" dir="rtl">';
    html += '<div class="plain-banner" style="background:#f1f5f9;padding:12px;border-radius:10px;margin-bottom:12px;border:1px solid #cbd5e1">';
    html += '<h3 style="margin:0 0 4px;font-size:1.1rem;color:#0f172a">עכשיו בלי להקה, רק אתה!</h3>';
    html += '<p style="margin:0;color:#475569;font-size:0.9rem">פתרו את התרגיל ללא צלילים או רמזים מוזיקליים</p>';
    html += '</div>';

    html += '<p class="plain-exercise-prompt" style="font-size:1.3rem;font-weight:700;margin:16px 0;text-align:center"><bdi dir="ltr">' + promptText + '</bdi></p>';

    if (choices.length > 0) {
      html += '<div class="plain-choices" role="group" aria-label="תשובות אפשריות" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">';
      choices.forEach(function (c) {
        html += '<button type="button" class="plain-choice-btn" data-plain-choice="' + c + '" style="min-width:48px;min-height:48px;padding:8px 16px;border-radius:8px;border:1px solid #94a3b8;background:#fff;font-size:1.1rem;cursor:pointer">' + c + '</button>';
      });
      html += '</div>';
    } else {
      html += '<div class="plain-input-row" style="text-align:center;margin:12px 0">';
      html += '<input type="text" class="plain-answer-input" aria-label="תשובה" style="font-size:1.2rem;padding:8px 12px;width:120px;text-align:center;border-radius:8px;border:1px solid #94a3b8" /> ';
      html += '<button type="button" class="plain-submit-btn primary" style="min-height:44px;padding:8px 16px;border-radius:8px;cursor:pointer">בדיקה</button>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function createMasteryTracker() {
    const topics = new Map();
    return {
      get: function (topicId) {
        if (!topics.has(topicId)) {
          topics.set(topicId, createTopicMastery(topicId));
        }
        return topics.get(topicId);
      },
      record: function (topicId, attempt) {
        const t = this.get(topicId);
        return recordAttempt(t, attempt);
      },
      isMastered: function (topicId) {
        return this.get(topicId).mastered;
      },
      getReport: function (topicId) {
        return getTopicReport(this.get(topicId));
      },
      getAllReports: function () {
        const rep = [];
        topics.forEach(function (state) {
          rep.push(getTopicReport(state));
        });
        return rep;
      }
    };
  }

  return {
    STAGES: STAGES,
    STAGE_LABELS_HE: STAGE_LABELS_HE,
    createTopicMastery: createTopicMastery,
    recordAttempt: recordAttempt,
    getTopicReport: getTopicReport,
    renderPlainCheckHtml: renderPlainCheckHtml,
    createMasteryTracker: createMasteryTracker
  };
});
