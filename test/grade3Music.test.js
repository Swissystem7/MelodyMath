const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const g3 = require('../src/lib/grade3Music');
const banks = require('../src/lib/banks');
const mastery = require('../src/lib/mastery');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('table 3 counts in 3/4 and table 6 in 6/8; other tables have no meter', () => {
  assert.deepEqual(g3.meterForTable(3), { table: 3, timeSig: '3/4', beatsPerBar: 3 });
  assert.deepEqual(g3.meterForTable(6), { table: 6, timeSig: '6/8', beatsPerBar: 6 });
  [1, 2, 4, 5, 7, 9, 10, 0, -3, null, 'שלוש', 1.5].forEach((bad) => {
    assert.equal(g3.meterForTable(bad), null, String(bad));
  });
  // A stored prototype name must not resolve to a meter.
  assert.equal(g3.meterForTable('constructor'), null);
});

test('every multiple of the table falls on an accent, and nothing else does', () => {
  const beats = g3.meterBeats(3, 4);
  assert.equal(beats.length, 12);
  assert.deepEqual(beats.filter((b) => b.accent).map((b) => b.count), [3, 6, 9, 12]);
  assert.deepEqual(beats.filter((b) => b.bar === 2).map((b) => b.count), [4, 5, 6]);
  assert.deepEqual(g3.meterBeats(6, 3).filter((b) => b.accent).map((b) => b.count), [6, 12, 18]);
  assert.deepEqual(g3.meterBeats(7, 3), []);
  assert.deepEqual(g3.meterBeats(3, 0), []);
  assert.deepEqual(g3.meterBeats(3, 99), []);
});

test('the accented beat sounds louder, higher and in another timbre', () => {
  const ev = g3.meterEvents(3, 2, 96);
  assert.equal(ev.length, 6);
  assert.ok(ev[2].hz > ev[0].hz);
  assert.ok(ev[2].gain > ev[0].gain);
  assert.notEqual(ev[2].type, ev[0].type);
  // 96 BPM is 0.625s a beat, so beat 2 starts there.
  assert.ok(Math.abs(ev[1].at - 0.625) < 1e-9);
  assert.equal(g3.meterNarration(3, 4), 'משקל 3/4. 12 פעמות ב־4 תיבות, והדגשה על 3, 6, 9, 12.');
  assert.equal(g3.meterNarration(7, 4), '');
});

test('14 beats in bars of 4 give 3 bars and 2 leftover beats', () => {
  assert.deepEqual(g3.barsAndRemainder(14, 4), { beats: 14, perBar: 4, bars: 3, remainder: 2 });
  assert.deepEqual(g3.barsAndRemainder(20, 4), { beats: 20, perBar: 4, bars: 5, remainder: 0 });
  assert.deepEqual(g3.barsAndRemainder(23, 5), { beats: 23, perBar: 5, bars: 4, remainder: 3 });
  assert.deepEqual(g3.barsAndRemainder(0, 4), { beats: 0, perBar: 4, bars: 0, remainder: 0 });
  [[14, 0], [14, -1], [-1, 4], [1e6, 4], ['x', 4], [14, null]].forEach((pair) => {
    assert.equal(g3.barsAndRemainder(pair[0], pair[1]), null, JSON.stringify(pair));
  });
  assert.equal(g3.remainderText(g3.barsAndRemainder(14, 4)), '3 שארית 2');
  assert.equal(g3.remainderText(null), '');
});

test('parseRemainder reads the ways a child writes the pair', () => {
  const want = { bars: 3, remainder: 2 };
  ['3 שארית 2', '3שארית2', ' 3  שארית  2 ', '3 ושארית 2', '3 ו־שארית 2',
    '3 ש 2', '3 ש׳ 2', "3 ש' 2", '3 r 2', '3R2', '3 rem 2', '3, 2', '3;2', '3 (2)',
  ].forEach((raw) => {
    assert.deepEqual(g3.parseRemainder(raw), want, raw);
  });
  ['', '3', 'שארית', '3 שארית', 'שארית 2', '3 שארית 2 שארית 1', '3.2', '3/2',
    'שלוש שארית שתיים', null, undefined, {},
  ].forEach((raw) => {
    assert.equal(g3.parseRemainder(raw), null, String(raw));
  });
});

