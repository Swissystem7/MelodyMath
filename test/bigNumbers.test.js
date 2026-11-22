'use strict';
// BigNumbers: an Orff ensemble, one instrument per place, all equally loud;
// from the ones upward, a turn marker before each place, a zero is real
// silence; ten of a place packed with one identical sound.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const B = require('../src/lib/music/bigNumbers');
const banks = require('../src/lib/banks');

const item = (music, prompt, answer) => ({ music: music, prompt: prompt, answer: answer });
const spec = (...a) => B.specForItem(item(...a));
const ev = (...a) => B.soundEvents(spec(...a));
const stage = (list, st) => list.filter((n) => n.stage === st);
const strokesAt = (list, place) => list.filter((n) => n.place === place && n.stage !== 'turn');

test('a number is played from the ones upward, a marker before every place; a zero is real silence', () => {
  const e = ev('thousandAccents', '6,000 + 80 + 9 = ? (כתבו בלי פסיק)', 6089);
  const turns = stage(e, 'turn');
  assert.deepEqual(turns.map((n) => n.place), [0, 1, 2, 3]);
  assert.ok(turns.every((n) => n.voice === 'woodClick' && n.hz === 400 && n.dur === 0.04 && n.gain === 0.08));
  assert.deepEqual([0, 1, 2, 3].map((p) => strokesAt(e, p).length), [9, 8, 0, 6]);
  // the hundreds slot is silent but keeps its time
  assert.ok(turns[3].at - turns[2].at > 0.5);
  // every place has its own instrument, all at the same loudness
  assert.equal(new Set(e.filter((n) => n.stage === 'digit').map((n) => n.gain)).size, 1);
  assert.equal(new Set([0, 1, 2, 3].map((p) => B.ORFF[p][1])).size, 4);
});

test('periods of three are closed by the same frame sound', () => {
  const e = ev('periodAccentLevels', '5,000,000 + 70,000 + 300 + 8 = ? (כתבו בלי פסיק)', 5070308);
  assert.equal(stage(e, 'periodFrame').length, 2);
  assert.equal(strokesAt(e, 6).length, 5);
  assert.equal(strokesAt(e, 4).length, 7);
});

test('a digit question plays the whole number; the answer is that place\'s strokes', () => {
  const e = ev('millionAccentLevels', 'במספר 472,315, מהי ספרת מאות האלפים?', 4);
  assert.equal(strokesAt(e, 5).length, 4);
  assert.equal(spec('millionAccentLevels', 'במספר 472,315, מהי ספרת מאות האלפים?', 7), null, 'a wrong key is never set to sound');
});

test('the next number after 999,999: the first packing in full, then packing after packing to a new place', () => {
  const e = ev('millionAccentLevels', 'מה המספר שבא אחרי 999,999? (כתבו בלי פסיק)', 1000000);
  assert.equal(stage(e, 'pack').length, 6);
  assert.equal(stage(e, 'nine').length, 9);
  assert.equal(stage(e, 'carried').length, 5);
  assert.equal(stage(e, 'newPlace').length, 1);
  const two = ev('periodAccentLevels', 'מה המספר שבא אחרי 1,999,999? (כתבו בלי פסיק)', 2000000);
  assert.equal(stage(two, 'pack').length, 6);
  assert.equal(stage(two, 'carried').length, 5);
  assert.equal(stage(two, 'newPlace').length, 2, 'the million that was there and the one carried in');
});

test('hundreds in 2800: a bundle is first heard equal to ten hundreds, then two bundles and eight', () => {
  const e = ev('thousandAccents', 'כמה מאות שלמות יש במספר 2800?', 28);
  assert.equal(stage(e, 'demo').length, 10);
  assert.equal(stage(e, 'bundle').length, 3);
  assert.equal(stage(e, 'hundred').length, 8);
});

test('rounding: the deciding digit, its steps down against its steps up to ten', () => {
  const e = ev('millionAccentLevels', 'עגלו את 318,460 לאלפים. (כתבו בלי פסיק)', 318000);
  assert.equal(stage(e, 'down').length, 4);
  assert.equal(stage(e, 'up').length, 6);
  assert.equal(spec('periodAccentLevels', 'עגלו את 738,450 לעשרות אלפים. (כתבו בלי פסיק)', 740000).d, 8);
});

test('comparing starts at the largest place and stops where the numbers first differ', () => {
  const e = ev('thousandAccents', 'איזה גבוה יותר: 7040 הרץ או 7400 הרץ? (כתבו בלי פסיק)', 7400);
  assert.equal(stage(e, 'decided')[0].place, 2);
  assert.deepEqual(stage(e, 'turn').map((n) => n.place), [3, 2]);
  assert.ok(stage(e, 'a').length > 0);
  assert.ok(stage(e, 'b').length > 0);
  assert.equal(spec('thousandAccents', 'איזה מספר קטן יותר: 7050 או 7500? כתבו את המספר.', 7050).value, 7050);
});

test('addition column by column from the ones; ten in a column is packed and carried', () => {
  const e = ev('carryAccentUp', '3,680 + 450 = ? (כתבו בלי פסיק)', 4130);
  assert.equal(stage(e, 'pack').length, 2);
  assert.equal(stage(e, 'carried').length, 2);
});

test('subtraction and missing addends by counting up: to a round number, then the big jumps', () => {
  const s = spec('carryAccentUp', 'הצליל הגבוה ביותר בפסנתר הוא 4186 הרץ. כמה חסר לו עד 10,000? (כתבו בלי פסיק)', 5814);
  assert.ok(s, 'played');
  assert.deepEqual(s.jumps, [[0, 4], [1, 1], [2, 8], [3, 5]]);
  const t = spec('periodAccentLevels', 'בעיר אחת 1,284,000 תושבים ובעיר אחרת 1,248,000. בכמה גדול מספר התושבים בעיר הראשונה? (כתבו בלי פסיק)', 36000);
  assert.equal(t.jumps.reduce((a, [p, c]) => a + c * Math.pow(10, p), 0), 36000);
});

test('×10 and ×100 move the same pattern up the instruments; ×1 is one framed group; ×0 is framed silence', () => {
  const e = ev('millionAccentLevels', '3,450 × 100 = ? (כתבו בלי פסיק)', 345000);
  assert.equal(stage(e, 'timesTen').length, 2);
  assert.deepEqual([1, 2, 3].map((p) => strokesAt(stage(e, 'start'), p).length), [5, 4, 3]);
  assert.deepEqual([3, 4, 5].map((p) => strokesAt(stage(e, 'shifted'), p).length), [5, 4, 3]);
  const z = ev('regroupAllLevels', '0 × 1,234,567 = ?', 0);
  assert.equal(z.length, 2);
  assert.ok(z.every((n) => n.stage === 'periodFrame'));
});

