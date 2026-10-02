const test = require('node:test');
const assert = require('node:assert/strict');
const access = require('../src/lib/access');

function memory() {
  const m = Object.create(null);
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
  };
}

test('prefs default to off and ignore garbage', () => {
  const ls = memory();
  assert.deepEqual(access.loadAccess(ls), access.normalizePrefs({}));
  ls.setItem(access.ACCESS_KEY, '{');
  assert.equal(access.loadAccess(ls).speak, false);
  assert.deepEqual(access.normalizePrefs({ contrast: 1, extra: true }).contrast, true);
  assert.equal(Object.prototype.hasOwnProperty.call(access.normalizePrefs({ extra: true }), 'extra'), false);
});

test('toggle persists on the device store and body classes follow', () => {
  const ls = memory();
  const on = access.toggleAccess('contrast', ls);
  assert.equal(on.contrast, true);
  assert.deepEqual(access.bodyClassList(on), ['mm-contrast']);
  const off = access.toggleAccess('contrast', ls);
  assert.equal(off.contrast, false);
  assert.deepEqual(access.bodyClassList({ large: true, quiet: true }), ['mm-large', 'mm-quiet']);
  assert.equal(access.toggleAccess('nope', ls).speak, false);
});

test('speech helpers are inert in Node and refuse an empty string', () => {
  assert.equal(access.speakHebrew('שלום'), false);
  assert.equal(access.speakIfEnabled('שלום', { speak: true }), false);
  assert.doesNotThrow(() => access.cancelSpeech());
});

test('wait after an answer stretches only when the teacher asked, not under reduced motion', () => {
  assert.equal(access.waitAfterAnswer({}, false), 700);
  assert.equal(access.waitAfterAnswer({ wait: true }, false), 1400);
  assert.equal(access.waitAfterAnswer({ wait: true }, true), 200);
});

test('hear groups are capped and rejected when they are not countable beats', () => {
  assert.deepEqual(access.sanitizeHear([3, 2]), [3, 2]);
  assert.equal(access.sanitizeHear([0]), null);
  assert.equal(access.sanitizeHear([13]), null);
  assert.equal(access.sanitizeHear('5'), null);
  assert.deepEqual(access.setActiveHear([5]), [5]);
  assert.deepEqual(access.getActiveHear(), [5]);
  assert.equal(access.setActiveHear([]), null);
});

test('refreshSpeakNow hides the speak button when there is no prompt', () => {
  const btn = { hidden: false, disabled: false };
  const doc = {
    getElementById: (id) => (id === 'mm-speak-now' ? btn : null),
    querySelector: () => null,
  };
  assert.equal(access.refreshSpeakNow(doc), '');
  assert.equal(btn.hidden, true);
  assert.equal(btn.disabled, true);
});

test('currentPromptText reads the visible class-mode prompt first', () => {
  const nodes = {
    '#classPlay:not(.hidden) #classPrompt': { textContent: '  כמה תופים?  ' },
    '#prompt': { textContent: 'other' },
  };
  const doc = {
    querySelector: (sel) => nodes[sel] || null,
  };
  assert.equal(access.currentPromptText(doc), 'כמה תופים?');
  assert.equal(access.currentPromptText({ querySelector: () => null }), '');
});

// ---------------------------------------------------------------------------
// R2-C — makeAnonLogEntry: one anonymous log row from one UI event.
//
// Every expected row below was written out by hand from the rules in the
// header of src/lib/access.js. No clock, no storage, no network.
// ---------------------------------------------------------------------------

const EMPTY_ROW = {
  type: 'other',
  tOffsetMs: null,
  grade: null,
  level: null,
  skill: null,
  correct: null,
  durationBucket: null,
};

test('a full practice event becomes exactly seven known fields', () => {
  assert.deepEqual(access.makeAnonLogEntry({
    type: 'exerciseCompleted',
    at: 1000,
    grade: 'ב',
    level: 2,
    skill: 'multiplication',
    correct: true,
    durationMs: 7000,
  }, 400), {
    type: 'exerciseCompleted',
    tOffsetMs: 600,
    grade: 'ב',
    level: 2,
    skill: 'multiplication',
    correct: true,
    durationBucket: '5-15s',
  });

  assert.deepEqual(access.ANON_LOG_FIELDS,
    ['type', 'tOffsetMs', 'grade', 'level', 'skill', 'correct', 'durationBucket']);
  // always the same keys in the same order, so the log is a table
  ['pageOpened', 'audioStarted', 'settingChanged', 'nonsense'].forEach((type) => {
    assert.deepEqual(Object.keys(access.makeAnonLogEntry({ type: type })),
      access.ANON_LOG_FIELDS, type);
  });
  assert.deepEqual(access.makeAnonLogEntry(null), EMPTY_ROW);
  assert.deepEqual(access.makeAnonLogEntry(), EMPTY_ROW);
  assert.deepEqual(access.makeAnonLogEntry('exerciseCompleted'), EMPTY_ROW);
});