test('isRemainderAnswer accepts only the right pair, and a bare quotient only when nothing is left', () => {
  const spec = g3.barsAndRemainder(14, 4);
  assert.equal(g3.isRemainderAnswer('3 שארית 2', spec), true);
  assert.equal(g3.isRemainderAnswer('3 ש 2', spec), true);
  assert.equal(g3.isRemainderAnswer('3 שארית 2', '3 שארית 2'), true);
  // A right quotient with the wrong remainder is wrong, and so is the swap.
  assert.equal(g3.isRemainderAnswer('3 שארית 1', spec), false);
  assert.equal(g3.isRemainderAnswer('2 שארית 3', spec), false);
  assert.equal(g3.isRemainderAnswer('3', spec), false);
  assert.equal(g3.isRemainderAnswer('14', spec), false);
  assert.equal(g3.isRemainderAnswer('3.5', spec), false);
  assert.equal(g3.isRemainderAnswer('', spec), false);
  // 20 beats in bars of 4 leave nothing, so "5" on its own is the answer.
  const exact = g3.barsAndRemainder(20, 4);
  assert.equal(g3.isRemainderAnswer('5', exact), true);
  assert.equal(g3.isRemainderAnswer('5 שארית 0', exact), true);
  assert.equal(g3.isRemainderAnswer('4', exact), false);
  // A broken expectation never passes anything.
  ['', null, undefined, '3', 'שארית', {}, { bars: 3 }].forEach((bad) => {
    assert.equal(g3.isRemainderAnswer('3 שארית 2', bad), false, String(bad));
  });
});

test('a remainder miss gets the message that names the mistake', () => {
  const spec = { beats: 14, perBar: 4 };
  assert.match(g3.remainderMiss('3', spec), /פעמות עוד לא נכנסו/);
  assert.match(g3.remainderMiss('14', spec), /מספר כל הפעמות/);
  assert.match(g3.remainderMiss('2 שארית 6', spec), /שארית תמיד קטנה מ־4/);
  assert.match(g3.remainderMiss('1 שארית 1', spec), /3 שארית 2/);
  assert.equal(g3.remainderMiss('3', { beats: 14, perBar: 0 }), '');
});

test('the leftover beats sound after the full bars and in another timbre', () => {
  const ev = g3.remainderEvents(14, 4, 96);
  assert.equal(ev.length, 14);
  const bars = ev.slice(0, 12);
  const left = ev.slice(12);
  assert.equal(left.length, 2);
  assert.equal(new Set(left.map((e) => e.type)).size, 1);
  assert.ok(left.every((e) => !bars.some((b) => b.type === e.type)), 'leftover reuses a bar timbre');
  assert.ok(left[0].at > bars[11].at);
  assert.deepEqual(g3.remainderEvents(14, 0, 96), []);
  assert.match(g3.remainderNarration({ beats: 14, perBar: 4 }), /3 תיבות שלמות, ואחריהן 2 פעמות/);
});

test('"פי כמה" is the whole-number ratio of two tempi or two frequencies', () => {
  assert.equal(g3.timesMore(440, 220), 2);
  assert.equal(g3.timesMore(880, 220), 4);
  assert.equal(g3.timesMore(150, 50), 3);
  assert.equal(g3.timesMore(220, 220), 1);
  // Not a whole number of times, and not a valid pair.
  assert.equal(g3.timesMore(330, 220), null);
  assert.equal(g3.timesMore(220, 440), null);
  [[440, 0], [0, 440], [-440, 220], [NaN, 2], ['x', 2], [Infinity, 2]].forEach((pair) => {
    assert.equal(g3.timesMore(pair[0], pair[1]), null, JSON.stringify(pair));
  });
});

