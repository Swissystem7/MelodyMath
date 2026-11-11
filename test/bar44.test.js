const test = require('node:test');
const assert = require('node:assert/strict');
const bar = require('../src/lib/bar44');
const { isCorrect } = require('../src/lib/adaptive');

test('1/2, 1/4 and 1/8 map onto eighths of a 4/4 bar', () => {
  assert.equal(bar.eighthsOf('1/2'), 4);
  assert.equal(bar.eighthsOf('1/4'), 2);
  assert.equal(bar.eighthsOf('1/8'), 1);
  assert.equal(bar.eighthsOf('½'), 4);
  assert.equal(bar.fractionFromEighths(4), '1/2');
  assert.equal(bar.fractionFromEighths(2), '1/4');
  assert.equal(bar.fractionFromEighths(1), '1/8');
  assert.equal(bar.fractionFromEighths(8), '1');
});

test('½ and 1/2 are the same fraction answer, and 0.5 is not required', () => {
  assert.equal(bar.sameFraction('½', '1/2'), true);
  assert.equal(bar.sameFraction('1/4', '2/8'), true);
  assert.ok(isCorrect('1/2', '1/2'));
  assert.ok(isCorrect('½', '1/2'));
  assert.ok(isCorrect('1 / 4', '1/4'));
});

test('the bar drawing names a 4/4 bar and has eight cells', () => {
  const html = bar.renderBar44Html({ fraction: '1/2' }, false);
  assert.match(html, /תיבה 4\/4/);
  assert.equal((html.match(/bar44-cell/g) || []).length, 8);
  assert.match(html, /מלא: 1\/2/);
});

test('fractionFromEighths returns 0/8 for input 0', () => {
  assert.equal(bar.fractionFromEighths(0), '0/8');
});

test('renderBar44Html should only enable interactivity when interactive is explicitly boolean true', () => {
  // Test with string 'true' - should NOT enable interactivity (disabled buttons)
  const htmlWithString = bar.renderBar44Html({ fraction: '1/2' }, 'true');
  assert.ok(htmlWithString.includes('disabled'), 'Buttons should be disabled when interactive is string "true"');
  
  // Test with number 1 - should NOT enable interactivity (disabled buttons)
  const htmlWithNumber = bar.renderBar44Html({ fraction: '1/2' }, 1);
  assert.ok(htmlWithNumber.includes('disabled'), 'Buttons should be disabled when interactive is number 1');
  
  // Test with boolean true - SHOULD enable interactivity (no disabled buttons)
  const htmlWithBooleanTrue = bar.renderBar44Html({ fraction: '1/2' }, true);
  assert.ok(!htmlWithBooleanTrue.includes('disabled'), 'Buttons should NOT be disabled when interactive is boolean true');
  
  // Verify the specific expected output for string 'true' case
  const expected = '<div class="bar44" dir="ltr" data-filled="4"><p class="bar44-label">תיבה 4/4 · 8 שמיניות</p><div class="bar44-track" role="group" aria-label="תיבה מוזיקלית 4/4"><button type="button" class="bar44-cell on" disabled data-i="0" aria-pressed="true" aria-label="שמינית 1 · פעימה 1"><span class="bar44-beat">1</span></button><button type="button" class="bar44-cell on" disabled data-i="1" aria-pressed="true" aria-label="שמינית 2 · פעימה 1"></button><button type="button" class="bar44-cell on" disabled data-i="2" aria-pressed="true" aria-label="שמינית 3 · פעימה 2"><span class="bar44-beat">2</span></button><button type="button" class="bar44-cell on" disabled data-i="3" aria-pressed="true" aria-label="שמינית 4 · פעימה 2"></button><button type="button" class="bar44-cell" disabled data-i="4" aria-pressed="false" aria-label="שמינית 5 · פעימה 3"><span class="bar44-beat">3</span></button><button type="button" class="bar44-cell" disabled data-i="5" aria-pressed="false" aria-label="שמינית 6 · פעימה 3"></button><button type="button" class="bar44-cell" disabled data-i="6" aria-pressed="false" aria-label="שמינית 7 · פעימה 4"><span class="bar44-beat">4</span></button><button type="button" class="bar44-cell" disabled data-i="7" aria-pressed="false" aria-label="שמינית 8 · פעימה 4"></button></div><p class="bar44-read" aria-live="polite">מלא: 1/2 מהתיבה</p></div>';
  assert.equal(htmlWithString, expected);
});

