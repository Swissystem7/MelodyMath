'use strict';
// What the sustained voices actually sound like, rendered from playVoice —
// not the nominal `dur` the score asked for. A fade that starts at the attack
// makes a 2s tekia and a "shorter fraction" both come out as a short ping.
const test = require('node:test');
const assert = require('node:assert/strict');
const heard = require('./renderHeard');

const rnd = heard.mulberry32(7);
const prev = Math.random;
Math.random = rnd;
const V = require('../src/lib/instrumentVoices');
const S = require('../src/lib/music/shofarCalls');
const F = require('../src/lib/music/fractionTime');
const Dec = require('../src/lib/music/decimalWorlds');
Math.random = prev;

const cents = (a, b) => 1200 * Math.log(a / b) / Math.log(2);

function renderCall(list) {
  const t0 = list.reduce((m, n) => Math.min(m, n.at), Infinity);
  const end = list.reduce((m, n) => Math.max(m, n.at - t0 + n.dur), 0);
  const ac = heard.makeContext(16000);
  list.forEach((n) => V.playVoice(ac, n.voice, n.hz, n.at - t0, ac.destination, {
    dur: n.dur, gain: n.gain, hold: n.hold, glide: n.glide, attack: n.attack,
  }));
  return { samples: ac.render(end + 0.2), sampleRate: 16000 };
}

test('a held horn stays loud until the release; the same note without hold dies at once', () => {
  const held = heard.renderVoice(V.playVoice, 'horn', 392, { dur: 2.2, gain: 0.24, hold: true, attack: 0.28 }, 2.5);
  const faded = heard.renderVoice(V.playVoice, 'horn', 392, { dur: 2.2, gain: 0.24 }, 2.5);
  const heldFor = heard.timeWithin(held.samples, held.sampleRate, 12);
  const fadedFor = heard.timeWithin(faded.samples, faded.sampleRate, 12);
  assert.ok(heldFor >= 1.8, 'tekia-length hold stays up, heard ' + heldFor.toFixed(2) + 's');
  assert.ok(fadedFor < 0.45, 'without hold the same dur is a ping, heard ' + fadedFor.toFixed(2) + 's');
});

test('shofar: one pitch, tekia clearly the longest call, and the tone rises at the end', () => {
  const item = {
    kind: 'shofar',
    prompt: 'תשר״ת הם ארבעה קולות: תקיעה, שברים, תרועה, תקיעה. תוקעים אותם 3 פעמים. כמה קולות?',
    answer: 12,
  };
  const ev = S.soundEvents(S.specForItem(item));
  const pitches = [...new Set(ev.filter((n) => n.voice === 'horn').map((n) => n.hz))];
  assert.deepEqual(pitches, [S.HORN_HZ], 'every blast is the same written pitch');

  const tekia = ev.find((n) => n.call === 'T');
  const shev = ev.filter((n) => n.call === 'S' && n.worth === 1);
  const teruaStart = ev.find((n) => n.call === 'R' && n.worth === 1);
  const terua = ev.filter((n) => n.at >= teruaStart.at && n.at < teruaStart.at + 2.2 && n.call === 'R');
  assert.equal(shev.length >= 1, true);
  assert.equal(terua.length, 9);

  const one = renderCall([tekia]);
  const tekiaHeard = heard.timeWithin(one.samples, one.sampleRate, 12);
  const ratt = renderCall(terua.map((n) => Object.assign({}, n, { at: n.at - teruaStart.at })));
  const teruaHeard = heard.timeWithin(ratt.samples, ratt.sampleRate, 12);
  assert.ok(tekiaHeard >= 2, 'tekia is a long blast, heard ' + tekiaHeard.toFixed(2) + 's');
  assert.ok(tekiaHeard > teruaHeard + 0.4, 'tekia outlasts the whole terua (' + teruaHeard.toFixed(2) + 's)');

  const sr = one.sampleRate;
  const early = heard.dominantHz(one.samples, sr, Math.floor(0.45 * sr), Math.floor(1.1 * sr));
  const late = heard.dominantHz(one.samples, sr, Math.floor((tekia.dur - 0.12) * sr), Math.floor(tekia.dur * sr));
  assert.ok(Math.abs(cents(early, S.HORN_HZ)) < 40, 'body of the tekia is the shofar pitch, heard ' + early.toFixed(1));
  assert.ok(cents(late, early) > 40, 'the tekia glides up at the end (' + early.toFixed(1) + ' → ' + late.toFixed(1) + ')');

  const shevSnd = renderCall([shev[0]]);
  const shevHz = heard.dominantHz(shevSnd.samples, shevSnd.sampleRate, Math.floor(0.12 * shevSnd.sampleRate), Math.floor(0.4 * shevSnd.sampleRate));
  const terSnd = renderCall([terua[0]]);
  const terHz = heard.dominantHz(terSnd.samples, terSnd.sampleRate, Math.floor(0.03 * terSnd.sampleRate), Math.floor(0.1 * terSnd.sampleRate));
  assert.ok(Math.abs(cents(shevHz, early)) < 50, 'shevarim on the tekia pitch, heard ' + shevHz.toFixed(1));
  // A 0.12s rattle is too short for the spectrum peak to settle on the
  // fundamental; it may lock an octave up. Same harmonic series either way.
  const terCents = Math.abs(cents(terHz, early));
  const terFold = Math.min(terCents % 1200, 1200 - (terCents % 1200));
  assert.ok(terFold < 80, 'terua on the tekia pitch, heard ' + terHz.toFixed(1));
});

