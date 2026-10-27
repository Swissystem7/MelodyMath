'use strict';
// #591 sequence guard (owner comment 6428226629): one test over every topic of
// grades א׳-ו׳ (curriculum/grade1-6.js and progression.js). It fails when
//   1. a topic comes before a topic it needs (progression.js PREREQ),
//   2. a topic has more than one primary music way,
//   3. a way that exists today is deleted (a dropped way stays as EXTRA),
//   4. in place value and subtraction above 12, one circle is not one sound.
// Test only: violations already on master are test.todo, not fixed here.
const test = require('node:test');
const assert = require('node:assert/strict');
const curriculum = require('../src/lib/curriculum');
const banks = require('../src/lib/banks');
const prog = require('../src/lib/curriculum/progression');
const tat = require('../src/lib/music/takeAwayTen');
const NP = require('../src/components/NumberPlay');

const GRADES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
const FILES = [1, 2, 3, 4, 5, 6].map((n) => require('../src/lib/curriculum/grade' + n));

const position = {};
curriculum.MATRIX.forEach((r, i) => { position[r.topicId] = i; });
const gradeOf = (id) => GRADES.indexOf(curriculum.MATRIX[position[id]].grade);
// a may come before b: an earlier grade, or the same grade at an earlier row.
const before = (a, b) => gradeOf(a) < gradeOf(b) || (gradeOf(a) === gradeOf(b) && position[a] < position[b]);

// Every music standard of every grade: [grade file, ST key, ways].
const STANDARDS = [];
FILES.forEach((f) => Object.keys(f.music || {}).forEach((key) => STANDARDS.push([f, key, f.music[key]])));

test('1. every topic of grades א׳-ו׳ comes after the topics it needs', () => {
  const late = [];
  curriculum.MATRIX.forEach((r) => {
    assert.ok(prog.PREREQ[r.topicId], r.topicId + ' is in progression.js');
    prog.PREREQ[r.topicId][0].forEach((p) => { if (!(p in position) || !before(p, r.topicId)) late.push(p + ' → ' + r.topicId); });
  });
  // A music skill sits on its topic, so it may not need a later grade either.
  STANDARDS.forEach(([f, key]) => {
    const s = curriculum.sectionForItem({ grade: f.grade, standard: banks.ST[key] });
    const tagged = s && s.topic ? curriculum.MATRIX.find((r) => r.grade === f.grade && r.topic === s.topic) : null;
    const links = prog.linksForSkill(f.grade, key, tagged ? tagged.topicId : null);
    if (!links) return;
    links.prereq.forEach((p) => { if (gradeOf(p) > GRADES.indexOf(f.grade)) late.push(p + ' → ' + f.grade + ':' + key); });
  });
  assert.deepEqual(late, []);
});

// On master these fraction standards give each level its own primary way
// (all M3, one mechanism), so they have two or three. The one-primary rule
// is not applied to them yet; each is a todo until it is (#591, #751).
// PR #745 makes fillBar the one primary fraction way; when it lands, drop
// its topics from this list so the list only gets shorter.
const MANY_PRIMARY_ON_MASTER = [
  'ד:FRAC_BAR', 'ד:FRAC_OF_QTY', 'ד:FRAC_NAMES', 'ד:FRAC_ADD_D',
  'ה:FRAC_EQUIV', 'ה:FRAC_ADD', 'ה:FRAC_OF', 'ה:FRAC_MIXED',
  'ו:FRAC_MUL', 'ו:FRAC_DIV', 'ו:G6_MIXED', 'ו:G6_FRAC_LAWS', 'ו:G6_FRAC_PART', 'ו:G6_FRAC_EST',
];
const primaryTags = (ways) => [...new Set(banks.primaryWays(ways).map(([tag]) => tag))];

test('2. no topic has more than one primary music way', () => {
  const many = STANDARDS.filter(([, , ways]) => primaryTags(ways).length > 1).map(([f, key]) => f.grade + ':' + key);
  assert.deepEqual(many.filter((name) => !MANY_PRIMARY_ON_MASTER.includes(name)), [], 'a new topic with more than one primary way');
  STANDARDS.forEach(([f, key, ways]) => assert.ok(primaryTags(ways).length >= 1, f.grade + ':' + key + ' has a primary way'));
});
MANY_PRIMARY_ON_MASTER.forEach((name) => {
  const [grade, key] = name.split(':');
  const ways = FILES.find((f) => f.grade === grade).music[key];
  test.todo('2. ' + name + ' has one primary way (master: ' + (ways ? primaryTags(ways).join(', ') : 'gone') + ')');
});

