const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pace = require('../src/lib/pace');
const cur = require('../src/lib/curriculum');
const plan = require('../src/lib/learnerPlan');
const view = require('../src/lib/learnerPlanView');

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

function student(count, firstAt) {
  const sessions = [];
  for (let i = 0; i < count; i++) sessions.push({ id: 's' + i, started: firstAt + i * 1000 });
  return { name: 'נועה', sessions: sessions };
}

test('every curriculum topic has one parent goal and one typical range, and no other topic does', () => {
  const ids = cur.MATRIX.map((r) => r.topicId);
  const covered = pace.TOPIC_PACE.map((r) => r[0]);
  assert.deepEqual(covered.slice().sort(), ids.slice().sort());
  assert.equal(new Set(covered).size, covered.length);
  pace.TOPIC_PACE.forEach((row) => {
    const topic = cur.topicById(row[0]);
    // The anchor pins the row to its topic, so a reordered matrix fails here
    // instead of silently handing a topic somebody else's goal.
    assert.ok(topic.topic.indexOf(row[1]) !== -1, row[0] + ' anchor «' + row[1] + '» is not in «' + topic.topic + '»');
    assert.ok(row[2].length > 12 && /[.]$/.test(row[2]), row[0] + ' needs a full parent sentence');
    assert.ok(Number.isInteger(row[3]) && Number.isInteger(row[4]) && row[3] >= 1 && row[3] < row[4],
      row[0] + ' needs a real weeks range, not one number');
    assert.ok(pace.topicPace(row[0]).source.trim().length > 0, row[0] + ' needs a source label');
  });
  assert.match(pace.topicPace('mm-cur-32').source, /Azaryahu/);
});

test('the goals promise work, not outcomes, and never label the child', () => {
  pace.TOPIC_PACE.forEach((row) => assert.doesNotMatch(row[2], /שולט|מובטח|חלש|מתקשה|לקוי|יבטיח/, row[0]));
  Object.keys(pace.FEATURE_INTRO).forEach((id) => assert.doesNotMatch(pace.FEATURE_INTRO[id], /שולט|מובטח|חלש|מתקשה|מוכח/, id));
  assert.match(pace.paceNote(), /טווח טיפוסי/);
  assert.match(pace.paceNote(), /אין טענה שהקצב משפר מתמטיקה/);
});

test('topicPace resolves a topicId or the exact topic text, and nothing else', () => {
  const byId = pace.topicPace('mm-cur-24');
  assert.equal(byId.grade, 'ג');
  assert.equal(byId.weeksRange, '4–8');
  assert.equal(byId.sessionsRange, '12–24');
  assert.equal(byId.sessionsTypical, 18);
  assert.equal(byId.minutes, 8);
  assert.deepEqual(pace.topicPace(cur.topicById('mm-cur-24').topic), byId);
  assert.deepEqual(pace.topicPace({ topicId: 'mm-cur-24' }), byId);

  // ו׳ holds «כפל וחילוק שברים» and «כפל וחילוק שברים עשרוניים». A fuzzy
  // lookup would hand the second topic the first one's goal.
  assert.equal(pace.topicPace('כפל וחילוק שברים').topicId, 'mm-cur-47');
  assert.equal(pace.topicPace('כפל וחילוק שברים עשרוניים').topicId, 'mm-cur-48');

  [null, undefined, '', 'לוח כפל', 'constructor', '__proto__', 0, [], { topic: 'אין כזה' }]
    .forEach((bad) => assert.equal(pace.topicPace(bad), null, String(bad)));
});

test('progress against pace reads ahead, on pace or needs reinforcement', () => {
  // Two weeks in, the typical pace is 6 sessions of 8 minutes.
  const at = (done) => pace.paceProgress({ topicId: 'mm-cur-0', weeksElapsed: 2, sessionsDone: done });
  assert.equal(at(8).status, 'ahead');
  assert.equal(at(8).statusHe, 'מקדים');
  assert.equal(at(6).status, 'on');
  assert.equal(at(6).statusHe, 'בקצב');
  assert.equal(at(5).status, 'on');
  assert.equal(at(4).status, 'behind');
  assert.equal(at(4).statusHe, 'צריך חיזוק');
  assert.equal(at(4).expectedSessions, 6);
  assert.match(at(4).parentLine, /מפגש קצר אחד נוסף/);
  assert.match(at(8).parentLine, /נרשמו 8 מפגשים/);
});