test('anything that could name a child is never read, not merely removed', () => {
  const nosy = {
    type: 'exerciseCompleted',
    at: 5000,
    // the fields anonLog.js bans by name
    name: 'דנה כהן', fullName: 'דנה כהן', studentName: 'דנה',
    email: 'a@b.co.il', phone: '050-0000000', idNumber: '123456789',
    tz: '123456789', address: 'הרצל 1', classCode: 'ב3', notes: 'צריכה עזרה',
    // and the fields its /name|email|phone|address|tz|id/ blocklist lets past
    birthday: '2018-04-01', school: 'בית חינוך', teacher: 'נועה',
    city: 'חיפה', gender: 'f', nickname: 'דני', deviceSerial: 'ABC-123',
    ip: '10.0.0.7', userAgent: 'Mozilla/5.0',
  };
  const row = access.makeAnonLogEntry(nosy, 1000);
  assert.deepEqual(row, {
    type: 'exerciseCompleted',
    tOffsetMs: 4000,
    grade: null, level: null, skill: null, correct: null, durationBucket: null,
  });
  // nothing from the event survived anywhere in the serialised row
  const json = JSON.stringify(row);
  ['דנה', 'כהן', 'a@b.co.il', '050', '123456789', 'הרצל', 'ב3',
    '2018-04-01', 'בית חינוך', 'נועה', 'חיפה', 'ABC-123', '10.0.0.7',
    'Mozilla'].forEach((leak) => {
    assert.equal(json.indexOf(leak), -1, leak + ' leaked into ' + json);
  });

  // two children whose answers were identical produce identical rows: the row
  // carries nothing that tells them apart
  const a = access.makeAnonLogEntry({ type: 'exerciseCompleted', at: 5000, correct: true, studentName: 'דנה' }, 1000);
  const b = access.makeAnonLogEntry({ type: 'exerciseCompleted', at: 5000, correct: true, studentName: 'יואב' }, 1000);
  assert.deepEqual(a, b);
});

test('the row carries an offset from an origin the caller passed, never a clock', () => {
  // no origin, no timestamp — and emphatically not "now"
  assert.equal(access.makeAnonLogEntry({ type: 'audioStarted', at: 1757000000000 }).tOffsetMs, null);
  assert.equal(access.makeAnonLogEntry({ type: 'audioStarted' }, 400).tOffsetMs, null);
  // the origin may travel on the event instead of as an argument
  assert.equal(access.makeAnonLogEntry({ type: 'audioStarted', at: 5000, origin: 1000 }).tOffsetMs, 4000);
  // an explicit origin wins
  assert.equal(access.makeAnonLogEntry({ type: 'audioStarted', at: 5000, origin: 1000 }, 4000).tOffsetMs, 1000);
  // whole milliseconds, and never negative — a clock that stepped back is 0
  assert.equal(access.makeAnonLogEntry({ type: 'pageOpened', at: 1000.6 }, 0).tOffsetMs, 1001);
  assert.equal(access.makeAnonLogEntry({ type: 'pageOpened', at: 100 }, 900).tOffsetMs, 0);
  ['5000', null, NaN, Infinity, {}].forEach((bad) => {
    assert.equal(access.makeAnonLogEntry({ type: 'pageOpened', at: bad }, 0).tOffsetMs, null, String(bad));
    assert.equal(access.makeAnonLogEntry({ type: 'pageOpened', at: 5000 }, bad).tOffsetMs, null, String(bad));
  });

  // and the function really does not read a clock: break Date.now and it
  // still answers, identically, twice
  const realNow = Date.now;
  Date.now = () => { throw new Error('makeAnonLogEntry must not read a clock'); };
  try {
    const first = access.makeAnonLogEntry({ type: 'exerciseCompleted', at: 3000, correct: false }, 1000);
    const second = access.makeAnonLogEntry({ type: 'exerciseCompleted', at: 3000, correct: false }, 1000);
    assert.deepEqual(first, second);
    assert.equal(first.tOffsetMs, 2000);
  } finally {
    Date.now = realNow;
  }
});

