'use strict';
// DataWorlds: tables, tallies, the mode, the mean, displays, even/odd and
// primes, heard. A timbre is a category, the number of strokes is how many;
// the mode is a value; the mean is built, not observed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const D = require('../src/lib/music/dataWorlds');
const TT = require('../src/lib/music/takeAwayTen');
const banks = require('../src/lib/banks');

const item = (music, prompt, answer) => ({ music: music, prompt: prompt, answer: answer });
const spec = (...a) => D.specForItem(item(...a));
const ev = (...a) => D.soundEvents(spec(...a));
const stage = (list, st) => list.filter((n) => n.stage === st);
const COLORS = 'בטבלת השכיחויות של צבעי החולצות: אדום — 100, ירוק — 50, כחול — 25, לבן — 25. ';

test('a table: a timbre per category, one after the other, with a silence between; equal loudness', () => {
  const e = ev('tableRowGroups', 'בטבלת החוגים רשומים: כדורגל — 12 תלמידים, מוזיקה — 8 תלמידים, ציור — 5 תלמידים. כמה תלמידים בחוג המוזיקה?', 8);
  assert.deepEqual([0, 1, 2].map((k) => stage(e, 'cat').filter((n) => n.cat === k).length), [12, 8, 5]);
  assert.equal(new Set(e.map((n) => n.gain)).size, 1, 'a loud drum must not sound like "many"');
  assert.equal(new Set(e.map((n) => n.voice)).size, 3);
});

test('big counts use a scale said in words: one stroke is twenty-five', () => {
  const s = spec('tallyFives', COLORS + 'מה השכיחות של ירוק?', 50);
  assert.equal(s.unit, 25);
  assert.deepEqual([0, 1, 2, 3].map((k) => stage(D.soundEvents(s), 'cat').filter((n) => n.cat === k).length), [4, 2, 1, 1]);
  assert.match(D.html(s), /כל הקשה שווה עשרים וחמישה/);
});

test('the mode of categories is the category (not its count); a part of the whole is a fraction', () => {
  assert.equal(spec('tallyFives', COLORS + 'איזה צבע הוא השכיח?', 'אדום').value, 'אדום');
  assert.equal(spec('tallyFives', COLORS + 'איזה חלק מהתלמידים לבשו חולצה אדומה? כתבו שבר.', '1/2').value, '1/2');
});

test('the mode of values: pitch is the value, in order, so the longest run of one pitch is the mode', () => {
  const e = ev('tallyFives', 'הציונים בבוחן: 7, 8, 8, 9, 8, 10, 7. מהו השכיח?', 8);
  const v = stage(e, 'value');
  assert.deepEqual(v.map((n) => n.v), [7, 7, 8, 8, 8, 9, 10]);
  const hz = v.map((n) => n.hz);
  assert.ok(hz.every((x, i) => i === 0 || x >= hz[i - 1]), 'from low to high');
  assert.equal(spec('tallyFives', 'מספר האחים של תלמידי קבוצה: 1, 2, 2, 3, 1, 2, 4, 2, 0. מה השכיחות של המספר 2?', 4).value, 4);
});

test('a list becomes a table: the list as it came, then sorted by timbre — the same number of strokes', () => {
  const e = ev('listToGroups', 'רשמנו את הכלי שכל ילד בחר: תוף, חליל, תוף, משולש, תוף, חליל, תוף. בטבלה מסודרת — כמה בחרו תוף?', 4);
  assert.equal(stage(e, 'raw').length, stage(e, 'sorted').length);
  assert.equal(stage(e, 'sorted').filter((n) => n.cat === 0).length, 4);
});

test('a tally: five equal strokes, a short silence, the rest — the silence is the border, no accent', () => {
  const t = stage(ev('listToGroups', 'ספירת שירים בסימני ספירה: פופ — ||||| ||, רוק — |||. כמה שירי פופ נספרו?', 7), 'tally').filter((n) => n.cat === 0);
  assert.equal(t.length, 7);
  assert.equal(new Set(t.map((n) => n.gain)).size, 1);
  assert.ok(t[5].at - t[4].at > t[1].at - t[0].at + 0.3);
});

test('the mean is built: floor strokes, what each has above the floor, then a fair share in rounds', () => {
  const s = spec('levelNotes', 'שקלו 4 קלמנטינות: 60, 70, 80 ו־90 גרם. מה המשקל הממוצע בגרם?', 75);
  assert.equal(s.floor, 60);
  assert.equal(s.unit, 5);
  const e = D.soundEvents(s);
  assert.deepEqual([0, 1, 2, 3].map((d) => stage(e, 'above').filter((n) => n.d === d).length), [0, 2, 4, 6]);
  assert.equal(stage(e, 'share').length, 12, 'three rounds, one to each of four');
  assert.ok(!s.units.includes(s.share), 'nobody had the mean at the start');
  assert.equal(spec('levelNotes', 'הקשתם 4 פעמים: 78, 82, 80 ו־84 BPM. מה הקצב הממוצע?', 81).share, 3);
});

test('mean × count is the sum: five equal groups', () => {
  const e = ev('levelNotes', 'הממוצע של 5 מספרים הוא 20. מה סכום המספרים?', 100);
  assert.equal(new Set(stage(e, 'level').map((n) => n.d)).size, 5);
});

test('displays: a pie is the hora circle; a pictogram symbol first opens into its units', () => {
  const pie = ev('showAsBar', 'מציגים 30 בעד ו־10 נגד בדיאגרמת עוגה של 4 חלקים שווים. כמה חלקים יהיו «בעד»?', 3);
  assert.equal(stage(pie, 'yes').length, 3);
  assert.equal(stage(pie, 'no').length, 1);
  const pic = ev('showAsBar', 'בפיקטוגרם כל סמל הוא 5 תלמידים. כמה סמלים יציגו 35 תלמידים?', 7);
  assert.equal(stage(pic, 'unit').length, 5);
  assert.equal(stage(pic, 'symbol').length, 7);
  assert.equal(stage(ev('showAsBar', 'בסקר 25% בחרו בכחול. כמה מעלות תהיה הגזרה של כחול בדיאגרמת עוגה?', 90), 'tick').length, 3);
});

test('even and odd: steps in pairs, a step with no partner alone after a silence', () => {
  const odd = ev('alternateDrums', '9 זוגי או אי־זוגי?', 'אי-זוגי');
  assert.equal(stage(odd, 'pair').length, 8);
  assert.equal(stage(odd, 'alone').length, 1);
  assert.equal(stage(ev('alternateDrums', '6 זוגי או אי־זוגי?', 'זוגי'), 'alone').length, 0);
});