test('a pair plays the two sides in the order the prompt names them', () => {
  const hz = g3.pairEvents({ a: 220, b: 440, unit: 'hz' });
  assert.equal(hz.length, 2);
  assert.equal(hz[0].hz, 220);
  assert.ok(hz[1].at > hz[0].at + hz[0].dur - 1e-9);
  // Four clicks a tempo, and the slow train must finish before the fast one
  // starts, or a 50 BPM pair would play over itself.
  const bpm = g3.pairEvents({ a: 50, b: 150, unit: 'bpm' });
  assert.equal(bpm.length, 8);
  assert.ok(bpm[1].at - bpm[0].at > bpm[5].at - bpm[4].at, 'the second tempo must be faster');
  assert.ok(bpm[4].at > bpm[3].at + bpm[3].dur, 'the two tempi overlap');
  assert.deepEqual(g3.pairEvents({ a: 0, b: 440 }), []);
  assert.deepEqual(g3.pairEvents(null), []);
  assert.equal(g3.pairNarration({ a: 220, b: 440, unit: 'hz' }), 'קודם 220 הרץ, ואחר כך 440 הרץ.');
  assert.match(g3.pairNarration({ a: 60, b: 120, unit: 'bpm' }), /פעמות לדקה/);
});

test('rows × steps of the sequencer grid is the area of the rectangle', () => {
  assert.equal(g3.gridCells(4, 8), 32);
  assert.equal(g3.gridCells(2, 16), 32);
  assert.equal(g3.gridCells(3, 8), 24);
  [[0, 8], [4, 0], [9, 8], [4, 17], ['x', 8], [4, null]].forEach((pair) => {
    assert.equal(g3.gridCells(pair[0], pair[1]), null, JSON.stringify(pair));
  });
  assert.match(g3.gridNarration(4, 8), /4 שורות ו־8 תאים בשורה, 32 תאים/);
  assert.equal(g3.gridNarration(4, 0), '');
});

test('grid cells stay at least 44px on a 360px phone by wrapping the row', () => {
  // A card on a 360px viewport leaves about 284px of content width.
  const narrow = g3.gridLayout(8, 284);
  assert.ok(narrow.cell >= g3.MIN_CELL, 'cell shrank to ' + narrow.cell);
  assert.equal(narrow.perRow, 4);
  assert.equal(narrow.wraps, 2, 'an 8-step row must wrap into 2 rows at 360px');
  assert.ok(narrow.perRow * narrow.cell + (narrow.perRow - 1) * narrow.gap <= 284, 'row overflows');
  // A tablet fits the whole bar on one line.
  const wide = g3.gridLayout(8, 700);
  assert.equal(wide.perRow, 8);
  assert.equal(wide.wraps, 1);
  assert.ok(wide.cell >= g3.MIN_CELL);
  // Every width from a 320px phone to 1280px keeps the 44px target and the
  // 8px spacing, and never asks for more room than it has.
  for (let w = 240; w <= 1280; w += 4) {
    const lay = g3.gridLayout(16, w);
    assert.ok(lay.cell >= g3.MIN_CELL, w + 'px gave a ' + lay.cell + 'px cell');
    assert.equal(lay.gap, g3.CELL_GAP);
    assert.equal(lay.perRow * lay.wraps >= 16, true, w + 'px lost steps');
    if (lay.perRow > 1) {
      assert.ok(lay.perRow * lay.cell + (lay.perRow - 1) * lay.gap <= w, w + 'px overflows');
    }
  }
  assert.equal(g3.gridLayout(8, 0), null);
  assert.equal(g3.gridLayout(0, 284), null);
  assert.equal(g3.gridLayout(8, 'wide'), null);
});

test('the grid plays one column at a time, every row of it', () => {
  const ev = g3.gridEvents(3, 8, 96);
  assert.equal(ev.length, 24);
  assert.equal(new Set(ev.map((e) => e.at)).size, 8, 'one start time per column');
  assert.equal(new Set(ev.filter((e) => e.at === 0).map((e) => e.hz)).size, 3, 'a pitch per row');
  assert.deepEqual(g3.gridEvents(0, 8, 96), []);
});

