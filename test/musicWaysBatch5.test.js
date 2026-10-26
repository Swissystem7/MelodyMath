'use strict';
// #751 batch 5: the grade ה׳/ו׳ topics that batches 1-4 (#760, #763,
// #767, #770) do not cover keep exactly one MAIN musical way. The MAIN
// way is the first, carried way; every other way stays as EXTRA/WEAK
// practice. Nothing is deleted, and the change reaches the child's
// practice screen: every item that takes a way takes the MAIN one, and
// the demoted ways stay visible/audible as its musicExtra.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');

const FILES = {
  'ה': require('../src/lib/curriculum/grade5'),
  'ו': require('../src/lib/curriculum/grade6'),
};

// [MAIN, ...other ways in file order] per topic, from the curriculum files.
const WAYS = {
  'ה': {
    DEC_PLACE: ['tenthNotes', 'beatDecimal', 'compareBeatParts'],
    DEC_ADD: ['tenthsTogether', 'beatDecimal', 'beatsLeftOver'],
    NUM_BIG: ['periodAccentLevels', 'millionTenGroups', 'tenAsOctave'],
    OPS_MILLION: ['regroupAllLevels', 'repeatedBars', 'roundBigAccent'],
    EQ_INEQ: ['balanceBars', 'fillBar', 'sameLength'],
    PRIME_FACTOR: ['meterGroups', 'lcmDrums', 'accentSkip'],
    TRI_AREA: ['areaScore', 'polygonWalk', 'anyBaseRows'],
    PARA_AREA: ['areaScore', 'polygonWalk', 'shiftedRowGroups'],
    SOLIDS: ['solidFaceMotif', 'netFoldEcho', 'prismPyramidMotif'],
    FREQ: ['tallyFives', 'frequencyGroupsCompare', 'allGroupsSum'],
    PICTOGRAM: ['symbolKeyGroups', 'keyJumpRow', 'twoRowsGroups'],
    PIE: ['pieBarParts', 'twoSectorNotes', 'phraseShare'],
  },
  'ו': {
    DEC_MUL: ['decimalNoteScale', 'beatDecimal', 'tenthBeatGroups'],
    PERCENT: ['percentBar', 'sectionsFillBar', 'hundredBar', 'partOfHundredBar'],
    G6_DECIMAL_SYS: ['romanGroupSymbols', 'placeLevelsAccent', 'silentLevelZero'],
    G6_NAT_OPS: ['groupsFirstLongChain', 'ostinatoLayers', 'groupThenCut'],
    G6_NAT_EST: ['roundToGroup', 'partGroupTimes', 'groupBoundsCheck'],
    G6_DEC_EST: ['nearlyWholeNote', 'pitchBound', 'shortNoteBound'],
    G6_DEC_LAWS: ['bracketBeatsFirst', 'tempoSwap', 'equalNotesDistribute'],
    G6_PCT_WHOLE: ['wholeFromTenth', 'splitToHundred', 'quarterToWhole'],
    G6_PCT_CHANGE: ['shortenByPercent', 'lengthenByPercent', 'changeOverOriginal'],
    G6_CIRCLE_TERMS: ['sectorAsNote', 'diameterTwoRadii', 'chordShorterNote'],
    G6_CIRCLE_CALC: ['piBarsAround', 'halfCircleBar', 'doubleRadiusBars'],
    G6_COMP_TRI: ['partsRowGroups', 'outerSideGroups', 'areaScore'],
    G6_BOX_VOL: ['layerByLayer', 'cubeEdgeLayers', 'layerCount'],
    G6_VOL_UNITS: ['litreThousandGroups', 'cubicLayers', 'unitBySize'],
    G6_MEAN: ['levelNotes', 'tapTempo', 'equalPhrases', 'pitchMean'],
    G6_DATA_READ: ['columnsAsNotes', 'pieSectorRead', 'symbolNoteLength'],
    G6_DATA_SHOW: ['showAsBar', 'symbolsPerKey', 'barToDegrees'],
  },
};

test('#751 batch 5: exactly one MAIN way per grade ה׳/ו׳ topic, the rest EXTRA on the practice screen', () => {
  Object.keys(WAYS).forEach((grade) => {
    const file = FILES[grade];
    Object.keys(WAYS[grade]).forEach((k) => {
      const expected = WAYS[grade][k];
      const [main, ...extra] = expected;
      const ways = file.music[k];
      assert.ok(ways, grade + ' ' + k + ' has ways');
      // Nothing deleted, order kept, MAIN first.
      assert.deepEqual(ways.map(([tag]) => tag), expected, grade + ' ' + k);
      // Exactly one MAIN (primary) way.
      const primary = banks.primaryWays(ways);
      assert.equal(primary.length, 1, grade + ' ' + k + ' has exactly one MAIN way');
      assert.equal(primary[0][0], main, grade + ' ' + k + ' MAIN');
      assert.equal(ways[0], primary[0], grade + ' ' + k + ' MAIN way first');
      assert.equal(banks.isOptionalWay(primary[0]), false, grade + ' ' + k + ' MAIN is not optional');
      // Every other way is optional practice and keeps its rating.
      extra.forEach((tag) => {
        const w = ways.find(([t]) => t === tag);
        assert.ok(w && banks.isOptionalWay(w), grade + ' ' + k + ' ' + tag + ' is EXTRA');
        assert.ok(['A', 'D', 'R'].includes(w[3]), grade + ' ' + k + ' ' + tag + ' keeps its rating');
      });
      // Visible/audible on the practice screen: items take the MAIN way,
      // and the demoted ways stay attached as musicExtra.
      const items = banks.itemsForGrade(grade).filter((it) => it.standard === banks.ST[k] && it.musicNote);
      assert.ok(items.length > 0, grade + ' ' + k + ' has items on the practice screen');
      items.forEach((it) => {
        assert.equal(it.music, main, it.id);
        assert.deepEqual((it.musicExtra || []).map((x) => x.music), extra, it.id);
      });
    });
  });
});