test('a prime cannot be split into equal bars — 51 can: three bars of seventeen', () => {
  const e = ev('stickingParity', 'האם 51 הוא מספר ראשוני? (כן/לא)', 'לא');
  assert.deepEqual([0, 1, 2].map((b) => e.filter((n) => n.bar === b).reduce((s, n) => s + (n.stage === 'barTen' ? 10 : 1), 0)), [17, 17, 17]);
  assert.equal(stage(ev('stickingParity', 'האם 2,345 מתחלק ב־5? (כן/לא)', 'כן'), 'one').length, 5);
});

test('a mean that does not share out evenly: whole rounds, then each unit left breaks into one piece per dancer', () => {
  const e = ev('levelNotes', 'הקשתם 4 פעמים: 80, 81, 82 ו־84 BPM. מה הקצב הממוצע?', 81.75);
  assert.equal(stage(e, 'share').length, 4, 'one whole round');
  assert.equal(stage(e, 'piece').length, 12, 'three units left, each in four pieces: three quarters for every dancer');
  assert.equal(spec('levelNotes', 'הממוצע של 4, 6 ו־8 הוא 6. מוסיפים לקבוצה את 0. מה הממוצע החדש?', 4.5).values.length, 4);
  assert.equal(spec('levelNotes', 'בארבע כיתות יש 30, 31, 29 ו־28 תלמידים. מה מספר התלמידים הממוצע לכיתה?', 29.5).floor, 28);
  const b = ev('levelNotes', 'בקבוצת מספרים הקטן הוא 3 והממוצע הוא 7. האם הגדול יכול להיות 6? (כן/לא)', 'לא');
  assert.equal(stage(b, 'above').length, 3, 'the best case: at most three above the smallest');
  assert.equal(stage(b, 'target').length, 4, 'the mean asked for is four above it — out of reach');
});

test('parts of one whole: the parts walk around the hora circle and close it', () => {
  const e = ev('showAsBar', 'רוצים להראות איזה חלק מהכיתה בחר כל ענף ספורט. מה מתאים יותר: עוגה או עמודות?', 'עוגה');
  assert.equal(new Set(stage(e, 'part').map((n) => n.part)).size, 4);
  assert.equal(stage(e, 'closed').length, 1);
});
test('only when the sounds give exactly the answer; TakeAwayTen keeps its place-value items', () => {
  assert.equal(spec('alternateDrums', '9 זוגי או אי־זוגי?', 'זוגי'), null, 'a wrong key is never set to sound');
  assert.equal(spec('levelNotes', 'הקשתם 4 פעמים: 80, 81, 82 ו־84 BPM. מה הקצב הממוצע?', 81.5), null);
  assert.equal(spec('nextBeat', '9 זוגי או אי־זוגי?', 'אי-זוגי'), null);
  assert.equal(D.specForItem(null), null);
  banks.allItems().forEach((it) => assert.ok(!(TT.specForItem(it) && D.specForItem(it)), 'both play: ' + it.prompt));
});