// Every way tag in grade1-6.js on master (f48deb0). A way may move between
// topics or become EXTRA, but it may not disappear. Add new tags freely.
const WAYS_ON_MASTER = `
accentNext accentSkip accentTens addWalkLine agoraSkip agorotTenGroups allGroupsSum alternateDrums anyBaseRows
areaScore armQuarterTurn balanceBars barChartMelody barCount barFill barFraction barNotes barStepWalk barSumBar
barToDegrees barTowerSteps barsAndHalf beatDecimal beatsAndRests beatsLeftOver bigCellGap billBars borrowGroupDown
borrowTenDown bracketBeatsFirst bracketGroup bracketNoteFirst callResponse carryAccentUp carryNote carryTenUp
cellGroups changeOverOriginal chordShorterNote clipClaps clipThrees clockWalk cmNote coinGroups columnHeldNote
columnNoteLength columnPattern columnPlayers columnSilence columnsAsNotes commonNoteValue compareBeatParts
compareTopAccent composePattern composeSkips cornerAccents countDownBeats countFromLandmark countOnBeats
cubeEdgeLayers cubeLayerGroups cubeRowPattern cubeSameGroups cubeSixGroups cubicLayers dayAsSong dayHourGroups
decimalNoteScale diameterTwoRadii digitMotif dottedBeats doublePhrase doubleRadiusBars durationCount edgeSteps
equalNotesDistribute equalPhrases faceAreaGroups faceEdgeGroups fillBar fillTen fiveMinuteAccents fiveMinuteClaps
fixedAccents floorWalkSides foldCorner frequencyGroupsCompare gramGroups gridBeats groupBoundsCheck groupThenCut
groupsBeforeSingles groupsFirstLongChain groupsTakeAway groupsThenMore halfCircleBar halfKiloAccents halfNoteSkip
halfSymbolGroup halfSymbolNote halfTurnBody handClap handTurnBody heelToeSteps hourAccents hourChimes hourCycle
hourGroupsThree hourTwelveGroups hundredBar hundredTwoSteps joinWalk keyAccentGroups keyFives keyGroups keyJumpRow
kiloGroupsTen layerBars layerByLayer layerCount lcmDrums lengthenByPercent levelNotes lineStepBeats
litreThousandGroups melodyAb meterGroups metreHundredGroups millionAccentLevels millionTenGroups minuteAndRest
minuteGroups mirrorPattern mirrorTriangle musicalTurns nearlyWholeNote netFoldEcho nextBeat noteLength noteValues
notesInARow notesRatioCompare oneSoundOneThing oppositeEcho ostinatoLayers outerSideGroups parallelVoices
partGroupTimes partOfHundredBar partsOfWholeBar partsRowGroups percentBar perimeterWalk periodAccentLevels
phraseFits phraseShare piBarsAround pieAsBar pieBarParts pieSectorRead piecesFillBar piecesPerUnit pitchBound
pitchMean placeLevelsAccent polygonTurns polygonWalk prismPyramidMotif quadMotif quantityAsBar quarterBarCorner
quarterCount quarterMinuteGroups quarterToWhole quarterTurnBar reciprocalNotes regroupAllLevels repeatedBars
restCount romanGroupSymbols roundBars roundBigAccent roundHourJump roundThousandAccent roundToAccent roundToGroup
rowAccent rowCellGroups rowDurations rowGroupsCompare rowStepsCompare sameLength sameWalk scaleSteps scaleTwos
sectionsFillBar sectorAsNote sectorNoteShare shapeAsBar shapeLoop shekelHundredGroups shiftedRowGroups
shortNoteBound shortenByPercent shortenNote showAsBar sideCountMotif sideNotes silenceQuarter silentLevelZero
skipReply solidFaceMotif splitNotes splitRowGroups splitToHundred splitWalk stairRows startTogether stepCycle
stickingParity subColumnSteps subWalkBack symbolKeyGroups symbolNoteLength symbolsPerKey tableCellNotes
tableGroupsSum tableRowGroups tableRowPattern takeAwayBeats tallyFives tapTempo tempoSwap tenAsOctave tenBeatBars
tenExchange tenGroupsUp tenThenMore tenfoldGroups tensAccentJumps tensBarsBack tensSequence tenthBeatGroups
tenthNotes tenthsTogether thousandAccents thousandGroups threeNoteLengths triangleMotif tripletShare turnAsBar
turnCount twoCellsJoin twoDivisions twoDrums twoNotesDifference twoRowsGroups twoSectorNotes unitBySize weekBars
weeksThenDays wholeFromPartBar wholeFromTenth wholeNotesTens zeroStartSteps
`.trim().split(/\s+/);
// The owner's lock list: each way stays on its topic, as MAIN or as EXTRA.
const LOCKED = {
  percentBar: 'ו:PERCENT', hundredBar: 'ו:PERCENT', partOfHundredBar: 'ו:PERCENT', sectionsFillBar: 'ו:PERCENT',
  areaScore: 'ג:AREA', cubeLayerGroups: 'ד:MASS_VOL', tenExchange: 'ב:PLACE_VALUE',
};

