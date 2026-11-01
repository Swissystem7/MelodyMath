// MelodyMath — GrooveGridScreen: Claude Design pixel-faithful Screen 1a. Refs #591 #665.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_GROOVE_GRID_SCREEN = api;
  if (typeof document !== 'undefined' && document.getElementById('ggCard')) api.mount(document.getElementById('ggCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const GG = root.MM_GROOVE_GRID || require('../lib/music/grooveGrid.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const GAME = 'grooveGrid', FALLBACK = 'djembe';
  const ROWC = ['#FF8A3D', '#2ED3A8', '#B9A5FF', '#5EC8FF', '#FF8FB8', '#B8E04A'];
  const PENTA = [523, 587, 659, 784, 880, 1047];

  function myInstrument() { return root.MM_MY_INSTRUMENT || require('../lib/myInstrument.js'); }
  function instData() { return typeof root.instrumentById === 'function' ? root : require('../lib/instruments.js'); }

  function tracks(storage) {
    const d = instData(), kid = d.instrumentById(myInstrument().instrumentFor(FALLBACK, null, storage)) || d.instrumentById(FALLBACK);
    const partner = d.instrumentById(GG.partnerFor(kid.family));
    return { kid: kid, partner: partner, families: [kid.family, partner.family],
      trackVoice: function (row) { return row === 0 ? kid.voice : partner.voice; } };
  }

  function createState(index, showMusic) {
    const i = Number(index) || 0, ex = i < GG.TARGETS.length ? GG.TARGETS[i] : null;
    return { index: i, ex: ex, gr: ex ? ex.rows : 3, gc: ex ? ex.cols : 4, gp: -1,
      status: ex ? 'ask' : 'plain', message: '', showMusic: showMusic !== false, sound: null };
  }
  function answerOf(ex) { return ex.ask === 'area' ? GG.gridArea(ex.rows, ex.cols) : GG.perimeterPath(ex.rows, ex.cols).length; }

  function answer(state, typed) {
    if (!state.ex || state.status === 'right') return state;
    const want = answerOf(state.ex), n = Number(String(typed).trim());
    if (n === want) {
      const how = state.ex.ask === 'area' ? state.ex.rows + ' שורות של ' + state.ex.cols + ' = ' + want + ' משבצות' : 'סיבוב של ' + want + ' צעדים';
      return Object.assign({}, state, { status: 'right', message: 'נכון! ' + how + '.', sound: 'right' });
    }
    return Object.assign({}, state, { status: 'retry', sound: 'wrong',
      message: 'עוד לא. ' + (state.ex.ask === 'area' ? 'נגנו שורה אחרי שורה: כמה קבוצות, וכמה בכל קבוצה?' : 'נגנו את הסיבוב: צעד לכל צלע של משבצת בשפה.') });
  }

  function checkPlain(state, answers) {
    const right = GG.NO_MUSIC_CHECK_ITEMS.filter(function (it) { return Number(String(answers[it.id] || '').trim()) === it.answer; }).length;
    return Object.assign({}, state, { message: right + ' מתוך ' + GG.NO_MUSIC_CHECK_ITEMS.length + ' נכונות.', done: right === GG.NO_MUSIC_CHECK_ITEMS.length });
  }

  function gridHtml(state, tr, on) {
    const gr = state.gr, gc = state.gc, gp = state.gp;
    let out = '<div class="gg-grid" role="img" aria-label="מלבן ' + gr + ' על ' + gc + '" style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;background:#F3E7CF;border-radius:24px;padding:10px">';
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        const inR = r < gr && c < gc, k = r * gc + c, act = inR && gp === k;
        if (inR) {
          const bg = act ? '#FFC93C' : ROWC[r];
          out += '<button type="button" class="gg-cell" data-cell="' + k + '" data-r="' + r + '" data-c="' + c + '" style="aspect-ratio:1;min-height:48px;border-radius:12px;cursor:pointer;padding:0;font:700 15px Rubik,system-ui;color:#1B1446;border:3px solid #1B1446;background:' + bg + ';' +
            (act ? 'transform:scale(1.12);box-shadow:0 0 0 4px #FFFFFF,0 0 0 7px #1B1446;z-index:2;' : '') +
            '"' + (on ? ' data-tap="' + JAM.esc(tr.trackVoice(r)) + '"' : '') + ' aria-label="שורה ' + (r + 1) + ', עמודה ' + (c + 1) + '">' + (k + 1) + '</button>';
        } else {
          out += '<button type="button" class="gg-cell-empty" data-r="' + r + '" data-c="' + c + '" style="aspect-ratio:1;min-height:48px;border-radius:12px;cursor:pointer;padding:0;background:#FFFFFF;border:2px dashed #C9B98F" aria-label="שורה ' + (r + 1) + ', עמודה ' + (c + 1) + '"></button>';
        }
      }
    }
    return out + '</div>';
  }

  function renderHtml(state, tr) {
    const e = JAM.esc, on = state.showMusic;
    const phoneOpen = '<div dir="rtl" class="cd-frame" style="width:390px;max-width:100%;border-radius:52px;border:10px solid #15102E;background:#FFF6E5;overflow:hidden;position:relative;box-shadow:0 20px 50px rgba(27,20,70,.25);font-family:Rubik,system-ui,sans-serif;color:#1B1446;display:flex;flex-direction:column;box-sizing:border-box;margin:0 auto">' +
      '<div style="height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 30px;font-weight:700;font-size:15px;flex:none"><span>9:41</span><span style="display:flex;gap:5px"><span style="width:18px;height:10px;border-radius:3px;background:#1B1446"></span><span style="width:24px;height:11px;border-radius:3px;border:2px solid #1B1446"></span></span></div>';

    if (!state.ex) {
      return phoneOpen + '<div style="padding:10px 20px 24px;display:flex;flex-direction:column;gap:14px;flex:1;background:#F4F1FF">' +
        '<div style="text-align:center"><div style="font-size:24px;font-weight:900">בדיקה בלי מוזיקה</div><div style="font-size:13px;font-weight:500;color:#4A3F7A">פתרו ללא צלילים</div></div>' +
        GG.NO_MUSIC_CHECK_ITEMS.map(function (it) {
          return '<div style="background:#FFFFFF;border:3px solid #1B1446;border-radius:20px;padding:12px 14px"><label style="font-weight:700;font-size:16px;display:flex;flex-direction:column;gap:6px">' + e(it.prompt) +
            '<input data-plain="' + e(it.id) + '" inputmode="numeric" style="height:48px;border:3px solid #1B1446;border-radius:14px;padding:0 12px;font:800 20px Rubik;text-align:center"></label></div>';
        }).join('') +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:auto">' +
        '<button type="button" class="primary" data-act="plainCheck" style="height:60px;border-radius:22px;border:3px solid #1B1446;background:#2ED3A8;font:800 19px Rubik;box-shadow:0 5px 0 #1B1446;cursor:pointer">בדיקה</button>' +
        '<button type="button" class="secondary" data-act="restart" style="height:60px;border-radius:22px;border:3px solid #1B1446;background:#FFFFFF;font:800 19px Rubik;box-shadow:0 5px 0 #1B1446;cursor:pointer">מתחילים מחדש</button>' +
        '</div><p class="jam-msg" role="status" aria-live="polite" style="font-size:15px;font-weight:700;text-align:center">' + e(state.message) + '</p></div></div>';
    }

    const ex = state.ex, target = answerOf(ex), gr = state.gr, gc = state.gc, gArea = gr * gc, hit = gArea === target;
    const chipText = hit ? 'מעולה! ' + gr + ' × ' + gc + ' = ' + target + ' פעימות' : 'אתגר: בנו מלבן של ' + target + ' פעימות';
    const playLabel = state.gp >= 0 ? 'פעימה ' + (state.gp + 1) + ' מתוך ' + gArea : '▶  נגנו את השטח';

    return phoneOpen +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 20px 10px;flex:none">' +
      '<button type="button" aria-label="חזרה" data-act="restart" style="width:52px;height:52px;border-radius:18px;border:3px solid #1B1446;background:#FFFFFF;font:800 24px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 4px 0 #1B1446">→</button>' +
      '<div style="text-align:center"><div style="font-size:24px;font-weight:900;letter-spacing:-.5px">גרוב־גריד</div><div style="font-size:13px;font-weight:500;color:#4A3F7A">המשך לשיטת השטח</div></div>' +
      '<div style="min-width:52px;height:52px;border-radius:18px;background:#FFC93C;border:3px solid #1B1446;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;padding:0 8px;box-sizing:border-box">★ ' + (hit ? 4 : 3) + '</div>' +
      '</div>' +
      '<div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:12px;flex:1">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:600;color:#4A3F7A">' +
      '<span>' + (on ? 'שורה ראשונה: ' + e(tr.kid.instrument.he) + ' · שאר השורות: ' + e(tr.partner.instrument.he) : 'מצב שקט') + '</span>' +
      JAM.musicToggleHtml(on) + '</div>' +
      '<div aria-live="polite" style="border-radius:20px;padding:10px 14px;font-size:16px;font-weight:700;text-align:center;border:3px solid #1B1446;background:' + (hit ? '#2ED3A8' : '#FFFFFF') + ';transition:background .2s">' + e(chipText) + '</div>' +
      '<div aria-live="polite" style="background:#FFFFFF;border:3px solid #1B1446;border-radius:24px;padding:10px 12px;display:flex;justify-content:center;align-items:flex-end;gap:12px" dir="ltr">' +
      '<div style="display:flex;flex-direction:column;align-items:center"><span style="font-size:42px;font-weight:900;line-height:1;color:#C2410C">' + gr + '</span><span style="font-size:13px;font-weight:600;color:#4A3F7A">שורות</span></div>' +
      '<span style="font-size:34px;font-weight:800;padding-bottom:18px">×</span>' +
      '<div style="display:flex;flex-direction:column;align-items:center"><span style="font-size:42px;font-weight:900;line-height:1;color:#0F766E">' + gc + '</span><span style="font-size:13px;font-weight:600;color:#4A3F7A">עמודות</span></div>' +
      '<span style="font-size:34px;font-weight:800;padding-bottom:18px">=</span>' +
      '<div style="display:flex;flex-direction:column;align-items:center"><span style="font-size:42px;font-weight:900;line-height:1;color:#5B3FD9">' + gArea + '</span><span style="font-size:13px;font-weight:600;color:#4A3F7A">פעימות</span></div>' +
      '</div>' +
      gridHtml(state, tr, on) +
      '<div style="font-size:13px;font-weight:500;color:#4A3F7A;text-align:center">הקישו על משבצת — המלבן נבנה מהפינה הימנית העליונה</div>' +
      (on ? '<button type="button" data-act="playArea" style="height:64px;border-radius:24px;border:3px solid #1B1446;background:#FF8A3D;font:800 20px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 6px 0 #1B1446;display:flex;align-items:center;justify-content:center;gap:10px">' + playLabel + '</button>' : '') +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
      '<button type="button" class="primary" data-act="check" style="height:56px;border-radius:20px;border:3px solid #1B1446;background:' + (hit ? '#2ED3A8' : '#FFFFFF') + ';font:800 18px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 4px 0 #1B1446">' + (hit ? '✓ נכון!' : 'בדיקה') + '</button>' +
      '<button type="button" class="secondary" data-act="next" style="height:56px;border-radius:20px;border:3px solid #1B1446;background:#FFFFFF;font:800 18px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 4px 0 #1B1446">תרגיל הבא ←</button>' +
      '</div>' +
      '<p class="jam-msg ' + (state.status === 'right' ? 'good' : state.status === 'retry' ? 'soft' : '') + '" role="status" aria-live="polite" style="font-size:15px;font-weight:700;text-align:center;margin:0">' + e(state.message) + '</p>' +
      '</div></div>';
  }

  function mount(el) {
    JAM.registerTapVoices();
    let state = createState(0, JAM.loadShowMusic(GAME)), tr = tracks(), playing = null;
    function stop() { if (playing) playing.stop(); playing = null; state = Object.assign({}, state, { gp: -1 }); }
    function draw() { el.innerHTML = renderHtml(state, tr); }
    function playSeq() {
      stop();
      if (!state.showMusic) return;
      const total = state.gr * state.gc, plan = GG.areaPlan(state.gr, state.gc, tr.trackVoice);
      playing = JAM.playNotes(plan, function (n) {
        if (n && n.steps && n.steps.length) {
          state = Object.assign({}, state, { gp: n.steps[0] });
          draw();
        }
      });
      if (playing && playing.onEnded) playing.onEnded(function () { state = Object.assign({}, state, { gp: -1 }); draw(); });
    }
    el.addEventListener('click', function (ev) {
      const cellBtn = ev.target.closest ? ev.target.closest('[data-r][data-c]') : null;
      if (cellBtn) {
        stop();
        const r = Number(cellBtn.getAttribute('data-r')), c = Number(cellBtn.getAttribute('data-c'));
        const newR = r + 1, newC = c + 1;
        state = Object.assign({}, state, { gr: newR, gc: newC, status: 'ask', message: '' });
        if (newR * newC === answerOf(state.ex)) state = answer(state, String(newR * newC));
        draw();
        return;
      }
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      if (act === 'playArea') { if (state.gp >= 0) { stop(); draw(); } else { playSeq(); } return; }
      if (act === 'check') state = answer(state, String(state.gr * state.gc));
      else if (act === 'plainCheck') {
        const answers = {};
        el.querySelectorAll('[data-plain]').forEach(function (i) { answers[i.getAttribute('data-plain')] = i.value; });
        state = checkPlain(state, answers);
      } else if (act === 'next' || act === 'restart') {
        stop(); state = createState(act === 'next' ? state.index + 1 : 0, state.showMusic);
      } else if (act === 'music') {
        stop(); state = Object.assign({}, state, { showMusic: !state.showMusic, sound: null }); JAM.saveShowMusic(GAME, state.showMusic);
      }
      draw();
      if (state.showMusic && state.sound) JAM.feedback(state.sound === 'right');
    });
    if (root.addEventListener) root.addEventListener(myInstrument().EVENT, function () { tr = tracks(); draw(); });
    JAM.stopWhenHidden(el, stop);
    draw();
    return { get state() { return state; } };
  }

  return { GAME: GAME, tracks: tracks, createState: createState, answer: answer, checkPlain: checkPlain, renderHtml: renderHtml, mount: mount };
});
