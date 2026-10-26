// MelodyMath — two more instrument families for a topic whose numbers above
// 12 are heard on only two (Refs #665). EXTRA only: the topic's own way still
// plays first and is unchanged; this adds a "more instruments" button beside
// it. The hundreds and tens go to one new family, the ones to another (or,
// for a round number, the same hundreds and tens answered again). Each
// family is played by the child's instrument when it belongs to that family
// (myInstrument.instrumentFor), else by a default from that family.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_MORE_FAMILIES = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  // Bank standards (ST keys) that get the extra. One topic per PR (#665).
  const TOPICS = ['SUB20'];
  const DEFAULT = { percussion: 'handbells', strings: 'balalaika', winds: 'recorder', keys: 'piano' };
  const ONE_HZ = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

  function need(p) { try { return require(p); } catch (e) { return null; } }
  function data() { return root && typeof root.instrumentById === 'function' ? root : need('../instruments.js'); }
  function mine() { return (root && root.MM_MY_INSTRUMENT) || need('../myInstrument.js'); }
  function tenLib() { return (root && root.MM_TAKEAWAY_TEN) || need('./takeAwayTen.js'); }
  function pctLib() { return (root && root.MM_PERCENT_MIX) || need('./percentMix.js'); }
  function st() { return (root && root.ST) || (need('../banks.js') || {}).ST || {}; }

  function familyOfVoice(voice) {
    const d = data(), x = d && d.INSTRUMENTS.filter(function (i) { return i.voice === voice; })[0];
    return x ? x.family : null;
  }
  function onTopic(item) {
    const S = st();
    return TOPICS.some(function (k) { return item.standard === k || item.standard === S[k]; });
  }

  // The number above 12 the topic's way voices, and the voices it uses.
  function heardOf(item, storage) {
    if (!item || item.noMusic || !onTopic(item)) return null;
    const t = tenLib(), a = t && t.specForItem(item);
    if (a) {
      const v = t.voicesFor(a, storage), n = a.kind === 'takeAway' ? a.start : a.bells;
      return n > 12 ? { number: n, voices: Object.keys(v).map(function (k) { return v[k]; }) } : null;
    }
    const p = pctLib(), b = p && p.specForItem(item);
    return b && b.percent > 12 ? { number: b.percent, voices: p.soundsOf(b).map(function (s) { return s.voice; }) } : null;
  }

  // Two families the way does not play, from the child's family onwards.
  function extraFamilies(heard, storage) {
    const d = data(), my = mine(), fams = d.FAMILIES;
    const own = d.instrumentById(my ? my.instrumentFor(null, null, storage) : null);
    const start = Math.max(0, fams.indexOf(own ? own.family : fams[0]));
    const out = [];
    for (let i = 0; i < fams.length && out.length < 2; i++) {
      const f = fams[(start + i) % fams.length];
      if (heard.indexOf(f) < 0) out.push(f);
    }
    return out.map(function (f) {
      const ids = d.INSTRUMENTS.filter(function (x) { return x.family === f; }).map(function (x) { return x.id; });
      const x = d.instrumentById(my ? my.instrumentFor(DEFAULT[f], ids, storage) : DEFAULT[f]);
      return { family: f, instrument: x.id, voice: x.voice, he: x.instrument.he };
    });
  }

  // The plan: hundreds and tens (one long low note each) on the first new
  // family, a silent beat, then the ones on the second. Null when off topic.
  function planFor(item, storage) {
    const h = heardOf(item, storage);
    if (!h) return null;
    const heard = h.voices.map(familyOfVoice).filter(function (f, i, a) { return f && a.indexOf(f) === i; });
    const fams = extraFamilies(heard, storage);
    if (fams.length < 2) return null;
    const notes = [], n = h.number;
    let t = 0;
    function push(count, x, hz, dur, gain, v, step) {
      for (let i = 0; i < count; i++) { notes.push({ at: t, hz: hz || ONE_HZ[i % 8], dur: dur, gain: gain, voice: x.voice, family: x.family, v: v }); t += step; }
    }
    function big(x) {
      push(Math.floor(n / 100), x, 98, 0.6, 0.3, 100, 0.7);
      push(Math.floor((n % 100) / 10), x, 131, 0.45, 0.28, 10, 0.55);
    }
    big(fams[0]);
    t += 0.4;
    // A round number has no ones, so the second family answers the same
    // hundreds and tens instead of staying silent.
    if (n % 10) push(n % 10, fams[1], 0, 0.18, 0.16, 1, 0.3);
    else big(fams[1]);
    return { number: n, heard: heard, families: fams, notes: notes };
  }

  function play(plan, env) {
    const e = env || {};
    const pv = e.playVoice || (root && root.playVoice);
    const ac = e.audioContext || (root && typeof root.getSharedAudioContext === 'function' ? root.getSharedAudioContext() : null);
    if (!plan || typeof pv !== 'function' || !ac) return null;
    if (ac.state === 'suspended' && ac.resume) { try { ac.resume(); } catch (err) { /* autoplay */ } }
    const t0 = ac.currentTime + 0.05;
    plan.notes.forEach(function (n) { pv(ac, n.voice, n.hz, t0 + n.at, null, { dur: n.dur, gain: n.gain }); });
    return { notes: plan.notes.length, families: plan.families.map(function (f) { return f.family; }) };
  }

  // A button after the widget host. Called on every render, so it first
  // removes the button of the previous item.
  function mount(host, item, storage) {
    if (!host || !host.parentNode || !host.ownerDocument) return null;
    const id = (host.id || 'w') + 'More', old = host.ownerDocument.getElementById(id);
    if (old && old.parentNode) old.parentNode.removeChild(old);
    const plan = planFor(item, storage);
    if (!plan) return null;
    const b = host.ownerDocument.createElement('button');
    b.type = 'button'; b.id = id; b.className = 'snd-more';
    b.textContent = '🎻 שמעו גם ב' + plan.families[0].he + ' וב' + plan.families[1].he;
    b.addEventListener('click', function () { play(planFor(item, storage)); });
    host.parentNode.insertBefore(b, host.nextSibling);
    return plan;
  }

  return { TOPICS: TOPICS, heardOf: heardOf, extraFamilies: extraFamilies, planFor: planFor, play: play, mount: mount };
});