test('fractionFromEighths(3) should return \'1/3\' to support grade ד׳ curriculum requirements', () => {
  assert.equal(bar.fractionFromEighths(3), '1/3');
});

test('fractionOfQuantity computes fraction of a beat quantity', () => {
  assert.equal(bar.fractionOfQuantity('1/4', 8), 2);
  assert.equal(bar.fractionOfQuantity('1/2', 8), 4);
  assert.equal(bar.fractionOfQuantity('3/4', 8), 6);
  assert.equal(bar.fractionOfQuantity('invalid', 8), null);
  assert.equal(bar.fractionOfQuantity('1/4', null), null);
});

test('areFractionsEquivalent and getEquivalentFractions identify duration equivalents', () => {
  assert.equal(bar.areFractionsEquivalent('2/8', '1/4'), true);
  assert.equal(bar.areFractionsEquivalent('4/8', '1/2'), true);
  assert.equal(bar.areFractionsEquivalent('6/8', '3/4'), true);
  assert.equal(bar.areFractionsEquivalent('3/8', '1/2'), false);

  const halfEqs = bar.getEquivalentFractions('1/2');
  assert.ok(halfEqs.includes('1/2'));
  assert.ok(halfEqs.includes('2/4'));
  assert.ok(halfEqs.includes('4/8'));

  const quarterEqs = bar.getEquivalentFractions('1/4');
  assert.ok(quarterEqs.includes('1/4'));
  assert.ok(quarterEqs.includes('2/8'));
});

test('compareFractions accurately orders musical durations', () => {
  assert.equal(bar.compareFractions('1/2', '1/4'), 1);
  assert.equal(bar.compareFractions('1/8', '1/4'), -1);
  assert.equal(bar.compareFractions('2/4', '1/2'), 0);
  assert.equal(bar.compareFractions('bad', '1/2'), null);
});

test('measureFill checks whether notes fill a 4/4 musical bar or overflow', () => {
  const partial = bar.measureFill(['1/4', '1/8']);
  assert.equal(partial.filled, 3);
  assert.equal(partial.remaining, 5);
  assert.equal(partial.isFull, false);
  assert.equal(partial.isOverflow, false);

  const full = bar.measureFill(['1/2', '1/4', '2/8']);
  assert.equal(full.filled, 8);
  assert.equal(full.remaining, 0);
  assert.equal(full.isFull, true);
  assert.equal(full.isOverflow, false);
  assert.equal(full.fraction, '1');

  const overflow = bar.measureFill(['1/2', '3/4']);
  assert.equal(overflow.filled, 10);
  assert.equal(overflow.isOverflow, true);
  assert.equal(overflow.isFull, false);
});

test('melodic symmetry functions support retrograde and pitch inversion', () => {
  const notes = ['1/4', '1/8', '1/2'];
  assert.deepEqual(bar.retrograde(notes), ['1/2', '1/8', '1/4']);

  const pitches = [261.63, 329.63, 392.0];
  const inverted = bar.invertPitch(pitches, 329.63);
  assert.equal(inverted[1], 329.63);
  assert.equal(Math.round(inverted[0] - 329.63), Math.round(329.63 - pitches[0]));
  assert.equal(Math.round(329.63 - inverted[2]), Math.round(pitches[2] - 329.63));

  assert.equal(bar.isMeter34(6), true);
  assert.equal(bar.isMeter34(8), false);
});

// A practice question shows the bar as a still picture: the line that names the
// filled fraction is the answer, so it is not printed, and a tap writes nothing.
test('picture mode: the bar does not print the filled fraction and is not interactive', () => {
  const quiet = bar.renderBar44Html({ fraction: '1/2' }, false, true);
  assert.doesNotMatch(quiet, /מלא: /);
  assert.doesNotMatch(quiet, /1\/2/);
  assert.equal((quiet.match(/bar44-cell on/g) || []).length, 4, 'the filled cells are still drawn');
  const root = { innerHTML: '', querySelectorAll() { throw new Error('picture mode binds no taps'); } };
  let picked = 0;
  const api = bar.bindBar44(root, { filled: 2 }, () => { picked++; }, { picture: true });
  assert.doesNotMatch(root.innerHTML, /מלא: |1\/4/);
  assert.match(root.innerHTML, / disabled/);
  assert.equal(api.fraction(), '1/4');
  assert.equal(picked, 0);
});

test('grade ד fraction prompts do not print their own answer in brackets', () => {
  const BANKS = require('../src/lib/banks');
  const rows = BANKS.practiceItems(null, 'ד').filter((x) => x.widget === 'bar44');
  assert.ok(rows.length >= 15);
  rows.forEach((x) => {
    assert.ok(!x.prompt.includes(`(${x.answer})`), x.prompt);
  });
});