test('the bank: data items of grades 2–6 are heard; no answer — number or word — in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => D.specForItem(it));
  assert.ok(list.length >= 27, 'played ' + list.length);
  assert.deepEqual([...new Set(list.map((it) => it.grade))].sort(), ['ב', 'ג', 'ד', 'ה', 'ו']);
  const word = (h, w) => h.split(/[\s.,:;—>(<)?]+/).includes(w);
  list.forEach((it) => {
    const s = D.specForItem(it), h = D.html(s), a = String(it.answer);
    assert.ok(/^\d+$/.test(a) ? !(h.match(/\d+/g) || []).includes(a) : !word(h, a), 'leak: ' + it.prompt);
    assert.ok(D.longestRun(D.soundEvents(s)) <= D.MAX_RUN, 'run: ' + it.prompt);
    assert.match(D.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('alternateDrums', '9 זוגי או אי־זוגי?', 'אי-זוגי');
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 1, state: 'suspended', resume() { this.state = 'running'; } } };
  const n = D.soundEvents(s).length;
  assert.deepEqual(D.play(s, env), { notes: n });
  assert.ok(calls.every((c) => c.when >= 1.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(D.play(s, {}), { notes: n, silent: true });
  assert.equal(D.play(null, env), null);
  assert.equal(D.html(null), '');
});

test('index.html renders the widget after TakeAwayTen and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_DATA_WORLDS\.play\(dw\)/);
  assert.match(html, /host\._dataSpec && typeof MM_DATA_WORLDS!=='undefined'/);
  assert.ok(html.indexOf("MM_TAKEAWAY_TEN.specForItem(item)") < html.indexOf("MM_DATA_WORLDS.specForItem(item)"));
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/dataWorlds\.js'/);
});

test('odd + odd: each leaves one step alone, and the two alone steps meet as a pair', () => {
  const e = ev('alternateDrums', '7 + 9 — זוגי או אי־זוגי?', 'זוגי');
  assert.equal(stage(e, 'pair').length, 2 * (3 + 4));
  assert.equal(stage(e, 'alone').length, 2);
  assert.equal(stage(e, 'meet').length, 2, 'the two alone steps dance together');
  assert.equal(spec('alternateDrums', '7 + 9 — זוגי או אי־זוגי?', 'אי-זוגי'), null);
  const odd = ev('alternateDrums', '6 + 3 — זוגי או אי־זוגי?', 'אי-זוגי');
  assert.equal(stage(odd, 'meet').length, 0);
  assert.ok(stage(odd, 'alone').some((n) => n.last), 'one step stays alone at the end');
});

test('two modes: two pitches hold the longest run — a set may have more than one mode', () => {
  const e = ev('tallyFives', 'הציונים בבוחן: 7, 8, 8, 9, 9, 10. כמה שכיחים יש?', 2);
  assert.deepEqual(stage(e, 'value').map((n) => n.v), [7, 8, 8, 9, 9, 10]);
  assert.equal(spec('tallyFives', 'הציונים בבוחן: 7, 8, 8, 9, 9, 10. כמה שכיחים יש?', 1), null, 'never the one-mode answer');
  assert.equal(spec('tallyFives', 'הציונים בבוחן: 7, 8, 8, 9, 10. כמה שכיחים יש?', 1).value, 1);
});

test('printableWidget: formats tables, tallies, lists, values, pies, and fallback hints', () => {
  assert.equal(D.printableWidget(null), '');
  assert.equal(D.printableWidget(undefined), '');
  assert.equal(D.printableWidget({}), '');
  assert.equal(D.printableWidget({ prompt: '1+1', answer: 2 }), '');

  const tableSpec1 = {
    kind: 'table',
    pairs: [{ label: 'א', n: 3 }, { label: 'ב', n: 4 }],
    unit: 1,
    world: D.WORLDS.andalus
  };
  assert.equal(
    D.printableWidget(tableSpec1),
    '<div class="sheet-widget sheet-data-table" dir="rtl"><table class="sheet-table"><thead><tr><th>קטגוריה</th><th>כמות</th></tr></thead><tbody><tr><td>א</td><td>3</td></tr><tr><td>ב</td><td>4</td></tr></tbody></table></div>'
  );

  const tableSpec25 = {
    kind: 'table',
    pairs: [{ label: 'א', n: 25 }, { label: 'ב', n: 50 }],
    unit: 25,
    world: D.WORLDS.andalus
  };
  assert.equal(
    D.printableWidget(tableSpec25),
    '<div class="sheet-widget sheet-data-table" dir="rtl"><table class="sheet-table"><thead><tr><th>קטגוריה</th><th>כמות</th></tr></thead><tbody><tr><td>א</td><td>25</td></tr><tr><td>ב</td><td>50</td></tr></tbody></table><div class="sheet-scale">כל הקשה = עשרים וחמישה</div></div>'
  );

  const tableSpecCustom = {
    kind: 'table',
    pairs: [{ label: 'א', n: 6 }],
    unit: 6,
    world: D.WORLDS.andalus
  };
  assert.match(D.printableWidget(tableSpecCustom), /<div class="sheet-scale">כל הקשה = 6<\/div>/);

  const tallySpec = {
    kind: 'tally',
    cats: [['חתול', 7], ['כלב', 3]],
    world: D.WORLDS.andalus
  };
  assert.equal(
    D.printableWidget(tallySpec),
    '<div class="sheet-widget sheet-data-tally" dir="rtl"><div class="sheet-widget-row">חתול: 卌 || (7)</div><div class="sheet-widget-row">כלב: ||| (3)</div></div>'
  );

  const listSpec = {
    kind: 'list',
    list: ['תוף', 'חליל'],
    world: D.WORLDS.andalus
  };
  assert.equal(
    D.printableWidget(listSpec),
    '<div class="sheet-widget sheet-data-list" dir="rtl">רשימה: תוף, חליל</div>'
  );

  const valSpec = {
    kind: 'values',
    values: [1, 2, 2, 3],
    world: D.WORLDS.andalus
  };
  assert.equal(
    D.printableWidget(valSpec),
    '<div class="sheet-widget sheet-data-values" dir="rtl">ערכים: 1, 2, 2, 3</div>'
  );

  const modesSpec = {
    kind: 'modesCount',
    values: [1, 2, 2, 3],
    world: D.WORLDS.andalus
  };
  assert.equal(
    D.printableWidget(modesSpec),
    '<div class="sheet-widget sheet-data-values" dir="rtl">ערכים: 1, 2, 2, 3</div>'
  );

  const pieSpec = {
    kind: 'pie',
    parts: 4,
    yes: 3,
    world: D.WORLDS.hora
  };
  assert.equal(
    D.printableWidget(pieSpec),
    '<div class="sheet-widget sheet-data-pie" dir="rtl">מעגל (4 חלקים): 3 בעד</div>'
  );

  assert.equal(
    D.printableWidget({ kind: 'parity', world: D.WORLDS.dabke }),
    '<div class="sheet-widget sheet-data-hint" dir="rtl">[צעדי דבקה]</div>'
  );
  assert.equal(
    D.printableWidget({ kind: 'fives', world: {} }),
    ''
  );

  const escSpec = {
    kind: 'table',
    pairs: [{ label: 'A & B < C > " D \' E', n: 1 }],
    unit: 1,
    world: D.WORLDS.andalus
  };
  assert.match(D.printableWidget(escSpec), /<td>A &amp; B &lt; C &gt; &quot; D &#39; E<\/td>/);

  const it = item('tallyFives', 'ספירת שירים בסימני ספירה: פופ — ||||| ||, רוק — |||. כמה שירי פופ נספרו?', 7);
  assert.match(D.printableWidget(it), /sheet-data-tally/);
});

test('isDataWorldItem: detects valid items and rejects invalid or non-data items', () => {
  assert.equal(D.isDataWorldItem(item('tallyFives', '9 זוגי או אי־זוגי?', 'אי-זוגי')), true);
  assert.equal(D.isDataWorldItem(item('alternateDrums', '6 זוגי או אי־זוגי?', 'זוגי')), true);
  assert.equal(D.isDataWorldItem(null), false);
  assert.equal(D.isDataWorldItem({}), false);
  assert.equal(D.isDataWorldItem(item('tallyFives', '9 זוגי או אי־זוגי?', 'זוגי')), false);
  assert.equal(D.isDataWorldItem({ music: 'tallyFives', noMusic: true, prompt: '9 זוגי או אי־זוגי?', answer: 'אי-זוגי' }), false);
  assert.equal(D.isDataWorldItem(item('unknownTag', '9 זוגי או אי־זוגי?', 'אי-זוגי')), false);
  assert.equal(D.isDataWorldItem(item('tallyFives', 'מה השעה?', 5)), false);
});

test('constants: WORLDS, TAGS, and MAX_RUN integrity', () => {
  assert.equal(D.MAX_RUN, 12);
  assert.ok(Object.isFrozen(D.TAGS));
  assert.deepEqual(D.TAGS, ['tableRowGroups', 'cellGroups', 'rowCellGroups', 'listToGroups', 'tallyFives', 'levelNotes', 'showAsBar', 'alternateDrums', 'stickingParity', 'tenExchange']);
  assert.ok(Object.isFrozen(D.WORLDS));
  assert.equal(D.WORLDS.andalus.he, 'בהשראת ההרכב האנדלוסי');
  assert.equal(D.WORLDS.andalus.why, 'הנגנים יושבים לפי משפחות כלים: כל גוון הוא קטגוריה, ומספר ההקשות הוא כמה יש בה. כל הכלים באותה עוצמה');
  assert.equal(D.WORLDS.hora.he, 'מעגל הורה');
  assert.equal(D.WORLDS.hora.why, 'ריקוד עם ישראלי במעגל. היישור כאן הוא דימוי — החשבון הוא סכום חלקי מספר');
  assert.equal(D.WORLDS.dabke.he, 'צעדי דבקה');
  assert.equal(D.WORLDS.dabke.why, 'ריקוד שורה לבנוני, פלסטיני וסורי: כל צעד הוא יחידה, וכל קיבוץ של צעדים הוא חלוקה');
});

test('html: markup structure, instructions for all 18 kinds, Hebrew scales, and escaping', () => {
  assert.equal(D.html(null), '');
  const baseSpec = { kind: 'parity', world: D.WORLDS.dabke, answer: 'זוגי' };
  const unrevealed = D.html(baseSpec);
  assert.ok(unrevealed.includes('<div class="data-worlds">'));
  assert.ok(unrevealed.includes('<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו וספרו.</p>'));
  assert.ok(unrevealed.includes('<button type="button" class="snd-play">▶ שמעו</button>'));
  assert.ok(!unrevealed.includes('snd-answer'));

  const revealed = D.html(baseSpec, { revealed: true });
  assert.ok(revealed.includes('<p class="band-predict dw-silent">עכשיו בלי צליל: אמרו במילים מה נספר ומה הערך, ובנו טבלה או ציור קטן.</p>'));
  assert.ok(revealed.includes('<span class="snd-answer">זוגי</span>'));

  const escH = D.html({ kind: 'table', world: { he: 'A&B', why: 'C<D>' }, answer: 'E"F\'' }, { revealed: true });
  assert.ok(escH.includes('A&amp;B: C&lt;D&gt;.'));
  assert.ok(escH.includes('<span class="snd-answer">E&quot;F&#39;</span>'));

  const kinds = [
    ['table', 'כל קטגוריה בתורה, לפי הסדר בשאלה, ושקט ביניהן. אחרי כל קטגוריה — עצרו ואמרו כמה.'],
    ['list', 'קודם הרשימה כמו שנאספה, אחד אחד. אחר כך אותה רשימה מסודרת: כל גוון בתורו. האם יצא אותו מספר בסך הכול?'],
    ['tally', 'סימני ספירה: חמש הקשות שוות, שקט קצר — זו חבילה — ואז השאר. השקט הוא הגבול.'],
    ['modesCount', 'כאן גובה הצליל הוא הערך, מהנמוך לגבוה, ושקט קצר כשהערך משתנה. איזה גובה חוזר הכי הרבה פעמים ברצף? אולי יש יותר מאחד כזה.'],
    ['values', 'כאן גובה הצליל הוא הערך, מהנמוך לגבוה, ושקט קצר כשהערך משתנה. השכיח הוא ערך — לא מספר ההקשות.'],
    ['mean', 'כל רוקד: מכה עמוקה (כולם עומדים על הקטן ביותר) ואחריה מה שיש לו מעל. אחר כך מחלקים את העודף בסבבים — אחד לכל רוקד בכל סבב. לאף אחד לא היה הערך הזה בהתחלה — בנינו אותו.'],
    ['meanNotValue', 'כל רוקד: מכה עמוקה ואחריה מה שיש לו מעל הקטן ביותר. אחר כך מחלקים את העודף בסבבים. האם למישהו היה בהתחלה בדיוק מה שיצא לכל אחד?'],
    ['meanSum', 'כל אחד בדיוק בגובה הממוצע: אותה קבוצה לכל אחד. כמה קבוצות, וכמה בכל קבוצה?'],
    ['meanBound', 'המקרה הטוב ביותר: הקטן ביותר, ולידו מספר בגובה הגדול ביותר. אחר כך — הגובה שהממוצע צריך להגיע אליו מעל הקטן ביותר. האם חלוקה הוגנת יכולה להגיע עד שם?'],
    ['wholeParts', 'השאלה היא איזה חלק מהשלם. החלקים נשמעים בהליכה סביב המעגל, כל חלק בגוון משלו, וכולם יחד סוגרים אותו בחזרה לנקודת ההתחלה — השלם כולו. איזו דיאגרמה מראה חלקים של שלם אחד?'],
    ['pie', 'העוגה היא מעגל ההורה: כל רוקד הוא חלק שווה. גוון אחד לבעד, גוון אחר לנגד.'],
    ['symbols', 'קודם סמל אחד נפתח ליחידות שלו. אחר כך כל סמל שווה את כולן. כמה סמלים?'],
    ['sector', 'סיבוב שלם בנקישות שוות, כל נקישה שלושים מעלות. אחר כך רק הגזרה.'],
    ['families', 'קבוצה לכל משפחה, גוון לכל סוג משפחה. כמה משפחות, כמה ילדים בכל אחת?'],
    ['sumParity', 'כל מספר בצעדים בזוגות. צעד בלי זוג נשמע לבד אחרי שקט. בסוף: אם שני צעדים נשארו לבד, הם נפגשים ורוקדים יחד כזוג.'],
    ['parity', 'צעדים בזוגות. כל עשר הוא חמישה זוגות שלמים — מכה עמוקה אחת. נשאר צעד בלי זוג? הוא יישמע לבד אחרי שקט.'],
    ['prime', 'מנסים לחלק לתיבות שוות — לפחות שתי תיבות, ובכל תיבה לפחות שני צעדים. כאן — האם התחלק?'],
    ['fives', 'כל עשר, מאה ואלף מתחלקים לחמישיות בלי שארית — מכה עמוקה אחת. מקבצים רק את האחדות. נשאר משהו?']
  ];
  kinds.forEach(([k, txt]) => {
    const h = D.html({ kind: k, world: D.WORLDS.andalus });
    assert.ok(h.includes(txt), 'missing text for ' + k);
  });

  const units = [
    [1, ''],
    [2, ' כל הקשה שווה שניים.'],
    [5, ' כל הקשה שווה חמישה.'],
    [10, ' כל הקשה שווה עשרה.'],
    [15, ' כל הקשה שווה חמישה־עשר.'],
    [20, ' כל הקשה שווה עשרים.'],
    [25, ' כל הקשה שווה עשרים וחמישה.'],
    [50, ' כל הקשה שווה חמישים.']
  ];
  units.forEach(([u, expected]) => {
    const h = D.html({ kind: 'table', unit: u, world: D.WORLDS.andalus });
    if (expected) assert.ok(h.includes(expected), 'missing scale for ' + u);
    else assert.ok(!h.includes('כל הקשה שווה'), 'unit 1 should not have scale');
  });
});

test('families: frequency tables of family groups play voice per family category and hits per kids', () => {
  const p = 'בטבלת שכיחויות: 2 משפחות עם 3 ילדים ו־3 משפחות עם 2 ילדים. כמה ילדים יש בכל המשפחות האלה?';
  const s = spec('cellGroups', p, 12);
  assert.equal(s.kind, 'families');
  assert.equal(s.world, D.WORLDS.andalus);
  assert.deepEqual(s.groups, [[2, 3], [3, 2]]);
  const e = D.soundEvents(s);
  const kids = stage(e, 'kid');
  assert.equal(kids.length, 12);
  assert.equal(kids.filter((n) => n.cat === 0).length, 6);
  assert.equal(kids.filter((n) => n.cat === 1).length, 6);
  assert.ok(kids.every((n) => n.gain === 0.22 && n.dur === 0.12));
  assert.equal(kids.filter((n) => n.cat === 0 && n.fam === 0).length, 3);
  assert.equal(kids.filter((n) => n.cat === 1 && n.fam === 2).length, 2);
  assert.equal(spec('cellGroups', p, 10), null);
});

test('meanNotValue: האם הממוצע חייב להיות אחד מהמספרים בקבוצה? is answered with לא and hora circle sounds', () => {
  const p = 'האם הממוצע חייב להיות אחד מהמספרים בקבוצה? (כן/לא)';
  const s = spec('levelNotes', p, 'לא');
  assert.equal(s.kind, 'meanNotValue');
  assert.equal(s.value, 'לא');
  assert.equal(s.world, D.WORLDS.hora);
  assert.deepEqual(s.values, [60, 70, 80, 90]);
  assert.equal(s.floor, 60);
  const e = D.soundEvents(s);
  assert.equal(stage(e, 'floor').length, 4);
  assert.ok(stage(e, 'above').length > 0);
  assert.ok(stage(e, 'share').length > 0);
  assert.equal(spec('levelNotes', p, 'כן'), null);
});

test('symbols: bar chart queries and pictograms open symbol units and step symbols', () => {
  const barPrompt = 'בדיאגרמת עמודות כל משבצת בציר הוא 2 תלמידים. כמה משבצות גובה תהיה לעמודה של 8 תלמידים?';
  const s = spec('showAsBar', barPrompt, 4);
  assert.equal(s.kind, 'symbols');
  assert.equal(s.per, 2);
  assert.equal(s.count, 4);
  const e = D.soundEvents(s);
  const units = stage(e, 'unit');
  assert.equal(units.length, 2);
  assert.ok(units.every((n) => n.voice === 'woodClick' && n.hz === 1500 && n.gain === 0.16));
  const symbols = stage(e, 'symbol');
  assert.equal(symbols.length, 4);
  assert.ok(symbols.every((n) => n.voice === 'drumLow' && n.hz === 110 && n.gain === 0.26));
  assert.deepEqual(symbols.map((n) => n.i), [0, 1, 2, 3]);

  // non-divisible total
  assert.equal(spec('showAsBar', 'בדיאגרמת עמודות כל משבצת בציר הוא 2 תלמידים. כמה משבצות גובה תהיה לעמודה של 7 תלמידים?', 3.5), null);
  // per > 10
  assert.equal(spec('showAsBar', 'בדיאגרמת עמודות כל משבצת בציר הוא 15 תלמידים. כמה משבצות גובה תהיה לעמודה של 30 תלמידים?', 2), null);
});

test('parity: tens drumLow strokes sound before ones step in pairs, handling tens >= 10', () => {
  const s13 = spec('alternateDrums', '13 זוגי או אי־זוגי?', 'אי-זוגי');
  assert.equal(s13.kind, 'parity');
  assert.equal(s13.n, 13);
  const e13 = D.soundEvents(s13);
  const tens13 = stage(e13, 'ten');
  assert.equal(tens13.length, 1);
  assert.equal(tens13[0].voice, 'drumLow');
  assert.equal(tens13[0].hz, 98);
  assert.equal(tens13[0].gain, 0.24);
  assert.equal(stage(e13, 'pair').length, 2);
  assert.equal(stage(e13, 'alone').length, 1);

  const s20 = spec('alternateDrums', '20 זוגי או אי־זוגי?', 'זוגי');
  const e20 = D.soundEvents(s20);
  assert.equal(stage(e20, 'ten').length, 2);
  assert.equal(stage(e20, 'pair').length, 0);
  assert.equal(stage(e20, 'alone').length, 0);

  const s12 = spec('alternateDrums', '12 פעימות הן מספר זוגי או אי-זוגי?', 'זוגי');
  assert.equal(s12.n, 12);
  assert.equal(stage(D.soundEvents(s12), 'ten').length, 1);
  assert.equal(stage(D.soundEvents(s12), 'pair').length, 2);

  const s11 = spec('alternateDrums', 'האם 11 הוא מספר זוגי או אי-זוגי?', 'אי-זוגי');
  assert.equal(s11.n, 11);
  assert.equal(stage(D.soundEvents(s11), 'alone').length, 1);
});

test('fives: non-multiples of 5 answer לא and pause after fifth stroke when ones > 5', () => {
  const s = spec('stickingParity', 'האם 2,348 מתחלק ב־5? (כן/לא)', 'לא');
  assert.equal(s.kind, 'fives');
  assert.equal(s.value, 'לא');
  const e = D.soundEvents(s);
  const rest = stage(e, 'rest');
  assert.equal(rest.length, 1);
  assert.equal(rest[0].voice, 'drumLow');
  assert.equal(rest[0].hz, 98);
  assert.equal(rest[0].dur, 0.4);
  assert.equal(rest[0].gain, 0.24);
  const ones = stage(e, 'one');
  assert.equal(ones.length, 8);
  assert.ok(ones[5].at - ones[4].at > ones[1].at - ones[0].at + 0.3);
  assert.equal(spec('stickingParity', 'האם 2,348 מתחלק ב־5? (כן/לא)', 'כן'), null);
});

test('prime: composite numbers decompose into equal bars with barTen and beats; primes return null', () => {
  assert.equal(spec('stickingParity', 'האם 7 הוא מספר ראשוני? (כן/לא)', 'כן'), null);
  assert.equal(spec('stickingParity', 'האם 13 הוא מספר ראשוני? (כן/לא)', 'כן'), null);
  assert.equal(spec('stickingParity', 'האם 23 הוא מספר ראשוני? (כן/לא)', 'כן'), null);

  const s6 = spec('stickingParity', 'האם 6 הוא מספר ראשוני? (כן/לא)', 'לא');
  assert.equal(s6.kind, 'prime');
  assert.equal(s6.bars, 2);
  assert.equal(s6.value, 'לא');
  const e6 = D.soundEvents(s6);
  assert.equal(stage(e6, 'barTen').length, 0);
  const beats = stage(e6, 'beat');
  assert.equal(beats.length, 6);
  assert.equal(beats.filter((n) => n.bar === 0).length, 3);
  assert.equal(beats.filter((n) => n.bar === 1).length, 3);
  assert.ok(beats.every((n) => n.voice === 'stomp' && n.hz === 90));
});

test('meanBound: hi >= mean yields כן; out of bounds returns null', () => {
  const s = spec('levelNotes', 'בקבוצת מספרים הקטן הוא 2 והממוצע הוא 5. האם הגדול יכול להיות 8? (כן/לא)', 'כן');
  assert.equal(s.kind, 'meanBound');
  assert.equal(s.target, 3);
  assert.equal(s.value, 'כן');
  const e = D.soundEvents(s);
  const target = stage(e, 'target');
  assert.equal(target.length, 3);
  assert.ok(target.every((n) => n.voice === 'jingle' && n.hz === 1568 && n.dur === 0.08 && n.gain === 0.12));

  // hi <= lo
  assert.equal(spec('levelNotes', 'בקבוצת מספרים הקטן הוא 5 והממוצע הוא 7. האם הגדול יכול להיות 4? (כן/לא)', 'לא'), null);
  // hi - lo > MAX_RUN
  assert.equal(spec('levelNotes', 'בקבוצת מספרים הקטן הוא 2 והממוצע הוא 5. האם הגדול יכול להיות 20? (כן/לא)', 'כן'), null);
  // mean - lo > MAX_RUN
  assert.equal(spec('levelNotes', 'בקבוצת מספרים הקטן הוא 2 והממוצע הוא 20. האם הגדול יכול להיות 25? (כן/לא)', 'כן'), null);
});

test('meanSum: Hebrew scales and woodClick pulses for each equal group', () => {
  const s = spec('levelNotes', 'הממוצע של 4 מספרים הוא 15. מה סכום המספרים?', 60);
  assert.equal(s.kind, 'meanSum');
  assert.equal(s.unit, 5);
  assert.match(D.html(s), /כל הקשה שווה חמישה\./);
  const e = D.soundEvents(s);
  const levels = stage(e, 'level');
  assert.equal(levels.length, 12);
  assert.deepEqual([0, 1, 2, 3].map((d) => levels.filter((n) => n.d === d).length), [3, 3, 3, 3]);
  assert.ok(levels.every((n) => n.voice === 'woodClick' && n.hz === 1300 && n.dur === 0.05 && n.gain === 0.2));

  // n > 6 returns null
  assert.equal(spec('levelNotes', 'הממוצע של 7 מספרים הוא 15. מה סכום המספרים?', 105), null);
});

test('table queries: יחד sums subsets, בסך הכול sums all, and מובילה/ambiguous mode return null', () => {
  const pTogether = 'בטבלת השאלת ספרים: יום א׳ — 10, יום ב׳ — 14, יום ג׳ — 6. כמה ספרים הושאלו בימים א׳ ו־ג׳ יחד?';
  const sTogether = spec('tableRowGroups', pTogether, 16);
  assert.equal(sTogether.op, 'sum');
  assert.deepEqual(sTogether.asked, ['יום א׳', 'יום ג׳']);
  assert.equal(sTogether.value, 16);

  const p = 'בטבלת החוגים רשומים: כדורגל — 12 תלמידים, מוזיקה — 8 תלמידים, ציור — 5 תלמידים. ';
  const sTotal = spec('tableRowGroups', p + 'כמה תלמידים בסך הכול?', 25);
  assert.equal(sTotal.op, 'sum');
  assert.equal(sTotal.asked.length, 3);
  assert.equal(sTotal.value, 25);

  const sThree = spec('tableRowGroups', p + 'כמה תלמידים בשלושת החוגים?', 25);
  assert.equal(sThree.op, 'sum');
  assert.equal(sThree.value, 25);

  // ambiguous mode in table
  const pTied = 'בטבלת החוגים רשומים: כדורגל — 10 תלמידים, מוזיקה — 10 תלמידים, ציור — 5 תלמידים. מהו החוג השכיח?';
  assert.equal(spec('tableRowGroups', pTied, 'כדורגל'), null);

  // lead (מובילה) returns null
  const pLead = 'בטבלת הנקודות: אדום — 20, כחול — 10. בכמה נקודות מובילה קבוצת אדום?';
  assert.equal(spec('tableRowGroups', pLead, 10), null);

  // post-show poll
  const pPoll = 'במשאל אחרי ההצגה: 6 תלמידים אהבו, 4 לא אהבו ו־2 בלי דעה. כמה תלמידים השתתפו במשאל?';
  const sPoll = spec('tableRowGroups', pPoll, 12);
  assert.equal(sPoll.kind, 'table');
  assert.equal(sPoll.value, 12);
  assert.equal(sPoll.unit, 1);
});

test('table labels: final letters normalisation and day abbreviation matching', () => {
  const pColor = 'בטבלת הצבעים: אדום — 10, לבן — 5. כמה לבשו חולצה אדומה?';
  const sColor = spec('tableRowGroups', pColor, 10);
  assert.equal(sColor.asked[0], 'אדום');
  assert.equal(sColor.value, 10);

  const pDay = 'בטבלת הפעילות: יום א׳ — 10, יום ב׳ — 20. כמה השתתפו ביום א׳?';
  const sDay = spec('tableRowGroups', pDay, 10);
  assert.equal(sDay.asked[0], 'יום א׳');
  assert.equal(sDay.value, 10);
});

test('list difference: ארגנו בטבלה בכמה יותר queries count difference', () => {
  const p = 'רשמנו את הכלי שכל ילד בחר: תוף, חליל, תוף, משולש, תוף, חליל, תוף. ארגנו בטבלה: בכמה ילדים יותר בחרו תוף מאשר משולש?';
  const s = spec('listToGroups', p, 3);
  assert.equal(s.kind, 'list');
  assert.equal(s.value, 3);
  assert.deepEqual(s.asked, ['תוף', 'משולש']);
  const e = D.soundEvents(s);
  assert.equal(stage(e, 'raw').length, 7);
  assert.equal(stage(e, 'sorted').length, 7);
});

test('sector: full circle 12 woodClick pulses, wholeEnd metalBell, then fraction ticks', () => {
  const p = 'בסקר 25% בחרו בכחול. כמה מעלות תהיה הגזרה של כחול בדיאגרמת עוגה?';
  const s = spec('showAsBar', p, 90);
  assert.equal(s.kind, 'sector');
  assert.equal(s.ticks, 3);
  const e = D.soundEvents(s);
  const whole = stage(e, 'whole');
  assert.equal(whole.length, 12);
  assert.ok(whole.every((n) => n.voice === 'woodClick' && n.hz === 1200 && n.dur === 0.04 && n.gain === 0.1));
  const end = stage(e, 'wholeEnd');
  assert.equal(end.length, 1);
  assert.equal(end[0].voice, 'metalBell');
  assert.equal(end[0].hz, 1047);
  assert.equal(end[0].dur, 0.4);
  assert.equal(end[0].gain, 0.14);
  const ticks = stage(e, 'tick');
  assert.equal(ticks.length, 3);
  assert.ok(ticks.every((n) => n.voice === 'woodClick' && n.hz === 1500 && n.dur === 0.05 && n.gain === 0.2));

  // non-integer ticks
  assert.equal(spec('showAsBar', 'בסקר 10% בחרו בכחול. כמה מעלות תהיה הגזרה של כחול בדיאגרמת עוגה?', 36), null);
});

test('longestRun: handles empty, single, duplicates, and burst thresholds', () => {
  assert.equal(D.longestRun([]), 0);
  assert.equal(D.longestRun([{ at: 1.0 }]), 1);
  assert.equal(D.longestRun([{ at: 1.0 }, { at: 1.0 }]), 1);
  assert.equal(D.longestRun([{ at: 0 }, { at: 0.1 }, { at: 0.2 }, { at: 0.3 }]), 4);
  assert.equal(D.longestRun([{ at: 0 }, { at: 0.5 }, { at: 1.0 }]), 1);
  assert.equal(D.longestRun([{ at: 0 }, { at: 0.1 }, { at: 0.6 }, { at: 0.7 }, { at: 0.8 }]), 3);
});

test('play: handles resume throwing without error, and empty events returns null', () => {
  assert.equal(D.play({ kind: 'empty' }, {}), null);
  const s = spec('alternateDrums', '9 זוגי או אי־זוגי?', 'אי-זוגי');
  let played = 0;
  const env = {
    playVoice: () => { played++; },
    audioContext: {
      currentTime: 0,
      state: 'suspended',
      resume() { throw new Error('autoplay blocked'); }
    }
  };
  const res = D.play(s, env);
  assert.equal(res.notes, played);
  assert.ok(played > 0);
});

test('wholeParts: hora circle instruments pluck, bowed, metalBell, woodClick and closing gong', () => {
  const p = 'רוצים להראות איזה חלק מהכיתה בחר כל ענף ספורט. מה מתאים יותר: עוגה או עמודות?';
  const s = spec('showAsBar', p, 'עוגה');
  assert.equal(s.kind, 'wholeParts');
  assert.equal(s.world, D.WORLDS.hora);
  assert.deepEqual(s.sizes, [3, 2, 4, 3]);
  const e = D.soundEvents(s);
  const parts = stage(e, 'part');
  assert.equal(parts.length, 12);
  const p0 = parts.filter((n) => n.part === 0);
  assert.equal(p0.length, 3);
  assert.ok(p0.every((n) => n.voice === 'pluck' && n.hz === 196 && n.dur === 0.15 && n.gain === 0.2));
  const p1 = parts.filter((n) => n.part === 1);
  assert.equal(p1.length, 2);
  assert.ok(p1.every((n) => n.voice === 'bowed' && n.hz === 330 && n.dur === 0.15 && n.gain === 0.2));
  const p2 = parts.filter((n) => n.part === 2);
  assert.equal(p2.length, 4);
  assert.ok(p2.every((n) => n.voice === 'metalBell' && n.hz === 784 && n.dur === 0.15 && n.gain === 0.2));
  const p3 = parts.filter((n) => n.part === 3);
  assert.equal(p3.length, 3);
  assert.ok(p3.every((n) => n.voice === 'woodClick' && n.hz === 1500 && n.dur === 0.15 && n.gain === 0.2));
  const closed = stage(e, 'closed');
  assert.equal(closed.length, 1);
  assert.equal(closed[0].voice, 'gong');
  assert.equal(closed[0].hz, 165);
  assert.equal(closed[0].dur, 0.6);
  assert.equal(closed[0].gain, 0.16);
});

test('soundEvents: null or unknown spec returns empty array', () => {
  assert.deepEqual(D.soundEvents(null), []);
  assert.deepEqual(D.soundEvents({ kind: 'unknown' }), []);
});

test('scaleFor: units selection and MAX_RUN limits', () => {
  const p50 = 'בטבלת האוספים: מטבעות — 600, בולים — 300. כמה פריטים באוסף המטבעות?';
  const s50 = spec('tableRowGroups', p50, 600);
  assert.equal(s50.unit, 50);

  const p15 = 'בטבלת הפרחים: ורדים — 180, צבעונים — 90. כמה ורדים יש?';
  const s15 = spec('tableRowGroups', p15, 180);
  assert.equal(s15.unit, 15);

  const p10 = 'בטבלת הפירות: תפוחים — 120, תפוזים — 60. כמה תפוחים יש?';
  const s10 = spec('tableRowGroups', p10, 120);
  assert.equal(s10.unit, 10);

  // values exceeding MAX_RUN even with unit 50
  const pHuge = 'בטבלת הפירות: תפוחים — 1000, תפוזים — 500. כמה תפוחים יש?';
  assert.equal(spec('tableRowGroups', pHuge, 1000), null);
});

test('even + even in sumParity: only pairs, no alone steps and no meet steps', () => {
  const e = ev('alternateDrums', '4 + 6 — זוגי או אי־זוגי?', 'זוגי');
  assert.equal(stage(e, 'pair').length, 10);
  assert.equal(stage(e, 'alone').length, 0);
  assert.equal(stage(e, 'meet').length, 0);
});

test('all 10 tags in TAGS are accepted by plan for matching items', () => {
  const samplePrompt = '9 זוגי או אי־זוגי?';
  D.TAGS.forEach((tag) => {
    const it = { music: tag, prompt: samplePrompt, answer: 'אי-זוגי' };
    const s = D.plan(it);
    assert.ok(s, 'tag ' + tag + ' should be accepted by plan');
  });
});

test('VOICES: 4 voices with timbre names and frequencies', () => {
  const p = 'בטבלת החוגים רשומים: כדורגל — 1, מוזיקה — 1, ציור — 1, שחמט — 1. כמה תלמידים בכדורגל?';
  const s = spec('tableRowGroups', p, 1);
  const e = D.soundEvents(s);
  const cats = stage(e, 'cat');
  assert.equal(cats.length, 4);
  assert.equal(cats[0].voice, 'pluck');
  assert.equal(cats[0].hz, 196);
  assert.equal(cats[1].voice, 'bowed');
  assert.equal(cats[1].hz, 330);
  assert.equal(cats[2].voice, 'frameDrum');
  assert.equal(cats[2].hz, 150);
  assert.equal(cats[3].voice, 'reed');
  assert.equal(cats[3].hz, 523);
});

test('pie sound events: pluck for yes, bowed for no, with accurate frequencies and part indices', () => {
  const pie = ev('showAsBar', 'מציגים 3 בעד ו־1 נגד בדיאגרמת עוגה של 4 חלקים שווים. כמה חלקים יהיו «בעד»?', 3);
  assert.equal(pie.length, 4);
  const yes = stage(pie, 'yes');
  assert.equal(yes.length, 3);
  assert.ok(yes.every((n, idx) => n.voice === 'pluck' && n.hz === 196 && n.dur === 0.2 && n.gain === 0.22 && n.part === idx));
  const no = stage(pie, 'no');
  assert.equal(no.length, 1);
  assert.ok(no.every((n) => n.voice === 'bowed' && n.hz === 330 && n.dur === 0.2 && n.gain === 0.22 && n.part === 3));
});

test('values and modesCount sound events: woodBar pitches and gap on change', () => {
  const s = spec('tallyFives', 'הציונים בבוחן: 5, 5, 7. מהו השכיח?', 5);
  const e = D.soundEvents(s);
  const vals = stage(e, 'value');
  assert.equal(vals.length, 3);
  assert.ok(vals.every((n) => n.voice === 'woodBar' && n.dur === 0.14 && n.gain === 0.22));
  assert.equal(vals[0].hz, 392);
  assert.equal(vals[1].hz, 392);
  const expectedHz7 = 392 * Math.pow(2, (7 - 5) * 2 / 12);
  assert.ok(Math.abs(vals[2].hz - expectedHz7) < 0.001);
  const normalStep = vals[1].at - vals[0].at;
  const changeStep = vals[2].at - vals[1].at;
  assert.ok(changeStep > normalStep + 0.35);
});

test('mean sound events: floor drumLow, above woodClick, share metalBell, and piece tine', () => {
  const s = spec('levelNotes', 'הקשתם 4 פעמים: 80, 81, 82 ו־84 BPM. מה הקצב הממוצע?', 81.75);
  const e = D.soundEvents(s);
  const floor = stage(e, 'floor');
  assert.equal(floor.length, 4);
  assert.ok(floor.every((n, d) => n.voice === 'drumLow' && n.hz === 98 && n.dur === 0.3 && n.gain === 0.22 && n.d === d));
  const above = stage(e, 'above');
  assert.ok(above.every((n) => n.voice === 'woodClick' && n.hz === 1300 + 120 * n.d && n.dur === 0.05 && n.gain === 0.2));
  const share = stage(e, 'share');
  assert.equal(share.length, 4);
  assert.ok(share.every((n) => n.voice === 'metalBell' && n.hz === 1047 + 60 * n.d && n.dur === 0.1 && n.gain === 0.16 && n.round === 0));
  const piece = stage(e, 'piece');
  assert.equal(piece.length, 12);
  assert.ok(piece.every((n) => n.voice === 'tine' && n.hz === 2093 && n.dur === 0.05 && n.gain === 0.12));
});

test('tally and list sound events: raw vs sorted, and tally tick grouping', () => {
  const sList = spec('listToGroups', 'רשמנו את הכלי שכל ילד בחר: תוף, חליל. בטבלה מסודרת — כמה בחרו תוף?', 1);
  const eList = D.soundEvents(sList);
  const raw = stage(eList, 'raw');
  assert.equal(raw.length, 2);
  assert.ok(raw.every((n) => n.dur === 0.14 && n.gain === 0.2));
  const sorted = stage(eList, 'sorted');
  assert.equal(sorted.length, 2);
  assert.ok(sorted.every((n) => n.dur === 0.14 && n.gain === 0.22));

  const sTally = spec('listToGroups', 'סימני ספירה: תוף — ||||| |, חליל — ||. כמה שירי תוף נספרו?', 6);
  const eTally = D.soundEvents(sTally);
  const tallies = stage(eTally, 'tally');
  assert.equal(tallies.length, 8);
  assert.ok(tallies.every((n) => n.dur === 0.14 && n.gain === 0.22));
  const drumHits = tallies.filter((n) => n.cat === 0);
  assert.equal(drumHits.length, 6);
  assert.ok(drumHits.every((n) => n.label === 'תוף'));
});

test('sumParity sound events: pairs with stomp 90 and 120 Hz, meet and alone', () => {
  const eMeet = ev('alternateDrums', '3 + 5 — זוגי או אי־זוגי?', 'זוגי');
  const meet = stage(eMeet, 'meet');
  assert.equal(meet.length, 2);
  assert.equal(meet[0].voice, 'stomp');
  assert.equal(meet[0].hz, 90);
  assert.equal(meet[1].voice, 'stomp');
  assert.equal(meet[1].hz, 120);

  const eAlone = ev('alternateDrums', '2 + 3 — זוגי או אי־זוגי?', 'אי-זוגי');
  const alone = stage(eAlone, 'alone');
  assert.equal(alone.length, 2);
  assert.ok(alone.some((n) => n.last));
  assert.ok(alone.every((n) => n.voice === 'stomp' && n.hz === 90));
});

test('prime sound events: barTen with drumLow and beat with stomp', () => {
  const s = spec('stickingParity', 'האם 34 הוא מספר ראשוני? (כן/לא)', 'לא');
  assert.equal(s.bars, 2);
  const e = D.soundEvents(s);
  const barTens = stage(e, 'barTen');
  assert.equal(barTens.length, 2);
  assert.ok(barTens.every((n) => n.voice === 'drumLow' && n.hz === 98 && n.dur === 0.3 && n.gain === 0.24));
  const beats = stage(e, 'beat');
  assert.equal(beats.length, 14);
  assert.ok(beats.every((n) => n.voice === 'stomp' && n.hz === 90));
});

test('tablePlan fraction and single category queries', () => {
  const pFrac = 'בטבלת הפרחים: ורדים — 6, צבעונים — 6. איזה חלק מהפרחים הם ורדים? כתבו שבר.';
  const sFrac = spec('tableRowGroups', pFrac, '1/2');
  assert.equal(sFrac.op, 'part');
  assert.equal(sFrac.value, '1/2');

  const pSingle = 'בטבלת הפרחים: ורדים — 6, צבעונים — 4. כמה ורדים יש?';
  const sSingle = spec('tableRowGroups', pSingle, 6);
  assert.equal(sSingle.op, 'one');
  assert.equal(sSingle.value, 6);
});

test('meanPlan boundary conditions: too few, too many, or exceeding runs', () => {
  assert.equal(spec('levelNotes', 'שקלו 1 קלמנטינות: 60 גרם. מה המשקל הממוצע?', 60), null);
  assert.equal(spec('levelNotes', 'שקלו 6 קלמנטינות: 10, 20, 30, 40, 50 ו־60 גרם. מה המשקל הממוצע?', 35), null);
  assert.equal(spec('levelNotes', 'שקלו 2 קלמנטינות: 10 ו־500 גרם. מה המשקל הממוצע?', 255), null);
});

test('takeAwayTen returns null when TakeAwayTen claims the item', () => {
  const placeValueItem = {
    music: 'tenExchange',
    prompt: '2 עשרות ו־4 יחידות הן:',
    answer: 24
  };
  if (TT.specForItem(placeValueItem)) {
    assert.equal(D.specForItem(placeValueItem), null);
  }
});

test('plan returns null for malformed items, wrong answers, and silent specs', () => {
  assert.equal(D.plan(null), null);
  assert.equal(D.plan({}), null);
  assert.equal(D.plan({ music: 'levelNotes', noMusic: true }), null);
  assert.equal(D.plan({ music: 'unknownTag', prompt: '9 זוגי או אי־זוגי?', answer: 'אי-זוגי' }), null);
  assert.equal(D.plan({ music: 'alternateDrums', prompt: '', answer: 'זוגי' }), null);
  assert.equal(D.plan({ music: 'alternateDrums', prompt: '9 זוגי או אי־זוגי?', answer: '' }), null);
});