test('1/3 against the claimed 2/7: the held tones differ by a gap a child can hear', () => {
  const P = 'דני אומר ש־1/3 + 1/4 = 2/7. האם הוא צודק? (כן/לא)';
  const spec = F.specForItem({ music: 'noteValues', prompt: P, answer: 'לא' });
  const ev = F.soundEvents(spec);
  const first = ev.find((n) => n.stage === 'firstHold');
  const claim = ev.find((n) => n.stage === 'claim');
  assert.ok(first && claim && first.hold && claim.hold);

  function tone(n) {
    const ac = heard.makeContext(16000);
    V.playVoice(ac, n.voice, n.hz, 0, ac.destination, { dur: n.dur, gain: n.gain, hold: n.hold });
    return heard.timeWithin(ac.render(n.dur + 0.2), 16000, 12);
  }
  const a = tone(first), b = tone(claim);
  assert.ok(a > b + 0.4, 'the first part stays up longer than Danny\'s sum (' + a.toFixed(2) + 's vs ' + b.toFixed(2) + 's)');
  assert.ok(b > 1.5, 'Danny\'s tone is actually held, not a ping (' + b.toFixed(2) + 's)');
});

test('0.125 and 0.5 start together and the longer one is still loud when the shorter has stopped', () => {
  const spec = Dec.specForItem({ music: 'tenthNotes', prompt: 'מה גדול יותר, 0.125 או 0.5? כתבו את הגדול.', answer: 0.5 });
  assert.ok(spec && spec.kind === 'race');
  const runs = Dec.soundEvents(spec).filter((n) => n.stage === 'run').sort((a, b) => a.dur - b.dur);
  assert.equal(runs.length, 2);
  const ac = heard.makeContext(16000);
  runs.forEach((n) => V.playVoice(ac, n.voice, n.hz, 0, ac.destination, { dur: n.dur, gain: n.gain, hold: true }));
  const x = ac.render(runs[1].dur + 0.15);
  const sr = 16000;
  const shortEnd = Math.floor(runs[0].dur * sr);
  const later = heard.rms(x, shortEnd + Math.floor(0.08 * sr), Math.floor((runs[1].dur - 0.05) * sr));
  const during = heard.rms(x, Math.floor(0.12 * sr), shortEnd);
  assert.ok(later > during * 0.25, 'after the short tone stops, the long one is still plainly there');
});
