'use strict';
// #591: every item of a grade with a ways file learns its standard through
// music. A prompt that already plays sound is a music activity; every other
// item takes the research-backed way of its level from the grade file, with a
// source and an evidence label. Grades without a ways file are untouched.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = require('../src/lib/banks');

const FILES = { 'ו': require('../src/lib/curriculum/grade6'), 'א': require('../src/lib/curriculum/grade1'), 'ד': require('../src/lib/curriculum/grade4'), 'ה': require('../src/lib/curriculum/grade5'), 'ג': require('../src/lib/curriculum/grade3'), 'ב': require('../src/lib/curriculum/grade2') };
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const keyOf = (file, it) => Object.keys(file.music).find((k) => banks.ST[k] === it.standard);
const cubeItem = (it) => /תיבה|קובי/.test(it.prompt);
const wayOf = (file, it) => {
  const listed = file.music[keyOf(file, it)] || [];
  // Grade ד׳ only: a cube item is solved with the volume way, not the kg one.
  if (file.grade === 'ד' && it.standard === banks.ST.MASS_VOL && cubeItem(it)) {
    return listed.find((w) => w[0] === 'cubeLayerGroups');
  }
  const ways = banks.primaryWays(listed);
  return ways.length ? ways[Math.min(it.level, ways.length) - 1] : undefined;
};

