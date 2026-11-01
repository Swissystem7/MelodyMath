// MelodyMath — NowAloneScreen: Claude Design pixel-faithful Screen 2b. Refs #665 #891.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_NOW_ALONE_SCREEN = api;
  if (typeof document !== 'undefined' && document.getElementById('nowAloneCard')) api.mount(document.getElementById('nowAloneCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const QUIZ = [
    { topic: 'שטח', q: 'במלבן יש 4 שורות ו־6 עמודות. כמה משבצות יש בו?', a: 24, g: 4, n: 6, unit: 'משבצות' },
    { topic: 'שטח', q: 'במלבן יש 5 שורות ו־3 עמודות. כמה משבצות יש בו?', a: 15, g: 5, n: 3, unit: 'משבצות' },
    { topic: 'נפח', q: 'מגדל של 3 שכבות. בכל שכבה 2 שורות ו־3 עמודות. כמה קוביות יש בו?', a: 18, g: 3, n: 6, unit: 'קוביות' }
  ];

  function e(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function createState(qi) {
    const i = Number(qi) || 0;
    return { qi: i, qIn: '', qState: 'idle', qTries: 0 };
  }

  function pressKey(state, key) {
    if (state.qState === 'right') return state;
    let inp = state.qState === 'wrong' ? '' : state.qIn;
    if (key === 'del') inp = inp.slice(0, -1);
    else if (key === 'clr') inp = '';
    else if (inp.length < 3) inp = (inp === '0' ? '' : inp) + key;
    return Object.assign({}, state, {
      qIn: inp,
      qState: (state.qState === 'wrong' || state.qState === 'retry') ? 'retry' : 'idle'
    });
  }

  function submit(state) {
    if (state.qState === 'right') {
      return createState((state.qi + 1) % QUIZ.length);
    }
    if (state.qIn === '' || state.qState === 'wrong') return state;
    const Q = QUIZ[state.qi % QUIZ.length];
    if (Number(state.qIn) === Q.a) {
      return Object.assign({}, state, { qState: 'right' });
    }
    return Object.assign({}, state, { qState: 'wrong', qTries: state.qTries + 1 });
  }

  function renderHtml(state) {
    const s = state || createState(0);
    const qi = s.qi % QUIZ.length, Q = QUIZ[qi];
    const qRight = s.qState === 'right', qWrong = s.qState === 'wrong' || s.qState === 'retry';
    const qEmpty = !qRight && (s.qIn === '' || s.qState === 'wrong');

    let dotsHtml = '';
    for (let d = 0; d < QUIZ.length; d++) {
      const w = d === qi ? 28 : 12;
      const bg = d < qi ? '#0F766E' : (d === qi ? '#1B1446' : '#D8D2EE');
      dotsHtml += '<span style="width:' + w + 'px;height:12px;border-radius:6px;background:' + bg + ';transition:width .2s"></span>';
    }

    const ansBorder = qRight ? '#0F766E' : (s.qState === 'wrong' ? '#C2410C' : '#1B1446');
    const ansBg = qRight ? '#D5F6EC' : (s.qState === 'wrong' ? '#FFF1E6' : '#FFFFFF');
    const ansColor = s.qIn === '' ? '#6B6396' : '#1B1446';
    const ansText = s.qIn === '' ? '?' : s.qIn;

    let msgHtml = '';
    if (!qWrong && !qRight) {
      msgHtml = '<div style="min-height:56px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:500;color:#4A3F7A;text-align:center">כתבו תשובה ולחצו ״בדיקה״. התשובה תיבדק רק אחרי השליחה.</div>';
    } else if (qWrong) {
      let hintGroupsHtml = '';
      for (let g = 0; g < Q.g; g++) {
        let dots = '';
        for (let dn = 0; dn < Q.n; dn++) {
          dots += '<span style="width:8px;height:8px;border-radius:4px;background:#1B1446"></span>';
        }
        hintGroupsHtml += '<div style="display:flex;gap:2px;padding:4px;border:2px solid #1B1446;border-radius:8px;background:#FFF6E5">' + dots + '</div>';
      }
      const wrongText = s.qTries >= 2 ? 'טעויות עוזרות ללמוד. נסו שוב!' : 'כמעט! זו לא התשובה. נסו שוב.';
      msgHtml = '<div role="status" style="background:#FFF1E6;border:3px solid #C2410C;border-radius:22px;padding:10px 12px;display:flex;flex-direction:column;gap:8px">' +
        '<div style="font-size:16px;font-weight:700;line-height:1.35">' + wrongText + '</div>' +
        '<div style="background:#FFFFFF;border:2px dashed #C2410C;border-radius:16px;padding:8px 10px;display:flex;flex-direction:column;gap:6px">' +
        '<div style="font-size:14px;font-weight:700;color:#7A2E0A">רמז: ' + Q.g + ' קבוצות של ' + Q.n + '. ספרו את כל הנקודות!</div>' +
        '<div dir="ltr" aria-hidden="true" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">' + hintGroupsHtml + '</div>' +
        '</div></div>';
    } else if (qRight) {
      msgHtml = '<div role="status" style="background:#2ED3A8;border:3px solid #1B1446;border-radius:22px;padding:14px 16px;font-size:19px;font-weight:800;text-align:center">✓ נכון! ' + Q.a + ' ' + Q.unit + '</div>';
    }

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clr', '0', 'del'];
    let keysHtml = '<div dir="ltr" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:auto">';
    for (let k = 0; k < keys.length; k++) {
      const kv = keys[k], isAction = kv === 'del' || kv === 'clr';
      const label = kv === 'del' ? '⌫' : (kv === 'clr' ? 'נקה' : kv);
      const aria = kv === 'del' ? 'מחיקה' : (kv === 'clr' ? 'ניקוי' : kv);
      const bg = isAction ? '#E6E1F5' : '#FFFFFF';
      const fSize = kv === 'clr' ? '18px' : '24px';
      keysHtml += '<button type="button" aria-label="' + aria + '" data-key="' + kv + '" style="height:50px;border-radius:18px;border:3px solid #1B1446;background:' + bg + ';color:#1B1446;cursor:pointer;box-shadow:0 4px 0 #1B1446;font:800 ' + fSize + ' Rubik">' + label + '</button>';
    }
    keysHtml += '</div>';

    const submitLabel = qRight ? (qi === QUIZ.length - 1 ? 'סיום הנושא ←' : 'לשאלה הבאה ←') : 'בדיקה';
    const submitBg = qRight ? '#2ED3A8' : (qEmpty ? '#E6E1F5' : '#FF8A3D');
    const submitColor = qEmpty ? '#4A3F7A' : '#1B1446';
    const submitBorder = qEmpty ? '#B7AED8' : '#1B1446';
    const submitShadow = qEmpty ? 'none' : '0 5px 0 #1B1446';

    return '<div dir="rtl" class="cd-frame cd-now-alone" style="width:390px;max-width:100%;min-height:844px;border-radius:52px;border:10px solid #15102E;background:#F4F1FF;overflow:hidden;position:relative;box-shadow:0 20px 50px rgba(27,20,70,.25);font-family:Rubik,system-ui,sans-serif;color:#1B1446;display:flex;flex-direction:column;box-sizing:border-box;margin:0 auto">' +
      '<div style="height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 30px;font-weight:700;font-size:15px;flex:none"><span>9:41</span><span style="display:flex;gap:5px"><span style="width:18px;height:10px;border-radius:3px;background:#1B1446"></span><span style="width:24px;height:11px;border-radius:3px;border:2px solid #1B1446"></span></span></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 20px 10px;flex:none">' +
      '<button type="button" aria-label="חזרה" data-act="back" style="width:52px;height:52px;border-radius:18px;border:3px solid #1B1446;background:#FFFFFF;font:800 24px Rubik;color:#1B1446;cursor:pointer;box-shadow:0 4px 0 #1B1446">→</button>' +
      '<div style="text-align:center"><div style="font-size:24px;font-weight:900;letter-spacing:-.5px">עכשיו לבד</div><div style="font-size:13px;font-weight:500;color:#4A3F7A">סוף הנושא · בלי מוזיקה</div></div>' +
      '<div style="height:52px;border-radius:18px;background:#FFFFFF;border:3px dashed #1B1446;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;padding:0 8px;box-sizing:border-box">בשקט</div>' +
      '</div>' +
      '<div style="padding:0 20px 24px;display:flex;flex-direction:column;gap:12px;flex:1">' +
      '<div style="display:flex;align-items:center;justify-content:space-between"><span style="font-size:14px;font-weight:600;color:#4A3F7A">שאלה ' + (qi + 1) + ' מתוך ' + QUIZ.length + '</span><div style="display:flex;gap:6px">' + dotsHtml + '</div></div>' +
      '<div style="background:#FFFFFF;border:3px solid #1B1446;border-radius:24px;padding:14px 16px;display:flex;flex-direction:column;gap:6px">' +
      '<span style="align-self:flex-start;background:#B9A5FF;border-radius:10px;padding:3px 10px;font-size:13px;font-weight:700">' + e(Q.topic) + '</span>' +
      '<div style="font-size:21px;font-weight:700;line-height:1.35">' + e(Q.q) + '</div>' +
      '</div>' +
      '<div aria-live="polite" dir="ltr" style="height:76px;box-sizing:border-box;border-radius:22px;display:flex;align-items:center;justify-content:center;font:900 44px Rubik;border:3px solid ' + ansBorder + ';background:' + ansBg + ';color:' + ansColor + '">' + ansText + '</div>' +
      msgHtml +
      keysHtml +
      '<button type="button" data-act="submit" style="height:64px;flex:none;border-radius:22px;font:800 20px Rubik;cursor:' + (qEmpty ? 'default' : 'pointer') + ';border:3px solid ' + submitBorder + ';background:' + submitBg + ';color:' + submitColor + ';box-shadow:' + submitShadow + '">' + submitLabel + '</button>' +
      '</div></div>';
  }

  function mount(el, init) {
    let state = createState(init && init.qi);
    function draw() { el.innerHTML = renderHtml(state); }
    el.addEventListener('click', function (ev) {
      const keyBtn = ev.target.closest ? ev.target.closest('[data-key]') : null;
      if (keyBtn) {
        state = pressKey(state, keyBtn.getAttribute('data-key'));
        draw();
        return;
      }
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      if (act === 'submit') {
        state = submit(state);
        draw();
      } else if (act === 'back') {
        state = createState(0);
        draw();
      }
    });
    draw();
    return { get state() { return state; } };
  }

  return { QUIZ: QUIZ, createState: createState, pressKey: pressKey, submit: submit, renderHtml: renderHtml, mount: mount };
});