test('minutes and seconds of a short tune convert both ways', () => {
  assert.equal(g3.tuneSeconds(2, 30), 150);
  assert.equal(g3.tuneSeconds(1, 45), 105);
  assert.equal(g3.tuneSeconds(3), 180);
  assert.equal(g3.tuneSeconds(0, 0), 0);
  assert.equal(g3.tuneSeconds(2, 60), null, '60 seconds is another minute');
  assert.equal(g3.tuneSeconds(-1, 30), null);
  assert.equal(g3.tuneSeconds('two', 30), null);
  assert.equal(g3.tuneClock(150), '2:30');
  assert.equal(g3.tuneClock(105), '1:45');
  assert.equal(g3.tuneClock(185), '3:05');
  assert.equal(g3.tuneClock(0), '0:00');
  assert.equal(g3.tuneClock(-1), '');
});

test('two four-digit frequencies compare as numbers', () => {
  assert.equal(g3.higherHz(1200, 1020), 1200);
  assert.equal(g3.higherHz(1480, 1740), 1740);
  assert.equal(g3.higherHz(1320, 1320), 1320);
  assert.equal(g3.higherHz(1200, 0), null);
  assert.equal(g3.higherHz('1200', '1020'), 1200);
  assert.equal(g3.higherHz(null, 1020), null);
});

test('playback is inert without a document, so Node never touches Web Audio', () => {
  assert.equal(g3.bindGrade3(null, { kind: 'meter', table: 3, bars: 2 }), false);
  assert.equal(g3.bindGrade3({}, null), false);
  assert.equal(g3.bindGrade3({}, { kind: 'nope' }), false);
});

// Enough of a document to render into without pulling in a dependency.
function fakeDoc(width) {
  function el(tag) {
    const n = {
      tagName: tag, className: '', textContent: '', dir: '', type: '',
      children: [], attrs: {}, styles: {}, clientWidth: width,
      classList: {
        toggle: function (c, on) {
          n.className = on ? (n.className + ' ' + c).trim() : n.className.split(' ').filter((x) => x !== c).join(' ');
        },
      },
      style: { setProperty: function (k, v) { n.styles[k] = v; } },
      setAttribute: function (k, v) { n.attrs[k] = String(v); },
      getAttribute: function (k) { return Object.prototype.hasOwnProperty.call(n.attrs, k) ? n.attrs[k] : null; },
      addEventListener: function () {},
      appendChild: function (c) { n.children.push(c); return c; },
      insertBefore: function (c) { n.children.unshift(c); return c; },
      querySelector: function (sel) { return all(n, sel.slice(1))[0] || null; },
    };
    Object.defineProperty(n, 'firstChild', { get: function () { return n.children[0] || null; } });
    return n;
  }
  function all(n, cls) {
    return n.children.flatMap(function (c) {
      const hit = c.className.split(' ').indexOf(cls) !== -1 ? [c] : [];
      return hit.concat(all(c, cls));
    });
  }
  return { createElement: el, all: all };
}

test('the rendered sequencer grid keeps 44px cells and a screen-reader line', () => {
  const dom = fakeDoc(284);
  globalThis.document = { createElement: dom.createElement };
  try {
    const host = dom.createElement('div');
    assert.equal(g3.bindGrade3(host, { kind: 'grid', rows: 4, steps: 8 }), true);
    const box = host.children[0];
    assert.equal(dom.all(box, 'g3-cell').length, 32, 'rows × steps cells');
    assert.equal(dom.all(box, 'g3-grow').length, 4, 'one line per sequencer row');
    const wrap = dom.all(box, 'g3-grid')[0];
    assert.ok(parseInt(wrap.styles['--g3-cell'], 10) >= 44, wrap.styles['--g3-cell']);
    assert.equal(wrap.styles['--g3-cols'], '4', 'the 8-step row wraps into 2 lines of 4');
    assert.equal(wrap.styles['--g3-gap'], '8px');
    assert.equal(wrap.dir, 'ltr', 'the grid reads left to right');
    // Every cell is a real button with a label, and the whole widget has a
    // screen-reader line plus the visible text fallback.
    dom.all(box, 'g3-cell').forEach(function (c) {
      assert.equal(c.tagName, 'button');
      assert.equal(c.type, 'button');
      assert.equal(c.getAttribute('aria-pressed'), 'false');
      assert.match(c.getAttribute('aria-label'), /^שורה \d+, תא \d+$/);
    });
    assert.equal(dom.all(box, 'sr-only').length, 1);
    assert.equal(box.firstChild.className, 'sr-only');
    assert.match(box.firstChild.textContent, /32 תאים/);
    assert.equal(dom.all(box, 'g3-note')[0].getAttribute('aria-hidden'), 'true');
    assert.equal(dom.all(box, 'g3-play').length, 1, 'a visible play-again button');
  } finally {
    delete globalThis.document;
  }
});

