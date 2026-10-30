// dragPlace (Refs #665, part 2 of #848): drag pieces into the practice-screen box. The box fills the answer. Ones sound on the child's instrument; bigger places on another family.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_DRAG_PLACE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const PLACES = [
    { kind: 'thousand', v: 1000, he: 'אלפים', name: 'אלף', hz: 98 },
    { kind: 'hundred', v: 100, he: 'מאות', name: 'מאה', hz: 131 },
    { kind: 'ten', v: 10, he: 'עשרות', name: 'עשרה', hz: 110 },
    { kind: 'one', v: 1, he: 'יחידות', name: 'יחידה', hz: 392 },
  ];
  const MAX_IN = 30;
  const FALLBACK = 'xylophone';
  function place(kind) { return PLACES.filter(function (p) { return p.kind === kind; })[0] || null; }
  function roundPart(n) {
    for (let i = 0; i < PLACES.length; i++) {
      const p = PLACES[i];
      if (n >= p.v && n % p.v === 0 && n / p.v <= 9) return { kind: p.kind, count: n / p.v };
    }
    return null;
  }
  function buildOf(parts) {
    const total = parts.reduce(function (s, x) { return s + place(x.kind).v * x.count; }, 0);
    const pieces = parts.reduce(function (s, x) { return s + x.count; }, 0);
    if (!total || pieces > MAX_IN) return null;
    const top = PLACES.findIndex(function (p) { return parts.some(function (x) { return x.kind === p.kind; }); });
    return { kind: 'build', target: total, pieces: PLACES.slice(top).map(function (p) { return p.kind; }) };
  }
  function buildSpec(prompt, skill) {
    const named = PLACES.map(function (p) {
      const m = prompt.match(new RegExp('(\\d+)\\s*' + p.he));
      return m ? { kind: p.kind, count: Number(m[1]) } : null;
    }).filter(Boolean);
    if (named.length >= 2) return buildOf(named.filter(function (x) { return x.count > 0; }));
    const sum = prompt.match(/^\s*\d+(\s*\+\s*\d+)+\s*=\s*\?\s*$/);
    if (!sum) return null;
    const nums = prompt.match(/\d+/g).map(Number);
    const parts = nums.map(roundPart);
    if (parts.some(function (x) { return !x; })) return null;
    if (skill !== 'place_value' && !nums.some(function (n) { return n >= 10; })) return null;
    return buildOf(parts);
  }
  function pickSpec(prompt, skill) {
    const which = prompt.match(/(גדול|קטן) יותר/);
    if (!which || skill !== 'place_value' || /\d[./]\d/.test(prompt)) return null;
    const labels = prompt.match(/\d{1,3}(?:,\d{3})+|\d+/g) || [];
    if (labels.length !== 2) return null;
    const options = labels.map(function (l) { return { label: l, value: Number(l.replace(/,/g, '')) }; });
    if (options[0].value === options[1].value) return null;
    return { kind: 'pick', bigger: which[1] === 'גדול', options: options };
  }
  function specForItem(item) {
    if (!item || typeof item !== 'object' || item.noMusic || typeof item.prompt !== 'string') return null;
    if (item.widget && item.widget !== 'tenExchange') return null;
    return buildSpec(item.prompt, item.skill) || pickSpec(item.prompt, item.skill);
  }
  function boxValue(spec, box) {
    if (!spec || !box || !box.length) return '';
    if (spec.kind === 'pick') return String(spec.options[box[0]].value);
    return String(box.reduce(function (s, k) { return s + place(k).v; }, 0));
  }
  function noteFor(spec, piece) {
    if (spec.kind === 'pick') {
      const o = spec.options;
      return { hz: o[piece].value > o[1 - piece].value ? 523.25 : 261.63, dur: 0.3 };
    }
    const p = place(piece);
    return { hz: p.hz, dur: p.v >= 10 ? 0.45 : 0.18 };
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pieceLabel(spec, piece) { return spec.kind === 'pick' ? spec.options[piece].label : place(piece).name; }
  function html(spec, box) {
    const ids = spec.kind === 'pick' ? [0, 1] : spec.pieces;
    const pile = ids.map(function (id) {
      const label = pieceLabel(spec, id);
      return '<button type="button" class="dp-piece dp-' + (spec.kind === 'pick' ? 'num' : id) + '" data-dp="' + id + '" aria-label="גררו לקופסה: ' + esc(label) + '">' + esc(label) + '</button>';
    }).join('');
    const inside = box.map(function (id, i) {
      return '<button type="button" class="dp-in dp-' + (spec.kind === 'pick' ? 'num' : id) + '" data-dp-at="' + i + '" aria-label="הוציאו מהקופסה: ' + esc(pieceLabel(spec, id)) + '">' + esc(pieceLabel(spec, id)) + '</button>';
    }).join('');
    const sum = spec.kind === 'build' && box.length ? spec.pieces.map(function (k) { return box.filter(function (x) { return x === k; }).length + ' ' + place(k).he; }).join(', ') : '';
    const ask = spec.kind === 'pick' ? 'גררו לקופסה את המספר ה' + (spec.bigger ? 'גדול' : 'קטן') + ' יותר' : 'גררו לקופסה מאות, עשרות ויחידות עד שתבנו את המספר';
    return '<div class="dp-wrap"><p class="dp-ask">' + ask + '</p><div class="dp-pile" role="group" aria-label="חלקים לגרירה">' + pile + '</div>' +
      '<div class="dp-box" role="group" aria-label="הקופסה">' + (inside || '<span class="dp-empty">גררו לכאן</span>') + '</div>' +
      '<p class="dp-sum" role="status" aria-live="polite">' + esc(sum) + '</p></div>';
  }
  function myInst() { if (root && root.MM_MY_INSTRUMENT) return root.MM_MY_INSTRUMENT; try { return require('../myInstrument.js'); } catch (e) { return null; } }
  function instData() { if (root && typeof root.instrumentById === 'function') return root; try { return require('../instruments.js'); } catch (e) { return null; } }
  function voicesFor(storage) {
    const mi = myInst(), d = instData();
    let id = mi ? mi.instrumentFor(FALLBACK, null, storage) : FALLBACK;
    if (id === 'ukulele') id = FALLBACK;
    const x = d && (d.instrumentById(id) || d.instrumentById(FALLBACK));
    const one = x && x.voice ? { id: x.id, family: x.family, voice: x.voice } : { id: FALLBACK, family: 'percussion', voice: 'woodBar' };
    const y = (d && d.INSTRUMENTS || []).filter(function (i) { return i.mechanism === 'M5' && i.voice && i.family !== one.family; })[0];
    return { one: one, big: y ? { id: y.id, family: y.family, voice: y.voice } : one };
  }
  function voiceFor(storage) { return voicesFor(storage).one.voice; }
  function sound(spec, piece, env) {
    const e = env || {};
    const pv = e.playVoice || (root && root.playVoice);
    const ac = e.audioContext || (root && typeof root.getSharedAudioContext === 'function' ? root.getSharedAudioContext() : null);
    if (e.quiet || typeof pv !== 'function' || !ac) return null;
    if (ac.state === 'suspended' && ac.resume) { try { ac.resume(); } catch (err) { /* autoplay */ } }
    const n = noteFor(spec, piece), vs = voicesFor(e.storage);
    const v = spec.kind === 'pick' || piece === 'one' ? vs.one : vs.big;
    pv(ac, v.voice, n.hz, ac.currentTime + 0.02, null, { dur: n.dur, gain: 0.22 });
    return { voice: v.voice, hz: n.hz, instrument: v.id };
  }
  function clearGhosts(doc) { if (!doc || !doc.querySelectorAll) return; const old = doc.querySelectorAll('.dp-ghost'); for (let i = 0; i < old.length; i++) if (old[i].remove) old[i].remove(); }
  function mount(host, item, o) {
    const spec = specForItem(item);
    const doc = root && root.document, opt = o || {};
    if (!spec || !host || !doc) return null;
    clearGhosts(doc);
    const el = doc.createElement('div');
    el.className = 'dp-host';
    host.appendChild(el);
    const box = [];
    function draw() { el.innerHTML = html(spec, box); }
    function changed() { draw(); if (opt.fill) opt.fill(boxValue(spec, box)); }
    function put(id) {
      if (spec.kind === 'pick') box.length = 0;
      else if (box.length >= MAX_IN) return;
      box.push(spec.kind === 'pick' ? Number(id) : id);
      changed();
      sound(spec, box[box.length - 1], opt);
    }
    let from = null;
    const drag = { ghostClass: 'dp-ghost', source: '.dp-piece', target: '.dp-box', onDrop: function () { if (from != null) put(from); } };
    el.addEventListener('pointerdown', function (ev) {
      const s = ev.target.closest ? ev.target.closest('.dp-piece') : null;
      if (!s) return;
      clearGhosts(doc);
      from = s.getAttribute('data-dp');
      drag.ghostClass = 'dp-ghost ' + s.className.replace('dp-piece', '').trim();
    });
    const jam = root.MM_JAM;
    const handle = jam && typeof jam.dragToTarget === 'function' ? jam.dragToTarget(el, drag) : null;
    if (host) host._dpDragCancel = handle ? handle.cancel : null;
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('.dp-piece, .dp-in') : null;
      if (!b || (handle && handle.dragged(b))) return;
      if (b.classList.contains('dp-piece')) put(b.getAttribute('data-dp'));
      else { box.splice(Number(b.getAttribute('data-dp-at')), 1); changed(); }
    });
    draw();
    return spec;
  }
  return { PLACES: PLACES, MAX_IN: MAX_IN, roundPart: roundPart, specForItem: specForItem, boxValue: boxValue, noteFor: noteFor, html: html, voiceFor: voiceFor, voicesFor: voicesFor, sound: sound, mount: mount };
});
