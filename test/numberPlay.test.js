// #686 — timing, circle count, two families, the child's instrument, stable tempo.
const test = require('node:test');
const assert = require('node:assert/strict');
const NP = require('../src/components/NumberPlay.js');
const inst = require('../src/lib/instruments.js');

function dots(html) { return (html.match(/class="np-dot/g) || []).length; }

test('3 + 2: one circle per sound, a beat of rest, two families, sound at 0 (#686)', () => {
  const plan = NP.extractNumberPlan({ prompt: '3 + 2 = ?', grade: 'א' }, { bpm: 60, streak: 0 });
  assert.equal(plan.totalSounds, 5);
  assert.equal(plan.notes[0].at, 0);
  assert.ok(plan.notes[0].at < 1);
  assert.equal(plan.notes[1].at - plan.notes[0].at, plan.beat);
  assert.ok(plan.notes[3].at - plan.notes[2].at >= plan.beat * 2);
  assert.notEqual(plan.groups[0].family, plan.groups[1].family);
  assert.notEqual(plan.groups[0].hz, plan.groups[1].hz);
  assert.ok(plan.notes.every((n) => n.hz >= 120));
  const html = NP.renderHtml(plan);
  assert.equal(dots(html), 5);
  assert.match(html, /<button type="button"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /min-height:48px/);
  assert.match(html, /▶/);
});

test('counts 13–20: sounds equal circles (#686)', () => {
  for (let n = 13; n <= 20; n++) {
    const plan = NP.extractNumberPlan({ skill: 'counting', hear: [n], prompt: 'כמה?' });
    assert.equal(plan.notes.length, n);
    assert.equal(dots(NP.renderHtml(plan)), n);
  }
  const edge = NP.extractNumberPlan({ prompt: '15 + 5 = ?', grade: 'ב' });
  assert.equal(edge.totalSounds, 20);
  assert.equal(dots(NP.renderHtml(edge)), 20);
});

test('subtraction, compare and multiplication (#686)', () => {
  const sub = NP.extractNumberPlan({ prompt: '7 - 3 = ?', grade: 'א' }, { bpm: 60 });
  assert.equal(sub.totalSounds, 10);
  assert.equal(dots(NP.renderHtml(sub)), 10);
  assert.notEqual(sub.groups[0].family, sub.groups[1].family);
  assert.ok(sub.notes[7].at - sub.notes[6].at >= sub.beat * 2);
  const he = NP.extractNumberPlan({ prompt: '9 תווים, מחקנו 4. כמה נשארו?', skill: 'subtraction' });
  assert.deepEqual(he.groups.map((g) => g.count), [9, 4]);
  const cmp = NP.extractNumberPlan({ prompt: 'איזה מספר גדול יותר: 6 או 4?', wordType: 'compare', skill: 'word_problems' });
  assert.deepEqual(cmp.groups.map((g) => g.count), [6, 4]);
  assert.notEqual(cmp.groups[0].family, cmp.groups[1].family);
  const mul = NP.extractNumberPlan({ prompt: '3 × 4 = ?', skill: 'multiplication' }, { bpm: 60 });
  assert.equal(mul.totalSounds, 12);
  assert.equal(dots(NP.renderHtml(mul)), 12);
  assert.ok(new Set(mul.groups.map((g) => g.family)).size >= 2);
  assert.ok(mul.notes[4].at - mul.notes[3].at >= mul.beat * 2);
  ['5 × 10 = ?', '10 × 10 = ?', '4 × 6 = ?', '9 × 9 = ?'].forEach(function (p) {
    const big = NP.extractNumberPlan({ prompt: p, skill: 'multiplication' });
    assert.ok(big.totalSounds <= 20 && big.totalSounds >= 1, p);
    assert.equal(dots(NP.renderHtml(big)), big.totalSounds, p);
  });
  const tens = NP.extractNumberPlan({ prompt: '5 × 10 = ?', skill: 'multiplication' });
  assert.deepEqual(tens.groups.map(function (g) { return g.count; }), [1, 1, 1, 1, 1]);
});

test('a repeated instrument keeps one pitch (#686)', () => {
  const plan = NP.extractNumberPlan({ prompt: '6 × 2 = ?', skill: 'multiplication' });
  const hz = plan.groups.filter(function (g) { return g.instrument === 'handbells'; }).map(function (g) { return g.hz; });
  assert.ok(hz.length >= 2 && hz.every(function (h) { return h === 494; }) && plan.notes.every(function (n) { return n.voice !== 'metalBell' || n.hz === 494; }));
});

test('the child instrument overrides forTopic (#686, #717)', () => {
  assert.ok(!inst.forTopic('counting').some((x) => x.id === 'guitar'));
  const mem = { 'mm.myInstrument': 'guitar', 'mm_child_inst_other': 'cajon' };
  const storage = { getItem: (k) => (Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null) };
  const plan = NP.extractNumberPlan({ prompt: '4 + 3 = ?', grade: 'א' }, { storage: storage, who: { name: 'dana', classCode: 'X' } });
  assert.equal(plan.groups[0].instrument, 'guitar');
  assert.equal(plan.groups[0].family, 'strings');
  assert.notEqual(plan.groups[1].family, 'strings');
  delete mem['mm.myInstrument'];
  mem['mm_child_inst_dana'] = 'piano';
  const via717 = NP.extractNumberPlan({ prompt: '4 + 3 = ?' }, { storage: storage, who: { name: 'dana', classCode: 'X' } });
  assert.equal(via717.groups[0].instrument, 'piano');
  assert.notEqual(via717.groups[1].family, 'keys');
  const other = NP.extractNumberPlan({ prompt: '4 + 3 = ?' }, { storage: storage, who: { name: 'noa', classCode: 'X' } });
  assert.equal(other.groups[0].instrument, 'handbells');
});

test('lower grades keep one tempo and it rises with the streak, not a prompt hash (#686)', () => {
  const opts = (streak) => ({ streak: streak });
  const bpm = (prompt, streak, grade) => NP.extractNumberPlan({ prompt: prompt, grade: grade || 'א' }, opts(streak)).bpm;
  assert.equal(bpm('3 + 2 = ?', 0), bpm('8 + 1 = ?', 0));
  assert.equal(bpm('3 + 2 = ?', 0), 72);
  assert.equal(bpm('9 + 6 = ?', 2), 72);
  assert.equal(bpm('1 + 4 = ?', 3), 76);
  assert.equal(bpm('1 + 4 = ?', 6), 80);
  assert.equal(bpm('3 + 2 = ?', 0, 'ב'), 72);
  assert.equal(bpm('3 + 2 = ?', 0, 'ו'), 96);
});

test('play() uses jamKit at once, and the button lights one circle per sound (#686)', () => {
  const plan = NP.extractNumberPlan({ prompt: '3 + 2 = ?', grade: 'א' }, { bpm: 90 });
  let seen = null;
  const prev = global.MM_JAM;
  global.MM_JAM = {
    playNotes: function (notes, onNote, onEnd) {
      seen = notes;
      notes.forEach(function (n, i) { if (onNote) onNote(n, i); });
      if (onEnd) onEnd();
      return { stop: function () {} };
    }
  };
  const t0 = Date.now();
  NP.play(plan).stop();
  assert.ok(Date.now() - t0 < 1000);
  assert.equal(seen[0].at, 0);
  assert.equal(seen.length, 5);
  assert.notEqual(seen[0].voice, seen[3].voice);
  const btn = { addEventListener: function (type, fn) { if (type === 'click') btn.click = fn; } };
  const live = { textContent: '' };
  let built = [];
  const container = {
    classList: { add: function () {}, remove: function () {} },
    innerHTML: '',
    querySelector: function (sel) { return sel.indexOf('play-numbers') >= 0 ? btn : live; },
    querySelectorAll: function () { return built; }
  };
  NP.mount(container, { prompt: '2 + 1 = ?', grade: 'א' });
  built = [0, 1, 2].map(function () {
    return { classList: { add: function (c) { this.list.push(c); }, remove: function () {}, list: [] } };
  });
  btn.click();
  assert.equal(built.filter(function (d) { return d.classList.list.indexOf('lit') >= 0; }).length, 3);
  assert.match(live.textContent, /3/);
  assert.match(container.innerHTML, /type="button"/);
  global.MM_JAM = prev;
});

test('the no-music check shows no play button (#686)', () => {
  const item = { prompt: '4 + 2 = ?', skill: 'addition', answer: 6, noMusic: true };
  assert.equal(NP.extractNumberPlan(item), null);
  const box = { innerHTML: '<button class="np-btn">', className: '', classList: { add: function (c) { box.className += c; }, remove: function () {} } };
  assert.equal(NP.mount(box, item), null);
  assert.equal(box.innerHTML, '');
  assert.match(box.className, /hidden/);
  const html = require('fs').readFileSync(require('path').join(__dirname, '../index.html'), 'utf8');
  const body = html.match(/function setNumberPlay\(id,it\)\{.*\}/)[0];
  assert.match(body, /it&&it\.noMusic/);
  const slot = { innerHTML: '<button class="np-btn">', classList: { add: function (c) { slot.className = c; } } };
  let mounted = 0;
  const setNumberPlay = new Function('$', 'MM_NUMBER_PLAY', 'selectedGrade', 'metroStreak', 'who', body + '\nreturn setNumberPlay;')(
    function () { return slot; }, { mount: function () { mounted += 1; } }, 'א', 0, null);
  setNumberPlay('rmNumberPlay', item);
  assert.equal(mounted, 0);
  assert.equal(slot.innerHTML, '');
  assert.equal(slot.className, 'hidden');
  setNumberPlay('rmNumberPlay', { prompt: '3 + 2 = ?' });
  assert.equal(mounted, 1);
});

test('one sound per unit cites Gelman & Gallistel 1978 (#686)', () => {
  const src = NP.sources.gelman1978;
  assert.equal(src[0], 'Gelman & Gallistel 1978 — The Child\'s Understanding of Number (Harvard University Press)');
  assert.equal(src[1], 'https://www.hup.harvard.edu/books/9780674116375');
  const html = NP.renderHtml(NP.extractNumberPlan({ prompt: '3 + 2 = ?', grade: 'א' }));
  assert.match(html, /class="music-src"[\s\S]*href="https:\/\/www\.hup\.harvard\.edu\/books\/9780674116375"[\s\S]*rel="noopener"[\s\S]*התאמה שעדיין לא נבדקה בנפרד/);
});

test('fractions, decimals, percents and numbers above 20 are left alone (#686)', () => {
  ['1/2 + 1/4', '0.5 + 0.25', '50% מ-20', '80 + 20 = ?', 'מה השעה 10:30?'].forEach(function (p) {
    assert.equal(NP.extractNumberPlan({ prompt: p, skill: /%/.test(p) ? 'percent' : /0\.5/.test(p) ? 'decimals' : /\//.test(p) ? 'fractions' : '' }), null);
  });
  assert.equal(NP.mount({ innerHTML: 'x', classList: { add: function () {}, remove: function () {} } }, { prompt: '3/4', skill: 'fractions' }), null);
});