test('3. no way that exists today is deleted; a dropped way stays as EXTRA', () => {
  const now = new Set();
  STANDARDS.forEach(([, , ways]) => ways.forEach(([tag]) => now.add(tag)));
  assert.equal(WAYS_ON_MASTER.length, 265);
  assert.deepEqual(WAYS_ON_MASTER.filter((tag) => !now.has(tag)), [], 'deleted ways');
  Object.keys(LOCKED).forEach((tag) => {
    assert.ok(WAYS_ON_MASTER.includes(tag), tag + ' is in the snapshot');
    const [grade, key] = LOCKED[tag].split(':');
    const ways = FILES.find((f) => f.grade === grade).music[key] || [];
    assert.ok(ways.some(([t]) => t === tag), tag + ' stays on ' + LOCKED[tag]);
  });
  // The main ways the owner named stay MAIN where they are main today.
  assert.deepEqual(primaryTags(FILES[5].music.PERCENT), ['percentBar']);
  assert.deepEqual(primaryTags(FILES[1].music.PLACE_VALUE), ['tenExchange']);
  assert.deepEqual(primaryTags(FILES[2].music.AREA), ['areaScore']);
});

// Strikes of play(): one playVoice call per sound, nothing else.
function strikes(spec) {
  const calls = [];
  const ac = { currentTime: 0, state: 'running', resume() {} };
  tat.play(spec, { audioContext: ac, playVoice: (c, v, hz, t, dest, opts) => calls.push({ v, dur: opts && opts.dur }) });
  return calls;
}
const circlesInDom = (spec) => (tat.circlesHtml(spec).match(/class="snd-circle /g) || []).length;

test('4. place value above 12: one circle is one sound, a ten is one drum', () => {
  const specs = banks.allItems().filter((it) => it.skill === 'place_value').map(tat.specForItem).filter((s) => s && s.bells > 12);
  assert.ok(specs.length > 0, 'shipped place-value items above 12 reach the circles');
  specs.forEach((s) => {
    const ev = tat.soundEvents(s);
    assert.equal(ev.length, s.circles.length, s.bells + ': one sound per circle');
    s.circles.forEach((c, i) => assert.equal(ev[i].kind, c.kind, s.bells + ': circle ' + i + ' sounds as itself'));
    assert.equal(ev.filter((e) => e.v === 10).length, s.drums, s.bells + ': a ten is one sound');
    assert.equal(ev.filter((e) => e.v === 1).length, s.left, s.bells + ': ones are single sounds');
    assert.equal(circlesInDom(s), s.circles.length);
    assert.equal(strikes(s).length, s.circles.length, s.bells + ': one strike per circle');
  });
});

test('4. subtraction above 12: one circle is one sound, a ten is one held sound', () => {
  const subs = banks.allItems().filter((it) => it.skill === 'subtraction');
  const specs = subs.map((it) => tat.specForItem({ music: 'takeAwayBeats', prompt: it.prompt })).filter((s) => s && s.start > 12);
  assert.ok(specs.length > 0, 'shipped subtraction items above 12 reach the circles');
  specs.forEach((s) => {
    const start = tat.soundEvents(s).filter((e) => e.phase === 'start');
    assert.equal(start.length, s.circles.length, s.start + ': one sound per circle');
    assert.equal(start.filter((e) => e.kind === 'drum' && e.v === 10).length, Math.floor(s.start / 10), s.start + ': a ten is one sound');
    assert.equal(circlesInDom(s), s.circles.length);
    const opening = strikes(s).slice(0, s.circles.length);
    assert.equal(opening.filter((c) => c.dur === 0.45).length, Math.floor(s.start / 10), s.start + ': one held strike per ten');
    assert.equal(opening.filter((c) => c.v === 'woodClick').length, s.start % 10, s.start + ': ones on woodClick');
  });
  // The number-play strip under the same items: one circle per sound there too.
  let strips = 0;
  subs.forEach((it) => {
    const plan = NP.extractNumberPlan(it);
    if (!plan || !plan.groups.some((g) => g.value > 12)) return;
    strips += 1;
    assert.equal((NP.renderHtml(plan).match(/class="np-dot/g) || []).length, plan.totalSounds, it.prompt);
    assert.equal(plan.notes.length, plan.totalSounds, it.prompt);
  });
  assert.ok(strips > 0, 'shipped subtraction items above 12 reach the number-play strip');
});