test('canAddNote allows valid durations that fit under capacity', () => {
  // Adding '1/4' to empty measure -> 2 <= 8
  assert.equal(bar.canAddNote([], '1/4'), true);
  // Adding '1/8' to ['1/2', '1/4'] -> 4 + 2 + 1 = 7 eighths <= 8
  assert.equal(bar.canAddNote(['1/2', '1/4'], '1/8'), true);
  // Adding '1/2' to ['1/4'] -> 2 + 4 = 6 eighths <= 8
  assert.equal(bar.canAddNote(['1/4'], '1/2'), true);
  // Adding whole note '1' to empty measure -> 8 <= 8
  assert.equal(bar.canAddNote([], '1'), true);
  // Adding Unicode fraction '¼' to ['½'] -> 4 + 2 = 6 <= 8
  assert.equal(bar.canAddNote(['½'], '¼'), true);
});

test('canAddNote allows exact capacity fill', () => {
  // Adding '1/8' to 7 eighths filled -> total 8 eighths -> true
  assert.equal(bar.canAddNote(['1/2', '1/4', '1/8'], '1/8'), true);
  // Adding '1/4' to 6 eighths filled -> total 8 eighths -> true
  assert.equal(bar.canAddNote(['1/2', '1/4'], '1/4'), true);
  // Adding '1/2' to 4 eighths filled -> total 8 eighths -> true
  assert.equal(bar.canAddNote(['1/2'], '1/2'), true);
  // Adding whole note '1' to empty bar -> exactly 8 eighths -> true
  assert.equal(bar.canAddNote([], '1'), true);
});

test('canAddNote blocks overflow beyond 4 beats', () => {
  // Adding '1/2' (4 eighths) to ['1/2', '1/4'] (6 eighths) -> total 10 eighths > 8 -> returns false
  assert.equal(bar.canAddNote(['1/2', '1/4'], '1/2'), false);
  // Adding any note to a full bar -> returns false
  assert.equal(bar.canAddNote(['1/2', '1/2'], '1/8'), false);
  assert.equal(bar.canAddNote(['1'], '1/8'), false);
  assert.equal(bar.canAddNote(['1/4', '1/4', '1/4', '1/4'], '1/4'), false);
  // Adding a whole note '1' to a non-empty bar -> returns false
  assert.equal(bar.canAddNote(['1/8'], '1'), false);
  // Adding '3/4' (6 eighths) to ['1/2'] (4 eighths) -> 10 eighths > 8 -> returns false
  assert.equal(bar.canAddNote(['1/2'], '3/4'), false);
});

test('canAddNote handles edge cases, bad inputs, and custom maxEighths capacities', () => {
  // Edge cases and bad inputs for newNote: null, undefined, empty string, malformed strings
  assert.equal(bar.canAddNote([], null), false);
  assert.equal(bar.canAddNote([], undefined), false);
  assert.equal(bar.canAddNote([], ''), false);
  assert.equal(bar.canAddNote([], '   '), false);
  assert.equal(bar.canAddNote([], 'banana'), false);
  assert.equal(bar.canAddNote([], '3/7'), false);
  assert.equal(bar.canAddNote([], '0/4'), false);
  assert.equal(bar.canAddNote([], '-1/4'), false);
  assert.equal(bar.canAddNote([], {}), false);
  assert.equal(bar.canAddNote([], 123), false);

  // Non-array existingNotes gracefully handled (treated as empty array)
  assert.equal(bar.canAddNote(null, '1/4'), true);
  assert.equal(bar.canAddNote(undefined, '1/4'), true);
  assert.equal(bar.canAddNote('invalid', '1/4'), true);
  assert.equal(bar.canAddNote(123, '1/4'), true);
  assert.equal(bar.canAddNote({}, '1/4'), true);

  // Custom maxEighths capacities (e.g. 3/4 time signature = 6 eighths, 2/4 = 4 eighths)
  assert.equal(bar.canAddNote(['1/4', '1/4'], '1/4', 6), true); // 2 + 2 + 2 = 6 <= 6
  assert.equal(bar.canAddNote(['1/4', '1/4'], '1/2', 6), false); // 2 + 2 + 4 = 8 > 6
  assert.equal(bar.canAddNote([], '1/4', 2), true); // 2 <= 2
  assert.equal(bar.canAddNote([], '1/2', 2), false); // 4 > 2
  assert.equal(bar.canAddNote(['1/4'], '1/4', '4'), true); // string '4' capacity: 2 + 2 = 4 <= 4

  // Fallback to BAR_EIGHTHS when maxEighths is invalid, non-positive, or non-finite
  assert.equal(bar.canAddNote(['1/2'], '1/4', 0), true); // fallback to 8: 4 + 2 = 6 <= 8
  assert.equal(bar.canAddNote(['1/2'], '1/4', -2), true); // fallback to 8
  assert.equal(bar.canAddNote(['1/2'], '1/4', NaN), true); // fallback to 8
  assert.equal(bar.canAddNote(['1/2'], '1/4', Infinity), true); // fallback to 8
  assert.equal(bar.canAddNote(['1/2'], '1/4', null), true); // fallback to 8
  assert.equal(bar.canAddNote(['1/2'], '1/4', 'banana'), true); // fallback to 8
  assert.equal(bar.canAddNote(['1/2', '1/2'], '1/8', -1), false); // fallback to 8: 8 + 1 = 9 > 8 -> false
});

