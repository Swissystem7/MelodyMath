// MelodyMath — InstrumentStudio screen (#591, spec 6376023552 + 6376035473).
//
// The card shows the topic's one musical way, the chosen instrument's own
// playing surface and, only at a choice moment, a group of 2-4 instrument
// buttons. Moments come from "התחלת נושא" here and from the app's answers
// (the 'mm:answer' event that the practice quiz sends after each check), so
// a choice waits in this card and never interrupts an exercise.
// Each mechanic has its own surface: zones, bars, tines, a slide strip,
// strike-and-damp bars, keys. Every note starts on pointerdown (several
// fingers at once) through instrumentVoices.playVoice and writes the same
// window.audioState fields as the other taps, so the latency test reads it.
// renderHtml is pure and tested in Node; mount() wires it to the page.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_INSTRUMENT_STUDIO = api;
  if (typeof document !== 'undefined' && document.getElementById('studioCard')) api.mount(document.getElementById('studioCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const S = root.MM_STUDIO || require('../lib/music/instrumentStudio.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const DATA = root && typeof root.instrumentById === 'function' ? root : require('../lib/instruments.js');
  const e = JAM.esc;

  const MOMENT_HE = { topicStart: 'מתחילים נושא: איזה כלי מנגן הפעם?', streak: 'רצף של 5 תשובות נכונות! רוצים להחליף כלי?', unlock: 'נפתח כלי חדש!' };
  const NOTE_HE = { 147: 'רה', 165: 'מי', 196: 'סול', 220: 'לה', 233: 'סי♭', 262: 'דו', 294: 'רה', 330: 'מי', 349: 'פה', 370: 'פה♯', 392: 'סול', 440: 'לה', 494: 'סי', 523: 'דו׳', 587: 'רה׳', 659: 'מי׳', 698: 'פה׳', 784: 'סול׳', 880: 'לה׳' };

  function noteBtn(cls, voice, hz, label, face, style) {
    return '<button type="button" class="st-note ' + cls + '" data-note="' + voice + '"' + (hz ? ' data-hz="' + hz + '"' : '') +
      (style ? ' style="' + style + '"' : '') + ' aria-label="' + e(label) + '">' + e(face) + '</button>';
  }

  // The playing surface of one profile.
  function surfaceHtml(prof) {
    const f = prof.feel;
    const he = prof.he;
    let inner = '';
    if (prof.mechanic === 'tapZones') {
      inner = noteBtn('st-zone st-dum', prof.samples[0], 0, he + ': דום במרכז', f.zones[0]) + noteBtn('st-zone st-tek', prof.samples[1], 0, he + ': טק בשוליים', f.zones[1]);
    } else if (prof.mechanic === 'barsByPitch' || prof.mechanic === 'keys') {
      inner = f.notes.map(function (hz, i) {
        const name = NOTE_HE[hz] || String(i + 1);
        return noteBtn(prof.mechanic === 'keys' ? 'st-key' : 'st-bar', prof.voice, hz, he + ' ' + name, name, prof.mechanic === 'keys' ? '' : 'height:' + (96 - i * 7) + 'px');
      }).join('');
    } else if (prof.mechanic === 'thumbPluck') {
      // Kalimba layout: the lowest tine in the middle, higher ones alternate outwards.
      const order = f.notes.map(function (hz, i) { return i; }).sort(function (a, b) { return (a % 2 ? -a : a) - (b % 2 ? -b : b); });
      inner = order.map(function (i) { return noteBtn('st-tine', prof.voice, f.notes[i], he + ' לשונית ' + (i + 1), '', 'height:' + (100 - i * 9) + 'px'); }).join('');
    } else if (prof.mechanic === 'pressSlide') {
      inner = noteBtn('st-zone', prof.samples[0], 0, he + ': לחיצה (נא)', 'נא') +
        '<div class="st-slide" role="group" aria-label="' + e(he) + ': מחליקים אצבע לאורך הרצועה">' +
        f.slide.map(function (hz, i) { return noteBtn('st-step', prof.samples[1], hz, he + ': גלישה, שלב ' + (i + 1), '·'); }).join('') + '</div>';
    } else if (prof.mechanic === 'tapPads') {
      inner = f.pads.map(function (pd) { return noteBtn('st-zone st-pad', prof.voice, pd[1], he + ': ' + pd[0], pd[0]); }).join('');
    } else if (prof.mechanic === 'strum') {
      // Strings across the surface: tap one, or swipe over several.
      inner = '<div class="st-strings" role="group" aria-label="' + e(he) + ': נוגעים במיתר או מחליקים אצבע על כמה מיתרים">' +
        f.strings.map(function (hz, i) { return noteBtn('st-string', prof.voice, hz, he + ' מיתר ' + (i + 1), '', 'border-width:' + (2 + Math.round((f.strings.length - i) / 3)) + 'px'); }).join('') + '</div>';
    } else if (prof.mechanic === 'hold') {
      // Holes of a wind instrument: the note lasts while the finger stays down.
      inner = f.notes.map(function (hz, i) {
        const name = NOTE_HE[hz] || String(i + 1);
        return noteBtn('st-hole', prof.voice, hz, he + ' ' + name + ', מחזיקים כדי לנשוף', name);
      }).join('');
    } else if (prof.mechanic === 'strikeDamp') {
      inner = f.notes.map(function (hz, i) { return noteBtn('st-bar st-gong', prof.voice, hz, he + ' קורה ' + (i + 1), String(i + 1)); }).join('') +
        '<button type="button" class="secondary st-damp" data-act="damp">✋ עמעום</button>';
    }
    return '<div class="st-surface st-' + prof.mechanic + ' st-theme-' + prof.theme.color + '" role="group" aria-label="' + e('מנגנים על ' + he + ': ' + S.MECHANICS[prof.mechanic].he) + '">' + inner + '</div>';
  }

  function momentHtml(state) {
    const m = state.moment;
    if (!m) return '';
    const head = m.kind === 'unlock' && m.fresh ? 'נפתח כלי חדש: ' + S.profile(m.fresh).he + '!' : MOMENT_HE[m.kind];
    return '<div class="st-choice" role="group" aria-labelledby="stChoiceHead"><h4 id="stChoiceHead" tabindex="-1">' + e(head) + '</h4><div class="jam-row">' +
      m.options.map(function (id) {
        const x = S.profile(id);
        return '<button type="button" class="st-option" data-act="choose" data-id="' + id + '" aria-pressed="' + (id === state.current) + '">' +
          '<span aria-hidden="true">' + x.theme.icon + '</span> <b>' + e(x.he) + '</b><small>' + e(S.MECHANICS[x.mechanic].he) + '</small></button>';
      }).join('') + '</div></div>';
  }

  function shelfHtml(state, device) {
    const open = S.unlockedIds(state);
    return '<ul class="st-shelf" aria-label="כל הכלים בסטודיו, כולם בחינם">' + S.PROFILES.map(function (x) {
      const status = !S.isAvailable(x, device) ? 'לא זמין במכשיר הזה: הצליל מגיע לאט מדי' :
        open.indexOf(x.id) >= 0 ? (x.id === state.current ? 'הכלי שלכם עכשיו' : 'פתוח') : 'ייפתח אחרי ' + x.opensAt + ' נושאים שתרגלתם היטב';
      return '<li class="' + (open.indexOf(x.id) >= 0 && S.isAvailable(x, device) ? 'open' : 'locked') + '"><span aria-hidden="true">' + x.theme.icon + '</span> ' + e(x.he) + ' · <small>' + e(status) + '</small></li>';
    }).join('') + '</ul>';
  }

  function renderHtml(state, view) {
    const v = view || {};
    const topic = v.topic || S.topics()[0];
    const method = S.primaryMethod(topic);
    const prof = S.profile(state.current);
    const opts = S.topics().map(function (t) {
      return '<option value="' + t + '"' + (t === topic ? ' selected' : '') + '>' + e(DATA.TOPICS[t].he) + '</option>';
    }).join('');
    return '<div class="jam-head"><span class="tag">סטודיו הכלים · כל הכלים בחינם</span></div>' +
      '<h3>🎶 בוחרים כלי ומנגנים</h3>' +
      '<div class="jam-row"><label for="stTopic">נושא</label><select id="stTopic" data-act="topic">' + opts + '</select>' +
      '<button type="button" class="primary" data-act="start">התחלת נושא</button></div>' +
      '<p class="st-method">הדרך המוזיקלית בנושא הזה: <b>' + e(method.he) + '</b>. הכלי משנה רק את הצליל ואת אופן הנגינה, לא את התרגיל ולא את התשובה.</p>' +
      momentHtml(state) +
      '<p class="st-now"><span aria-hidden="true">' + prof.theme.icon + '</span> הכלי שלכם: <b>' + e(prof.he) + '</b> · ' + e(S.MECHANICS[prof.mechanic].he) + '</p>' +
      surfaceHtml(prof) + shelfHtml(state, v.device) +
      '<p class="jam-msg" role="status" aria-live="polite">' + e(v.message || '') + '</p>';
  }

  // window.audioState's last measured tap, the device input for isAvailable.
  function device() {
    const a = root.audioState;
    const ms = a && a.lastStart != null && a.lastEventTime != null ? a.lastStart - a.lastEventTime : 0;
    return { jsPathMs: ms > 0 ? ms : 0 };
  }

  // Pointer wiring shared by the studio and the library: every note starts on
  // pointerdown (one per finger), a swipe over a slide strip or strings plays
  // each one it enters, and a wind note ends when its finger lifts, so the
  // hold is the note length. getProfile() returns the instrument on screen.
  function wirePlay(el, getProfile) {
    let ringing = null;
    const held = {};
    function release(bus) {
      if (bus) { try { bus.gain.setTargetAtTime(0.0001, bus.context.currentTime, 0.04); } catch (err) { /* already gone */ } }
    }
    function damp() {
      release(ringing);
      ringing = null;
    }
    function strike(btn, ev) {
      const me = root.musicEngine;
      const ac = me && me.getSharedAudioContext ? me.getSharedAudioContext() : null;
      if (!ac || typeof root.playVoice !== 'function' || (me.audioState && me.audioState.muted)) return;
      if (ac.state === 'suspended') { try { ac.resume(); } catch (err) { /* autoplay */ } }
      if (getProfile().mechanic === 'strikeDamp') damp();
      const bus = ac.createGain();
      bus.connect(ac.destination);
      root.playVoice(ac, btn.getAttribute('data-note'), Number(btn.getAttribute('data-hz')) || 0, ac.currentTime, bus);
      ringing = bus;
      if (ev && ev.pointerId != null) held[ev.pointerId] = bus;
      const a = me.audioState;
      if (a) { a.lastStart = performance.now(); a.lastEventTime = ev && ev.timeStamp > 0 ? ev.timeStamp : a.lastStart; a.lastVoice = btn.getAttribute('data-note'); a.taps += 1; }
      btn.classList.remove('mm-tap'); void btn.offsetWidth; btn.classList.add('mm-tap');
      if (root.navigator && typeof root.navigator.vibrate === 'function') { try { root.navigator.vibrate(10); } catch (err) { /* not allowed */ } }
    }
    const down = {};
    el.addEventListener('pointerdown', function (ev) {
      const b = ev.target.closest && ev.target.closest('[data-note]');
      if (!b) return;
      down[ev.pointerId] = b;
      if (b.releasePointerCapture) { try { b.releasePointerCapture(ev.pointerId); } catch (err) { /* none */ } }
      strike(b, ev);
    });
    el.addEventListener('pointerover', function (ev) {
      const b = ev.target.closest && ev.target.closest('.st-step,.st-string');
      const was = down[ev.pointerId];
      if (b && was && was !== b && was.className === b.className) { down[ev.pointerId] = b; strike(b, ev); }
    });
    ['pointerup', 'pointercancel'].forEach(function (t) {
      el.addEventListener(t, function (ev) {
        delete down[ev.pointerId];
        if (getProfile().mechanic === 'hold') release(held[ev.pointerId]);
        delete held[ev.pointerId];
      });
    });
    return { strike: strike, damp: damp };
  }

  function mount(el) {
    const store = root.localStorage;
    let state = S.load(store);
    let view = { topic: S.topics()[0], message: '' };
    function draw(focusSel) {
      view.device = device();
      el.innerHTML = renderHtml(state, view);
      const f = focusSel && el.querySelector(focusSel);
      if (f && f.focus) f.focus();
    }
    function commit(next, msg) {
      state = next;
      S.save(store, state);
      view.message = msg || '';
      draw(state.moment ? '#stChoiceHead' : null);
    }
    const play = wirePlay(el, function () { return S.profile(state.current); });
    el.addEventListener('click', function (ev) {
      const n = ev.target.closest && ev.target.closest('[data-note]');
      if (n && ev.detail === 0) return play.strike(n, ev); // Enter/Space: the same sound for keyboard players
      const b = ev.target.closest && ev.target.closest('[data-act]');
      if (!b) return;
      const act = b.getAttribute('data-act');
      if (act === 'start') commit(S.onEvent(state, { type: 'topicStart' }, device()), S.choiceOptions(state, device()) ? '' : 'עוד אין שני כלים פתוחים לבחירה.');
      else if (act === 'choose') { commit(S.choose(state, b.getAttribute('data-id')), 'בחרתם ' + S.profile(b.getAttribute('data-id')).he + '. התרגיל נשאר אותו תרגיל.'); const s = el.querySelector('.st-note'); if (s) s.focus(); }
      else if (act === 'damp') play.damp();
    });
    el.addEventListener('change', function (ev) {
      if (ev.target && ev.target.id === 'stTopic') { view.topic = ev.target.value; draw('#stTopic'); }
    });
    // Answers from the practice quiz: counted the same whatever the instrument.
    if (typeof root.addEventListener === 'function') {
      root.addEventListener('mm:answer', function (ev) {
        const d = (ev && ev.detail) || {};
        commit(S.onEvent(state, { type: 'answer', correct: !!d.correct, topic: d.topic }, device()));
      });
    }
    draw();
    return { get state() { return state; }, onEvent: function (ev) { commit(S.onEvent(state, ev, device())); } };
  }

  return { renderHtml: renderHtml, surfaceHtml: surfaceHtml, momentHtml: momentHtml, wirePlay: wirePlay, device: device, mount: mount };
});
