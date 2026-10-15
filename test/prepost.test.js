const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pp = require('../src/lib/prepost.js');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// A check session as teacherStore.startSession + addItem would leave it.
function session(kind, started, correctCount, total) {
  const items = [];
  for (let i = 0; i < total; i += 1) {
    items.push({ skill: 'basic_fractions', prompt: 'q' + i, correct: i < correctCount, at: started + i });
  }
  return { id: kind + started, kind: kind, started: started, ended: started + total, items: items };
}

test('every unit ships two parallel forms of 6-8 items at the same difficulty', () => {
  const ids = pp.unitIds();
  assert.ok(ids.length >= 1, 'expected at least the grade ד׳ fractions unit');
  ids.forEach((id) => {
    const balance = pp.formsBalanced(id);
    assert.deepEqual(balance.problems, [], id);
    assert.equal(balance.ok, true, id);
    const a = pp.formItems(id, 'A');
    const b = pp.formItems(id, 'B');
    assert.ok(a.length >= 6 && a.length <= 8, id + ' has ' + a.length + ' items per form');
    // Identical difficulty, item by item: same shape, same level, same step
    // count, same number of options.
    assert.deepEqual(pp.difficultyProfile(a), pp.difficultyProfile(b), id);
  });
});

test('the two forms are parallel, not the same items twice', () => {
  pp.unitIds().forEach((id) => {
    const a = pp.formItems(id, 'A');
    const b = pp.formItems(id, 'B');
    a.forEach((it, i) => {
      assert.equal(it.slot, b[i].slot);
      assert.equal(it.level, b[i].level);
      assert.notEqual(it.prompt, b[i].prompt, it.slot + ' repeats the same prompt');
      assert.notEqual(it.answer, b[i].answer, it.slot + ' repeats the same answer');
    });
  });
});

test('every item is tagged, has four options, and one of them is the answer', () => {
  pp.unitIds().forEach((id) => {
    const unit = pp.unitById(id);
    ['A', 'B'].forEach((form) => {
      pp.formItems(id, form).forEach((it) => {
        assert.equal(it.unit, id);
        assert.equal(it.skill, unit.skill);
        assert.ok(it.slot && it.shape, it.id + ' needs a slot and a shape');
        assert.ok(it.level >= 1 && it.level <= 3, it.id + ' level ' + it.level);
        assert.ok(it.steps >= 1, it.id + ' needs a step count');
        assert.ok(String(it.prompt).trim().length > 5, it.id + ' has no prompt');
        assert.equal(it.choices.length, 4, it.id);
        assert.equal(new Set(it.choices).size, 4, it.id + ' repeats an option');
        assert.ok(it.choices.includes(it.answer), it.id + ' hides its own answer');
        assert.ok(it.eighths === null || (it.eighths >= 0 && it.eighths <= 8), it.id);
      });
    });
  });
});

test('balanceProblems catches a post-form that is easier than the pre-form', () => {
  const a = pp.formItems('frac4', 'A');
  const b = pp.formItems('frac4', 'B');
  assert.deepEqual(pp.balanceProblems(a, b), []);
  const easier = b.map((it, i) => (i === 0 ? Object.assign({}, it, { level: 1, steps: 1, shape: 'guess' }) : it));
  const flagged = pp.balanceProblems(a, easier);
  assert.ok(flagged.some((m) => /רמת הקושי/.test(m)), flagged.join(' | '));
  const cloned = b.map((it, i) => (i === 1 ? Object.assign({}, it, { prompt: a[1].prompt }) : it));
  assert.ok(pp.balanceProblems(a, cloned).some((m) => /אותו פריט/.test(m)));
  const lost = b.map((it, i) => (i === 2 ? Object.assign({}, it, { answer: 'אין' }) : it));
  assert.ok(pp.balanceProblems(a, lost).some((m) => /אינה בין האפשרויות/.test(m)));
  assert.ok(pp.balanceProblems(a.slice(0, 3), b.slice(0, 3)).length >= 1, 'a 3-item form is too short');
  assert.deepEqual(pp.formsBalanced('nope').problems, ['אין יחידה כזו']);
});