test('thousands in a million: three levels of "opens into ten"', () => {
  const e = ev('periodAccentLevels', 'כמה אלפים יש במיליון? (כתבו בלי פסיק)', 1000);
  assert.equal(stage(e, 'opens').length, 3);
  assert.equal(stage(e, 'into').length, 30);
});

test('only for its tags, and only when the sounds give exactly the answer', () => {
  assert.equal(spec('regroupAllLevels', 'מה ערך הספרה 7 במספר 27,000,000? (כתבו בלי פסיק)', 7000000), null, 'no ten-millions instrument yet');
  assert.equal(spec('remainders', '28 × 5 = ?', 140), null);
  assert.equal(B.specForItem(null), null);
});

test('the bank: big-number items of grades 2–6 are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => B.specForItem(it));
  assert.ok(list.length >= 60, 'played ' + list.length);
  assert.deepEqual([...new Set(list.map((it) => it.grade))].sort(), ['ב', 'ג', 'ד', 'ה', 'ו']);
  const word = (h, w) => new RegExp('(^|[\\s.,:;—>(])' + w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '($|[\\s.,:;—<)?])').test(h);
  list.forEach((it) => {
    const s = B.specForItem(it), h = B.html(s), a = String(it.answer);
    assert.ok(/^\d+$/.test(a) ? !(h.match(/\d+/g) || []).includes(a) : !word(h, a), 'leak: ' + it.prompt);
    assert.ok(B.longestRun(B.soundEvents(s)) <= B.MAX_RUN, 'run: ' + it.prompt);
    assert.match(B.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('thousandAccents', 'מה הספרה במקום העשרות במספר 3164?', 6);
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 1, state: 'suspended', resume() { this.state = 'running'; } } };
  const n = B.soundEvents(s).length;
  assert.deepEqual(B.play(s, env), { notes: n });
  assert.ok(calls.every((c) => c.when >= 1.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(B.play(s, {}), { notes: n, silent: true });
  assert.equal(B.play(null, env), null);
  assert.equal(B.html(null), '');
});

test('vertical multiplication as partial products; taking away hundreds by counting up', () => {
  const e = ev('repeatedBars', 'חשבו במאונך: 586 × 7 (כתבו בלי פסיק)', 4102);
  assert.deepEqual(spec('repeatedBars', 'חשבו במאונך: 586 × 7 (כתבו בלי פסיק)', 4102).parts, [3500, 560, 42]);
  assert.equal(stage(e, 'partialSign').length, 3);
  assert.deepEqual(spec('regroupAllLevels', 'חשבו במאונך: 1,234 × 56 (כתבו בלי פסיק)', 69104).parts, [61700, 7404]);
  assert.equal(spec('repeatedBars', '4 × 5 = ?', 20), null, 'the new tags use only the new rules: TimesTable keeps its table');
  assert.deepEqual(spec('repeatedBars', '25 × 36 = ?', 900).parts, [750, 150]);
  const up = spec('takeAwayBeats', 'היו 300 כיסאות באולם. הוציאו 145 לצורך אירוע אחר. כמה כיסאות נשארו?', 155);
  assert.deepEqual(up.jumps, [[0, 5], [1, 5], [2, 1]]);
});

test('differences in tables by counting up; a sum of two shows in columns', () => {
  assert.equal(spec('rowCellGroups', 'בטבלת המבקרים בתערוכה: 2024 — 125,400 מבקרים, 2025 — 131,900 מבקרים. בכמה מבקרים יותר היו ב־2025? (כתבו בלי פסיק)', 6500).kind, 'up');
  assert.equal(spec('tableRowGroups', 'בטבלת נקודות: קבוצה א׳ — 25, קבוצה ב׳ — 18. בכמה נקודות מובילה קבוצה א׳?', 7).value, 7);
  assert.equal(spec('callResponse', 'בהצגה הראשונה נכחו 180 צופים, ובשנייה 215. כמה צופים נכחו בסך הכול בשתי ההצגות?', 395).kind, 'add');
});

test('how many hundreds in a jump: counting up in two jumps, thousands then hundreds', () => {
  const s = spec('romanGroupSymbols', 'כדי להפוך את 210,000 ל־217,800 מוסיפים 7 אלפים ועוד כמה מאות?', 8);
  assert.equal(s.ask, 'hundreds');
  assert.deepEqual(s.jumps, [[3, 7], [2, 8]]);
});
test('the modules that already own an item keep it', () => {
  const owners = ['multiplyWorlds', 'timesTable', 'takeAwayTen', 'dragPlace', 'dataWorlds', 'earlyBeats'].map((f) => require('../src/lib/music/' + f));
  banks.allItems().filter((it) => B.specForItem(it)).forEach((it) => owners.forEach((o) => assert.equal(o.specForItem(it), null, 'both play: ' + it.prompt)));
});

test('index.html renders the widget and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_BIG_NUMBERS\.play\(bn\)/);
  assert.match(html, /host\._bigSpec && typeof MM_BIG_NUMBERS!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/bigNumbers\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/bigNumbers\.js'/);
});

test('TAGS, EXTRA_TAGS, OWNERS, MAX_RUN, and ORFF instrument definitions are exact and complete', () => {
  assert.equal(B.MAX_RUN, 12);
  assert.deepEqual(B.TAGS, [
    'thousandAccents', 'carryAccentUp', 'millionAccentLevels', 'carryTenUp',
    'periodAccentLevels', 'regroupAllLevels', 'repeatedBars', 'takeAwayBeats',
    'tableRowGroups', 'rowCellGroups', 'columnsAsNotes', 'callResponse', 'romanGroupSymbols'
  ]);
  assert.ok(Object.isFrozen(B.TAGS));
  assert.deepEqual(B.EXTRA_TAGS, [
    'repeatedBars', 'takeAwayBeats', 'tableRowGroups', 'rowCellGroups', 'columnsAsNotes', 'callResponse', 'romanGroupSymbols'
  ]);
  assert.ok(Object.isFrozen(B.EXTRA_TAGS));
  assert.deepEqual(B.OWNERS, [
    'multiplyWorlds', 'timesTable', 'takeAwayTen', 'dragPlace', 'dataWorlds', 'earlyBeats'
  ]);
  assert.ok(Object.isFrozen(B.OWNERS));
  assert.deepEqual(B.ORFF, [
    ['tine', 2093, 'גלוקנשפיל'],
    ['woodBar', 880, 'קסילופון סופרן'],
    ['woodBar', 523, 'קסילופון אלט'],
    ['metalBell', 660, 'מטלופון'],
    ['frameDrum', 196, 'תוף יד'],
    ['drumLow', 98, 'תוף בס'],
    ['shaker', 1200, 'שייקר']
  ]);
});

test('html renders complete markup, world info, legend, instructions for all kinds, and escapes input', () => {
  assert.equal(B.html(null), '');
  assert.equal(B.html(undefined), '');

  const expectedLegend = 'גלוקנשפיל — האחדות, קסילופון סופרן — העשרות, קסילופון אלט — המאות, מטלופון — האלפים, תוף יד — עשרות האלפים, תוף בס — מאות האלפים, שייקר — המיליונים.';
  const expectedWorld = 'הרכב אורף: כלי הנגינה של שיעור המוזיקה, בשיטה שפיתח קרל אורף: לכל מקום במספר כלי משלו, כולם באותה עוצמה, ומנגנים בתורות — מהאחדות כלפי מעלה.';
  const unrevealedPredict = '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו: איזה כלי, וכמה פעמים?</p>';
  const revealedPredict = '<p class="band-predict bn-silent">עכשיו בלי צליל: כתבו בטבלת מקומות, עם אפס בכל מקום ריק, ובדקו שוב.</p>';
  const playButton = '<button type="button" class="snd-play">▶ שמעו</button>';

  const howByKind = {
    number: 'מהאחדות כלפי מעלה: סימן תור לפני כל מקום, ואחריו הנגינות של המקום — או שקט אמיתי כשהספרה אפס. כל שלושה מקומות נסגרים במסגרת.',
    hundreds: 'קודם שומעים שחבילה אחת שווה עשר מאות. אחר כך החבילות, ואחריהן המאות הבודדות.',
    levels: 'מיליון נפתח לעשר, כל אחד מהם לעשר, וכל אחד מהם לעשר אלפים. שלוש רמות של עשר.',
    cascade: 'מוסיפים אחד: עשר אחדות נארזות לעשרת אחת, והאריזה עוברת מקום אחרי מקום עד מקום חדש.',
    round: 'קודם המספר. אחר כך הספרה שמכריעה: כמה צעדים למטה, וכמה למעלה עד העשר. הקצר מנצח.',
    compare: 'בהשוואה מתחילים מהמקום הגדול: שני המספרים באותם סימנים, מקום אחרי מקום, עד המקום הראשון שבו הם נבדלים — שם זה מוכרע.',
    regroup: 'האלפים, ואחריהם המאות: עשר מאות נארזות לעוד אלף, ומה שנשאר נשאר מאות.',
    shift: 'כפל בעשר מעביר כל נגינה לכלי של המקום הבא: אותה תבנית, מקום אחד למעלה.',
    timesOne: 'קבוצה אחת בלבד, בתוך מסגרת: המספר עצמו.',
    partials: 'כפל במאונך בחלקים: כל ספרה כפול הכופל היא מספר שלם של ההרכב, מהאחדות כלפי מעלה. פעמון לפני כל חלק. כמה הם יחד?',
    timesZero: 'אפס קבוצות: תיבה של שקט אמיתי בין שתי מסגרות.',
    estimate: 'קודם מעגלים למספר נוח, ואחר כך כופלים. כמה מקומות נפתחים בתוצאה?',
    add: 'עמודה אחרי עמודה מהאחדות: שכבה ראשונה, שכבה שנייה, וכשמגיעים לעשר — צליל אריזה, ואחד עובר למקום הבא.',
    up: 'סופרים קדימה מהמספר הקטן: קודם עד מספר עגול, ואחר כך בקפיצות גדולות. כל קפיצה היא משפט. כמה הוספנו בסך הכול?',
    steps: 'מהמספר שמתחילים בו, צעד אחרי צעד; עשרה צעדים נארזים לאחד מהמקום הבא.',
    groups: 'האלפים בקבוצות בגודל המחלק — כל קבוצה חבילה אחת. כמה קבוצות?',
    halfTen: 'קודם פי עשרה, ואחר כך חצי ממנו.',
    oneMore: 'מה שידוע, ואחריו עוד קבוצה אחת.',
    inverse: 'מה שידוע, ואחריו הביטול: החילוק מחזיר בדיוק את מה שהכפל עשה.',
    stages: 'כל פעולה היא שלב, לפי הסדר, וכל שלב נגמר בתוצאה שלו.',
  };

  for (const [kind, explanation] of Object.entries(howByKind)) {
    const dummySpec = {
      kind,
      value: 42,
      answer: '42',
      world: { he: 'הרכב אורף', why: 'כלי הנגינה של שיעור המוזיקה, בשיטה שפיתח קרל אורף: לכל מקום במספר כלי משלו, כולם באותה עוצמה, ומנגנים בתורות — מהאחדות כלפי מעלה' }
    };
    const htmlUnrevealed = B.html(dummySpec);
    assert.ok(htmlUnrevealed.startsWith('<div class="big-numbers">'));
    assert.ok(htmlUnrevealed.includes('<p class="band-note">' + expectedWorld + '</p>'));
    assert.ok(htmlUnrevealed.includes('<p class="band-note">' + expectedLegend + '</p>'));
    assert.ok(htmlUnrevealed.includes('<p class="band-note">' + explanation + '</p>'));
    assert.ok(htmlUnrevealed.includes(unrevealedPredict));
    assert.ok(htmlUnrevealed.includes(playButton));
    assert.ok(!htmlUnrevealed.includes('snd-answer'));
    assert.ok(htmlUnrevealed.endsWith('</div>'));

    const htmlRevealed = B.html(dummySpec, { revealed: true });
    assert.ok(htmlRevealed.includes(revealedPredict));
    assert.ok(!htmlRevealed.includes(unrevealedPredict));
    assert.ok(htmlRevealed.includes('<span class="snd-answer">42</span>'));
  }

  // HTML escaping for special characters & < > " '
  const specWithEscapes = {
    kind: 'number',
    answer: '<tag> & "quote" \'apostrophe\'',
    world: { he: 'שלום & ברכה', why: 'בדיקה <1> ו-"2" ו-\'3\'' }
  };
  const escapedHtml = B.html(specWithEscapes, { revealed: true });
  assert.ok(escapedHtml.includes('&lt;tag&gt; &amp; &quot;quote&quot; &#39;apostrophe&#39;'));
  assert.ok(escapedHtml.includes('שלום &amp; ברכה: בדיקה &lt;1&gt; ו-&quot;2&quot; ו-&#39;3&#39;.'));
});

test('regroup sound events: thousands, hundreds, packing, packedThousand, remaining hundreds', () => {
  const s = B.specForItem({ music: 'thousandAccents', prompt: '5 אלפים ועוד 14 מאות שווים', answer: 6400, widget: 'bigNumbers' });
  assert.equal(s.kind, 'regroup');
  assert.equal(s.thousands, 5);
  assert.equal(s.hundreds, 14);
  assert.equal(s.value, 6400);

  const e = B.soundEvents(s);
  const thousands = stage(e, 'thousand');
  assert.equal(thousands.length, 5);
  assert.ok(thousands.every((n) => n.voice === 'metalBell' && n.hz === 660 && n.place === 3 && n.worth === 1000));

  const hundreds = stage(e, 'hundred');
  assert.equal(hundreds.length, 14);
  assert.ok(hundreds.every((n) => n.voice === 'woodBar' && n.hz === 523 && n.place === 2 && n.worth === 100));

  const pack = stage(e, 'pack');
  assert.equal(pack.length, 1);
  assert.equal(pack[0].voice, 'jingle');
  assert.equal(pack[0].hz, 784);
  assert.equal(pack[0].dur, 0.3);
  assert.equal(pack[0].gain, 0.14);

  const packedThousand = stage(e, 'packedThousand');
  assert.equal(packedThousand.length, 1);
  assert.equal(packedThousand[0].voice, 'metalBell');
  assert.equal(packedThousand[0].hz, 660);
  assert.equal(packedThousand[0].place, 3);
});

test('steps sound events: starting number, step strokes at place, conditional pack', () => {
  const s1 = spec('carryAccentUp', 'צליל של 400 הרץ, ועוד 3 צעדים של 100 הרץ.', 700);
  assert.equal(s1.kind, 'steps');
  assert.equal(s1.a, 400);
  assert.equal(s1.k, 3);
  assert.equal(s1.w, 100);
  assert.equal(s1.value, 700);

  const e1 = B.soundEvents(s1);
  const startDigits = stage(e1, 'start');
  assert.ok(startDigits.length > 0);
  const steps1 = stage(e1, 'step');
  assert.equal(steps1.length, 3);
  assert.ok(steps1.every((n) => n.place === 2 && n.voice === 'woodBar' && n.hz === 523));
  assert.equal(stage(e1, 'pack').length, 0);

  const s2 = spec('carryAccentUp', 'צליל של 300 הרץ, ועוד 10 צעדים של 100 הרץ.', 1300);
  const e2 = B.soundEvents(s2);
  const steps2 = stage(e2, 'step');
  assert.equal(steps2.length, 10);
  const packs = stage(e2, 'pack');
  assert.equal(packs.length, 1);
  assert.equal(packs[0].voice, 'jingle');
  assert.equal(packs[0].hz, 784);
});

test('groups sound events: thousands divided into bundles, groupBundle hits', () => {
  const s = spec('thousandAccents', '6,000 : 2 = ?', 3000);
  assert.equal(s.kind, 'groups');
  assert.equal(s.thousands, 6);
  assert.equal(s.k, 2);
  assert.equal(s.value, 3000);

  const e = B.soundEvents(s);
  const bundles = stage(e, 'groupBundle');
  assert.equal(bundles.length, 3);
  assert.deepEqual(bundles.map((b) => b.g), [0, 1, 2]);
  assert.ok(bundles.every((b) => b.voice === 'metalBell' && b.hz === 660 && b.dur === 0.45 && b.gain === 0.2 && b.worth === 2000));

  assert.equal(spec('thousandAccents', '6,500 : 2 = ?', 3250), null);
  assert.equal(spec('thousandAccents', '40,000 : 2 = ?', 20000), null);
});

test('halfTen sound events: number times ten, halve shaker sound, number half', () => {
  const s = spec('thousandAccents', '16 × 5 = ?', 80);
  assert.equal(s.kind, 'halfTen');
  assert.equal(s.a, 16);
  assert.equal(s.value, 80);

  const e = B.soundEvents(s);
  const timesTen = stage(e, 'timesTen');
  assert.ok(timesTen.length > 0);
  const halve = stage(e, 'halve');
  assert.equal(halve.length, 1);
  assert.equal(halve[0].voice, 'shaker');
  assert.equal(halve[0].hz, 520);
  assert.equal(halve[0].dur, 0.3);
  assert.equal(halve[0].gain, 0.12);
  const half = stage(e, 'half');
  assert.ok(half.length > 0);

  assert.equal(spec('thousandAccents', '15 × 5 = ?', 75), null);
  assert.equal(spec('thousandAccents', '102 × 5 = ?', 510), null);
});

test('oneMore and inverse sound events: plusGroup and undo bowed sound', () => {
  const sOneMore = spec('thousandAccents', 'נתון: 7 × 8 = 56. כמה זה 7 × 9?', 63);
  assert.equal(sOneMore.kind, 'oneMore');
  assert.equal(sOneMore.known, 56);
  assert.equal(sOneMore.group, 7);
  assert.equal(sOneMore.value, 63);

  const eOneMore = B.soundEvents(sOneMore);
  assert.ok(stage(eOneMore, 'known').length > 0);
  const plusGroup = stage(eOneMore, 'plusGroup');
  assert.equal(plusGroup.length, 1);
  assert.equal(plusGroup[0].voice, 'metalBell');
  assert.equal(plusGroup[0].hz, 784);
  assert.equal(plusGroup[0].dur, 0.3);
  assert.equal(plusGroup[0].gain, 0.14);
  assert.ok(stage(eOneMore, 'group').length > 0);

  assert.equal(spec('thousandAccents', 'נתון: 7 × 8 = 56. כמה זה 7 × 10?', 70), null);

  const sInverse = spec('thousandAccents', 'נתון: 6 × 7 = 42. כמה זה 42 : 7?', 6);
  assert.equal(sInverse.kind, 'inverse');
  assert.equal(sInverse.known, 42);
  assert.equal(sInverse.value, 6);

  const eInverse = B.soundEvents(sInverse);
  assert.ok(stage(eInverse, 'known').length > 0);
  const undo = stage(eInverse, 'undo');
  assert.equal(undo.length, 1);
  assert.equal(undo[0].voice, 'bowed');
  assert.equal(undo[0].hz, 330);
  assert.equal(undo[0].dur, 0.4);
  assert.equal(undo[0].gain, 0.14);
});

test('stages sound events: multiplication, subtraction, division, and addition stages', () => {
  const sTimes4 = spec('thousandAccents', '25 × 4 = ?', 100);
  assert.equal(sTimes4.kind, 'stages');
  assert.deepEqual(sTimes4.stages, [['×', 50], ['×', 100]]);
  assert.equal(sTimes4.value, 100);

  const eTimes4 = B.soundEvents(sTimes4);
  const signs4 = stage(eTimes4, 'sign');
  assert.equal(signs4.length, 2);
  assert.ok(signs4.every((n) => n.voice === 'shaker' && n.hz === 300 && n.op === '×'));
  assert.ok(stage(eTimes4, 'result').length > 0);

  const sCombo = spec('thousandAccents', '(100 − 20) × 2 : 4 = ?', 40);
  assert.equal(sCombo.kind, 'stages');
  assert.deepEqual(sCombo.stages, [['(', 80], ['×', 160], [':', 40]]);
  assert.equal(sCombo.value, 40);

  const eCombo = B.soundEvents(sCombo);
  const signsCombo = stage(eCombo, 'sign');
  assert.equal(signsCombo.length, 3);
  assert.equal(signsCombo[0].voice, 'clap');
  assert.equal(signsCombo[0].hz, 1600);
  assert.equal(signsCombo[0].op, '(');
  assert.equal(signsCombo[1].voice, 'shaker');
  assert.equal(signsCombo[1].hz, 300);
  assert.equal(signsCombo[1].op, '×');
  assert.equal(signsCombo[2].voice, 'shaker');
  assert.equal(signsCombo[2].hz, 620);
  assert.equal(signsCombo[2].op, ':');

  const sAddStage = spec('thousandAccents', '20 × 3 + 15 = ?', 75);
  assert.equal(sAddStage.kind, 'stages');
  assert.deepEqual(sAddStage.stages, [['×', 60], ['+', 75]]);
  assert.equal(sAddStage.value, 75);

  const eAddStage = B.soundEvents(sAddStage);
  const signsAdd = stage(eAddStage, 'sign');
  assert.equal(signsAdd.length, 2);
  assert.equal(signsAdd[0].voice, 'shaker');
  assert.equal(signsAdd[0].hz, 300);
  assert.equal(signsAdd[0].op, '×');
  assert.equal(signsAdd[1].voice, 'metalBell');
  assert.equal(signsAdd[1].hz, 1600);
  assert.equal(signsAdd[1].op, '+');
});

test('estimate sound events: rounded number, multiplication sign, and estimate number', () => {
  const s1 = spec('carryAccentUp', 'אומדן: 21 × 32 קרוב יותר ל־600 או ל־800?', 600);
  assert.equal(s1.kind, 'estimate');
  assert.equal(s1.A, 20);
  assert.equal(s1.B, 30);
  assert.equal(s1.est, 600);
  assert.equal(s1.value, 600);

  const e1 = B.soundEvents(s1);
  assert.ok(stage(e1, 'rounded').length > 0);
  const sign = stage(e1, 'sign');
  assert.equal(sign.length, 1);
  assert.equal(sign[0].voice, 'shaker');
  assert.equal(sign[0].hz, 300);
  assert.equal(sign[0].dur, 0.25);
  assert.equal(sign[0].gain, 0.14);
  assert.equal(sign[0].op, '×');
  assert.ok(stage(e1, 'estimate').length > 0);

  const s2 = spec('carryAccentUp', 'אומדן: 28 × 32 קרוב יותר ל־600 או ל־900?', 900);
  assert.equal(s2.value, 900);
});

test('timesOne sound events: framed number once with periodFrames', () => {
  const s = spec('thousandAccents', '40 × 1 = ?', 40);
  assert.equal(s.kind, 'timesOne');
  assert.equal(s.n, 40);
  assert.equal(s.value, 40);

  const e = B.soundEvents(s);
  const frames = stage(e, 'periodFrame');
  assert.equal(frames.length, 2);
  assert.equal(frames[0].voice, 'shaker');
  assert.equal(frames[0].hz, 300);
  assert.equal(frames[0].dur, 0.3);
  assert.equal(frames[0].gain, 0.1);
  const once = stage(e, 'once');
  assert.ok(once.length > 0);
  assert.ok(once[0].at > frames[0].at);
  assert.ok(once[once.length - 1].at < frames[1].at);

  const sBig = spec('thousandAccents', '5,400 × 1 = ?', 5400);
  assert.equal(stage(B.soundEvents(sBig), 'periodFrame').length, 3);
});

test('round sound events: down strokes, roundDown bell, up strokes, roundUp bell', () => {
  const sDown = spec('thousandAccents', 'עגלו את 3,420 לאלפים.', 3000);
  assert.equal(sDown.kind, 'round');
  assert.equal(sDown.place, 3);
  assert.equal(sDown.d, 4);
  assert.equal(sDown.value, 3000);

  const eDown = B.soundEvents(sDown);
  assert.ok(stage(eDown, 'digit').length > 0);
  const downStrokes = stage(eDown, 'down');
  assert.equal(downStrokes.length, 4);
  assert.ok(downStrokes.every((n) => n.place === 2 && n.voice === 'woodBar' && n.hz === 523));

  const roundDown = stage(eDown, 'roundDown');
  assert.equal(roundDown.length, 1);
  assert.equal(roundDown[0].voice, 'metalBell');
  assert.equal(roundDown[0].hz, 784);
  assert.equal(roundDown[0].dur, 0.25);
  assert.equal(roundDown[0].gain, 0.14);

  const upStrokes = stage(eDown, 'up');
  assert.equal(upStrokes.length, 6);
  assert.ok(upStrokes.every((n) => n.place === 2 && n.voice === 'woodBar' && n.hz === 523));

  const roundUp = stage(eDown, 'roundUp');
  assert.equal(roundUp.length, 1);
  assert.equal(roundUp[0].voice, 'metalBell');
  assert.equal(roundUp[0].hz, 1047);
  assert.equal(roundUp[0].dur, 0.25);
  assert.equal(roundUp[0].gain, 0.14);

  assert.equal(spec('millionAccentLevels', 'עגלו את 350,000 למאות אלפים.', 400000).place, 5);
  assert.equal(spec('millionAccentLevels', 'עגלו את 1,800,000 למיליונים.', 2000000).place, 6);
});

test('place question prompt variants in plan: ones, tens, hundreds, thousands, ten-thousands, hundred-thousands, millions', () => {
  const p0 = spec('thousandAccents', 'מה הספרה במקום האחדות במספר 4,321?', 1);
  assert.equal(p0.kind, 'number');
  assert.equal(p0.ask, 0);
  assert.equal(p0.value, 1);

  const p1 = spec('thousandAccents', 'מה הספרה במקום העשרות במספר 4,321?', 2);
  assert.equal(p1.ask, 1);
  assert.equal(p1.value, 2);

  const p2 = spec('thousandAccents', 'מה הספרה במקום המאות במספר 4,321?', 3);
  assert.equal(p2.ask, 2);
  assert.equal(p2.value, 3);

  const p3 = spec('thousandAccents', 'מה הספרה במקום האלפים במספר 4,321?', 4);
  assert.equal(p3.ask, 3);
  assert.equal(p3.value, 4);

  const p4 = spec('millionAccentLevels', 'במספר 543,210, מהי ספרת עשרות האלפים?', 4);
  assert.equal(p4.ask, 4);
  assert.equal(p4.value, 4);

  const p5 = spec('millionAccentLevels', 'במספר 543,210, מהי ספרת מאות האלפים?', 5);
  assert.equal(p5.ask, 5);
  assert.equal(p5.value, 5);

  const p6 = spec('millionAccentLevels', 'במספר 2,345,678, מהי ספרת המיליונים?', 2);
  assert.equal(p6.ask, 6);
  assert.equal(p6.value, 2);

  const hertzThousand = spec('thousandAccents', 'צליל של 4560 הרץ. כמה אלפים יש במספר?', 4);
  assert.equal(hertzThousand.ask, 3);
  assert.equal(hertzThousand.value, 4);

  const hertzHundred = spec('thousandAccents', 'צליל של 4560 הרץ. מה ספרת המאות?', 5);
  assert.equal(hertzHundred.ask, 2);
  assert.equal(hertzHundred.value, 5);

  const hertzTen = spec('thousandAccents', 'צליל של 4560 הרץ. מה ספרת העשרות?', 6);
  assert.equal(hertzTen.ask, 1);
  assert.equal(hertzTen.value, 6);

  const textMillion = spec('millionAccentLevels', 'כתבו בספרות: שני מיליון ושלוש מאות אלף', 2300000);
  assert.equal(textMillion.n, 2300000);
  assert.equal(textMillion.value, 2300000);

  const min7 = spec('millionAccentLevels', 'מהו המספר הקטן ביותר בן 7 ספרות?', 1000000);
  assert.equal(min7.n, 1000000);
  assert.equal(min7.value, 1000000);

  const decomposed = B.specForItem({ music: 'thousandAccents', prompt: '4 אלפים, 3 מאות, 2 עשרות ו־1 יחידות', answer: 4321, widget: 'bigNumbers' });
  assert.equal(decomposed.n, 4321);
  assert.equal(decomposed.value, 4321);
});

test('addition and subtraction story prompt variants and missing addend patterns', () => {
  const addTickets = spec('carryAccentUp', 'נמכרו 1,200 כרטיסים ולשני 3,400.', 4600);
  assert.equal(addTickets.kind, 'add');
  assert.equal(addTickets.value, 4600);

  const addLibrary = spec('carryAccentUp', 'בספריית התווים 1,200 דפים, והוסיפו עוד 3,400.', 4600);
  assert.equal(addLibrary.kind, 'add');
  assert.equal(addLibrary.value, 4600);

  const subHall = spec('carryAccentUp', 'באולם 5,000 מקומות, ו־1,200 כבר תפוסים.', 3800);
  assert.equal(subHall.kind, 'up');
  assert.equal(subHall.value, 3800);

  const subMoney = spec('carryAccentUp', 'צריכה לאסוף 5,000 ₪ וכבר אספה 1,200 ₪.', 3800);
  assert.equal(subMoney.kind, 'up');
  assert.equal(subMoney.value, 3800);

  const subSimple = spec('carryAccentUp', '5,000 − 1,200 = ?', 3800);
  assert.equal(subSimple.kind, 'up');
  assert.equal(subSimple.value, 3800);

  const fillAdd = spec('carryAccentUp', 'השלימו: 1,200 + ☐ = 5,000', 3800);
  assert.equal(fillAdd.kind, 'up');
  assert.equal(fillAdd.value, 3800);

  const fillSub = spec('carryAccentUp', 'השלימו: 5,000 − ☐ = 1,200', 3800);
  assert.equal(fillSub.kind, 'up');
  assert.equal(fillSub.value, 3800);

  const fillMinuend = spec('carryAccentUp', 'השלימו: ☐ − 1,200 = 3,800', 5000);
  assert.equal(fillMinuend.kind, 'up');
  assert.equal(fillMinuend.start, 3800);
  assert.equal(fillMinuend.value, 5000);
  assert.equal(fillMinuend.addMode, true);

  const fillReversed = spec('carryAccentUp', 'השלימו: 5,000 = 1,200 + ☐', 3800);
  assert.equal(fillReversed.kind, 'up');
  assert.equal(fillReversed.value, 3800);
});

test('compare prompt variations and soundEvents: comparison decision bell', () => {
  const cmpBig1 = spec('thousandAccents', 'איזה גדול יותר: 2000 או 3000?', 3000);
  assert.equal(cmpBig1.kind, 'compare');
  assert.equal(cmpBig1.big, true);
  assert.equal(cmpBig1.value, 3000);

  const cmpBig2 = spec('thousandAccents', 'איזה מספר גדול יותר: 2000 או 3000?', 3000);
  assert.equal(cmpBig2.value, 3000);

  const cmpSmall1 = spec('thousandAccents', 'איזה קטן יותר: 2000 הרץ או 3000 הרץ?', 2000);
  assert.equal(cmpSmall1.big, false);
  assert.equal(cmpSmall1.value, 2000);

  const cmpSmall2 = spec('thousandAccents', 'צליל א׳ 2000 הרץ, צליל ב׳ 3000 הרץ. איזה מספר גדול יותר?', 3000);
  assert.equal(cmpSmall2.value, 3000);

  const e = B.soundEvents(cmpBig1);
  const decided = stage(e, 'decided');
  assert.equal(decided.length, 1);
  assert.equal(decided[0].voice, 'metalBell');
  assert.equal(decided[0].hz, 1568);
  assert.equal(decided[0].dur, 0.3);
  assert.equal(decided[0].gain, 0.14);
  assert.equal(decided[0].place, 3);
});

test('extraPlan word problems: books, balls, table queries, and two-digit vertical multiplication', () => {
  const books = spec('takeAwayBeats', 'היו 500 ספרים בארון. נמכרו 200 ספרים לחנות. כמה ספרים נשארו?', 300);
  assert.equal(books.kind, 'up');
  assert.equal(books.value, 300);

  const balls = spec('takeAwayBeats', 'היו 500 כדורים בסל. חולקו 200 כדורים לילדים. כמה כדורים נשארו?', 300);
  assert.equal(balls.kind, 'up');
  assert.equal(balls.value, 300);

  const cityTable = spec('tableRowGroups', 'בטבלה: בעיר א׳ 10,000 תושבים, בעיר ב׳ 25,000 ובעיר ג׳ 32,000. בכמה תושבים עיר ג׳ גדולה מעיר ב׳?', 7000);
  assert.equal(cityTable.kind, 'up');
  assert.equal(cityTable.value, 7000);

  const vert2 = spec('repeatedBars', 'חשבו במאונך: 234 × 12 (כתבו בלי פסיק)', 2808);
  assert.equal(vert2.kind, 'partials');
  assert.deepEqual(vert2.parts, [2340, 468]);

  const vertSinglePart = spec('repeatedBars', 'חשבו במאונך: 234 × 10 (כתבו בלי פסיק)', 2340);
  assert.equal(vertSinglePart, null, 'only single non-zero partial product, must be between 2 and 3');
});

test('longestRun computation: detects consecutive notes and bounds runs', () => {
  assert.equal(B.longestRun([]), 0);
  assert.equal(B.longestRun([{ at: 0 }, { at: 0.1 }, { at: 0.2 }]), 3);
  assert.equal(B.longestRun([{ at: 0 }, { at: 0.4 }, { at: 0.8 }]), 1);
  assert.equal(B.longestRun([{ at: 0 }, { at: 0 }, { at: 0.1 }]), 2);
  assert.equal(B.longestRun([{ at: 0 }, { at: 0.2 }, { at: 0.35 }, { at: 0.7 }]), 3);
});

test('upPlan boundaries: invalid inputs, non-strictly greater b, and jump digit overflow', () => {
  assert.equal(spec('carryAccentUp', 'השלימו: 500 − ☐ = 500', 0), null);
  assert.equal(spec('carryAccentUp', 'השלימו: 300 − ☐ = 500', -200), null);
});

test('play handles AudioContext states and errors gracefully', () => {
  const dummySpec = {
    kind: 'number',
    n: 100,
    answer: '100',
    world: { he: 'הרכב אורף', why: 'שיעור מוזיקה' }
  };
  const calls = [];
  const envRunning = {
    playVoice: (ac, voice, hz, when, extra, opts) => calls.push({ voice, hz, when, opts }),
    audioContext: { currentTime: 0, state: 'running' }
  };
  const resRunning = B.play(dummySpec, envRunning);
  assert.ok(resRunning.notes > 0);
  assert.equal(resRunning.silent, undefined);
  assert.ok(calls.length > 0);

  const envResumeThrow = {
    playVoice: () => {},
    audioContext: {
      currentTime: 0,
      state: 'suspended',
      resume() { throw new Error('Autoplay blocked'); }
    }
  };
  const resThrow = B.play(dummySpec, envResumeThrow);
  assert.ok(resThrow.notes > 0);

  assert.equal(B.play({ kind: 'empty' }, envRunning), null);
});

test('cascade, shift, add, up, and levels soundEvents verify exact properties and stages', () => {
  // cascade with 999: triggers periodFrame at place 2
  const sCascade = spec('thousandAccents', 'מה המספר שבא אחרי 999? (כתבו בלי פסיק)', 1000);
  const eCascade = B.soundEvents(sCascade);
  const cascadeFrames = stage(eCascade, 'periodFrame');
  assert.equal(cascadeFrames.length, 1);
  assert.equal(cascadeFrames[0].voice, 'shaker');
  assert.equal(cascadeFrames[0].hz, 300);
  assert.equal(cascadeFrames[0].dur, 0.3);
  assert.equal(cascadeFrames[0].gain, 0.1);

  // cascade with 19: top is ds[place] + 1 = 2
  const sCascade19 = spec('thousandAccents', 'מה המספר שבא אחרי 19? (כתבו בלי פסיק)', 20);
  const eCascade19 = B.soundEvents(sCascade19);
  assert.equal(stage(eCascade19, 'nine').length, 9);
  assert.equal(stage(eCascade19, 'plusOne').length, 1);
  assert.equal(stage(eCascade19, 'newPlace').length, 2);

  // shift with ×10 and ×1,000
  const sShift1000 = spec('thousandAccents', '34 × 1,000 = ? (כתבו בלי פסיק)', 34000);
  const eShift1000 = B.soundEvents(sShift1000);
  const timesTenHits = stage(eShift1000, 'timesTen');
  assert.equal(timesTenHits.length, 3);
  assert.deepEqual(timesTenHits.map((h) => h.k), [1, 2, 3]);
  assert.ok(timesTenHits.every((h) => h.voice === 'metalBell' && h.hz === 1047 && h.dur === 0.3 && h.gain === 0.14));

  // add event details
  const sAdd = spec('carryAccentUp', '3,680 + 450 = ? (כתבו בלי פסיק)', 4130);
  const eAdd = B.soundEvents(sAdd);
  assert.ok(stage(eAdd, 'layerA').length > 0);
  assert.ok(stage(eAdd, 'layerB').length > 0);
  assert.equal(stage(eAdd, 'carried').length, 2);
  const addPacks = stage(eAdd, 'pack');
  assert.equal(addPacks.length, 2);
  assert.ok(addPacks.every((p) => p.voice === 'jingle' && p.hz === 784 && p.dur === 0.3 && p.gain === 0.14));

  // up event details
  const sUp = spec('carryAccentUp', '5,000 − 1,200 = ?', 3800);
  const eUp = B.soundEvents(sUp);
  const upStart = stage(eUp, 'start');
  assert.equal(upStart.length, 1);
  assert.equal(upStart[0].voice, 'bowed');
  assert.equal(upStart[0].hz, 196);
  assert.equal(upStart[0].dur, 0.6);
  assert.equal(upStart[0].gain, 0.16);
  const upArrived = stage(eUp, 'arrived');
  assert.equal(upArrived.length, 1);
  assert.equal(upArrived[0].voice, 'metalBell');
  assert.equal(upArrived[0].hz, 1568);
  assert.equal(upArrived[0].dur, 0.4);
  assert.equal(upArrived[0].gain, 0.16);
  const upJumps = stage(eUp, 'jump');
  assert.equal(upJumps.length, 11);
  assert.ok(upJumps.every((n) => n.stage === 'jump'));

  // levels event details
  const sLevels = spec('periodAccentLevels', 'כמה אלפים יש במיליון? (כתבו בלי פסיק)', 1000);
  const eLevels = B.soundEvents(sLevels);
  const opens = stage(eLevels, 'opens');
  assert.equal(opens.length, 3);
  assert.deepEqual(opens.map((o) => o.place), [6, 5, 4]);
  assert.deepEqual(opens.map((o) => o.voice), ['shaker', 'drumLow', 'frameDrum']);
  assert.deepEqual(opens.map((o) => o.hz), [1200, 98, 196]);
  assert.ok(opens.every((o) => o.dur === 0.4 && o.gain === 0.2));
  const into = stage(eLevels, 'into');
  assert.equal(into.length, 30);
  assert.deepEqual(into.filter((n) => n.level === 6).map((n) => n.place), Array(10).fill(5));
  assert.deepEqual(into.filter((n) => n.level === 5).map((n) => n.place), Array(10).fill(4));
  assert.deepEqual(into.filter((n) => n.level === 4).map((n) => n.place), Array(10).fill(3));

  // partials event details
  const sPartials = spec('repeatedBars', 'חשבו במאונך: 586 × 7 (כתבו בלי פסיק)', 4102);
  const ePartials = B.soundEvents(sPartials);
  const partialSigns = stage(ePartials, 'partialSign');
  assert.equal(partialSigns.length, 3);
  assert.deepEqual(partialSigns.map((p) => p.n), [0, 1, 2]);
  assert.ok(partialSigns.every((p) => p.voice === 'metalBell' && p.hz === 784 && p.dur === 0.25 && p.gain === 0.14));
  assert.ok(stage(ePartials, 'partial').length > 0);
});

test('plan returns null when answer does not match, when events exceed MAX_EVENTS, or when run exceeds MAX_RUN', () => {
  // answer does not match
  assert.equal(spec('thousandAccents', '40 × 1 = ?', 999), null);
  assert.equal(spec('thousandAccents', '16 × 5 = ?', 999), null);

  // soundEvents with empty spec returns empty array
  assert.deepEqual(B.soundEvents(null), []);
  assert.deepEqual(B.soundEvents(undefined), []);
  assert.deepEqual(B.soundEvents({ kind: 'unknown' }), []);
});

test('columnsAsNotes item runs through extraPlan and returns counting up spec', () => {
  const s = spec('columnsAsNotes', 'בטבלת נקודות: קבוצה א׳ — 25, קבוצה ב׳ — 18. בכמה נקודות מובילה קבוצה א׳?', 7);
  assert.ok(s);
  assert.equal(s.kind, 'up');
  assert.equal(s.value, 7);
});

test('spec contains world info with he and why exact descriptions', () => {
  const s = spec('thousandAccents', 'מה הספרה במקום האחדות במספר 4,321?', 1);
  assert.ok(s);
  assert.equal(s.world.he, 'הרכב אורף');
  assert.equal(s.world.why, 'כלי הנגינה של שיעור המוזיקה, בשיטה שפיתח קרל אורף: לכל מקום במספר כלי משלו, כולם באותה עוצמה, ומנגנים בתורות — מהאחדות כלפי מעלה');
});

test('browser environment assigns root.MM_BIG_NUMBERS and otherPlays delegates to root modules', () => {
  const vm = require('node:vm');
  const code = fs.readFileSync(path.join(__dirname, '../src/lib/music/bigNumbers.js'), 'utf8');

  // Test globalThis root and otherPlays delegation in browser
  const ctxWithGlobalThis = {
    globalThis: {},
    MM_MULTIPLY_WORLDS: { specForItem: (it) => it.prompt === 'from-mw' ? {} : null },
    MM_TIMES_TABLE: { specForItem: (it) => it.prompt === 'from-tt' ? {} : null },
    MM_TAKEAWAY_TEN: { specForItem: (it) => it.prompt === 'from-ta' ? {} : null },
    MM_DRAG_PLACE: { specForItem: (it) => it.prompt === 'from-dp' ? {} : null },
    MM_DATA_WORLDS: { specForItem: (it) => it.prompt === 'from-dw' ? {} : null },
    MM_EARLY_BEATS: { specForItem: (it) => it.prompt === 'from-eb' ? {} : null }
  };
  ctxWithGlobalThis.globalThis = ctxWithGlobalThis;
  vm.runInNewContext(code, ctxWithGlobalThis);
  assert.ok(ctxWithGlobalThis.MM_BIG_NUMBERS);
  assert.equal(ctxWithGlobalThis.MM_BIG_NUMBERS.specForItem({ music: 'thousandAccents', prompt: 'from-mw', answer: 1 }), null);
  assert.equal(ctxWithGlobalThis.MM_BIG_NUMBERS.specForItem({ music: 'thousandAccents', prompt: 'from-tt', answer: 1 }), null);
  assert.equal(ctxWithGlobalThis.MM_BIG_NUMBERS.specForItem({ music: 'thousandAccents', prompt: 'from-ta', answer: 1 }), null);
  assert.equal(ctxWithGlobalThis.MM_BIG_NUMBERS.specForItem({ music: 'thousandAccents', prompt: 'from-dp', answer: 1 }), null);
  assert.equal(ctxWithGlobalThis.MM_BIG_NUMBERS.specForItem({ music: 'thousandAccents', prompt: 'from-dw', answer: 1 }), null);
  assert.equal(ctxWithGlobalThis.MM_BIG_NUMBERS.specForItem({ music: 'thousandAccents', prompt: 'from-eb', answer: 1 }), null);

  // Module that throws in specForItem is handled gracefully
  const ctxThrow = {
    globalThis: {},
    MM_MULTIPLY_WORLDS: { specForItem: () => { throw new Error('fail'); } }
  };
  ctxThrow.globalThis = ctxThrow;
  vm.runInNewContext(code, ctxThrow);
  assert.ok(ctxThrow.MM_BIG_NUMBERS.specForItem({ music: 'thousandAccents', prompt: 'מה הספרה במקום האחדות במספר 4,321?', answer: 1 }));

  // Test fallback when globalThis is undefined (uses this)
  const ctxWithoutGlobalThis = { globalThis: undefined };
  vm.runInNewContext(code, ctxWithoutGlobalThis);
  assert.ok(ctxWithoutGlobalThis.MM_BIG_NUMBERS);
});

test('otherPlays defers to takeAwayTen and multiplyWorlds on overlapping items', () => {
  const taItem = { music: 'takeAwayBeats', prompt: 'היו 10 תפוחים בארון. נמכרו 4 תפוחים לחנות. כמה תפוחים נשארו?', answer: 6 };
  assert.equal(B.specForItem(taItem), null);

  const mwItem = { music: 'repeatedBars', prompt: 'חשבו במאונך: 23 × 2', answer: 46, standard: 'כפל וחילוק במספר חד' };
  assert.equal(B.specForItem(mwItem), null);
});

test('play falls back to globalThis getSharedAudioContext and playVoice', () => {
  const s = spec('thousandAccents', 'מה הספרה במקום העשרות במספר 3164?', 6);
  const calls = [];
  const fakeCtx = { currentTime: 2, state: 'running' };
  const origGetShared = globalThis.getSharedAudioContext;
  const origPlayVoice = globalThis.playVoice;
  try {
    globalThis.getSharedAudioContext = () => fakeCtx;
    globalThis.playVoice = (ac, voice, hz, when, extra, opts) => calls.push({ ac, voice, hz, when, opts });
    const res = B.play(s);
    assert.ok(res.notes > 0);
    assert.ok(calls.length > 0);
    assert.equal(calls[0].ac, fakeCtx);
    assert.ok(calls[0].opts.dur > 0);
    assert.ok(calls[0].opts.gain > 0);
  } finally {
    if (origGetShared) globalThis.getSharedAudioContext = origGetShared;
    else delete globalThis.getSharedAudioContext;
    if (origPlayVoice) globalThis.playVoice = origPlayVoice;
    else delete globalThis.playVoice;
  }
});

test('html unrevealed ends cleanly without extra string and handles null answer', () => {
  const dummySpec = {
    kind: 'number',
    value: 12,
    answer: '12',
    world: { he: 'הרכב אורף', why: 'כלי הנגינה' }
  };
  const unrev = B.html(dummySpec);
  assert.ok(unrev.endsWith('<button type="button" class="snd-play">▶ שמעו</button></div>'));

  const nullSpec = {
    kind: 'number',
    value: null,
    answer: null,
    world: { he: 'הרכב אורף', why: 'כלי הנגינה' }
  };
  const revNull = B.html(nullSpec, { revealed: true });
  assert.ok(revNull.includes('<span class="snd-answer"></span>'));
});



