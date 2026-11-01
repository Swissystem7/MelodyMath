// MelodyMath — PersonalBestEncoreScreen: Claude Design pixel-faithful Screen 1c. Refs #591 #665 #891.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_ENCORE_SCREEN = api;
  if (typeof document !== 'undefined' && document.getElementById('encoreCard')) api.mount(document.getElementById('encoreCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const JAM = root.MM_JAM || (typeof require === 'function' ? require('./jamKit.js') : null);
  const MEL = [0, 2, 4, 2, 5, 4, 2, 0, 4, 5, 7, 7];
  const MELF = [392, 440, 523, 587, 659, 784, 880, 1047];
  const CONF_COLORS = ['#FFC93C', '#FF8A3D', '#2ED3A8', '#FF8FB8', '#5EC8FF', '#FFFFFF'];
  const BAR_COLORS = ['#FF8A3D', '#2ED3A8', '#B9A5FF', '#5EC8FF'];

  function createState(best, score) {
    const b = Number(best) || 14, s = Number(score) || 18;
    return { best: b, score: s, gain: Math.max(0, s - b), ep: -1 };
  }

  function renderHtml(state) {
    const s = state || createState();
    const best = s.best, score = s.score, gain = s.gain, ep = s.ep;

    let confHtml = '<div aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;overflow:hidden">';
    for (let i = 0; i < 26; i++) {
      const left = ((i * 37) % 100);
      const w = i % 3 ? 8 : 12, h = i % 2 ? 14 : 8;
      const r = i % 4 ? 2 : 6;
      const c = CONF_COLORS[i % 6];
      const dur = (4 + (i % 5) * 0.7).toFixed(1);
      const delay = ((i * 0.31) % 4).toFixed(1);
      confHtml += '<span style="position:absolute;top:-20px;left:' + left + '%;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px;background:' + c + ';animation:mmFall ' + dur + 's linear ' + delay + 's infinite"></span>';
    }
    confHtml += '</div>';

    let melodyHtml = '';
    for (let i = 0; i < MEL.length; i++) {
      const p = MEL[i], h = 34 + p * 11;
      const isAct = ep === i, isDone = ep > i;
      const bg = isAct ? '#FFC93C' : (isDone ? '#FF8FB8' : BAR_COLORS[i % BAR_COLORS.length]);
      const border = isAct ? '3px solid #FFFFFF' : '0';
      const tr = isAct ? 'transform:translateY(-8px);' : '';
      melodyHtml += '<button type="button" aria-label="צליל ' + (i + 1) + '" data-act="col" data-col="' + i + '" style="flex:1;min-width:0;height:' + h + 'px;border-radius:10px;cursor:pointer;padding:0;border:' + border + ';background:' + bg + ';' + tr + 'transition:background .1s,transform .1s"></button>';
    }

    const encNote = ep >= 0 ? 'צליל ' + (ep + 1) + ' מתוך ' + MEL.length : 'הקישו על עמודה';
    const encPlayLabel = ep >= 0 ? '■ עצרו' : '▶  נגנו שוב את המנגינה';

    return '<div dir="rtl" class="cd-frame cd-encore" style="width:390px;max-width:100%;min-height:844px;border-radius:52px;border:10px solid #15102E;background:#2A1B6B;overflow:hidden;position:relative;box-shadow:0 20px 50px rgba(27,20,70,.25);font-family:Rubik,system-ui,sans-serif;color:#FFFFFF;display:flex;flex-direction:column;box-sizing:border-box;margin:0 auto">' +
      confHtml +
      '<div style="height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 30px;font-weight:700;font-size:15px;flex:none;position:relative"><span>9:41</span><span style="display:flex;gap:5px"><span style="width:18px;height:10px;border-radius:3px;background:#FFFFFF"></span><span style="width:24px;height:11px;border-radius:3px;border:2px solid #FFFFFF"></span></span></div>' +
      '<div style="padding:8px 22px 26px;display:flex;flex-direction:column;align-items:center;gap:16px;flex:1;position:relative">' +
      '<div style="font-size:16px;font-weight:700;color:#FFC93C;letter-spacing:.5px">שיא אישי חדש!</div>' +
      '<div style="font-size:84px;font-weight:900;line-height:.95;letter-spacing:-2px">הדרן!</div>' +
      '<div style="font-size:17px;font-weight:500;color:#E4DCFF;text-align:center;max-width:300px">ניצחת את התוצאה הכי טובה שלך — המנגינה שלך מבקשת עוד הופעה</div>' +
      '<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;width:100%;margin-top:4px">' +
      '<div style="background:#3D2C8A;border-radius:22px;padding:12px;text-align:center"><div style="font-size:13px;font-weight:600;color:#E4DCFF">השיא הקודם</div><div style="font-size:38px;font-weight:900">' + best + '</div></div>' +
      '<div style="width:84px;height:84px;border-radius:50%;background:#FFC93C;color:#1B1446;display:flex;flex-direction:column;align-items:center;justify-content:center;border:4px solid #FFFFFF;animation:mmPulse 1.6s ease-in-out infinite"><span dir="ltr" style="font-size:28px;font-weight:900;line-height:1">+' + gain + '</span><span style="font-size:11px;font-weight:700">נקודות</span></div>' +
      '<div style="background:#FFFFFF;color:#1B1446;border-radius:22px;padding:12px;text-align:center"><div style="font-size:13px;font-weight:600;color:#4A3F7A">השיא החדש</div><div style="font-size:38px;font-weight:900">' + score + '</div></div>' +
      '</div>' +
      '<div style="width:100%;background:#3D2C8A;border-radius:26px;padding:14px 14px 12px;box-sizing:border-box">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px"><span style="font-size:16px;font-weight:700">המנגינה הכי טובה שלך</span><span style="font-size:13px;font-weight:600;color:#E4DCFF">' + encNote + '</span></div>' +
      '<div style="height:120px;display:flex;align-items:flex-end;gap:5px" dir="ltr">' +
      melodyHtml +
      '</div></div>' +
      '<div style="display:flex;flex-direction:column;gap:12px;width:100%;margin-top:auto">' +
      '<button type="button" data-act="encPlay" style="height:70px;border-radius:26px;border:3px solid #FFFFFF;background:#FFC93C;font:800 22px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 6px 0 #120B3A">' + encPlayLabel + '</button>' +
      '<button type="button" data-act="next" style="height:60px;border-radius:24px;border:3px solid #FFFFFF;background:transparent;font:700 19px Rubik;color:#FFFFFF;cursor:pointer">לשלב הבא ←</button>' +
      '</div></div></div>';
  }

  function mount(el, init) {
    let state = createState(init && init.best, init && init.score), timer = null;
    function draw() { el.innerHTML = renderHtml(state); }
    function playSeq() {
      clearTimeout(timer);
      let i = 0;
      function tick() {
        if (i >= MEL.length) { state = Object.assign({}, state, { ep: -1 }); draw(); return; }
        state = Object.assign({}, state, { ep: i });
        draw();
        i++;
        timer = setTimeout(tick, 220);
      }
      tick();
    }
    el.addEventListener('click', function (ev) {
      const colBtn = ev.target.closest ? ev.target.closest('[data-act="col"]') : null;
      if (colBtn) {
        clearTimeout(timer);
        const col = Number(colBtn.getAttribute('data-col'));
        state = Object.assign({}, state, { ep: col });
        draw(); return;
      }
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      if (act === 'encPlay') {
        if (state.ep >= 0) { clearTimeout(timer); state = Object.assign({}, state, { ep: -1 }); draw(); }
        else { playSeq(); }
      }
    });
    draw();
    return { get state() { return state; } };
  }

  return { MEL: MEL, MELF: MELF, createState: createState, renderHtml: renderHtml, mount: mount };
});
