// MelodyMath — FamilyJam: 3-minute parent-and-kid round at home (Refs #891, Refs #591).
// Berkowitz et al. (2015), Science 350(6257), 196-198.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_FAMILY_JAM = api;
  if (typeof document !== 'undefined' && document.getElementById('familyJamCard')) {
    api.mount(document.getElementById('familyJamCard'));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  function need(p) { try { return require(p); } catch (e) { return null; } }
  const JAM = (root && root.MM_JAM) || need('./jamKit.js');
  const MY = (root && root.MM_MY_INSTRUMENT) || need('../lib/myInstrument.js');
  const INST = (root && typeof root.instrumentById === 'function') ? root : need('../lib/instruments.js');
  const BANKS = (root && typeof root.itemsForGrade === 'function') ? root : need('../lib/banks.js');
  const GAME = 'familyJam';

  const PARENT_PROMPTS = ['שאלו: איך הגעת לתשובה?', 'שאלו: מה עזר לך לגלות?', 'שאלו: איך אפשר להסביר את זה?'];

  const PAIRS = {
    darbuka: 'djembe', djembe: 'darbuka', tabla: 'mridangam', mridangam: 'tabla', cajon: 'conga', conga: 'cajon',
    taiko: 'surdo', surdo: 'taiko', bodhran: 'riq', riq: 'bodhran', marimba: 'balafon', balafon: 'marimba',
    handbells: 'steelPan', steelPan: 'handbells', claves: 'gankogui', gankogui: 'claves', kalimba: 'mbira', mbira: 'kalimba',
    violin: 'guitar', guitar: 'violin', oud: 'qanun', qanun: 'oud', kora: 'charango', charango: 'kora',
    koto: 'guzheng', guzheng: 'koto', erhu: 'balalaika', balalaika: 'erhu', ukulele: 'guitar',
    recorder: 'panFlute', panFlute: 'recorder', ney: 'shakuhachi', shakuhachi: 'ney', shofar: 'didgeridoo', didgeridoo: 'shofar',
    dizi: 'bagpipes', bagpipes: 'dizi', piano: 'accordion', accordion: 'piano', harmonium: 'pipeOrgan', pipeOrgan: 'harmonium'
  };

  function getComplementaryInstrument(kidInstId) {
    const kid = (INST && INST.instrumentById) ? INST.instrumentById(kidInstId) : null;
    const kidFamily = kid ? kid.family : 'percussion';
    if (PAIRS[kidInstId]) {
      const p = INST.instrumentById(PAIRS[kidInstId]);
      if (p && p.family === kidFamily) return p.id;
    }
    if (INST && typeof INST.byFamily === 'function') {
      const same = INST.byFamily(kidFamily).filter((x) => x.id !== kidInstId);
      if (same.length) return same[0].id;
    }
    return kidFamily === 'percussion' ? 'djembe' : 'darbuka';
  }

  function getSecondFamily(family) { return family === 'percussion' ? 'keys' : 'percussion'; }
  function getSecondFamilyInstrument(firstFamily) { return getSecondFamily(firstFamily) === 'keys' ? 'piano' : 'darbuka'; }

  function numberToNotes(n, voice, baseAt) {
    baseAt = baseAt || 0;
    const num = Math.max(1, Math.min(100, Math.round(Number(n) || 1)));
    if (num <= 12) return Array.from({ length: num }, (_, i) => ({ at: baseAt + i * 0.18, voice, hz: 261.63, dur: 0.12 }));
    const tens = Math.floor(num / 10), ones = num % 10, notes = [];
    let curAt = baseAt;
    for (let t = 0; t < tens; t++) { notes.push({ at: curAt, voice, hz: 130.81, held: true, dur: 0.32, gain: 0.45 }); curAt += 0.35; }
    for (let o = 0; o < ones; o++) { notes.push({ at: curAt, voice, hz: 261.63, dur: 0.12 }); curAt += 0.18; }
    return notes;
  }

  function itemToNotes(item, voice) {
    const nums = (String(item && item.prompt || '').match(/\d+/g) || []).map(Number);
    if (!nums.length) return [{ at: 0, voice, hz: 261.63, dur: 0.25 }];
    const notes = [];
    let curAt = 0;
    nums.slice(0, 2).forEach((n) => {
      const sub = numberToNotes(n, voice, curAt);
      notes.push(...sub);
      curAt = (sub.length ? sub[sub.length - 1].at : curAt) + 0.35;
    });
    return notes;
  }

  function pickTodayTopic(opts) {
    if (opts && opts.topic) return opts.topic;
    if (root && root.rmPlanTopic) return root.rmPlanTopic;
    try {
      if (root && root.mmLastDiag && root.mmLastDiag.perSkill && root.mmLastDiag.perSkill.length) return root.mmLastDiag.perSkill[0].skill;
    } catch (e) {}
    return 'addition';
  }

  function generateChoices(ans) {
    const a = Math.round(Number(ans)) || 4;
    const set = [a, a + 1, a - 1, a + 2].filter((x, i, arr) => x >= 0 && arr.indexOf(x) === i);
    if (set.length < 4) set.push(a + 3);
    return set.slice(0, 4).sort((x, y) => x - y);
  }

  function pickFamilyJamItems(topic, count, banksApi) {
    const B = banksApi || BANKS, cnt = count || 3;
    let list = [];
    if (B && typeof B.allItems === 'function') {
      list = B.allItems().filter((it) => {
        if (!it || it.noMusic) return false;
        const skillMatch = !topic || it.skill === topic || it.standard === topic || (it.topicId && it.topicId.indexOf(topic) >= 0);
        return skillMatch && ((it.musicWay && !it.musicWay.optional) || !it.musicWay);
      });
      if (list.length < cnt) list = list.concat(B.allItems().filter((it) => it && !it.noMusic));
    }
    if (!list.length) {
      list = [
        { id: 'fj-1', prompt: '3 + 4 = ?', answer: 7, musicWay: { mechanism: 'M1' } },
        { id: 'fj-2', prompt: '5 + 2 = ?', answer: 7, musicWay: { mechanism: 'M1' } },
        { id: 'fj-3', prompt: '6 + 3 = ?', answer: 9, musicWay: { mechanism: 'M1' } }
      ];
    }
    return list.slice(0, cnt).map((it, idx) => {
      const numAns = Math.round(Number(it.answer)) || 5;
      return {
        id: it.id || ('fj-item-' + (idx + 1)),
        prompt: it.prompt || ('2 + ' + (idx + 2) + ' = ?'),
        answer: numAns,
        choices: generateChoices(numAns),
        parentPrompt: PARENT_PROMPTS[idx % PARENT_PROMPTS.length],
        musicWay: it.musicWay || { mechanism: 'M1' }
      };
    });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  function createState(opts) {
    opts = opts || {};
    const storage = opts.storage || (root && root.localStorage);
    const kidInstId = (opts && opts.instrument) || (MY && typeof MY.getMyInstrument === 'function' ? MY.getMyInstrument(storage) : null) || 'darbuka';
    const parentInstId = getComplementaryInstrument(kidInstId);
    const topic = pickTodayTopic(opts);
    const items = pickFamilyJamItems(topic, 3, opts.banks);
    const showMusic = (JAM && typeof JAM.loadShowMusic === 'function') ? JAM.loadShowMusic(GAME, storage) : true;
    const kidData = (INST && INST.instrumentById) ? INST.instrumentById(kidInstId) : null;
    const parentData = (INST && INST.instrumentById) ? INST.instrumentById(parentInstId) : null;
    const kidFamily = kidData ? kidData.family : 'percussion';
    const parentFamily = parentData ? parentData.family : kidFamily;
    const secInstId = getSecondFamilyInstrument(kidFamily);
    const secData = (INST && INST.instrumentById) ? INST.instrumentById(secInstId) : null;
    const secFamily = secData ? secData.family : getSecondFamily(kidFamily);
    const kidObj = (JAM && JAM.instrument) ? JAM.instrument(kidInstId, 'drumLow') : { id: kidInstId, he: 'דרבוקה', voice: 'drumLow' };
    const parentObj = (JAM && JAM.instrument) ? JAM.instrument(parentInstId, 'drumHigh') : { id: parentInstId, he: 'ג׳מבה', voice: 'drumHigh' };
    const secObj = (JAM && JAM.instrument) ? JAM.instrument(secInstId, 'keys') : { id: secInstId, he: 'פסנתר', voice: 'keys' };
    return {
      topic, items, itemIndex: 0,
      kidInstrument: Object.assign({}, kidObj, { family: kidFamily }),
      parentInstrument: Object.assign({}, parentObj, { family: parentFamily }),
      secondFamilyInstrument: Object.assign({}, secObj, { family: secFamily }),
      showMusic, stage: 'quiz', feedbackText: '', isCorrect: null, storage
    };
  }

  function renderHtml(state) {
    const on = state.showMusic;
    const toggle = (JAM && typeof JAM.musicToggleHtml === 'function') ? JAM.musicToggleHtml(on) : '<button type="button" class="secondary mm-music-toggle" data-act="music">' + (on ? '🎵 עם מוזיקה' : '🔇 בלי מוזיקה') + '</button>';
    let body = '';
    if (state.stage === 'quiz') {
      const it = state.items[state.itemIndex] || state.items[0];
      const countText = 'שאלה ' + (state.itemIndex + 1) + ' מתוך ' + state.items.length;
      const playBtnText = on ? 'מבוגר/ת: לחצו להשמעת השאלה 👂' : 'מבוגר/ת: קראו את השאלה 📖';
      const choicesHtml = (it.choices || []).map((c) => '<button type="button" class="choice" data-fj-choice="' + esc(c) + '">' + esc(c) + '</button>').join('');
      const fbClass = state.feedbackText ? (state.isCorrect ? 'good' : 'bad') : 'hidden';
      body = '<div class="topline"><span class="tag">' + esc(countText) + '</span></div>' +
        '<div class="mm-fj-parent-box" style="margin:10px 0;padding:10px;background:var(--card,#fff);border:1px solid var(--line,#ccc);border-radius:10px;" dir="rtl"><span class="tag" style="margin-bottom:6px;display:inline-block;">להורה</span><p class="mm-fj-parent-prompt" style="margin:0;font-size:1rem;font-weight:bold;">' + esc(it.parentPrompt) + '</p></div>' +
        '<button type="button" class="primary mm-fj-play-btn" data-fj-act="play" style="margin:8px 0;width:100%;">' + esc(playBtnText) + '</button>' +
        '<h3 class="prompt mm-fj-math-prompt" style="font-size:1.6rem;text-align:center;margin:12px 0;">' + esc(it.prompt) + '</h3>' +
        '<div class="choices mm-fj-choices" role="group" aria-label="תשובות אפשריות" style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:12px 0;">' + choicesHtml + '</div>' +
        '<div class="feedback ' + fbClass + '" role="status" aria-live="polite" style="margin-top:10px;">' + esc(state.feedbackText) + '</div>';
    } else {
      const finaleBtnText = on ? '🎶 נגינה משותפת של שני הכלים!' : '🌟 סיום חגיגי!';
      body = '<div class="topline"><span class="tag">סיום משותף</span></div><h3 style="margin:8px 0;">סיום משותף! 🥁🎷</h3><p>עניתם יחד על 3 השאלות! עכשיו מנגנים יחד בשני כלים מאותה משפחה:</p>' +
        '<div class="jam-row" role="group" aria-label="פדים לנגינה משותפת" style="display:flex;gap:12px;margin:14px 0;">' +
        '<button type="button" class="jam-pad" data-fj-pad="kid" style="flex:1;padding:14px;">🧒 הכלי שלי: ' + esc(state.kidInstrument.he) + '</button>' +
        '<button type="button" class="jam-pad" data-fj-pad="parent" style="flex:1;padding:14px;">🧑 כלי ההורה: ' + esc(state.parentInstrument.he) + '</button></div>' +
        '<button type="button" class="primary mm-fj-finale-btn" data-fj-act="finale" style="width:100%;margin-bottom:10px;">' + esc(finaleBtnText) + '</button>' +
        '<button type="button" class="secondary" data-fj-act="restart" style="width:100%;">סיבוב חדש</button>';
    }
    return '<div class="jam-head" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;">' +
      '<div><span class="tag">נגינה משותפת בבית · 3 דקות</span><h2 style="margin:4px 0 0;">FamilyJam 🎶 ג׳אם משפחתי</h2></div>' + toggle + '</div>' + body;
  }

  function mount(container, opts) {
    if (!container) return null;
    let state = createState(opts), activePlay = null;

    function stopAudio() {
      if (activePlay && typeof activePlay.stop === 'function') { try { activePlay.stop(); } catch (e) {} }
      activePlay = null;
    }

    function draw() { container.innerHTML = renderHtml(state); }

    container.addEventListener('click', (ev) => {
      const actBtn = ev.target.closest('[data-fj-act]');
      const musicBtn = ev.target.closest('[data-act="music"]');
      const choiceBtn = ev.target.closest('[data-fj-choice]');
      const padBtn = ev.target.closest('[data-fj-pad]');

      if (musicBtn) {
        stopAudio();
        state.showMusic = !state.showMusic;
        if (JAM && typeof JAM.saveShowMusic === 'function') JAM.saveShowMusic(GAME, state.showMusic, state.storage);
        draw();
        return;
      }
      if (actBtn) {
        const act = actBtn.getAttribute('data-fj-act');
        if (act === 'play') {
          stopAudio();
          if (state.showMusic && JAM && typeof JAM.playNotes === 'function') {
            const it = state.items[state.itemIndex] || state.items[0];
            activePlay = JAM.playNotes(itemToNotes(it, state.secondFamilyInstrument.voice));
          }
        } else if (act === 'finale') {
          stopAudio();
          if (state.showMusic && JAM && typeof JAM.playNotes === 'function') {
            const kVoice = state.kidInstrument.voice, pVoice = state.parentInstrument.voice;
            activePlay = JAM.playNotes([
              { at: 0.0, voice: kVoice, hz: 329.63, dur: 0.16 },
              { at: 0.22, voice: pVoice, hz: 261.63, dur: 0.16 },
              { at: 0.44, voice: kVoice, hz: 392.00, dur: 0.16 },
              { at: 0.66, voice: pVoice, hz: 293.66, dur: 0.16 },
              { at: 0.88, voice: kVoice, hz: 523.25, dur: 0.30 }
            ]);
          }
        } else if (act === 'restart') {
          stopAudio();
          state = createState(opts);
          draw();
        }
        return;
      }
      if (choiceBtn && state.stage === 'quiz') {
        stopAudio();
        const it = state.items[state.itemIndex] || state.items[0];
        const val = Math.round(Number(choiceBtn.getAttribute('data-fj-choice')));
        if (val === it.answer) {
          state.isCorrect = true;
          state.feedbackText = 'נכון מאוד! כל הכבוד! 🎉';
          if (state.showMusic && JAM && typeof JAM.feedback === 'function') JAM.feedback(true, true);
          draw();
          setTimeout(() => {
            if (state.itemIndex < state.items.length - 1) {
              state.itemIndex++;
              state.feedbackText = '';
              state.isCorrect = null;
            } else {
              state.stage = 'finale';
              state.feedbackText = '';
              state.isCorrect = null;
            }
            draw();
          }, 900);
        } else {
          state.isCorrect = false;
          state.feedbackText = 'לא נורא, נסו שוב 🙂';
          if (state.showMusic && JAM && typeof JAM.feedback === 'function') JAM.feedback(false, true);
          draw();
        }
        return;
      }
      if (padBtn) {
        stopAudio();
        const role = padBtn.getAttribute('data-fj-pad');
        const inst = role === 'parent' ? state.parentInstrument : state.kidInstrument;
        if (state.showMusic && JAM && typeof JAM.playNotes === 'function') {
          activePlay = JAM.playNotes([{ at: 0, voice: inst.voice, hz: role === 'parent' ? 261.63 : 329.63, dur: 0.25 }]);
        }
      }
    });

    if (root && typeof root.addEventListener === 'function') {
      root.addEventListener('mm:instrument', (ev) => {
        if (ev && ev.detail && ev.detail.id) {
          const kidInstId = ev.detail.id;
          const kidData = (INST && INST.instrumentById) ? INST.instrumentById(kidInstId) : null;
          const kidFamily = kidData ? kidData.family : 'percussion';
          const kidObj = (JAM && JAM.instrument) ? JAM.instrument(kidInstId, kidData ? kidData.voice : 'drumLow') : { id: kidInstId, he: kidData ? kidData.instrument.he : kidInstId, voice: kidData ? kidData.voice : 'drumLow' };
          state.kidInstrument = Object.assign({}, kidObj, { family: kidFamily });
          const parentInstId = getComplementaryInstrument(kidInstId);
          const parentData = (INST && INST.instrumentById) ? INST.instrumentById(parentInstId) : null;
          const parentFamily = parentData ? parentData.family : kidFamily;
          const parentObj = (JAM && JAM.instrument) ? JAM.instrument(parentInstId, parentData ? parentData.voice : 'drumHigh') : { id: parentInstId, he: parentData ? parentData.instrument.he : parentInstId, voice: parentData ? parentData.voice : 'drumHigh' };
          state.parentInstrument = Object.assign({}, parentObj, { family: parentFamily });
          draw();
        }
      });
    }

    draw();
    return { draw, stopAudio, getState: () => state };
  }

  return {
    GAME, PARENT_PROMPTS, PAIRS, getComplementaryInstrument, getSecondFamily,
    getSecondFamilyInstrument, numberToNotes, itemToNotes, pickTodayTopic,
    pickFamilyJamItems, createState, renderHtml, mount
  };
});