Object.keys(FILES).forEach((grade) => {
  const file = FILES[grade];
  const items = banks.itemsForGrade(grade).filter((it) => !it.noMusic);

  test('grade ' + grade + ': every item has a music side, activity or way', () => {
    assert.ok(items.length > 100);
    items.forEach((it) => assert.ok(it.music, it.id + ' ' + it.prompt));
    items.forEach((it) => {
      if (it.musicNote) {
        assert.ok(it.musicSrc && it.musicEv, it.id);
        const way = wayOf(file, it);
        assert.ok(way, it.id + ' has no way for ' + it.standard + ' level ' + it.level);
        assert.deepEqual([it.music, it.musicNote, it.musicSrc, it.musicEv], way.slice(0, 4), it.id);
      } else {
        assert.ok(banks.MUSIC_SOURCES[it.musicSrc] && it.musicEv, it.id + ' activity ' + it.music);
      }
    });
  });

  test('grade ' + grade + ': every standard with items is met through at least two musical models', () => {
    Object.keys(file.music).forEach((k) => {
      assert.ok(banks.ST[k], grade + ' ' + k + ' is not a bank standard');
      const ways = file.music[k];
      // One main way per level (1-3), plus an optional extra; a topic whose
      // main way was replaced (#751) keeps the old ways as optional ones,
      // never a fourth primary.
      assert.ok(ways.length >= 2 && ways.length <= 4, k);
      assert.ok(banks.primaryWays(ways).length <= 3, k);
      assert.equal(new Set(ways.map(([tag]) => tag)).size, ways.length, k + ' repeats a tag');
      assert.equal(new Set(ways.map(([, note]) => note)).size, ways.length, k + ' repeats a note');
    });
    const byStd = {};
    items.filter((it) => it.musicNote).forEach((it) => {
      const s = byStd[it.standard] || (byStd[it.standard] = { levels: new Set(), tags: new Set() });
      s.levels.add(it.level);
      s.tags.add(it.music);
    });
    Object.keys(byStd).forEach((std) => {
      // Dosage rule 4: one consistent way per topic, so a standard may have a
      // single primary way; with more, levels take different ones.
      const key = Object.keys(file.music).find((k) => banks.ST[k] === std);
      const n = banks.primaryWays(file.music[key]).length;
      if (grade === 'ד' && key === 'MASS_VOL') {
        assert.equal(n, 1, 'MASS_VOL has one main way');
        assert.ok(byStd[std].tags.has('kiloGroupsTen') && byStd[std].tags.has('cubeLayerGroups'), grade + ' ' + std);
      } else {
        assert.equal(byStd[std].tags.size, new Set([...byStd[std].levels].map((l) => Math.min(l, n))).size, grade + ' ' + std);
      }
    });
    // A way tag is never an activity tag of the same grade.
    const activityTags = new Set(items.filter((it) => !it.musicNote).map((it) => it.music));
    Object.values(file.music).forEach((ways) => ways.forEach(([tag]) => assert.ok(!activityTags.has(tag), grade + ' ' + tag)));
  });

  test('grade ' + grade + ': each way is Hebrew, short, and carries a real source with an evidence label', () => {
    Object.values(file.music).forEach((ways) => ways.forEach(([tag, note, src, ev]) => {
      assert.match(tag, /^[a-z][A-Za-z0-9]+$/);
      assert.match(note, /[א-ת]/);
      assert.ok(note.length < 140, note.length + ' ' + note);
      assert.ok(file.sources[src] || banks.MUSIC_SOURCES[src], grade + ' ' + tag + ' → ' + src);
      assert.ok(['D', 'R', 'A'].includes(ev), tag + ' ' + ev);
    }));
    Object.keys(file.sources).forEach((id) => {
      const [label, url] = file.sources[id];
      assert.ok(label.length > 5, id);
      assert.match(url, /^https:\/\//, id);
      assert.deepEqual(banks.MUSIC_SOURCES[id], file.sources[id], id + ' differs between grade files');
    });
  });
});

test('grade א׳: a prompt that plays sound is a music activity, not a way', () => {
  const items = banks.itemsForGrade('א').filter((it) => !it.noMusic);
  const hear = items.filter((it) => it.hear && it.hear.length);
  const g1 = items.filter((it) => it.g1);
  assert.ok(hear.length >= 10 && g1.length >= 3);
  hear.forEach((it) => assert.equal(it.music, 'hearBeats', it.id));
  g1.forEach((it) => assert.equal(it.music, 'g1' + it.g1.kind.charAt(0).toUpperCase() + it.g1.kind.slice(1), it.id));
  hear.concat(g1).forEach((it) => assert.equal(it.musicNote, undefined, it.id));
  assert.equal(items.filter((it) => it.musicNote).length, items.length - hear.length - g1.length);
});

test('grade ד׳: a 4/4-bar fraction item is music notation already, an activity and not a way', () => {
  const items = banks.itemsForGrade('ד');
  const bars = items.filter((it) => it.widget === 'bar44');
  assert.ok(bars.length >= 10);
  bars.forEach((it) => assert.equal(it.music, 'bar44Notes', it.id));
  bars.forEach((it) => assert.equal(it.musicNote, undefined, it.id));
  assert.equal(items.filter((it) => it.musicNote).length, items.length - bars.length);
});

test('grade ה׳: the music activities of #106 keep their tag and take no way', () => {
  const items = banks.itemsForGrade('ה');
  const acts = items.filter((it) => !it.musicNote);
  assert.ok(acts.length >= 30);
  acts.forEach((it) => assert.ok(['bars', 'lcm', 'mixedBar', 'bpm', 'secPerBeat', 'drumsMeet', 'meters', 'hzChart'].includes(it.music), it.id + ' ' + it.music));
  assert.equal(items.filter((it) => it.musicNote).length, items.length - acts.length);
});

test('grade ג׳: the #105 activities keep their tag and the g3 widgets become activities, no way', () => {
  const items = banks.itemsForGrade('ג');
  const g3 = items.filter((it) => it.g3);
  assert.ok(g3.length >= 20);
  g3.forEach((it) => assert.equal(it.music, 'g3' + it.g3.kind.charAt(0).toUpperCase() + it.g3.kind.slice(1), it.id));
  const acts = items.filter((it) => !it.musicNote);
  acts.forEach((it) => assert.ok(it.g3 || ['meters', 'tuneTime', 'stepGrid', 'leftoverBeats', 'howManyTimes', 'hzCompare'].includes(it.music), it.id + ' ' + it.music));
  assert.equal(items.filter((it) => it.musicNote).length, items.length - acts.length);
});

test('grade ב׳: the #103 activities keep their tag and take no way', () => {
  const items = banks.itemsForGrade('ב').filter((it) => !it.noMusic);
  const acts = items.filter((it) => !it.musicNote);
  assert.ok(acts.length >= 50);
  acts.forEach((it) => assert.ok(['beatsBars', 'twoInstruments', 'evenOdd', 'registers', 'halfBar'].includes(it.music), it.id + ' ' + it.music));
  assert.equal(items.filter((it) => it.musicNote).length, items.length - acts.length);
});

test('every item of every grade has a music side: 1255/1255', () => {
  const all = banks.allItems();
  assert.equal(all.length, 1255); // + 15 MASS_VOL in ד׳, minus 3 kg/liter removed from ב׳ (#751), + 3 explorer exercises and 3 silent checks (#688) + 2 pattern and worked example items (#670) + 6 ה׳ perimeter (#711)
  assert.equal(all.filter((it) => it.music || it.noMusic).length, all.length);
  assert.equal(all.filter((it) => it.musicNote && !(it.musicSrc && it.musicEv)).length, 0);
  assert.deepEqual(banks.GRADES.filter((g) => !FILES[g]), []);
});

test('a music-side file adds no curriculum rows, loads before banks.js on every page, and is cached offline', () => {
  [['א', 'grade1'], ['ד', 'grade4'], ['ה', 'grade5'], ['ג', 'grade3'], ['ב', 'grade2']].forEach(([grade, name]) => {
    const file = FILES[grade];
    assert.equal(file.rows, undefined, name);
    assert.deepEqual(file.items, [], name);
    ['index.html', 'program.html', 'curriculum.html'].forEach((f) => {
      const html = read(f);
      const at = html.indexOf('<script src="src/lib/banks.js">');
      const fat = html.indexOf('<script src="src/lib/curriculum/' + name + '.js">');
      assert.ok(at > 0 && fat >= 0 && fat < at, f + ' ' + name);
    });
    assert.ok(read('sw.js').includes('curriculum/' + name + '.js'), name);
  });
  assert.ok(Number(read('sw.js').match(/melodymath-offline-v(\d+)/)[1]) >= 27, 'a new asset, so CACHE moves');
});

test('#710: grades ד׳-ה׳ EQ_INEQ cite Knuth et al. 2006 next to azaryahu2020, without a DOI, on every item', () => {
  [['ד', 'grade4'], ['ה', 'grade5']].forEach(([grade, name]) => {
    const file = FILES[grade];
    const [label, url] = file.sources.knuth2006;
    assert.match(label, /Knuth et al\. 2006 — Does Understanding the Equal Sign Matter\?/, name);
    assert.ok(!/doi|10\.2307/i.test(url), name + ' ' + url);
    file.music.EQ_INEQ.forEach((w) => {
      assert.equal(w[2], 'azaryahu2020', name + ' ' + w[0]);
      assert.deepEqual(w[4].also, ['knuth2006'], name + ' ' + w[0]);
      assert.equal(banks.isOptionalWay(w), w[0] !== 'balanceBars', name + ' ' + w[0]);
    });
    const items = banks.itemsForGrade(grade).filter((it) => it.standard === banks.ST.EQ_INEQ);
    assert.ok(items.length >= 9, name);
    items.forEach((it) => {
      assert.equal(it.musicSrc, 'azaryahu2020', it.id);
      assert.deepEqual(it.musicSrcAlso, ['knuth2006'], it.id);
    });
  });
  assert.equal(banks.allItems().filter((it) => it.musicSrcAlso && it.standard !== banks.ST.EQ_INEQ).length, 0);
});

test('grade א׳ #751: PATTERN is taught with fixed accents (das2023), and CHART100 that builds on it starts the same way', () => {
  const g1 = FILES['א'];
  const ways = g1.music.PATTERN;
  const primary = banks.primaryWays(ways);
  assert.equal(primary.length, 1);
  assert.deepEqual([primary[0][0], primary[0][2]], ['fixedAccents', 'das2023']);
  assert.equal(ways[0], primary[0]);
  // The MusiMath ways stay as extra practice and keep their D label.
  ['melodyAb', 'mirrorPattern', 'composePattern'].forEach((tag) => {
    const w = ways.find(([t]) => t === tag);
    assert.ok(w && banks.isOptionalWay(w), tag);
    assert.equal(w[3], 'D', tag);
    assert.notEqual(w[4].evidence, 'weak', tag);
  });
  // The next topic in bank order builds on patterns and opens with das2023.
  const order = Object.keys(banks.ST);
  assert.equal(order[order.indexOf('PATTERN') + 1], 'CHART100');
  assert.equal(g1.music.CHART100[0][2], 'das2023');
  assert.equal(banks.primaryWays(g1.music.CHART100)[0][2], 'das2023');
  const items = banks.itemsForGrade('א').filter((it) => it.standard === banks.ST.PATTERN && it.musicNote);
  assert.ok(items.length > 0);
  items.forEach((it) => {
    assert.equal(it.music, 'fixedAccents', it.id);
    assert.deepEqual(it.musicExtra.map((x) => x.music), ['melodyAb', 'mirrorPattern', 'composePattern'], it.id);
  });
});

test('#751 batch 2: one main way per topic; the others stay as EXTRA with their rating', () => {
  const MAIN = {
    'ב': { DIV_PART: 'phraseShare', DIV_QUOT: 'phraseShare', WORD_COLLECT: 'callResponse', WORD_REMOVE: 'takeAwayBeats', MASS_VOL: 'layerBars' },
    'ג': { MUL_C: 'repeatedBars', DIV_PART: 'phraseShare', DIV_QUOT: 'phraseShare', TRI_SORT: 'triangleMotif', MINUTES: 'hourTwelveGroups' },
  };
  Object.keys(MAIN).forEach((grade) => {
    Object.keys(MAIN[grade]).forEach((k) => {
      const ways = FILES[grade].music[k];
      const primary = banks.primaryWays(ways);
      assert.deepEqual(primary.map(([tag]) => tag), [MAIN[grade][k]], grade + ' ' + k);
      assert.equal(ways[0], primary[0], grade + ' ' + k + ' main way first');
      assert.ok(ways.length >= 2, grade + ' ' + k);
      ways.forEach((w) => assert.ok(['A', 'D', 'R'].includes(w[3]), grade + ' ' + k + ' ' + w[0]));
      const items = banks.itemsForGrade(grade).filter((it) => it.standard === banks.ST[k] && it.musicNote);
      assert.ok(items.length > 0, grade + ' ' + k);
      items.forEach((it) => assert.equal(it.music, MAIN[grade][k], it.id));
    });
  });
});

test('#751 batch 3: grade ג׳ topics keep one main way, the others stay as EXTRA with their rating', () => {
  const WAYS = {
    AREA: ['areaScore', 'repeatedBars'],
    PICTOGRAM: ['keyAccentGroups', 'halfSymbolGroup', 'rowGroupsCompare'],
    BARCHART: ['columnNoteLength', 'twoNotesDifference', 'notesInARow'],
    TABLE: ['cellGroups', 'tableGroupsSum'],
    DIV_REM: ['phraseShare', 'repeatedBars'],
    NUM10K: ['thousandAccents', 'tenGroupsUp'],
    TIME_MIN_SEC: ['minuteGroups', 'quarterMinuteGroups', 'minuteAndRest'],
    ADD_SUB_10K: ['carryAccentUp', 'borrowGroupDown', 'roundToAccent'],
    WORD_TWO_STEP: ['groupsThenMore', 'groupsTakeAway'],
    TIMES_MORE: ['phraseFits', 'repeatedBars', 'phraseShare'],
    MUL_DIV_10: ['tenfoldGroups', 'hundredTwoSteps'],
  };
  const g3 = FILES['ג'];
  Object.keys(WAYS).forEach((k) => {
    const [main, ...extra] = WAYS[k];
    const ways = g3.music[k];
    const primary = banks.primaryWays(ways);
    assert.deepEqual(primary.map(([tag]) => tag), [main], k);
    assert.equal(ways[0], primary[0], k + ' main way first');
    extra.forEach((tag) => {
      const w = ways.find(([t]) => t === tag);
      assert.ok(w && banks.isOptionalWay(w), k + ' ' + tag);
      assert.equal(w[3], 'A', k + ' ' + tag + ' keeps its rating');
    });
    const items = banks.itemsForGrade('ג').filter((it) => it.standard === banks.ST[k] && it.musicNote);
    items.forEach((it) => assert.equal(it.music, main, it.id));
  });
});

test('#751 batch 4: grade ד׳ topics keep one main way, the others stay as EXTRA with their rating', () => {
  const WAYS = {
    QUAD_SORT: ['quadMotif', 'oppositeEcho', 'mirrorPattern'],
    BOX: ['faceEdgeGroups', 'layerCount', 'cubeSameGroups'],
    UNITS: ['metreHundredGroups', 'thousandGroups', 'piecesPerUnit'],
    CALENDAR: ['weekBars', 'dayHourGroups', 'weeksThenDays'],
    BARCHART: ['columnHeldNote', 'notesRatioCompare', 'barChartMelody'],
    TABLE: ['rowCellGroups', 'twoCellsJoin', 'bigCellGap'],
    NUM_MILLION: ['millionAccentLevels', 'compareTopAccent'],
    ADD_SUB_MILLION: ['carryTenUp', 'borrowTenDown', 'roundThousandAccent'],
    MUL_DIV_VERT: ['repeatedBars', 'phraseShare'],
    ORDER_OPS: ['barCount', 'groupsBeforeSingles', 'bracketGroup'],
    EQ_INEQ: ['balanceBars', 'fillBar', 'sameLength'],
    BOX_AREA: ['faceAreaGroups', 'areaScore', 'cubeSixGroups'],
    PIE: ['pieAsBar', 'sectorNoteShare'],
  };
  const g4 = FILES['ד'];
  Object.keys(WAYS).forEach((k) => {
    const [main, ...extra] = WAYS[k];
    const ways = g4.music[k];
    const primary = banks.primaryWays(ways);
    assert.deepEqual(primary.map(([tag]) => tag), [main], k);
    assert.equal(ways[0], primary[0], k + ' main way first');
    extra.forEach((tag) => {
      const w = ways.find(([t]) => t === tag);
      assert.ok(w && banks.isOptionalWay(w), k + ' ' + tag);
      assert.equal(w[3], 'A', k + ' ' + tag + ' keeps its rating');
    });
    // Only a topic with no grade ד׳ items is skipped here; every item of the
    // others that takes a way (not a music activity) takes the main one.
    const items = banks.itemsForGrade('ד').filter((it) => it.standard === banks.ST[k] && it.musicNote);
    items.forEach((it) => assert.equal(it.music, main, it.id));
  });
});

test('#751 batch 5: grade ה׳ and ו׳ topics keep one main way, the others stay as EXTRA with their rating', () => {
  const WAYS = {
    'ה': {
      DEC_PLACE: ['tenthNotes', 'beatDecimal', 'compareBeatParts'],
      DEC_ADD: ['tenthsTogether', 'beatDecimal', 'beatsLeftOver'],
      NUM_BIG: ['periodAccentLevels', 'millionTenGroups'],
      OPS_MILLION: ['regroupAllLevels', 'repeatedBars', 'roundBigAccent'],
      EQ_INEQ: ['balanceBars', 'fillBar', 'sameLength'],
      PRIME_FACTOR: ['meterGroups', 'accentSkip'],
      TRI_AREA: ['areaScore', 'anyBaseRows'],
      PARA_AREA: ['areaScore', 'shiftedRowGroups'],
      SOLIDS: ['solidFaceMotif', 'netFoldEcho', 'prismPyramidMotif'],
      FREQ: ['tallyFives', 'frequencyGroupsCompare', 'allGroupsSum'],
      PICTOGRAM: ['symbolKeyGroups', 'keyJumpRow', 'twoRowsGroups'],
      PIE: ['pieBarParts', 'twoSectorNotes'],
    },
    'ו': {
      DEC_MUL: ['decimalNoteScale', 'beatDecimal', 'tenthBeatGroups'],
      PERCENT: ['percentBar', 'sectionsFillBar', 'hundredBar', 'partOfHundredBar'],
      G6_DECIMAL_SYS: ['romanGroupSymbols', 'placeLevelsAccent', 'silentLevelZero'],
      G6_NAT_OPS: ['groupsFirstLongChain', 'ostinatoLayers', 'groupThenCut'],
      G6_NAT_EST: ['roundToGroup', 'partGroupTimes', 'groupBoundsCheck'],
      G6_DEC_EST: ['nearlyWholeNote', 'shortNoteBound'],
      G6_DEC_LAWS: ['bracketBeatsFirst', 'tempoSwap', 'equalNotesDistribute'],
      G6_PCT_WHOLE: ['wholeFromTenth', 'splitToHundred', 'quarterToWhole'],
      G6_PCT_CHANGE: ['shortenByPercent', 'lengthenByPercent', 'changeOverOriginal'],
      G6_CIRCLE_TERMS: ['sectorAsNote', 'diameterTwoRadii', 'chordShorterNote'],
      G6_CIRCLE_CALC: ['piBarsAround', 'halfCircleBar', 'doubleRadiusBars'],
      G6_COMP_TRI: ['partsRowGroups', 'outerSideGroups', 'areaScore'],
      G6_BOX_VOL: ['cubeLayerGroups', 'layerByLayer', 'cubeEdgeLayers', 'layerCount'],
      G6_VOL_UNITS: ['litreThousandGroups', 'cubicLayers', 'unitBySize'],
      G6_MEAN: ['levelNotes', 'equalPhrases'],
      G6_DATA_READ: ['columnsAsNotes', 'pieSectorRead', 'symbolNoteLength'],
      G6_DATA_SHOW: ['showAsBar', 'symbolsPerKey', 'barToDegrees'],
    },
  };
  Object.keys(WAYS).forEach((grade) => {
    const file = FILES[grade];
    Object.keys(WAYS[grade]).forEach((k) => {
      const [main, ...extra] = WAYS[grade][k];
      const ways = file.music[k];
      const primary = banks.primaryWays(ways);
      assert.deepEqual(primary.map(([tag]) => tag), [main], grade + ' ' + k);
      assert.equal(ways[0], primary[0], grade + ' ' + k + ' main way first');
      extra.forEach((tag) => {
        const w = ways.find(([t]) => t === tag);
        assert.ok(w && banks.isOptionalWay(w), grade + ' ' + k + ' ' + tag);
        assert.equal(w[3], 'A', grade + ' ' + k + ' ' + tag + ' keeps its rating');
      });
      // Every item of the topic that takes a way (not a music activity)
      // takes the main one.
      const items = banks.itemsForGrade(grade).filter((it) => it.standard === banks.ST[k] && it.musicNote);
      items.forEach((it) => assert.equal(it.music, main, it.id));
    });
  });
});

test('PERCENT has exactly one primary way: percentBar', () => {
  const ways = FILES['ו'].music.PERCENT;
  assert.deepEqual(banks.primaryWays(ways).map(([tag]) => tag), ['percentBar']);
  assert.equal(banks.isOptionalWay(ways.find(([tag]) => tag === 'sectionsFillBar')), true);
});

test('#751: grade ד׳ MASS_VOL has one main way beside UNITS, and grade ג׳ has neither the ways nor the exercises', () => {
  const g3 = FILES['ג'];
  const g4 = FILES['ד'];
  assert.equal(g3.music.MASS_VOL, undefined);
  Object.keys(g3.music).forEach((k) => assert.ok(banks.primaryWays(g3.music[k]).length >= 1, k));
  const order = Object.keys(g4.music);
  assert.equal(order[order.indexOf('UNITS') + 1], 'MASS_VOL');
  const ways = g4.music.MASS_VOL;
  assert.deepEqual(ways.map((w) => w[0]), ['kiloGroupsTen', 'gramGroups', 'halfKiloAccents', 'cubeLayerGroups']);
  const gram = ways[1];
  assert.equal(gram[0], 'gramGroups');
  assert.equal(gram[1], 'ק״ג הוא 1,000 גרם, עשר קבוצות של 100. מחיאה לכל 100 גרם והדגשה כל עשר מחיאות — כל הדגשה היא ק״ג שלם.');
  assert.equal(banks.isOptionalWay(gram), true);
  const primary = banks.primaryWays(ways);
  assert.equal(primary.length, 1);
  assert.equal(primary[0][0], 'kiloGroupsTen');
  assert.equal(banks.isOptionalWay(primary[0]), false);
  ways.forEach((w) => {
    assert.deepEqual([w[2], w[3]], ['das2023', 'A'], w[0]);
    if (w[0] !== 'kiloGroupsTen') assert.equal(banks.isOptionalWay(w), true, w[0]);
  });
  const vol = banks.itemsForGrade('ד').filter((it) => it.standard === banks.ST.MASS_VOL && cubeItem(it));
  const mass = banks.itemsForGrade('ד').filter((it) => it.standard === banks.ST.MASS_VOL && !cubeItem(it));
  assert.ok(vol.length >= 12 && mass.length >= 6);
  vol.forEach((it) => {
    assert.equal(it.music, 'cubeLayerGroups', it.prompt);
    assert.match(it.musicNote, /נפח תיבה/, it.prompt);
    assert.ok(!(it.musicExtra || []).some((x) => x.music === 'gramGroups' || /ק״ג|גרם/.test(x.note)), it.prompt);
  });
  mass.forEach((it) => {
    assert.equal(it.music, 'kiloGroupsTen', it.prompt);
    assert.match(it.musicNote, /ק״ג/, it.prompt);
    assert.ok((it.musicExtra || []).some((x) => x.music === 'gramGroups' && x.note === gram[1] && x.ev === 'A'), it.prompt);
    assert.ok(!(it.musicExtra || []).some((x) => x.music === 'cubeLayerGroups'), it.prompt);
  });
  // All 21 prompts from 847674c, grade adapted to ד׳. A prompt already in ד׳
  // is not copied again. None of them is in ג׳.
  const PROMPTS = [
    'תיבה בנויה מ־2 שכבות של 6 קוביות. כמה קוביות יש בה?',
    'שק אחד שוקל 3 ק״ג ושק שני 5 ק״ג. בכמה ק״ג השני כבד יותר?',
    'תיבה בנויה מ־3 שכבות של 5 קוביות. כמה קוביות יש בה?',
    'בקבוק מחזיק 1 ליטר. כמה כוסות של חצי ליטר ממלאות אותו?',
    'תיבה בנויה מ־2 שכבות, ובכל שכבה 3 שורות של 4 קוביות. כמה קוביות יש בה?',
    'מזגנו 2 ליטר מים לכוסות של חצי ליטר. כמה כוסות מילאנו?',
    'כמה גרם יש בחצי ק״ג?',
    'כמה מ״ל יש ב־1 ליטר?',
    'כמה גרם יש ב־2 ק״ג?',
    'כמה מ״ל יש ב־3 ליטר?',
    'שקית סוכר שוקלת 250 גרם. כמה שקיות נכנסות ב־1 ק״ג?',
    'בבקבוק 1 ליטר ועוד 500 מ״ל. כמה מ״ל בסך הכול?',
    'תיבה בנויה מ־4 שכבות של 4 קוביות. כמה קוביות יש בה?',
    'תיבה בנויה משכבה אחת של 3 שורות, ובכל שורה 3 קוביות. כמה קוביות יש בה?',
    'בתיבה 10 קוביות. הוצאנו 3. כמה קוביות נשארו?',
    'תיבה בנויה מ־5 שכבות של 2 קוביות. כמה קוביות יש בה?',
    'תיבה בנויה מ־2 שכבות של 10 קוביות. כמה קוביות יש בה?',
    'בתיבה 12 קוביות, ובכל שכבה 4 קוביות. מכמה שכבות היא בנויה?',
    'תיבה בנויה מ־2 שכבות של 5 קוביות. הוסיפו לה עוד שכבה כזאת. כמה קוביות יש בה עכשיו?',
    'תיבה בנויה מ־3 שכבות, ובכל שכבה 2 שורות של 3 קוביות. כמה קוביות יש בה?',
    'תיבה אחת בנויה מ־2 שכבות של 6 קוביות, ותיבה שנייה מ־3 שכבות של 3 קוביות. בכמה קוביות יש בראשונה יותר?',
  ];
  const inGrade = (grade) => banks.itemsForGrade(grade).filter((it) => it.standard === banks.ST.MASS_VOL);
  const g2 = inGrade('ב');
  assert.equal(g2.length, 12);
  assert.ok(g2.every(cubeItem), 'grade ב keeps cube counting only');
  assert.equal(banks.itemsForGrade('ב').filter((it) => /ק״ג|ליטר/.test(it.prompt)).length, 0);
  assert.equal(inGrade('ג').length, 0);
  assert.deepEqual(banks.itemsForGrade('ג').filter((it) => PROMPTS.includes(it.prompt)).map((it) => it.prompt), []);
  const mine = inGrade('ד').filter((it) => PROMPTS.includes(it.prompt));
  assert.equal(mine.length, PROMPTS.length);
  assert.deepEqual(mine.map((it) => it.prompt).sort(), PROMPTS.slice().sort());
  mine.forEach((it) => assert.equal(it.grade, 'ד', it.prompt));
});

test('#751: grade ב׳ has no kg/liter method as primary', () => {
  const g2 = FILES['ב'];
  Object.keys(g2.music).forEach((k) => {
    banks.primaryWays(g2.music[k]).forEach((w) => {
      assert.doesNotMatch(w[0], /gram|kilo|litre|liter/i, k + ' ' + w[0]);
      assert.doesNotMatch(w[1], /ק״ג|ליטר/, k + ' ' + w[0]);
    });
  });
  Object.values(g2.music).forEach((list) => assert.ok(!list.some((w) => w[0] === 'gramGroups')));
  const ways = g2.music.MASS_VOL;
  assert.deepEqual(ways.map((w) => w[0]), ['layerBars', 'cubeRowPattern']);
  assert.deepEqual(banks.primaryWays(ways).map((w) => w[0]), ['layerBars']);
  banks.itemsForGrade('ב').filter((it) => it.standard === banks.ST.MASS_VOL).forEach((it) => {
    assert.equal(it.music, 'layerBars', it.prompt);
    assert.doesNotMatch(it.musicNote, /ק״ג|ליטר/);
  });
});

test('#751: no cube-volume item references kg', () => {
  const kg = /ק״ג|גרם|gramGroups|kiloGroupsTen|halfKiloAccents/;
  const cubes = banks.allItems().filter((it) => it.standard === banks.ST.MASS_VOL && cubeItem(it));
  assert.ok(cubes.length >= 24);
  cubes.forEach((it) => {
    assert.doesNotMatch(it.music || '', kg, it.prompt);
    assert.doesNotMatch(it.musicNote || '', kg, it.prompt);
    (it.musicExtra || []).forEach((x) => assert.doesNotMatch(x.music + '\n' + x.note, kg, it.prompt));
  });
  banks.itemsForGrade('ב').filter((it) => it.standard === banks.ST.MASS_VOL).forEach((it) => {
    assert.equal(it.music, 'layerBars', it.prompt);
  });
  const g4 = FILES['ד'].music.MASS_VOL;
  assert.equal(g4[0][0], 'kiloGroupsTen');
  assert.equal(banks.isOptionalWay(g4[0]), false);
  const gram = g4.find((w) => w[0] === 'gramGroups');
  assert.equal(gram[1], 'ק״ג הוא 1,000 גרם, עשר קבוצות של 100. מחיאה לכל 100 גרם והדגשה כל עשר מחיאות — כל הדגשה היא ק״ג שלם.');
  assert.equal(banks.isOptionalWay(gram), true);
});
