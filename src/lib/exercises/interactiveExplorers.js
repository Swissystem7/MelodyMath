// MelodyMath — Interactive Explorer Exercises (Issue #688, Refs #665).
// Transforms passive exploratory tools into active curriculum exercises:
// 1. Singing Number Line (ישר מספרים מנגן עם פעמוני שבר / אחוז)
// 2. Groups × Size (קבוצות כפל עם פעימות צליל)
// 3. Even/Odd Rhythm (זוגי/אי-זוגי עם פעימות בזוגות)
// Criteria: <= 15 words per prompt, audio replay + second try on error, animation on success.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_INTERACTIVE_EXPLORERS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const EXERCISE_KINDS = {
    SINGING_LINE: 'singing_line',
    GROUPS_MULT: 'groups_mult',
    EVEN_ODD: 'even_odd'
  };

  function countWords(str) {
    if (!str) return 0;
    return String(str).trim().split(/\s+/).filter(Boolean).length;
  }

  function validateExerciseCard(ex) {
    if (!ex) return { valid: false, reason: 'missing exercise' };
    const words = countWords(ex.prompt);
    if (words > 15) return { valid: false, reason: 'prompt exceeds 15 words: ' + words };
    if (!ex.standard) return { valid: false, reason: 'missing curriculum standard' };
    if (!ex.kind || !Object.values(EXERCISE_KINDS).includes(ex.kind)) {
      return { valid: false, reason: 'unrecognized explorer kind: ' + ex.kind };
    }
    return { valid: true, wordCount: words };
  }

  function createSingingLineExercise(opts) {
    const o = opts || {};
    const isPercent = o.grade === 'ו' || Boolean(o.isPercent);
    const pct = o.pct != null ? o.pct : 50;
    const fraction = o.fraction || (pct === 25 ? '1/4' : pct === 50 ? '1/2' : pct === 75 ? '3/4' : '1');
    const percentStr = pct + '%';
    const prompt = o.prompt || (isPercent
      ? (pct === 50 ? 'איזה אחוז שווה לשבר 1/2 על ישר המספרים?' : pct === 25 ? 'איזה אחוז שווה לשבר 1/4 על ישר המספרים?' : 'איזה אחוז נמצא בנקודה ' + pct + '% על הישר?')
      : (pct === 50 ? 'איזה שבר נמצא באמצע הדרך על ישר המספרים?' : pct === 25 ? 'איזה שבר נמצא ברבע הדרך על ישר המספרים?' : pct === 75 ? 'איזה שבר נמצא בשלושה רבעים מהדרך על ישר המספרים?' : 'איזה שבר נמצא בסוף ישר המספרים?'));
    return {
      id: o.id || ('singing-line-' + (isPercent ? 'pct-' : '') + pct),
      grade: isPercent ? 'ו' : 'ד',
      skill: isPercent ? 'percent' : 'fractions',
      kind: EXERCISE_KINDS.SINGING_LINE,
      standard: o.standard || (isPercent ? 'אחוזים — הקשר בין שבר פשוט, שבר עשרוני ואחוז' : 'שבר כחלק משלם — 1/2, 1/4, 1/8 מול תיבה 4/4'),
      pct: pct,
      prompt: prompt,
      answer: o.answer || (isPercent ? percentStr : fraction),
      hint: o.hint || (isPercent ? 'בכיתה ו׳ שבר של ' + (pct === 50 ? 'חצי' : 'רבע') + ' שווה ל־' + percentStr : (pct === 50 ? 'הקשיבו לפעמון השבר באמצע הדרך' : pct === 25 ? 'הקשיבו לפעמון השבר ברבע הדרך' : 'הקשיבו לפעמון השבר על ישר המספרים')),
      wordCount: countWords(prompt),
      hasMusic: true,
      visualKind: 'glow_line'
    };
  }

  function createGroupsMultExercise(opts) {
    const o = opts || {};
    const groups = o.groups || 4;
    const size = o.size || 3;
    const total = groups * size;
    const prompt = 'יש ' + groups + ' קבוצות של ' + size + ' פעימות. כמה בסך הכל?';
    return {
      id: o.id || 'groups-mult-' + groups + 'x' + size,
      grade: o.grade || 'ב',
      skill: 'multiplication',
      kind: EXERCISE_KINDS.GROUPS_MULT,
      standard: o.standard || 'כפולות 2, 4, 5 ו־10 עד סוף כיתה ב׳',
      groups: groups,
      size: size,
      prompt: prompt,
      answer: total,
      hint: groups + ' כפול ' + size + ' שווה ' + total,
      wordCount: countWords(prompt),
      hasMusic: true,
      visualKind: 'repeat_group'
    };
  }

  function createEvenOddExercise(opts) {
    const o = opts || {};
    const count = o.count != null ? o.count : 6;
    const isEven = count % 2 === 0;
    const answer = isEven ? 'זוגי' : 'אי-זוגי';
    const prompt = 'האם ' + count + ' פעימות הן מספר זוגי או אי-זוגי?';
    return {
      id: o.id || 'even-odd-' + count,
      grade: o.grade || 'ב',
      skill: 'place_value',
      kind: EXERCISE_KINDS.EVEN_ODD,
      standard: o.standard || 'מבנה עשרוני עד 1,000 — מאות/עשרות/יחידות, זוגי/אי־זוגי, השוואה',
      count: count,
      isEven: isEven,
      prompt: prompt,
      answer: answer,
      hint: isEven ? count + ' מתחלק לזוגות שלמים' : 'נשארת פעימה אחת ללא זוג',
      wordCount: countWords(prompt),
      hasMusic: true,
      visualKind: 'pairs_pulse'
    };
  }

  function renderExplorerWidget(container, exercise, options) {
    if (!container || !exercise) return;
    const opts = options || {};
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'explorer-exercise-widget explorer-widget-' + exercise.kind;

    if (exercise.kind === EXERCISE_KINDS.SINGING_LINE) {
      const isPct = exercise.grade === 'ו' || exercise.skill === 'percent';
      wrapper.innerHTML = `
        <div class="nl-control" style="margin:8px 0;"><input type="range" class="explorer-line-slider" min="0" max="100" value="${exercise.pct}" aria-label="ישר מספרים מנגן" style="width:100%;min-height:44px;"></div>
        <div class="nl-keys" role="group" aria-label="נקודות ${isPct ? 'אחוז' : 'שבר'} על הישר" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">
          ${[0, 25, 50, 75, 100].map((p, idx) => {
            const label = isPct ? (p + '%') : (p === 0 ? '0' : p === 25 ? '1/4' : p === 50 ? '1/2' : p === 75 ? '3/4' : '1');
            const freqs = [261.63, 293.66, 329.63, 392.00, 523.25];
            const hz = freqs[idx];
            return `<button type="button" class="secondary line-tick-btn" data-tap="woodBar" data-step="${idx}" data-hz="${hz}" data-pct="${p}" data-val="${label}" style="min-width:44px;min-height:44px;">${label}</button>`;
          }).join('')}
        </div>`;
      wrapper.querySelectorAll('.line-tick-btn').forEach(btn => {
        btn.onclick = () => {
          if (typeof opts.onSelect === 'function') opts.onSelect(btn.dataset.val);
          if (typeof opts.playFreq === 'function') opts.playFreq(Number(btn.dataset.pct));
        };
      });
    } else if (exercise.kind === EXERCISE_KINDS.GROUPS_MULT) {
      const g = exercise.groups || 3, s = exercise.size || 4;
      let dots = '';
      for (let i = 0; i < g; i++) {
        dots += '<div class="explorer-group" style="display:inline-flex;gap:4px;padding:6px;border:2px dashed var(--purple);border-radius:10px;margin:4px;">';
        for (let j = 0; j < s; j++) dots += '<button type="button" class="explorer-dot-btn" data-tap="drumLow" aria-label="פעימה" style="display:inline-block;width:20px;height:20px;border-radius:50%;background:var(--pink);border:0;cursor:pointer;padding:0;"></button>';
        dots += '</div>';
      }
      wrapper.innerHTML = `<div class="groups-container" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:10px 0;">${dots}</div>`;
    } else if (exercise.kind === EXERCISE_KINDS.EVEN_ODD) {
      const n = exercise.count || 6, pairs = Math.floor(n / 2), leftover = n % 2;
      let pairsHtml = '';
      for (let i = 0; i < pairs; i++) pairsHtml += '<div class="explorer-pair" style="display:inline-flex;gap:4px;padding:4px 8px;border:2px solid var(--good);border-radius:12px;background:#e5f6ef;margin:4px;"><span style="font-size:1.2rem;">🥁</span><span style="font-size:1.2rem;">🥁</span></div>';
      if (leftover) pairsHtml += '<div class="explorer-lone" style="display:inline-flex;padding:4px 8px;border:2px dashed var(--bad);border-radius:12px;background:#ffe8ed;margin:4px;"><span style="font-size:1.2rem;">🥁</span></div>';
      wrapper.innerHTML = `
        <div class="pairs-container" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:10px 0;">${pairsHtml}</div>
        <div class="even-odd-choices" style="display:flex;gap:12px;justify-content:center;margin-top:10px;">
          <button type="button" class="secondary eo-choice-btn" data-choice="זוגי" data-tap="metalBell" data-step="0" data-hz="329.63" style="min-width:70px;min-height:44px;">זוגי</button>
          <button type="button" class="secondary eo-choice-btn" data-choice="אי-זוגי" data-tap="metalBell" data-step="2" data-hz="440.00" style="min-width:70px;min-height:44px;">אי-זוגי</button>
        </div>`;
      wrapper.querySelectorAll('.eo-choice-btn').forEach(btn => {
        btn.onclick = () => { if (typeof opts.onSelect === 'function') opts.onSelect(btn.dataset.choice); };
      });
    }
    container.appendChild(wrapper);
  }

  return {
    EXERCISE_KINDS: EXERCISE_KINDS,
    countWords: countWords,
    validateExerciseCard: validateExerciseCard,
    createSingingLineExercise: createSingingLineExercise,
    createGroupsMultExercise: createGroupsMultExercise,
    createEvenOddExercise: createEvenOddExercise,
    renderExplorerWidget: renderExplorerWidget
  };
});
