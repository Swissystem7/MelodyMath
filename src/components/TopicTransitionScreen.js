// MelodyMath — TopicTransitionScreen: Claude Design pixel-faithful Screen 2c. Refs #665 #891.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TOPIC_TRANSITION_SCREEN = api;
  if (typeof document !== 'undefined' && document.getElementById('topicTransitionCard')) {
    api.mount(document.getElementById('topicTransitionCard'));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const BRM = [[523, 1], [659, 1], [784, 1], [659, 1], [880, 1], [784, 1], [1047, 3]];

  function e(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function createState(opts) {
    const o = opts || {};
    return {
      bView: o.view || 'bridge',
      bp: typeof o.bp === 'number' ? o.bp : -1,
      bDone: Boolean(o.done),
      prevTopic: o.prevTopic || 'שטח',
      prevStars: o.prevStars || '★★★',
      nextTopic: o.nextTopic || 'נפח',
      nextSubtitle: o.nextSubtitle || 'בונים בשכבות',
      nextPrompt: o.nextPrompt || 'בנו מגדל של 2 שורות, 2 עמודות ו־3 שכבות'
    };
  }

  function setStep(state, bp) {
    const p = Number(bp);
    if (p < 0 || p >= BRM.length) {
      return Object.assign({}, state, { bp: -1, bDone: p >= BRM.length });
    }
    return Object.assign({}, state, { bp: p, bDone: false });
  }

  function transitionToNext(state) {
    return Object.assign({}, state, { bp: -1, bView: 'next' });
  }

  function backToBridge(state) {
    return Object.assign({}, state, { bView: 'bridge', bp: -1, bDone: false });
  }

  function renderHtml(state) {
    const s = state || createState();
    const isBridge = s.bView === 'bridge';

    if (!isBridge) {
      return '<div dir="rtl" class="cd-frame cd-topic-transition" style="width:390px;max-width:100%;min-height:844px;border-radius:52px;border:10px solid #15102E;background:#EAF7F3;overflow:hidden;position:relative;box-shadow:0 20px 50px rgba(27,20,70,.25);font-family:Rubik,system-ui,sans-serif;color:#1B1446;display:flex;flex-direction:column;box-sizing:border-box;margin:0 auto">' +
        '<div style="height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 30px;font-weight:700;font-size:15px;flex:none"><span>9:41</span><span style="display:flex;gap:5px"><span style="width:18px;height:10px;border-radius:3px;background:#1B1446"></span><span style="width:24px;height:11px;border-radius:3px;border:2px solid #1B1446"></span></span></div>' +
        '<div style="padding:12px 22px 26px;display:flex;flex-direction:column;gap:16px;flex:1;background:#EAF7F3">' +
        '<div style="font-size:15px;font-weight:700;color:#4A3F7A">תרגיל 1 · ' + e(s.nextTopic) + '</div>' +
        '<div style="background:#FFFFFF;border:3px solid #1B1446;border-radius:24px;padding:18px;font-size:22px;font-weight:700;line-height:1.35">' + e(s.nextPrompt) + '</div>' +
        '<div role="status" style="background:#D3EFE6;border-radius:18px;padding:12px 14px;font-size:15px;font-weight:600">מנגינת המעבר נעצרה. התרגיל מתחיל בשקט.</div>' +
        '<button type="button" data-act="back" style="margin-top:auto;height:60px;border-radius:24px;border:3px solid #1B1446;background:#FFFFFF;font:700 18px Rubik;color:#1B1446;cursor:pointer">→ חזרה למסך המעבר (הדגמה)</button>' +
        '</div></div>';
    }

    let barsHtml = '';
    for (let i = 0; i < BRM.length; i++) {
      const f = BRM[i][0], d = BRM[i][1];
      const h = Math.round(28 + (f - 523) / 524 * 56);
      const bg = s.bp === i ? '#FFFFFF' : ((s.bp > i || (s.bDone && s.bp < 0)) ? '#1B1446' : '#FFE79A');
      const tr = s.bp === i ? 'translateY(-6px)' : 'none';
      barsHtml += '<span style="flex:' + d + ';height:' + h + 'px;border-radius:10px;box-sizing:border-box;border:3px solid #1B1446;transition:background .1s, transform .1s;background:' + bg + ';transform:' + tr + '"></span>';
    }

    const bPlayIcon = s.bp >= 0 ? '■' : '▶';
    const bPlayAria = s.bp >= 0 ? 'עצירת המנגינה' : 'ניגון מנגינת המעבר';
    const bStatus = s.bp >= 0 ? 'המנגינה מתנגנת… התרגיל יתחיל אחריה' : (s.bDone ? 'המנגינה הסתיימה — מוכנים?' : 'הקשיבו למנגינת המעבר');

    return '<div dir="rtl" class="cd-frame cd-topic-transition" style="width:390px;max-width:100%;min-height:844px;border-radius:52px;border:10px solid #15102E;background:#FFC93C;overflow:hidden;position:relative;box-shadow:0 20px 50px rgba(27,20,70,.25);font-family:Rubik,system-ui,sans-serif;color:#1B1446;display:flex;flex-direction:column;box-sizing:border-box;margin:0 auto">' +
      '<div style="height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 30px;font-weight:700;font-size:15px;flex:none"><span>9:41</span><span style="display:flex;gap:5px"><span style="width:18px;height:10px;border-radius:3px;background:#1B1446"></span><span style="width:24px;height:11px;border-radius:3px;border:2px solid #1B1446"></span></span></div>' +
      '<div style="padding:12px 22px 26px;display:flex;flex-direction:column;align-items:center;gap:18px;flex:1">' +
      '<div style="font-size:15px;font-weight:700;letter-spacing:.3px">מעבר נושא</div>' +
      '<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;width:100%">' +
      '<div style="background:#FFFFFF;border:3px solid #1B1446;border-radius:22px;padding:12px;text-align:center"><div style="font-size:13px;font-weight:600;color:#4A3F7A">סיימתם</div><div style="font-size:28px;font-weight:900">' + e(s.prevTopic) + '</div><div style="font-size:14px;font-weight:700;color:#0F766E">✓ ' + e(s.prevStars) + '</div></div>' +
      '<div style="font-size:30px;font-weight:900">←</div>' +
      '<div style="background:#1B1446;color:#FFFFFF;border:3px solid #1B1446;border-radius:22px;padding:12px;text-align:center"><div style="font-size:13px;font-weight:600;color:#E4DCFF">הבא בתור</div><div style="font-size:28px;font-weight:900">' + e(s.nextTopic) + '</div><div style="font-size:14px;font-weight:700;color:#FFC93C">' + e(s.nextSubtitle) + '</div></div>' +
      '</div>' +
      '<div style="font-size:34px;font-weight:900;line-height:1.1;text-align:center;letter-spacing:-.5px">כל הכבוד!<br>עכשיו — ' + e(s.nextTopic) + '</div>' +
      '<button type="button" aria-label="' + e(bPlayAria) + '" data-act="play" style="width:132px;height:132px;border-radius:50%;border:4px solid #FFFFFF;background:#1B1446;color:#FFC93C;font:900 48px Rubik;cursor:pointer;box-shadow:0 8px 0 #7A5A00;display:flex;align-items:center;justify-content:center">' + bPlayIcon + '</button>' +
      '<div dir="ltr" style="display:flex;align-items:flex-end;gap:6px;height:90px;width:100%">' + barsHtml + '</div>' +
      '<div aria-live="polite" style="font-size:17px;font-weight:700;text-align:center;min-height:24px">' + e(bStatus) + '</div>' +
      '<div style="margin-top:auto;width:100%;display:flex;flex-direction:column;gap:8px">' +
      '<div style="font-size:13px;font-weight:600;text-align:center">המנגינה תמיד נעצרת לפני שהתרגיל מתחיל</div>' +
      '<button type="button" data-act="continue" style="height:70px;border-radius:26px;border:3px solid #1B1446;background:#FFFFFF;font:800 22px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 6px 0 #1B1446">המשך ←</button>' +
      '</div></div></div>';
  }

  function mount(el, init) {
    let state = createState(init), timer = null;
    function stopMelody() {
      if (timer) { clearTimeout(timer); timer = null; }
      state = Object.assign({}, state, { bp: -1 });
    }
    function draw() { el.innerHTML = renderHtml(state); }
    function playSeq() {
      stopMelody();
      let i = 0;
      function tick() {
        if (i >= BRM.length) {
          state = Object.assign({}, state, { bp: -1, bDone: true });
          draw();
          return;
        }
        state = Object.assign({}, state, { bp: i, bDone: false });
        draw();
        const dur = BRM[i][1] * 200;
        i++;
        timer = setTimeout(tick, dur);
      }
      tick();
    }

    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      if (act === 'play') {
        if (state.bp >= 0) {
          stopMelody();
          draw();
        } else {
          playSeq();
        }
      } else if (act === 'continue') {
        stopMelody();
        state = transitionToNext(state);
        draw();
      } else if (act === 'back') {
        stopMelody();
        state = backToBridge(state);
        draw();
      }
    });
    draw();
    return {
      get state() { return state; },
      stopMelody: stopMelody,
      playMelody: playSeq
    };
  }

  return {
    BRM: BRM,
    createState: createState,
    setStep: setStep,
    transitionToNext: transitionToNext,
    backToBridge: backToBridge,
    renderHtml: renderHtml,
    mount: mount
  };
});