function stubBar44Root(mode) {
  const root = {
    innerHTML: '',
    textContent: '',
    querySelectorAll(selector) {
      if (selector !== '.bar44-cell') return [];
      this._cells = this._cells || {};
      const cells = [];
      const re = /<button\b[^>]*>/gi;
      let m;
      while ((m = re.exec(this.innerHTML))) {
        const tag = m[0];
        const i = /data-i="(\d+)"/.exec(tag);
        if (!i) continue;
        const key = i[1];
        if (!this._cells[key]) {
          this._cells[key] = {
            getAttribute(name) { return name === 'data-i' ? key : null; },
            addEventListener(type, fn) { if (type === 'click') this._onClick = fn; },
            click() { if (this._onClick) this._onClick(); },
          };
        }
        cells.push(this._cells[key]);
      }
      return cells;
    },
  };
  if (mode === 'modern') {
    root.replaceChildren = function () {
      this.innerHTML = '';
      this.textContent = '';
    };
    root.insertAdjacentHTML = function (position, html) {
      if (position === 'beforeend') this.innerHTML += html;
    };
  } else if (mode === 'insertOnly') {
    root.insertAdjacentHTML = function (position, html) {
      if (position === 'beforeend') this.innerHTML += html;
    };
  }
  return root;
}

test('formatFraction returns n/d and fractionFromEighths uses it for 5/8 and 7/8', () => {
  assert.equal(bar.formatFraction(5, 8), '5/8');
  assert.equal(bar.formatFraction(7, 8), '7/8');
  assert.equal(bar.fractionFromEighths(5), '5/8');
  assert.equal(bar.fractionFromEighths(7), '7/8');
});

test('bindBar44 picture mode uses replaceChildren and insertAdjacentHTML when both exist', () => {
  const root = stubBar44Root('modern');
  const api = bar.bindBar44(root, { filled: 2 }, () => {}, { picture: true });
  assert.match(root.innerHTML, / disabled/);
  assert.doesNotMatch(root.innerHTML, /מלא: /);
  assert.equal(api.fraction(), '1/4');
  assert.equal(api.eighths(), 2);
});

test('bindBar44 picture mode falls back to insertAdjacentHTML without replaceChildren', () => {
  const root = stubBar44Root('insertOnly');
  const api = bar.bindBar44(root, { filled: 4 }, () => {}, { picture: true });
  assert.match(root.innerHTML, /bar44-cell/);
  assert.doesNotMatch(root.innerHTML, /מלא: /);
  assert.equal(api.fraction(), '1/2');
  assert.equal(api.eighths(), 4);
});

test('bindBar44 interactive paint binds cell taps and reports the chosen fraction', () => {
  const root = stubBar44Root('modern');
  const picks = [];
  const api = bar.bindBar44(root, { filled: 2 }, (frac, eighths) => {
    picks.push([frac, eighths]);
  });
  assert.match(root.innerHTML, /מלא: 1\/4 מהתיבה/);
  assert.equal(api.fraction(), '1/4');
  assert.equal(api.eighths(), 2);
  const cells = root.querySelectorAll('.bar44-cell');
  assert.equal(cells.length, 8);
  cells[4].click();
  assert.equal(api.eighths(), 5);
  assert.equal(api.fraction(), '5/8');
  assert.match(root.innerHTML, /מלא: 5\/8 מהתיבה/);
  assert.deepEqual(picks, [['5/8', 5]]);
});
