// MelodyMath — LoopStackScreen: Claude Design pixel-faithful Screen 1b. Refs #591 #665.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_LOOP_STACK_SCREEN = api;
  if (typeof document !== 'undefined' && document.getElementById('lsCard')) api.mount(document.getElementById('lsCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const LS = root.MM_LOOP_STACK || require('../lib/music/loopStack.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const MINE = root.MM_MY_INSTRUMENT || require('../lib/myInstrument.js');
  const GAME = 'loopStack', DEFAULT_INSTRUMENT = 'marimba';
  const INST = [
    { name: 'תופים', color: '#FF8A3D' },
    { name: 'בס', color: '#5EC8FF' },
    { name: 'פסנתר', color: '#B9A5FF' },
    { name: 'פעמונים', color: '#2ED3A8' },
    { name: 'כפיים', color: '#FF8FB8' }
  ];

  function createState(index, showMusic) {
    const n = LS.TARGETS.length, i = Number(index) || 0, ex = i < n ? LS.TARGETS[i] : null;
    return {
      index: i, ex: ex,
      lr: ex ? ex.a : 3, lc: ex ? ex.b : 2, ln: ex ? ex.c : 3, lp: -1,
      status: i < n ? 'open' : 'plain', message: '', showMusic: showMusic !== false
    };
  }

  function check(state, typed) {
    const ex = state.ex, want = LS.volume(ex.a, ex.b, ex.c);
    const n = Number(String(typed).trim());
    if (n === want) {
      return Object.assign({}, state, { status: 'right', message: ex.c + ' שכבות של ' + (ex.a * ex.b) + ' = ' + want + ' סמ״ק — בדיוק!' });
    }
    return Object.assign({}, state, { status: 'wrong', message: 'נסו שוב: כמה קוביות בשכבה אחת, וכמה שכבות?' });
  }

  function checkPlain(state, answers) {
    const right = LS.NO_MUSIC_CHECK_ITEMS.filter(function (it) { return Number(String(answers[it.id] || '').trim()) === it.answer; }).length;
    return Object.assign({}, state, { message: right + ' מתוך ' + LS.NO_MUSIC_CHECK_ITEMS.length + ' נכונות.' });
  }

  function renderHtml(state, names) {
    const e = JAM.esc, on = state.showMusic, instNames = Array.isArray(names) ? names : [];
    const phoneOpen = '<div dir="rtl" class="cd-frame" style="width:390px;max-width:100%;border-radius:52px;border:10px solid #15102E;background:#EAF7F3;overflow:hidden;position:relative;box-shadow:0 20px 50px rgba(27,20,70,.25);font-family:Rubik,system-ui,sans-serif;color:#1B1446;display:flex;flex-direction:column;box-sizing:border-box;margin:0 auto">' +
      '<div style="height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 30px;font-weight:700;font-size:15px;flex:none"><span>9:41</span><span style="display:flex;gap:5px"><span style="width:18px;height:10px;border-radius:3px;background:#1B1446"></span><span style="width:24px;height:11px;border-radius:3px;border:2px solid #1B1446"></span></span></div>';

    if (!state.ex) {
      return phoneOpen + '<div style="padding:10px 20px 24px;display:flex;flex-direction:column;gap:14px;flex:1;background:#F4F1FF">' +
        '<div style="text-align:center"><div style="font-size:24px;font-weight:900">בדיקה בלי מוזיקה</div><div style="font-size:13px;font-weight:500;color:#4A3F7A">פתרו ללא צלילים</div></div>' +
        LS.NO_MUSIC_CHECK_ITEMS.map(function (it) {
          return '<div style="background:#FFFFFF;border:3px solid #1B1446;border-radius:20px;padding:12px 14px"><label style="font-weight:700;font-size:16px;display:flex;flex-direction:column;gap:6px">' + e(it.prompt) +
            '<input data-plain="' + e(it.id) + '" inputmode="decimal" style="height:48px;border:3px solid #1B1446;border-radius:14px;padding:0 12px;font:800 20px Rubik;text-align:center"></label></div>';
        }).join('') +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:auto">' +
        '<button type="button" class="primary" data-act="plainCheck" style="height:60px;border-radius:22px;border:3px solid #1B1446;background:#2ED3A8;font:800 19px Rubik;box-shadow:0 5px 0 #1B1446;cursor:pointer">בדיקה</button>' +
        '<button type="button" class="secondary" data-act="restart" style="height:60px;border-radius:22px;border:3px solid #1B1446;background:#FFFFFF;font:800 19px Rubik;box-shadow:0 5px 0 #1B1446;cursor:pointer">מתחילים מחדש</button>' +
        '</div><p class="jam-msg" role="status" aria-live="polite" style="font-size:15px;font-weight:700;text-align:center">' + e(state.message) + '</p></div></div>';
    }

    const ex = state.ex, lr = state.lr, lc = state.lc, ln = state.ln;
    const baseArea = lr * lc, lVol = baseArea * ln, hit = state.status === 'right';
    const sumParts = []; for (let s = 0; s < ln; s++) sumParts.push(baseArea);
    const lSum = sumParts.join(' + ') + ' = ' + lVol;
    const cell = 24, gap = 3, w = lc * (cell + gap) - gap, h = lr * (cell + gap) - gap;

    let layersHtml = '';
    for (let i = 0; i < ln; i++) {
      const act = state.lp === i, cColor = act ? '#FFC93C' : (INST[i % INST.length].color);
      let cubesHtml = '';
      for (let k = 0; k < baseArea; k++) {
        cubesHtml += '<span class="ls-cube" style="width:' + cell + 'px;height:' + cell + 'px;border-radius:5px;box-sizing:border-box;background:' + cColor + ';border:2px solid #1B1446;box-shadow:0 3px 0 #1B1446;display:inline-block"></span>';
      }
      layersHtml += '<div class="ls-layer" data-layer="' + i + '" style="position:absolute;left:' + (-w / 2) + 'px;top:' + (-h / 2) + 'px;width:' + w + 'px;height:' + h + 'px;display:grid;grid-template-columns:repeat(' + lc + ',' + cell + 'px);gap:' + gap + 'px;transform:translateZ(' + (i * 24 + (act ? 8 : 0)) + 'px);transition:transform .2s">' + cubesHtml + '</div>';
    }

    const badgeText = state.lp >= 0 ? 'שכבה ' + (state.lp + 1) + ': ' + (instNames[state.lp] || INST[state.lp % INST.length].name) : 'בסיס: ' + baseArea + ' קוביות';

    let chipsHtml = '';
    if (on) {
      chipsHtml = '<div style="display:flex;flex-wrap:wrap;gap:6px">';
      for (let i = 0; i < ln; i++) {
        const iname = instNames[i] || INST[i % INST.length].name, icolor = INST[i % INST.length].color;
        chipsHtml += '<button type="button" data-act="chip" data-idx="' + i + '" style="height:44px;padding:0 12px;border-radius:14px;border:2px solid #1B1446;cursor:pointer;background:' + icolor + ';font:700 14px Rubik;color:#1B1446">' + (i + 1) + ' · ' + e(iname) + '</button>';
      }
      chipsHtml += '</div>';
    }

    const playLabel = state.lp >= 0 ? '■ עצרו' : '▶ נגנו';

    return phoneOpen +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 20px 10px;flex:none">' +
      '<button type="button" aria-label="חזרה" data-act="restart" style="width:52px;height:52px;border-radius:18px;border:3px solid #1B1446;background:#FFFFFF;font:800 24px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 4px 0 #1B1446">→</button>' +
      '<div style="text-align:center"><div style="font-size:24px;font-weight:900;letter-spacing:-.5px">לופ־סטאק</div><div style="font-size:13px;font-weight:500;color:#4A3F7A">שכבות של קוביות, שכבות של צלילים</div></div>' +
      '<div style="min-width:52px;height:52px;display:flex;align-items:center;justify-content:center">' + JAM.musicToggleHtml(on) + '</div>' +
      '</div>' +
      '<div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:12px;flex:1">' +
      '<div aria-live="polite" style="background:#FFFFFF;border:3px solid #1B1446;border-radius:24px;padding:10px 14px;display:flex;flex-direction:column;align-items:center;gap:2px">' +
      '<div dir="ltr" style="font-size:34px;font-weight:900;line-height:1.1"><span style="color:#C2410C">' + lr + '</span> × <span style="color:#0F766E">' + lc + '</span> × <span style="color:#5B3FD9">' + ln + '</span> = ' + lVol + '</div>' +
      '<div dir="ltr" style="font-size:15px;font-weight:600;color:#4A3F7A">' + lSum + '</div>' +
      '</div>' +
      '<div style="height:230px;position:relative;border-radius:24px;background:#D3EFE6;overflow:hidden">' +
      '<div style="position:absolute;left:50%;top:58%;width:0;height:0;transform-style:preserve-3d;transform:rotateX(58deg) rotateZ(45deg)">' +
      layersHtml + '</div>' +
      '<div style="position:absolute;top:10px;right:12px;background:#FFFFFF;border:2px solid #1B1446;border-radius:12px;padding:4px 10px;font-size:13px;font-weight:700">' + e(badgeText) + '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
      '<div style="background:#FFFFFF;border:3px solid #1B1446;border-radius:20px;display:flex;align-items:center;justify-content:space-between;padding:6px">' +
      '<button type="button" aria-label="הוספת שורה" data-act="rUp" style="width:48px;height:48px;border-radius:14px;border:0;background:#FF8A3D;font:900 26px Rubik;color:#1B1446;cursor:pointer">+</button>' +
      '<div style="text-align:center;line-height:1.1"><div style="font-size:22px;font-weight:900">' + lr + '</div><div style="font-size:12px;font-weight:600;color:#4A3F7A">שורות</div></div>' +
      '<button type="button" aria-label="הסרת שורה" data-act="rDn" style="width:48px;height:48px;border-radius:14px;border:0;background:#FFE1CC;font:900 26px Rubik;color:#1B1446;cursor:pointer">−</button>' +
      '</div>' +
      '<div style="background:#FFFFFF;border:3px solid #1B1446;border-radius:20px;display:flex;align-items:center;justify-content:space-between;padding:6px">' +
      '<button type="button" aria-label="הוספת עמודה" data-act="cUp" style="width:48px;height:48px;border-radius:14px;border:0;background:#2ED3A8;font:900 26px Rubik;color:#1B1446;cursor:pointer">+</button>' +
      '<div style="text-align:center;line-height:1.1"><div style="font-size:22px;font-weight:900">' + lc + '</div><div style="font-size:12px;font-weight:600;color:#4A3F7A">עמודות</div></div>' +
      '<button type="button" aria-label="הסרת עמודה" data-act="cDn" style="width:48px;height:48px;border-radius:14px;border:0;background:#C9F3E7;font:900 26px Rubik;color:#1B1446;cursor:pointer">−</button>' +
      '</div></div>' +
      chipsHtml +
      '<div style="display:grid;grid-template-columns:64px 1fr 1fr;gap:10px;margin-top:auto">' +
      '<button type="button" aria-label="הסרת שכבה" data-act="nDn" style="height:60px;border-radius:22px;border:3px solid #1B1446;background:#FFFFFF;font:900 28px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 5px 0 #1B1446">−</button>' +
      '<button type="button" data-act="nUp" style="height:60px;border-radius:22px;border:3px solid #1B1446;background:#B9A5FF;font:800 19px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 5px 0 #1B1446">+ שכבה</button>' +
      (on ? '<button type="button" data-act="play" style="height:60px;border-radius:22px;border:3px solid #1B1446;background:#2ED3A8;font:800 19px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 5px 0 #1B1446">' + playLabel + '</button>' :
        '<button type="button" class="primary" data-act="check" style="height:60px;border-radius:22px;border:3px solid #1B1446;background:#2ED3A8;font:800 19px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 5px 0 #1B1446">בדיקה</button>') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
      '<button type="button" class="primary" data-act="check" style="height:52px;border-radius:18px;border:3px solid #1B1446;background:' + (hit ? '#2ED3A8' : '#FFFFFF') + ';font:800 17px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 4px 0 #1B1446">' + (hit ? '✓ נכון!' : 'בדיקה') + '</button>' +
      '<button type="button" class="secondary" data-act="next" style="height:52px;border-radius:18px;border:3px solid #1B1446;background:#FFFFFF;font:800 17px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 4px 0 #1B1446">תרגיל הבא ←</button>' +
      '</div>' +
      '<p class="jam-msg ' + (state.status === 'right' ? 'good' : state.status === 'wrong' ? 'soft' : '') + '" role="status" aria-live="polite" style="font-size:15px;font-weight:700;text-align:center;margin:0">' + e(state.message) + '</p>' +
      '</div></div>';
  }

  function mount(el) {
    JAM.registerTapVoices();
    let state = createState(0, JAM.loadShowMusic(GAME)), playing = null;
    function stop() { if (playing) playing.stop(); playing = null; state = Object.assign({}, state, { lp: -1 }); }
    function band() {
      const childId = MINE.instrumentFor(DEFAULT_INSTRUMENT), own = JAM.instrument(childId, 'woodBar');
      const data = root.instrumentById ? root.instrumentById(childId) : null;
      const ids = LS.layerInstruments(state.ln, childId, data ? data.family : 'percussion');
      return ids.map(function (id, i) { return i === 0 ? own : JAM.instrument(id, 'woodBar'); });
    }
    function draw() { el.innerHTML = renderHtml(state, band().map(function (x) { return x.he; })); }
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      if (act === 'rUp' || act === 'rDn') {
        stop();
        const d = act === 'rUp' ? 1 : -1, nr = Math.max(1, Math.min(5, state.lr + d));
        state = Object.assign({}, state, { lr: nr });
        draw(); return;
      }
      if (act === 'cUp' || act === 'cDn') {
        stop();
        const d = act === 'cUp' ? 1 : -1, nc = Math.max(1, Math.min(5, state.lc + d));
        state = Object.assign({}, state, { lc: nc });
        draw(); return;
      }
      if (act === 'nUp' || act === 'nDn') {
        stop();
        const d = act === 'nUp' ? 1 : -1, nn = Math.max(1, Math.min(5, state.ln + d));
        state = Object.assign({}, state, { ln: nn });
        draw(); return;
      }
      if (act === 'chip') {
        stop();
        const idx = Number(b.getAttribute('data-idx'));
        state = Object.assign({}, state, { lp: idx });
        draw(); return;
      }
      if (act === 'play') {
        if (state.lp >= 0) { stop(); draw(); return; }
        stop();
        if (!state.showMusic) return;
        const voices = band().map(function (x) { return x.voice; });
        playing = JAM.playNotes(LS.stackPlan(state.lr, state.lc, state.ln, function (i) { return voices[i]; }));
        return;
      }
      if (act === 'check') {
        state = check(state, String(state.lr * state.lc * state.ln));
      } else if (act === 'plainCheck') {
        const answers = {};
        el.querySelectorAll('[data-plain]').forEach(function (i) { answers[i.getAttribute('data-plain')] = i.value; });
        state = checkPlain(state, answers);
      } else if (act === 'next' || act === 'restart') {
        stop(); state = createState(act === 'next' ? state.index + 1 : 0, state.showMusic);
      } else if (act === 'music') {
        stop(); state = Object.assign({}, state, { showMusic: !state.showMusic }); JAM.saveShowMusic(GAME, state.showMusic);
      }
      draw();
      if (state.showMusic && act === 'check') JAM.feedback(state.status === 'right');
    });
    if (root.addEventListener) root.addEventListener(MINE.EVENT, draw);
    JAM.stopWhenHidden(el, stop);
    draw();
    return { get state() { return state; } };
  }

  return { GAME: GAME, DEFAULT_INSTRUMENT: DEFAULT_INSTRUMENT, createState: createState, check: check, checkPlain: checkPlain, renderHtml: renderHtml, mount: mount };
});