test('an event type outside the list is counted, not quoted', () => {
  access.ANON_EVENTS.forEach((type) => {
    assert.equal(access.makeAnonLogEntry({ type: type }).type, type);
  });
  // a free-text type is a text field, and a text field is where a name ends up
  ['exerciseCompleted:דנה', 'EXERCISECOMPLETED', 'exercise completed', '',
    42, null, undefined, {}].forEach((type) => {
    assert.equal(access.makeAnonLogEntry({ type: type }).type, access.ANON_OTHER, String(type));
  });
  assert.equal(access.ANON_OTHER, 'other');
});

test('grade, level and skill are coarse or they are null', () => {
  // the grade vocabulary is the one banks.js ships, and must not drift
  assert.deepEqual(access.ANON_GRADES, require('../src/lib/banks').GRADES);
  ['א', 'ב', 'ג', 'ד'].forEach((gr) => {
    assert.equal(access.makeAnonLogEntry({ type: 'pageOpened', grade: gr }).grade, gr);
  });
  ['ה', 'ו', 'B', '2', 2, '', null].forEach((gr) => {
    assert.equal(access.makeAnonLogEntry({ type: 'pageOpened', grade: gr }).grade, null, String(gr));
  });

  [[1, 1], [2, 2], [3, 3], [2.4, 2], [0.6, 1]].forEach(([given, want]) => {
    assert.equal(access.makeAnonLogEntry({ type: 'pageOpened', level: given }).level, want, String(given));
  });
  [0, 4, 3.6, -1, '2', null, NaN].forEach((lv) => {
    assert.equal(access.makeAnonLogEntry({ type: 'pageOpened', level: lv }).level, null, String(lv));
  });

  const skill = (s) => access.makeAnonLogEntry({ type: 'pageOpened', skill: s }).skill;
  assert.equal(skill('multiplication'), 'multiplication');
  assert.equal(skill('place-value'), 'place-value');
  assert.equal(skill('  counting  '), 'counting');
  assert.equal(skill('a'.repeat(32)), 'a'.repeat(32));
  // a typed name looks exactly like the things this refuses
  ['דנה', 'דנה כהן', 'my name', '_x', '', 'a'.repeat(33), 'naïve', 5, null].forEach((s) => {
    assert.equal(skill(s), null, String(s));
  });
});

test('how long the child took is kept as a bucket, not as a fingerprint', () => {
  const bucket = (ms) => access.makeAnonLogEntry({ type: 'exerciseCompleted', durationMs: ms }).durationBucket;
  assert.deepEqual(access.ANON_DURATION_BUCKETS, ['0-5s', '5-15s', '15-60s', '60s+']);
  assert.equal(bucket(0), '0-5s');
  assert.equal(bucket(4999), '0-5s');
  assert.equal(bucket(5000), '5-15s');
  assert.equal(bucket(14999), '5-15s');
  assert.equal(bucket(15000), '15-60s');
  assert.equal(bucket(59999), '15-60s');
  assert.equal(bucket(60000), '60s+');
  assert.equal(bucket(3600000), '60s+');
  [-1, NaN, Infinity, '7000', null, undefined].forEach((ms) => {
    assert.equal(bucket(ms), null, String(ms));
  });
  // 7413 ms and 7009 ms are the same row: the millisecond is gone for good
  assert.deepEqual(access.makeAnonLogEntry({ type: 'exerciseCompleted', durationMs: 7413 }),
    access.makeAnonLogEntry({ type: 'exerciseCompleted', durationMs: 7009 }));
});

test('correct is a flag, and the whole row survives JSON untouched', () => {
  assert.equal(access.makeAnonLogEntry({ type: 'exerciseCompleted', correct: true }).correct, true);
  assert.equal(access.makeAnonLogEntry({ type: 'exerciseCompleted', correct: false }).correct, false);
  [1, 0, 'true', '', null, undefined].forEach((c) => {
    assert.equal(access.makeAnonLogEntry({ type: 'exerciseCompleted', correct: c }).correct, null, String(c));
  });

  const row = access.makeAnonLogEntry({
    type: 'audioStopped', at: 9000, grade: 'ד', level: 3,
    skill: 'graph_listen', correct: false, durationMs: 61000,
  }, 1000);
  assert.deepEqual(JSON.parse(JSON.stringify(row)), row);
  assert.deepEqual(row, {
    type: 'audioStopped', tOffsetMs: 8000, grade: 'ד', level: 3,
    skill: 'graph_listen', correct: false, durationBucket: '60s+',
  });
});
