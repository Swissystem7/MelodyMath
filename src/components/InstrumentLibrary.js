// MelodyMath — WorldInstrumentLibrary screen (#591, owner spec 6376067230).
//
// 24 instruments in four families. Each open instrument has a culture card
// (where it comes from, its family, how it is played, a 10-second demo) and
// its own playing surface, the same surfaces and pointer wiring as the
// InstrumentStudio. Locked ones say after how many topics practised well they
// open: nothing is sold, every instrument is free.
//
// Progress is read from the studio's store (mm.studio), so the library and
// the studio open the same instruments. The library never changes a topic's
// musical way: it is a place to listen and play, not an exercise.
//
// Loading: the sounds are synthesised, so "loading" an instrument is planning
// its voices (instrumentLibrary.createLoader). Only the chosen instrument is
// prepared; the next one to open is prefetched when the page is idle.
// renderHtml is pure and tested in Node; mount() wires it to the page.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_INSTRUMENT_LIBRARY = api;
  if (typeof document !== 'undefined' && document.getElementById('libraryCard')) api.mount(document.getElementById('libraryCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const LIB = root.MM_LIBRARY || require('../lib/music/instrumentLibrary.js');
  const S = root.MM_STUDIO || require('../lib/music/instrumentStudio.js');
  const UI = root.MM_INSTRUMENT_STUDIO || require('./InstrumentStudio.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const e = JAM.esc;

  function statusHe(x, open) {
    return open ? 'פתוח' : 'ייפתח אחרי ' + x.opensAt + ' נושאים שתרגלתם היטב';
  }

  function cardHtml(x) {
    const c = x.card;
    return '<article class="lib-card" aria-labelledby="libCardHead">' +
      '<h4 id="libCardHead" tabindex="-1"><span aria-hidden="true">' + x.theme.icon + '</span> ' + e(x.he) + '</h4>' +
      '<dl class="lib-facts">' +
      '<dt>מאיפה</dt><dd>' + e(c.origin) + '</dd>' +
      '<dt>משפחה</dt><dd>' + e(LIB.FAMILY_HE[x.family]) + '</dd>' +
      '<dt>איך מנגנים</dt><dd>' + e(c.how) + '</dd>' +
      '<dt>על המסך</dt><dd>' + e(S.MECHANICS[x.mechanic].he) + '</dd>' +
      '</dl>' +
      '<div class="jam-row"><button type="button" class="secondary" data-act="demo">▶ הדגמה של ' + LIB.DEMO_SECONDS + ' שניות</button>' +
      // TODO-source: instruments.js has no verified source for some (kalimba); no link then.
      (/^https:/.test(c.source) ? '<a class="lib-src" href="' + e(c.source) + '" target="_blank" rel="noopener">מקור</a>' : '') + '</div>' +
      UI.surfaceHtml(x) +
      '</article>';
  }

  // view: { id, open: [ids], message }
  function renderHtml(view) {
    const v = view || {};
    const open = v.open || LIB.basicIds();
    const chosen = v.id && open.indexOf(v.id) >= 0 ? LIB.byId(v.id) : null;
    return '<div class="jam-head"><span class="tag">ספריית כלי העולם · ' + LIB.LIBRARY.length + ' כלים · כולם בחינם</span></div>' +
      '<h3>🌍 מכירים כלים מכל העולם</h3>' +
      '<p>בוחרים כלי פתוח, שומעים הדגמה ומנגנים. כלי חדש נפתח בכל נושא שתרגלתם היטב.</p>' +
      LIB.FAMILIES.map(function (f) {
        const list = LIB.byFamily(f);
        return '<section class="lib-family" aria-labelledby="libFam-' + f + '"><h4 id="libFam-' + f + '">' + e(LIB.FAMILY_HE[f]) + ' (' + list.length + ')</h4>' +
          '<div class="lib-grid">' + list.map(function (x) {
            const isOpen = open.indexOf(x.id) >= 0;
            return '<button type="button" class="lib-item' + (isOpen ? '' : ' locked') + '" data-act="pick" data-id="' + x.id + '"' +
              (isOpen ? ' aria-pressed="' + (chosen && chosen.id === x.id) + '"' : ' aria-disabled="true"') +
              ' aria-label="' + e(x.he + ', ' + statusHe(x, isOpen)) + '"><span aria-hidden="true">' + x.theme.icon + '</span> <b>' + e(x.he) + '</b>' +
              (isOpen ? '' : '<small>' + e(statusHe(x, false)) + '</small>') + '</button>';
          }).join('') + '</div></section>';
      }).join('') +
      (chosen ? cardHtml(chosen) : '') +
      '<p class="jam-msg" role="status" aria-live="polite">' + e(v.message || '') + '</p>';
  }

  function mount(el) {
    const store = root.localStorage;
    const loader = LIB.createLoader();
    let view = { id: null, message: '' };
    let demoBus = null;
    function progress() {
      const st = S.load(store);
      return { open: S.unlockedIds(st), mastered: Object.keys(st.correct).filter(function (t) { return st.correct[t] >= S.MASTERY; }).length };
    }
    function draw(focusSel) {
      const p = progress();
      view.open = p.open;
      el.innerHTML = renderHtml(view);
      const f = focusSel && el.querySelector(focusSel);
      if (f && f.focus) f.focus();
      return p;
    }
    function idle(fn) {
      if (typeof root.requestIdleCallback === 'function') root.requestIdleCallback(fn);
      else fn();
    }
    function stopDemo() {
      if (demoBus) { try { demoBus.gain.setTargetAtTime(0.0001, demoBus.context.currentTime, 0.05); } catch (err) { /* already gone */ } }
      demoBus = null;
    }
    function demo(x) {
      const me = root.musicEngine;
      const ac = me && me.getSharedAudioContext ? me.getSharedAudioContext() : null;
      if (!ac || typeof root.playVoice !== 'function' || (me.audioState && me.audioState.muted)) { view.message = 'הצליל כבוי כרגע.'; return; }
      if (ac.state === 'suspended') { try { ac.resume(); } catch (err) { /* autoplay */ } }
      stopDemo();
      demoBus = ac.createGain();
      demoBus.connect(ac.destination);
      const t0 = ac.currentTime + 0.05;
      LIB.demoPlan(x).forEach(function (n) {
        const g = ac.createGain();
        g.connect(demoBus);
        root.playVoice(ac, n.voice, n.hz, t0 + n.at, g);
        // A held (wind) note ends with its written length.
        if (LIB.KIND[x.mechanic] === 'hold') g.gain.setTargetAtTime(0.0001, t0 + n.at + n.dur, 0.05);
      });
      view.message = 'הדגמה: ' + x.he + ', ' + LIB.DEMO_SECONDS + ' שניות.';
    }
    const play = UI.wirePlay(el, function () { return LIB.byId(view.id) || LIB.BASICS[0]; });
    el.addEventListener('click', function (ev) {
      const n = ev.target.closest && ev.target.closest('[data-note]');
      if (n) { if (ev.detail === 0) play.strike(n, ev); return; } // pointer notes sound on pointerdown; Enter/Space here
      const b = ev.target.closest && ev.target.closest('[data-act]');
      if (!b) return;
      const act = b.getAttribute('data-act');
      if (act === 'pick') {
        const id = b.getAttribute('data-id');
        const x = LIB.byId(id);
        if (view.open.indexOf(id) < 0) { view.message = x.he + ': ' + statusHe(x, false) + '.'; draw(); return; }
        stopDemo();
        view.id = id;
        view.message = '';
        loader.prepare(id);
        const p = draw('#libCardHead');
        idle(function () { loader.prefetch(LIB.nextToOpen(p.mastered)); });
      } else if (act === 'demo' && view.id) {
        demo(LIB.byId(view.id));
        const m = el.querySelector('.jam-msg');
        if (m) m.textContent = view.message;
      } else if (act === 'damp') play.damp();
    });
    if (typeof root.addEventListener === 'function') root.addEventListener('mm:answer', function () {
      // Redraw only when an answer opened a new instrument.
      if (progress().open.length !== view.open.length) draw();
    });
    draw();
    return { get view() { return view; }, loader: loader };
  }

  return { renderHtml: renderHtml, cardHtml: cardHtml, mount: mount };
});