test('an equivalent fraction counts, a near miss does not', () => {
  const add = pp.formItems('frac4', 'A').find((it) => it.shape === 'add');
  assert.equal(pp.checkItemCorrect(add, '3/8'), true);
  assert.equal(pp.checkItemCorrect(add, '6/16'), true);
  assert.equal(pp.checkItemCorrect(add, '1/2'), false);
  const count = pp.formItems('frac4', 'A').find((it) => it.shape === 'count-in-bar');
  assert.equal(pp.checkItemCorrect(count, '4'), true);
  assert.equal(pp.checkItemCorrect(count, 4), true);
  assert.equal(pp.checkItemCorrect(count, '8'), false);
  assert.equal(pp.checkItemCorrect(count, null), false);
  assert.equal(pp.checkItemCorrect(null, '4'), false);
});

test('a check is stored as one session kind per unit and phase', () => {
  assert.equal(pp.checkKind('frac4', 'pre'), 'pre:frac4');
  assert.equal(pp.checkKind('frac4', 'post'), 'post:frac4');
  assert.equal(pp.checkKind('frac4', 'constructor'), '');
  assert.equal(pp.checkKind('__proto__', 'pre'), '');
  assert.deepEqual(pp.parseCheckKind('post:frac4'), { phase: 'post', unit: 'frac4' });
  assert.equal(pp.parseCheckKind('pre:nope'), null);
  assert.equal(pp.parseCheckKind('practice'), null);
  assert.equal(pp.parseCheckKind(null), null);
  assert.equal(pp.formFor('pre'), 'A');
  assert.equal(pp.formFor('post'), 'B');
  assert.deepEqual(pp.formItems('frac4', 'C'), []);
  const labels = pp.kindLabels();
  assert.equal(Object.keys(labels).length, pp.unitIds().length * 2);
  assert.match(labels['pre:frac4'], /בדיקת פתיחה/);
  assert.doesNotMatch(Object.values(labels).join(' '), /יעילות|מוכח|משפר|שולט/);
});

test('the report reads the newest run of each phase and ignores practice sessions', () => {
  const student = {
    name: 'דנה',
    sessions: [
      session('practice', 1000, 8, 8),
      session('pre:frac4', 2000, 1, 2),
      session('pre:frac4', 3000, 3, 8),
      session('post:frac4', 4000, 6, 8),
      null,
      'broken',
    ],
  };
  const r = pp.studentPrePost(student, 'frac4');
  assert.equal(r.name, 'דנה');
  assert.deepEqual([r.pre.correct, r.pre.total], [3, 8]);
  assert.deepEqual([r.post.correct, r.post.total], [6, 8]);
  assert.equal(r.both, true);
  assert.equal(Math.round(r.delta * 100), 38);
  const preOnly = pp.studentPrePost({ name: 'יוסי', sessions: [session('pre:frac4', 5000, 2, 8)] }, 'frac4');
  assert.equal(preOnly.both, false);
  assert.equal(preOnly.delta, null);
  assert.equal(preOnly.post, null);
  assert.equal(pp.studentPrePost(null, 'frac4').both, false);
});

test('the class line counts only students with both checks and survives a bad roster', () => {
  const roster = {
    students: {
      'דנה': { name: 'דנה', sessions: [session('pre:frac4', 2000, 2, 8), session('post:frac4', 3000, 6, 8)] },
      'אבי': { name: 'אבי', sessions: [session('pre:frac4', 2100, 4, 8), session('post:frac4', 3100, 4, 8)] },
      'יוסי': { name: 'יוסי', sessions: [session('pre:frac4', 2200, 1, 8)] },
      'נועה': { name: 'נועה', sessions: [session('practice', 2300, 8, 8)] },
      'ריק': null,
      'מחרוזת': 'nope',
      'מערך': [],
    },
  };
  const r = pp.classPrePost(roster, 'frac4');
  assert.equal(r.n, 2, 'only דנה and אבי have both checks');
  assert.equal(r.unit, 'frac4');
  assert.deepEqual(r.pre, { correct: 6, total: 16 });
  assert.deepEqual(r.post, { correct: 10, total: 16 });
  assert.equal(Math.round(r.delta * 100), 25);
  // נועה practised but never took a check, so she is not a row at all.
  assert.deepEqual(r.students.map((s) => s.name), ['אבי', 'דנה', 'יוסי']);
  assert.match(r.disclaimer, /לא ניסוי מבוקר/);
  const empty = pp.classPrePost({ students: {} }, 'frac4');
  assert.equal(empty.n, 0);
  assert.equal(empty.delta, null);
  assert.deepEqual(pp.classPrePost(null, 'frac4').students, []);
  assert.deepEqual(pp.studentRows({ students: { ['__proto__']: { name: 'x' } } }), []);
});