test('a child who only started today is not already behind, and nobody gets a pace with no data', () => {
  // One session on day one is one session owed, not a whole week's three.
  const fresh = pace.paceProgress({ topicId: 'mm-cur-0', student: student(1, NOW - 1000), now: NOW });
  assert.equal(fresh.daysElapsed, 1);
  assert.equal(fresh.weeksElapsed, 1);
  assert.equal(fresh.expectedSessions, 1);
  assert.equal(fresh.status, 'on');
  const quiet = pace.paceProgress({ topicId: 'mm-cur-0', student: student(1, NOW - 10 * DAY), now: NOW });
  assert.equal(quiet.expectedSessions, 4);
  assert.equal(quiet.status, 'behind');

  const none = pace.paceProgress({ topicId: 'mm-cur-0', student: { sessions: [] }, now: NOW });
  assert.equal(none.status, 'none');
  assert.equal(none.statusHe, 'טרם התחלנו');
  assert.equal(none.expectedSessions, 0);
  assert.equal(none.percent, 0);
  assert.match(none.parentLine, /עוד לא נרשמו מפגשים/);
});

test('expected sessions stop at the top of the typical range instead of growing forever', () => {
  // ישר המספרים is 2–3 weeks, so at most 9 sessions are ever expected.
  const long = pace.paceProgress({ topicId: 'mm-cur-2', sessionsDone: 9, weeksElapsed: 40 });
  assert.equal(long.expectedSessions, 9);
  assert.equal(long.status, 'on');
  assert.equal(pace.paceProgress({ topicId: 'mm-cur-2', sessionsDone: 30, weeksElapsed: 40 }).percent, 100);
});

test('sessions are counted from the device log, ignoring junk, null and the future', () => {
  const messy = { sessions: [
    { started: NOW - 21 * DAY }, { started: NOW - 1000 }, { started: 'אתמול' },
    { started: NaN }, { started: null }, null, 'מפגש', { started: NOW + DAY },
  ] };
  const p = pace.paceProgress({ topicId: 'mm-cur-3', student: messy, now: NOW });
  assert.equal(p.sessionsDone, 2);
  assert.equal(p.weeksElapsed, 3);
  assert.equal(p.expectedSessions, 9);
  assert.equal(p.status, 'behind');
  [null, 'לא אובייקט', { topicId: 'mm-cur-3', student: null }].forEach((bad) => {
    assert.doesNotThrow(() => pace.paceProgress(bad));
  });
  assert.equal(pace.paceProgress(null).ok, false);
  assert.ok(pace.paceProgress(null).parentLine.length > 0);
});

test('explicit counts win over the device log, and a broken count falls back to it', () => {
  const s = student(5, NOW - 14 * DAY);
  const of = (extra) => pace.paceProgress(Object.assign({ topicId: 'mm-cur-0', student: s, now: NOW }, extra));
  assert.equal(of({ sessionsDone: 1 }).sessionsDone, 1);
  assert.equal(of({ sessionsDone: -4 }).sessionsDone, 5);
  assert.equal(of({ sessionsDone: 'שלוש' }).sessionsDone, 5);
  assert.equal(of({ weeksElapsed: 'הרבה' }).weeksElapsed, 2);
});