test('the meter, remainder and pair widgets render without a real browser', () => {
  const dom = fakeDoc(284);
  globalThis.document = { createElement: dom.createElement };
  try {
    const meter = dom.createElement('div');
    g3.bindGrade3(meter, { kind: 'meter', table: 3, bars: 4 });
    assert.equal(dom.all(meter, 'g3-bar').length, 4, 'one group per bar');
    assert.equal(dom.all(meter, 'on').length, 4, 'one accent per multiple of 3');
    assert.deepEqual(dom.all(meter, 'on').map((p) => p.textContent), ['3', '6', '9', '12']);
    // The pads picture the sr-only line, so a reader does not hear it twice.
    assert.equal(dom.all(meter, 'g3-row')[0].getAttribute('aria-hidden'), 'true');

    const rem = dom.createElement('div');
    g3.bindGrade3(rem, { kind: 'remainder', beats: 14, perBar: 4 });
    assert.equal(dom.all(rem, 'g3-bar').length, 4, '3 full bars plus the leftover group');
    assert.equal(dom.all(rem, 'left').length, 2, 'the 2 leftover beats look different');
    assert.match(dom.all(rem, 'sr-only')[0].textContent, /2 פעמות שנשארו בצליל אחר/);

    const pair = dom.createElement('div');
    g3.bindGrade3(pair, { kind: 'pair', a: 220, b: 440, unit: 'hz' });
    const values = dom.all(pair, 'g3-values')[0];
    assert.equal(values.dir, 'ltr', 'the two numbers must not mirror');
    assert.equal(values.textContent, '220 → 440 Hz');
    [meter, rem, pair].forEach(function (host) {
      assert.equal(dom.all(host, 'g3-play').length, 1);
      assert.equal(dom.all(host, 'sr-only').length, 1);
    });
  } finally {
    delete globalThis.document;
  }
});

test('every grade-ג music item agrees with the pure function behind it', () => {
  const rows = banks.itemsForGrade('ג').filter((it) => it.g3);
  assert.ok(rows.length >= 15, 'expected the #104 items, got ' + rows.length);
  const kinds = new Set(rows.map((it) => it.g3.kind));
  assert.deepEqual([...kinds].sort(), ['grid', 'meter', 'pair', 'remainder']);
  rows.forEach((it) => {
    const s = it.g3;
    assert.equal(it.widget, 'g3', it.id);
    if (s.kind === 'meter') {
      const beats = g3.meterBeats(s.table, s.bars);
      assert.ok(beats.length, it.id + ' has no meter');
      // The prompt either asks for the beats or for the number of bars.
      assert.ok([beats.length, s.bars].includes(Number(it.answer)), it.id + ' answer ' + it.answer);
    } else if (s.kind === 'remainder') {
      assert.equal(g3.isRemainderAnswer(it.answer, g3.barsAndRemainder(s.beats, s.perBar)), true, it.id);
      assert.equal(it.typed, true, it.id + ' needs a typed answer');
      // A remainder answer is not a times-table fact, so it must not count
      // toward the core and must not open the 3/6/7/8/9 gate.
      assert.equal(mastery.itemTable(it), null, it.id + ' is tagged with a table');
      assert.doesNotMatch(it.prompt, new RegExp('«' + it.answer + '»'), it.id + ' spells out its own answer');
    } else if (s.kind === 'grid') {
      assert.equal(g3.gridCells(s.rows, s.steps), Number(it.answer), it.id);
    } else {
      const times = g3.timesMore(Math.max(s.a, s.b), Math.min(s.a, s.b));
      assert.ok(times === Number(it.answer) || g3.higherHz(s.a, s.b) === Number(it.answer)
        || Math.min(s.a, s.b) === Number(it.answer), it.id + ' answer ' + it.answer);
    }
  });
});

