// MelodyMath — NoteLengthLineScreen: Claude Design pixel-faithful Screen 2a. Refs #591 #665 #891.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_NOTE_LENGTH_LINE_SCREEN = api;
  if (typeof document !== 'undefined' && document.getElementById('nllCard')) api.mount(document.getElementById('nllCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const NLL = root.MM_NOTE_LENGTH_LINE || require('../lib/noteLengthLine.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const MINE = root.MM_MY_INSTRUMENT || require('../lib/myInstrument.js');
  const GAME = 'noteLengthLine', DEFAULT_INSTRUMENT = 'ukulele', STEPS = 1000;
  const NOTES = [
    { name: 'שלמה', frac: '1', e: 8, c: '#B9A5FF' },
    { name: 'חצי', frac: '1/2', e: 4, c: '#5EC8FF' },
    { name: 'רבע', frac: '1/4', e: 2, c: '#2ED3A8' },
    { name: 'שמינית', frac: '1/8', e: 1, c: '#FF8A3D' }
  ];
  const NTARGETS = [6, 5, 7, 4];

  function fr8(e) {
    if (e === 0) return '0';
    if (e === 8) return '1';
    const g = e % 4 === 0 ? 4 : e % 2 === 0 ? 2 : 1;
    return (e / g) + '/' + (8 / g);
  }

  function createState(index, showMusic) {
    const n = NLL.ITEMS.length, i = Number(index) || 0;
    return {
      index: i, item: i < n ? NLL.ITEMS[i] : null, chosen: [], feedback: [],
      nSegs: [1, 3], nFb: 'idle', status: i < n ? 'open' : 'plain', message: '', showMusic: showMusic !== false
    };
  }

  function place(state, x) {
    const it = state.item;
    if (!it || state.status === 'done') return state;
    const k = state.chosen.length, v = NLL.positionToValue(x, it.max), fb = NLL.feedback(v, it.values[k], it.max);
    const chosen = state.chosen.concat([v]), feedback = state.feedback.concat([fb]);
    const done = chosen.length === it.values.length;
    let message = fb.he;
    if (done && it.kind === 'compare') message = (NLL.orderRight(chosen, it.values, it.max) ? 'הסדר על הקו נכון! ' : 'הסדר הפוך — מי מהתווים ארוך יותר? ') + fb.he;
    else if (!done) message = fb.he + ' עכשיו התו השני.';
    return Object.assign({}, state, { chosen: chosen, feedback: feedback, status: done ? 'done' : 'open', message: message });
  }

  function placedPlan(state, voice) {
    const k = state.chosen.length - 1;
    return NLL.playPlan([state.chosen[k], state.item.values[k]], voice);
  }

  function checkPlain(state, answers) {
    const right = NLL.NO_MUSIC_CHECK_ITEMS.filter(function (it) { return String(answers[it.id] || '').replace(/\s/g, '') === it.answer; }).length;
    return Object.assign({}, state, { message: right + ' מתוך ' + NLL.NO_MUSIC_CHECK_ITEMS.length + ' נכונות.' });
  }

  function pct(v, max) { return (v / max) * 100; }

  function renderHtml(state, instrumentHe) {
    const e = JAM.esc, on = state.showMusic;
    const phoneOpen = '<div dir="rtl" class="cd-frame" style="width:390px;max-width:100%;border-radius:52px;border:10px solid #15102E;background:#FFF6E5;overflow:hidden;position:relative;box-shadow:0 20px 50px rgba(27,20,70,.25);font-family:Rubik,system-ui,sans-serif;color:#1B1446;display:flex;flex-direction:column;box-sizing:border-box;margin:0 auto">' +
      '<div style="height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 30px;font-weight:700;font-size:15px;flex:none"><span>9:41</span><span style="display:flex;gap:5px"><span style="width:18px;height:10px;border-radius:3px;background:#1B1446"></span><span style="width:24px;height:11px;border-radius:3px;border:2px solid #1B1446"></span></span></div>';

    if (!state.item) {
      return phoneOpen + '<div style="padding:10px 20px 24px;display:flex;flex-direction:column;gap:14px;flex:1;background:#F4F1FF">' +
        '<div style="text-align:center"><div style="font-size:24px;font-weight:900">בדיקה בלי מוזיקה</div><div style="font-size:13px;font-weight:500;color:#4A3F7A">שברים על קו המספרים</div></div>' +
        NLL.NO_MUSIC_CHECK_ITEMS.map(function (it) {
          return '<div style="background:#FFFFFF;border:3px solid #1B1446;border-radius:20px;padding:12px 14px"><label style="font-weight:700;font-size:16px;display:flex;flex-direction:column;gap:6px">' + e(it.prompt) +
            '<input data-plain="' + e(it.id) + '" dir="ltr" style="height:48px;border:3px solid #1B1446;border-radius:14px;padding:0 12px;font:800 20px Rubik;text-align:center"></label></div>';
        }).join('') +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:auto">' +
        '<button type="button" class="primary" data-act="plainCheck" style="height:60px;border-radius:22px;border:3px solid #1B1446;background:#2ED3A8;font:800 19px Rubik;box-shadow:0 5px 0 #1B1446;cursor:pointer">בדיקה</button>' +
        '<button type="button" class="secondary" data-act="restart" style="height:60px;border-radius:22px;border:3px solid #1B1446;background:#FFFFFF;font:800 19px Rubik;box-shadow:0 5px 0 #1B1446;cursor:pointer">מתחילים מחדש</button>' +
        '</div><p class="jam-msg" role="status" aria-live="polite" style="font-size:15px;font-weight:700;text-align:center">' + e(state.message) + '</p></div></div>';
    }

    const it = state.item, max = it.max || 1;
    const tgt = NTARGETS[state.index % NTARGETS.length], targetStr = fr8(tgt);
    const segs = state.nSegs || [];
    const nSum = segs.reduce(function (a, idx) { return a + NOTES[idx].e; }, 0);
    const last = state.chosen.length ? state.chosen[state.chosen.length - 1] : (nSum / 8 * max);
    const fillPct = pct(last, max);

    let marksHtml = '';
    for (let i = 0; i < state.chosen.length; i++) {
      const v = state.chosen[i];
      marksHtml += '<span class="nll-mark" data-mark="' + i + '" style="position:absolute;left:' + pct(v, max) + '%;top:-1.4em;transform:translateX(-50%)">' + 'אב'[i] + '</span>' +
        '<span class="nll-true" style="position:absolute;left:' + pct(NLL.value(it.values[i]), max) + '%;bottom:0;height:100%;border-left:2px dashed var(--good)"></span>';
    }

    let ticksHtml = '';
    for (let k = 1; k < 8; k++) {
      ticksHtml += '<div style="position:absolute;top:8px;bottom:8px;left:' + (k / 8 * 100) + '%;border-left:' + (k === 4 ? '3px solid #C9B98F' : '2px dashed #D9C9A3') + '"></div>';
    }

    let segsHtml = '';
    for (let j = 0; j < segs.length; j++) {
      const ni = segs[j], N = NOTES[ni];
      segsHtml += '<button type="button" aria-label="' + e(N.name) + ' — הקישו להסרה" data-act="remSeg" data-idx="' + j + '" style="width:' + (N.e / 8 * 100) + '%;flex:none;height:100%;box-sizing:border-box;border:3px solid #1B1446;border-radius:12px;background:' + N.c + ';font:800 16px Rubik;color:#1B1446;cursor:pointer;padding:0">' + N.frac + '</button>';
    }

    let beatsHtml = '';
    for (let b = 0; b < 8; b++) {
      const isQuarter = b % 2 === 0, isFilled = b < nSum, bSize = isQuarter ? 18 : 12;
      const bColor = isFilled ? (isQuarter ? '#1B1446' : '#6B6396') : '#FFFFFF';
      beatsHtml += '<span style="justify-self:center;width:' + bSize + 'px;height:' + bSize + 'px;border-radius:50%;box-sizing:border-box;border:2px solid #1B1446;background:' + bColor + '"></span>';
    }

    let notesHtml = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
    for (let ni = 0; ni < NOTES.length; ni++) {
      const N = NOTES[ni], fits = nSum + N.e <= 8;
      notesHtml += '<button type="button" aria-label="הוספת ' + e(N.name) + '" data-act="addNote" data-idx="' + ni + '" style="height:76px;border-radius:20px;border:3px ' + (fits ? 'solid' : 'dashed') + ' #1B1446;background:' + (fits ? N.c : '#F3E7CF') + ';cursor:pointer;padding:8px 12px;display:flex;flex-direction:column;justify-content:space-between;color:#1B1446;font-family:Rubik;box-shadow:' + (fits ? '0 4px 0 #1B1446' : 'none') + ';box-sizing:border-box">' +
        '<div style="display:flex;justify-content:space-between;align-items:baseline;width:100%"><span style="font-size:18px;font-weight:800">' + e(N.name) + '</span><span dir="ltr" style="font-size:22px;font-weight:900">' + N.frac + '</span></div>' +
        '<div dir="ltr" style="width:100%;height:12px;border-radius:6px;background:#FFFFFF;border:2px solid #1B1446;box-sizing:border-box;overflow:hidden"><div style="width:' + (N.e / 8 * 100) + '%;height:100%;background:#1B1446"></div></div>' +
        '</button>';
    }
    notesHtml += '</div>';

    const isRight = nSum === tgt || state.status === 'done';
    const fbStyle = 'min-height:48px;box-sizing:border-box;border-radius:18px;padding:8px 14px;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;text-align:center;background:' + (isRight ? '#2ED3A8' : '#FFFFFF') + ';border:3px solid #1B1446;';
    const fbText = isRight ? ('✓ נכון! ' + targetStr + ' תיבה') : (nSum ? ('על הקו עכשיו: ' + fr8(nSum)) : 'הקישו על תו כדי להוסיף אותו לקו');

    return phoneOpen +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 20px 10px;flex:none">' +
      '<button type="button" aria-label="חזרה" data-act="restart" style="width:52px;height:52px;border-radius:18px;border:3px solid #1B1446;background:#FFFFFF;font:800 24px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 4px 0 #1B1446">→</button>' +
      '<div style="text-align:center"><div style="font-size:24px;font-weight:900;letter-spacing:-.5px">קו הצלילים</div><div style="font-size:13px;font-weight:500;color:#4A3F7A">שברים באורכי תווים</div></div>' +
      '<div style="min-width:52px;height:52px;border-radius:18px;background:#FFC93C;border:3px solid #1B1446;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;padding:0 8px;box-sizing:border-box">★ ' + (state.index + 3) + '</div>' +
      '</div>' +
      '<div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:12px;flex:1">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
      '<button type="button" aria-label="השמעת יוקללה" data-act="uke" style="height:52px;border-radius:16px;border:3px solid #1B1446;background:#1B1446;color:#FFFFFF;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0"><span style="font-size:16px;font-weight:800">יוקללה</span><span style="font-size:11px;font-weight:600;color:#E4DCFF">כלי ראשי · מנגינה</span></button>' +
      '<button type="button" aria-label="השמעת תוף" data-act="drum" style="height:52px;border-radius:16px;border:3px solid #1B1446;background:#FFFFFF;color:#1B1446;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0;box-shadow:0 3px 0 #1B1446"><span style="font-size:16px;font-weight:800">תוף</span><span style="font-size:11px;font-weight:600;color:#4A3F7A">כלי נוסף · פעימה</span></button>' +
      '</div>' +
      '<div style="background:#1B1446;color:#FFFFFF;border-radius:18px;padding:8px 14px;display:flex;align-items:center;justify-content:space-between"><span style="font-size:16px;font-weight:700">בנו קו באורך של</span><span style="display:flex;align-items:baseline;gap:6px"><span dir="ltr" style="font-size:28px;font-weight:900;color:#FFC93C">' + targetStr + '</span><span style="font-size:15px;font-weight:600">תיבה</span></span></div>' +
      '<div style="background:#FFFFFF;border:3px solid #1B1446;border-radius:22px;padding:10px 12px">' +
      '<div dir="ltr" style="position:relative;height:20px;margin-bottom:4px;font:700 13px Rubik;color:#4A3F7A"><span style="position:absolute;left:0;top:0">0</span><span style="position:absolute;right:0;top:0">1</span><span style="position:absolute;top:0;left:' + (tgt / 8 * 100) + '%;transform:translateX(-50%);color:#C2410C;font-weight:800">יעד ' + targetStr + '</span></div>' +
      '<div class="nll-line" dir="ltr" style="position:relative;height:68px;background:#FBF4E4;border-radius:14px;border:2px solid #D9C9A3;box-sizing:border-box">' +
      '<span class="nll-fill" style="position:absolute;left:0;top:0;bottom:0;width:' + fillPct + '%;background:#B9A5FF;opacity:.55;border-radius:12px 0 0 12px"></span>' +
      ticksHtml +
      '<div style="position:absolute;inset:0;display:flex">' + segsHtml + '</div>' +
      '<div style="position:absolute;top:-6px;bottom:-6px;left:calc(' + (tgt / 8 * 100) + '% - 2px);width:4px;border-radius:2px;background:#C2410C;z-index:2;pointer-events:none"></div>' +
      marksHtml +
      '<input type="range" data-line min="0" max="' + STEPS + '" value="' + Math.round((last / max) * STEPS) + '" aria-label="גררו את התו על הקו מ־0 עד ' + max + '"' +
      (state.status === 'done' ? ' disabled' : '') + ' style="position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer">' +
      '</div>' +
      '<div dir="ltr" aria-label="שורת התוף" style="display:flex;align-items:center;gap:8px;margin-top:6px"><div style="flex:1;display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:4px;align-items:center">' + beatsHtml + '</div><span style="font:700 12px Rubik;color:#4A3F7A;flex:none">תוף</span></div>' +
      '<div style="font-size:12px;font-weight:500;color:#4A3F7A;text-align:center;margin-top:4px">הקישו על קטע בקו כדי להסיר אותו</div>' +
      '</div>' +
      '<div aria-live="polite" style="' + fbStyle + '"><span>' + e(fbText) + '</span></div>' +
      notesHtml +
      '<div style="display:grid;grid-template-columns:1fr 56px 1.2fr;gap:10px;margin-top:auto">' +
      (on ? '<button type="button" data-act="play" style="height:58px;border-radius:20px;border:3px solid #1B1446;background:#FFFFFF;font:800 17px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 4px 0 #1B1446">▶ נגנו</button>' : '<button type="button" data-act="restart" style="height:58px;border-radius:20px;border:3px solid #1B1446;background:#FFFFFF;font:800 17px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 4px 0 #1B1446">איפוס</button>') +
      '<button type="button" aria-label="ניקוי הקו" data-act="clear" style="height:58px;border-radius:20px;border:3px solid #1B1446;background:#FFFFFF;font:800 24px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 4px 0 #1B1446">↺</button>' +
      '<button type="button" class="primary" data-act="check" style="height:58px;border-radius:20px;border:3px solid #1B1446;background:' + (isRight ? '#2ED3A8' : '#FF8A3D') + ';font:800 18px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 4px 0 #1B1446">' + (isRight ? 'לתרגיל הבא ←' : 'בדיקה ✓') + '</button>' +
      '</div>' +
      '<p class="jam-msg" role="status" aria-live="polite" style="font-size:14px;font-weight:700;text-align:center;margin:0">' + e(state.message) + '</p>' +
      '</div></div>';
  }

  function mount(el) {
    JAM.registerTapVoices();
    let state = createState(0, JAM.loadShowMusic(GAME)), playing = null;
    function band() { return NLL.ensemble(MINE.instrumentFor(DEFAULT_INSTRUMENT)); }
    function stop() { if (playing) playing.stop(); playing = null; }
    function play(notes) { stop(); if (state.showMusic) playing = JAM.playNotes(notes); }
    function draw() { const bd = band(); el.innerHTML = renderHtml(state, 'התו: ' + bd.primary.he + ' · הקצב: ' + bd.beat.he); }
    el.addEventListener('change', function (ev) {
      if (!ev.target.hasAttribute || !ev.target.hasAttribute('data-line')) return;
      state = place(state, Number(ev.target.value) / STEPS);
      NLL.recordError(state.feedback[state.feedback.length - 1].err);
      draw();
      const bd = band();
      play(NLL.withBeat(placedPlan(state, bd.primary.voice), bd.beat.voice));
    });
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      if (act === 'addNote') {
        const ni = Number(b.getAttribute('data-idx'));
        const curSegs = state.nSegs || [];
        const nSum = curSegs.reduce(function (acc, x) { return acc + NOTES[x].e; }, 0);
        if (nSum + NOTES[ni].e <= 8) {
          state = Object.assign({}, state, { nSegs: curSegs.concat([ni]) });
          state = place(state, (nSum + NOTES[ni].e) / 8);
          draw();
        }
        return;
      }
      if (act === 'remSeg') {
        const idx = Number(b.getAttribute('data-idx'));
        const curSegs = (state.nSegs || []).slice();
        curSegs.splice(idx, 1);
        const newSum = curSegs.reduce(function (acc, x) { return acc + NOTES[x].e; }, 0);
        state = Object.assign({}, state, { nSegs: curSegs });
        state = place(state, newSum / 8);
        draw();
        return;
      }
      if (act === 'clear') {
        state = Object.assign({}, state, { nSegs: [], chosen: [], feedback: [], status: 'open', message: '' });
        draw();
        return;
      }
      if (act === 'play') {
        const it = state.item, bd = band();
        play(NLL.withBeat(NLL.playPlan(it.kind === 'compare' ? it.values : [it.values[0]], bd.primary.voice), bd.beat.voice));
        return;
      }
      if (act === 'check') {
        const tgt = NTARGETS[state.index % NTARGETS.length];
        const nSum = (state.nSegs || []).reduce(function (acc, x) { return acc + NOTES[x].e; }, 0);
        if (nSum === tgt || state.status === 'done') {
          stop();
          state = createState(state.index + 1, state.showMusic);
        } else {
          state = Object.assign({}, state, { message: nSum < tgt ? 'הקו קצר מדי מהיעד. הוסיפו תו!' : 'הקו ארוך מדי. הסירו תו!' });
        }
        draw();
        return;
      }
      if (act === 'plainCheck') {
        const answers = {};
        el.querySelectorAll('[data-plain]').forEach(function (i) { answers[i.getAttribute('data-plain')] = i.value; });
        state = checkPlain(state, answers);
      } else if (act === 'next' || act === 'restart') {
        stop(); state = createState(act === 'next' ? state.index + 1 : 0, state.showMusic);
      } else if (act === 'music') {
        stop(); state = Object.assign({}, state, { showMusic: !state.showMusic }); JAM.saveShowMusic(GAME, state.showMusic);
      }
      draw();
    });
    if (root.addEventListener) root.addEventListener(MINE.EVENT, draw);
    JAM.stopWhenHidden(el, stop);
    draw();
    return { get state() { return state; } };
  }

  return { GAME: GAME, DEFAULT_INSTRUMENT: DEFAULT_INSTRUMENT, STEPS: STEPS, NOTES: NOTES, NTARGETS: NTARGETS, createState: createState, place: place, placedPlan: placedPlan, checkPlain: checkPlain, renderHtml: renderHtml, mount: mount };
});