test('the meter is a labelled progressbar with the range, the status, the note and escaped text', () => {
  const html = pace.renderPaceMeterHtml(pace.paceProgress({ topicId: 'mm-cur-24', sessionsDone: 4, weeksElapsed: 2 }));
  assert.match(html, /role="progressbar"/);
  assert.match(html, /aria-valuemin="0"/);
  assert.match(html, /aria-valuemax="18"/);
  assert.match(html, /aria-valuenow="4"/);
  assert.match(html, /aria-valuetext="4 מתוך 18 מפגשים טיפוסיים"/);
  assert.match(html, /data-status="behind"/);
  assert.match(html, /dir="rtl"/);
  assert.match(html, /מה הילד מתרגל עכשיו/);
  assert.match(html, /טווח טיפוסי: 4–8 שבועות/);
  assert.match(html, /צריך חיזוק/);
  assert.match(html, /אין טענה שהקצב משפר מתמטיקה/);
  assert.equal(pace.renderPaceMeterHtml(null), '');
  assert.equal(pace.renderPaceMeterHtml(pace.paceProgress(null)), '');

  const over = pace.paceProgress({ topicId: 'mm-cur-0', sessionsDone: 99, weeksElapsed: 1 });
  const quoted = pace.renderPaceMeterHtml(Object.assign({}, over, { topic: '<i>"x"</i>', goal: "a'b" }));
  assert.match(pace.renderPaceMeterHtml(over), /width:100%/);
  assert.doesNotMatch(quoted, /<i>/);
  assert.match(quoted, /&lt;i&gt;&quot;x&quot;&lt;\/i&gt;/);
  assert.match(quoted, /a&#39;b/);
});

test('every tab and printable card has one line saying what is practised and why', () => {
  view.SLOTS.concat(['reportCard', 'classBoardCard', 'parentCard', 'worksheetCard']).forEach((id) => {
    assert.ok(pace.featureIntro(id).length > 20, 'no intro line for ' + id);
  });
  view.SLOTS.forEach((id) => assert.equal(view.TAB_WHY[id], pace.featureIntro(id), id));
  ['אין כזה', null, 'constructor', '__proto__'].forEach((bad) => assert.equal(pace.featureIntro(bad), ''));
});

test('mountPaceIntros puts the line after the heading once, however often it runs', () => {
  function el(tag, intro) {
    const node = {
      tagName: tag, className: '', textContent: '', children: [], parentNode: null, nextSibling: null,
      ownerDocument: { createElement: el },
      appendChild(child) { return node.insertBefore(child, null); },
      insertBefore(child, before) {
        const at = before ? node.children.indexOf(before) : -1;
        child.parentNode = node;
        node.children.splice(at < 0 ? node.children.length : at, 0, child);
        node.children.forEach((c, i) => { c.nextSibling = node.children[i + 1] || null; });
        return child;
      },
      getAttribute() { return intro == null ? null : intro; },
      querySelector(sel) {
        const want = sel.replace('.', '');
        return node.children.filter((c) => (sel[0] === '.' ? c.className === want : c.tagName === want))[0] || null;
      },
    };
    return node;
  }
  const card = el('div', 'parentCard');
  const head = card.appendChild(el('h2'));
  const body = card.appendChild(el('p'));
  const unknown = el('div', 'אין כזה');
  const scope = { querySelectorAll: () => [card, unknown] };

  assert.equal(pace.mountPaceIntros(scope), 1);
  assert.equal(pace.mountPaceIntros(scope), 1);
  assert.deepEqual(card.children.map((c) => c.className), ['', 'mm-plan-why', '']);
  assert.equal(card.children[0], head);
  assert.equal(card.children[2], body);
  assert.equal(card.children[1].textContent, pace.featureIntro('parentCard'));
  assert.equal(unknown.children.length, 0);
  assert.equal(pace.mountPaceIntros({}), 0);
});

test('the plan card and the pace meter agree on the ranges they both show', () => {
  // learnerPlan keys its ranges by topic fragment; pace.js keys them by topic.
  // If the two ever drift, a parent sees two different numbers for one topic.
  plan.PACE.forEach((row) => {
    const step = plan.learningPath().filter((s) => s.topic.indexOf(row[0]) !== -1)[0];
    assert.ok(step, 'learnerPlan pace row «' + row[0] + '» matches no topic');
    const mine = pace.topicPace(step.topic);
    assert.equal(mine.sessionsPerWeek, row[1], 'sessions per week drifted for ' + step.topic);
    assert.equal(mine.minutes, row[2], 'minutes per session drifted for ' + step.topic);
    assert.equal(mine.weeksRange, row[3], 'weeks range drifted for ' + step.topic);
    assert.equal(mine.source, row[4], 'pace source drifted for ' + step.topic);
  });
});

test('the page loads the module, precaches it, styles it and marks the cards it explains', () => {
  const root = path.join(__dirname, '..');
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(index, /<script src="src\/lib\/pace\.js"><\/script>/);
  assert.match(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), /\.\/src\/lib\/pace\.js/);
  assert.match(fs.readFileSync(path.join(root, 'src', 'sefirot.css'), 'utf8'), /\.mm-pace-status/);
  // pace.js feeds learnerPlanView its tab lines, so it has to load first.
  assert.ok(index.indexOf('src/lib/pace.js') < index.indexOf('src/lib/learnerPlanView.js'));
  ['reportCard', 'classBoardCard', 'parentCard', 'worksheetCard'].forEach((id) => {
    assert.match(index, new RegExp('id="' + id + '" data-mm-intro="' + id + '"'), id);
  });
  // The meter rides the report and the printable parent letter.
  assert.match(index, /id="reportPace"/);
  assert.match(index, /pace\.innerHTML=paceMeterHtml\(student,who\.name\)/);
  assert.match(index, /box\.innerHTML=paceMeterHtml\(student,who\.name\)\+renderParentNoteHtml/);
});
