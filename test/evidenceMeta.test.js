'use strict';
// #685 (rules: #665): decimals, percent and ratio carry evidence
// 'experimental' and explicit buildsFrom links in teacher metadata, and
// grades א׳-ב׳ never use staff notation by default.
const test = require('node:test');
const assert = require('node:assert/strict');
const curriculum = require('../src/lib/curriculum');
const banks = require('../src/lib/banks');
const meta = require('../src/lib/curriculum/evidenceMeta');

const GRADES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
const rowOf = (id) => curriculum.MATRIX.find((r) => r.topicId === id);

// A decimals, percent or ratio topic: the decimals strand (percent sits in it
// in grade ו׳), or a topic named for percent or ratio. «מבנה עשרוני» rows are
// whole-number place value (strand numbers) and are not included.
const isTarget = (r) => r.strand === 'decimals' || /אחוז|יחס|פרופורצי/.test(r.topic);
const targets = curriculum.MATRIX.filter(isTarget);

test('the curriculum has decimals and percent topics to label', () => {
  assert.ok(targets.some((r) => /עשרוני/.test(r.topic)), 'no decimals topic found');
  assert.ok(targets.some((r) => /אחוז/.test(r.topic)), 'no percent topic found');
});

test('every decimals/percent/ratio topic is marked experimental', () => {
  targets.forEach((r) => {
    const m = meta.metaForTopic(r.topicId);
    assert.ok(m, r.topicId + ' «' + r.topic + '» has no evidence entry');
    assert.equal(m.evidence, 'experimental', r.topicId);
    assert.ok(m.buildsFrom.length > 0, r.topicId + ' has no buildsFrom links');
  });
});

test('every entry is a real decimals/percent/ratio topic', () => {
  Object.keys(meta.META).forEach((id) => {
    const r = rowOf(id);
    assert.ok(r, id + ' is not a curriculum topic');
    assert.ok(isTarget(r), id + ' «' + r.topic + '» is not decimals/percent/ratio');
  });
});

test('every buildsFrom id exists in the curriculum and comes no later', () => {
  Object.keys(meta.META).forEach((id) => {
    const own = GRADES.indexOf(rowOf(id).grade);
    meta.metaForTopic(id).buildsFrom.forEach((p) => {
      const r = rowOf(p);
      assert.ok(r, id + ' builds from unknown topic ' + p);
      assert.notEqual(p, id, id + ' builds from itself');
      assert.ok(GRADES.indexOf(r.grade) <= own, id + ' builds from later grade topic ' + p);
    });
  });
});

test('metaForTopic returns a copy, and null for a topic without an entry', () => {
  const m = meta.metaForTopic('mm-cur-53');
  m.buildsFrom.push('x');
  assert.ok(!meta.metaForTopic('mm-cur-53').buildsFrom.includes('x'));
  assert.equal(meta.metaForTopic('mm-cur-0'), null);
  assert.equal(meta.metaForTopic('no-such-topic'), null);
});

test('grades א׳-ב׳ do not use staff notation by default', () => {
  const staff = new Set(meta.STAFF_NOTATION_TAGS);
  ['א', 'ב'].forEach((grade) => {
    const items = banks.itemsForGrade(grade);
    assert.ok(items.length > 0, 'grade ' + grade + ' has items');
    items.forEach((it) => {
      assert.ok(!staff.has(it.music), grade + ': «' + it.q + '» uses ' + it.music);
      assert.ok(!staff.has(it.widget), grade + ': «' + it.q + '» uses widget ' + it.widget);
      (it.musicExtra || []).forEach((x) => {
        assert.ok(!staff.has(x.music), grade + ': «' + it.q + '» extra uses ' + x.music);
      });
    });
  });
  [1, 2].forEach((n) => {
    const file = require('../src/lib/curriculum/grade' + n);
    Object.keys(file.music || {}).forEach((k) => {
      file.music[k].forEach((way) => {
        assert.ok(!staff.has(way[0]), 'grade' + n + '.js ' + k + ' way ' + way[0]);
      });
    });
  });
});