test('the minutes-to-seconds items match the shared conversion', () => {
  const rows = banks.itemsForGrade('ג').filter((it) => /דקות לשניות/.test(it.standard));
  assert.ok(rows.length >= 3, 'expected the time items, got ' + rows.length);
  rows.forEach((it) => {
    const mmss = /(\d+) דק(?:ה|ות)(?: ו־(\d+) שניות)?/.exec(it.prompt);
    const secs = /(\d+) שניות\. כמה דקות/.exec(it.prompt);
    if (secs) {
      assert.equal(g3.tuneClock(Number(secs[1])), Number(it.answer) + ':00', it.id);
    } else {
      assert.ok(mmss, it.id + ' prompt does not name a duration');
      assert.equal(g3.tuneSeconds(Number(mmss[1]), mmss[2] ? Number(mmss[2]) : 0), Number(it.answer), it.id);
    }
  });
});

test('the table-as-meter items stay behind the mastery.js gate', () => {
  const meters = banks.itemsForGrade('ג').filter((it) => it.g3 && it.g3.kind === 'meter');
  assert.ok(meters.length >= 5);
  meters.forEach((it) => {
    assert.equal(mastery.itemTable(it), it.g3.table, it.id);
    assert.equal(mastery.isBlockedItem(it), true, it.id + ' is not gated');
  });
  // With nothing mastered the gate hides every meter item; once 2, 4, 5 and 10
  // each have two correct items it opens them.
  const all = banks.allItems();
  const open = banks.itemsForGrade('ג').filter((it) => it.g3 && it.g3.kind === 'meter');
  assert.deepEqual(mastery.gateItems(open, [], all), []);
  const history = [];
  [2, 4, 5, 10].forEach((t) => {
    all.filter((it) => it.table === t).slice(0, 2).forEach((it) => history.push({ id: it.id, correct: true }));
  });
  assert.equal(mastery.gateItems(open, history, all).length, open.length);
});

test('index.html draws the grade-ג widget, checks remainders and unlocks audio', () => {
  assert.match(indexHtml, /src="src\/lib\/musicEngine\.js"/);
  assert.match(indexHtml, /src="src\/lib\/grade3Music\.js"/);
  assert.ok(indexHtml.includes("item.widget==='g3'"), 'renderWidget has no g3 branch');
  assert.ok(indexHtml.includes('bindGrade3(host, item.g3)'));
  // Both typed flows go through the remainder validator, not through isCorrect.
  assert.equal((indexHtml.match(/answerOk\(/g) || []).length, 3);
  assert.ok(indexHtml.includes('isRemainderAnswer(given,barsAndRemainder('));
  assert.ok(indexHtml.includes('remainderMiss(given,s)'));
  // Tap-to-answer modes never serve an item that needs typing.
  assert.ok(indexHtml.includes('pool.filter(it=>!it.typed)'));
  const core = fs.readFileSync(path.join(root, 'src/lib/core.js'), 'utf8');
  assert.match(core, /setAudioContextProvider\(getAudioContext\)/);
  assert.match(core, /addEventListener\('pointerdown'/);
  assert.match(core, /unlockAudio\(\)/);
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.ok(sw.includes("'./src/lib/grade3Music.js'"));
  assert.ok(sw.includes("'./src/lib/musicEngine.js'"));
});