test('the report view escapes names, isolates every number LTR, and prints n with the disclaimer', () => {
  const html = pp.renderPrePostHtml(pp.classPrePost({
    students: {
      '<img src=x onerror=1>': {
        name: '<img src=x onerror=1>',
        sessions: [session('pre:frac4', 2000, 2, 8), session('post:frac4', 3000, 5, 8)],
      },
    },
  }, 'frac4'));
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
  assert.match(html, /n = <bdi dir="ltr">1<\/bdi>/);
  assert.match(html, /<bdi dir="ltr">2\/8<\/bdi>/);
  assert.match(html, /<bdi dir="ltr">\+38%<\/bdi>/);
  assert.match(html, /לא ניסוי מבוקר/);
  // Four columns only, so the table still fits a 360px phone.
  assert.equal((html.match(/<th scope="col">/g) || []).length, 4);
  assert.doesNotMatch(html, /יעילות|מוכח|משפר מתמטיקה|שולט/);
  const blank = pp.renderPrePostHtml(null);
  assert.match(blank, /עוד לא נרשמה בדיקה/);
  assert.match(blank, /לא ניסוי מבוקר/);
});

test('the check bar is silent, described for a screen reader, and never leaks the answer', () => {
  const bar = pp.renderCheckBarHtml(4);
  assert.equal((bar.match(/pp-cell/g) || []).length, 8);
  assert.equal((bar.match(/pp-cell on/g) || []).length, 4);
  assert.match(bar, /role="img"/);
  assert.match(bar, /aria-label="תיבה של 4\/4 מחולקת ל־8 שמיניות, 4 מהן צבועות"/);
  assert.match(bar, /dir="ltr"/);
  // bar44 prints "מלא: 1/2 מהתיבה", which is the answer to the first item.
  assert.doesNotMatch(bar, /מלא:/);
  assert.doesNotMatch(bar, /1\/2/);
  assert.equal(pp.renderCheckBarHtml(null), '');
  assert.equal(pp.renderCheckBarHtml(9), '');
  assert.equal(pp.renderCheckBarHtml(-1), '');
});

test('no export of this module shadows one index.html already loads', () => {
  // Every src/lib module is a classic script that does Object.assign(window, api),
  // so a shared name silently takes the last definition on the page. core.js and
  // adaptive.js both export isCorrect, and core.js loads last.
  const others = [...indexHtml.matchAll(/ src="src\/lib\/([^"]+\.js)"/g)]
    .map((m) => m[1])
    .filter((f) => f !== 'prepost.js');
  const mine = Object.keys(pp);
  others.forEach((file) => {
    const api = require('../src/lib/' + file);
    mine.forEach((name) => {
      assert.ok(
        !Object.prototype.hasOwnProperty.call(api, name),
        file + ' already exports ' + name + '; rename the prepost.js export',
      );
    });
  });
});

test('home wires the check into the teacher tab, offline and without efficacy copy', () => {
  assert.match(indexHtml, /src="src\/lib\/prepost\.js"/);
  ['ppUnit', 'ppStartPre', 'ppStartPost', 'ppRefresh', 'ppRun', 'ppPrompt', 'ppChoices', 'ppReport'].forEach((id) => {
    assert.match(indexHtml, new RegExp('id="' + id + '"'), id + ' is missing from index.html');
  });
  assert.match(indexHtml, /id="ppReport"[^>]*aria-live/);
  assert.match(indexHtml, /id="ppLive"[^>]*aria-live/);
  assert.match(indexHtml, /\.pp-cell\{/, 'the silent bar needs CSS that does not force a 44px cell');
  // The check records through teacherStore, with no storage of its own.
  assert.match(indexHtml, /checkKind\(/);
  assert.doesNotMatch(indexHtml, /localStorage\.setItem\(['"]mm-prepost/);
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(sw, /'\.\/src\/lib\/prepost\.js'/);
  const cache = sw.match(/const CACHE = 'melodymath-offline-v(\d+)'/);
  assert.ok(cache && Number(cache[1]) > 9, 'sw.js cache must be bumped past v9 for the new file');
  const card = indexHtml.match(/id="prePost"[\s\S]*?id="ppReport"/);
  assert.ok(card, 'the pre/post block is missing from the teacher tab');
  assert.doesNotMatch(card[0], /יעילות|מוכח|משפר|שולט|סוגר פערים/);
  assert.match(card[0], /לא ניסוי מבוקר/);
});
