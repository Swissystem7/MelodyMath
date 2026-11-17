'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const dataWorlds = require('../src/lib/music/dataWorlds');
const mastery = require('../src/lib/mastery');
const curriculum = require('../src/lib/curriculum');
const grade6 = require('../src/lib/curriculum/grade6');
const banks = require('../src/lib/banks');

test('dataWorlds: mean calculation and auditory events from chart bars and multi-column prompts', () => {
  // Mean from chart bars (TOURS: [30, 45, 40, 35, 50], average = 40)
  const toursChart = {
    bars: [
      { label: '10:00', value: 30 },
      { label: '11:00', value: 45 },
      { label: '12:00', value: 40 },
      { label: '13:00', value: 35 },
      { label: '14:00', value: 50 },
    ],
  };
  const chartItem = {
    music: 'levelNotes',
    prompt: 'הדיאגרמה מראה כמה משתתפים יצאו לכל סיור. מה מספר המשתתפים הממוצע לסיור?',
    answer: 40,
    chart: toursChart,
  };
  const chartSpec = dataWorlds.specForItem(chartItem);
  assert.ok(chartSpec, 'spec should be created for chart mean');
  assert.equal(chartSpec.kind, 'mean');
  assert.equal(chartSpec.value, 40);
  assert.equal(chartSpec.floor, 30);
  assert.equal(chartSpec.unit, 5);

  const chartEvents = dataWorlds.soundEvents(chartSpec);
  assert.ok(chartEvents.length > 0);
  const floorEvents = chartEvents.filter((e) => e.stage === 'floor');
  assert.equal(floorEvents.length, 5, 'one floor stroke per dancer');
  const shareEvents = chartEvents.filter((e) => e.stage === 'share');
  assert.equal(shareEvents.length, 10, 'two rounds of five dancers');

  // Mean from multi-column prompt
  const colPromptItem = {
    music: 'levelNotes',
    prompt: 'בשלוש עמודות יש 3, 5 ו־7 הקשות. מה הממוצע?',
    answer: 5,
  };
  const colSpec = dataWorlds.specForItem(colPromptItem);
  assert.ok(colSpec);
  assert.equal(colSpec.kind, 'mean');
  assert.equal(colSpec.value, 5);
  assert.equal(colSpec.floor, 3);

  // Mean with identical numbers (everyone at floor)
  const equalPromptItem = {
    music: 'levelNotes',
    prompt: 'מה הממוצע של 6, 6, 6?',
    answer: 6,
  };
  const equalSpec = dataWorlds.specForItem(equalPromptItem);
  assert.ok(equalSpec);
  assert.equal(equalSpec.value, 6);
  assert.equal(equalSpec.share, 0);

  // Mean resulting in fractional pieces
  const fracItem = {
    music: 'levelNotes',
    prompt: 'הקשתם 4 פעמים: 80, 81, 82 ו־84 BPM. מה הקצב הממוצע?',
    answer: 81.75,
  };
  const fracSpec = dataWorlds.specForItem(fracItem);
  assert.ok(fracSpec);
  assert.equal(fracSpec.value, 81.75);
  const fracEvents = dataWorlds.soundEvents(fracSpec);
  const pieces = fracEvents.filter((e) => e.stage === 'piece');
  assert.equal(pieces.length, 12, 'three units left, each shared to 4 dancers');
});

test('dataWorlds: mode calculation, frequency detection, and auditory pitch runs', () => {
  // Mode from explicit prompt
  const modeItem = {
    music: 'levelNotes',
    prompt: 'מהו השכיח בקבוצת המספרים: 4, 7, 7, 9?',
    answer: 7,
  };
  const modeSpec = dataWorlds.specForItem(modeItem);
  assert.ok(modeSpec);
  assert.equal(modeSpec.kind, 'values');
  assert.equal(modeSpec.value, 7);

  // Auditory pitches in order
  const modeEvents = dataWorlds.soundEvents(modeSpec);
  const valueNotes = modeEvents.filter((e) => e.stage === 'value');
  assert.deepEqual(valueNotes.map((n) => n.v), [4, 7, 7, 9]);
  const hzList = valueNotes.map((n) => n.hz);
  assert.ok(hzList[1] > hzList[0]);
  assert.equal(hzList[1], hzList[2]); // same pitch for repeated mode value
  assert.ok(hzList[3] > hzList[2]);

  // Frequency of a specific number
  const freqItem = {
    music: 'tallyFives',
    prompt: 'מספר האחים של תלמידי קבוצה: 1, 2, 2, 3, 1, 2, 4, 2, 0. מה השכיחות של המספר 2?',
    answer: 4,
  };
  const freqSpec = dataWorlds.specForItem(freqItem);
  assert.ok(freqSpec);
  assert.equal(freqSpec.value, 4);

  // Multimodal count
  const multiModeItem = {
    music: 'tallyFives',
    prompt: 'הציונים בבוחן: 7, 8, 8, 9, 9, 10. כמה שכיחים יש?',
    answer: 2,
  };
  const multiSpec = dataWorlds.specForItem(multiModeItem);
  assert.ok(multiSpec);
  assert.equal(multiSpec.kind, 'modesCount');
  assert.equal(multiSpec.value, 2);

  // No mode / all single occurrences returns null for unique mode prompt
  const noModeItem = {
    music: 'levelNotes',
    prompt: 'מהו השכיח בקבוצת המספרים: 2, 4, 6, 8?',
    answer: 2,
  };
  assert.equal(dataWorlds.specForItem(noModeItem), null);
});

test('dataWorlds: column comparison logic, scaling, and comparative audio events', () => {
  // Column comparison from prompt
  const colCompItem = {
    music: 'showAsBar',
    prompt: 'בגרף, עמודה א׳ היא 60 ועמודה ב׳ 70. בכמה ב׳ גבוהה יותר?',
    answer: 10,
  };
  const compSpec = dataWorlds.specForItem(colCompItem);
  assert.ok(compSpec, 'columnCompare spec created');
  assert.equal(compSpec.kind, 'columnCompare');
  assert.equal(compSpec.diff, 10);
  assert.equal(compSpec.value, 10);
  assert.equal(compSpec.unit, 10);

  // Sound events: col1 (60/10=6), col2 (70/10=7), diff (10/10=1)
  const compEvents = dataWorlds.soundEvents(compSpec);
  const col1Notes = compEvents.filter((e) => e.stage === 'col1');
  const col2Notes = compEvents.filter((e) => e.stage === 'col2');
  const diffNotes = compEvents.filter((e) => e.stage === 'diff');
  assert.equal(col1Notes.length, 6);
  assert.equal(col2Notes.length, 7);
  assert.equal(diffNotes.length, 1);
  assert.equal(diffNotes[0].voice, 'metalBell');

  // Chart-based column comparison (e.g. TOURS 14:00 at 50 vs 10:00 at 30)
  const chartCompItem = {
    music: 'columnsAsNotes',
    prompt: 'הדיאגרמה מראה כמה משתתפים יצאו לכל סיור. בכמה משתתפים היו יותר בסיור של 14:00 מבסיור של 10:00?',
    answer: 20,
    chart: {
      bars: [
        { label: '10:00', value: 30 },
        { label: '14:00', value: 50 },
      ],
    },
  };
  const chartCompSpec = dataWorlds.specForItem(chartCompItem);
  assert.ok(chartCompSpec);
  assert.equal(chartCompSpec.kind, 'columnCompare');
  assert.equal(chartCompSpec.diff, 20);
  assert.equal(chartCompSpec.unit, 5);

  // Direct bar chart column comparison prompt
  const directBarItem = {
    music: 'columnsAsNotes',
    prompt: 'בדיאגרמת עמודות: עמודה כחול בגובה 8 ועמודה אדום בגובה 5. מה ההפרש ביניהן?',
    answer: 3,
  };
  const directBarSpec = dataWorlds.specForItem(directBarItem);
  assert.ok(directBarSpec);
  assert.equal(directBarSpec.kind, 'columnCompare');
  assert.equal(directBarSpec.diff, 3);
  assert.equal(directBarSpec.unit, 1);

  // Printable widget formatting
  const widgetHtml = dataWorlds.printableWidget(compSpec);
  assert.ok(widgetHtml.includes('sheet-data-columns'));
  assert.ok(widgetHtml.includes('הפרש: 10'));
  assert.ok(widgetHtml.includes('כל הקשה = עשרה'));

  // HTML rendering and no leak
  const html = dataWorlds.html(compSpec);
  assert.ok(html.includes('השוואת עמודות'));
  assert.ok(!html.includes('snd-answer'));
  const revealedHtml = dataWorlds.html(compSpec, { revealed: true });
  assert.ok(revealedHtml.includes('<span class="snd-answer">10</span>'));
});

test('dataWorlds: probability calculations, fraction reduction, and auditory events', () => {
  // Marbles in jar: 3 red, 2 blue -> P(red) = 3/5
  const marbleItem = {
    music: 'showAsBar',
    prompt: 'בכד 3 כדורים אדומים ו־2 כדורים כחולים. מה ההסתברות להוציא כדור אדום? (כשבר)',
    answer: '3/5',
  };
  const probSpec = dataWorlds.specForItem(marbleItem);
  assert.ok(probSpec);
  assert.equal(probSpec.kind, 'probability');
  assert.equal(probSpec.fav, 3);
  assert.equal(probSpec.total, 5);
  assert.equal(probSpec.value, '3/5');

  // Auditory events: 3 favorable pluck + 2 other bowed + 1 closing bell
  const probEvents = dataWorlds.soundEvents(probSpec);
  const favHits = probEvents.filter((e) => e.stage === 'fav');
  const otherHits = probEvents.filter((e) => e.stage === 'other');
  const chime = probEvents.filter((e) => e.stage === 'totalChime');
  assert.equal(favHits.length, 3);
  assert.equal(otherHits.length, 2);
  assert.equal(chime.length, 1);

  // Fair die: even number probability -> 3/6 reduced to 1/2
  const dieItem = {
    music: 'showAsBar',
    prompt: 'מטילים קובייה הוגנת. מה הסיכוי לקבל מספר זוגי? (כשבר)',
    answer: '1/2',
  };
  const dieSpec = dataWorlds.specForItem(dieItem);
  assert.ok(dieSpec);
  assert.equal(dieSpec.value, '1/2');

  // Equal spinner: 4 colors -> 1/4
  const spinItem = {
    music: 'showAsBar',
    prompt: 'בסביבון 4 צבעים שווים. מה הסיכוי שייפול על כחול? (כשבר)',
    answer: '1/4',
  };
  const spinSpec = dataWorlds.specForItem(spinItem);
  assert.ok(spinSpec);
  assert.equal(spinSpec.value, '1/4');

  // Equal chance from total items
  const cardItem = {
    music: 'probabilityChance',
    prompt: 'מה ההסתברות שכרטיס מתוך 8 שווים? (כשבר)',
    answer: '1/8',
  };
  const cardSpec = dataWorlds.specForItem(cardItem);
  assert.ok(cardSpec);
  assert.equal(cardSpec.value, '1/8');

  // Printable widget
  const probWidget = dataWorlds.printableWidget(probSpec);
  assert.ok(probWidget.includes('sheet-data-probability'));
  assert.ok(probWidget.includes('3 מתוך 5'));

  // No answer leakage in unrevealed HTML
  const unrevealed = dataWorlds.html(probSpec);
  assert.ok(!unrevealed.includes('3/5'));
});

test('dataWorlds: tier auditory feedback generates distinct acoustic signatures for review levels', () => {
  // Correct feedback across tiers
  const t1Correct = dataWorlds.tierAuditoryFeedback(1, true);
  const t2Correct = dataWorlds.tierAuditoryFeedback(2, true);
  const t3Correct = dataWorlds.tierAuditoryFeedback(3, true);

  assert.equal(t1Correct.length, 3, 'tier 1 has 3 supportive notes');
  assert.equal(t1Correct[0].voice, 'pluck');
  assert.equal(t2Correct.length, 2, 'tier 2 has 2 guided notes');
  assert.equal(t2Correct[0].voice, 'woodBar');
  assert.equal(t3Correct.length, 2, 'tier 3 has crisp 2-note resolution');
  assert.equal(t3Correct[0].voice, 'tine');

  // Distinct frequencies across tiers
  assert.notEqual(t1Correct[0].hz, t2Correct[0].hz);
  assert.notEqual(t2Correct[0].hz, t3Correct[0].hz);

  // Retry cues across tiers
  const t1Retry = dataWorlds.tierAuditoryFeedback(1, false);
  const t2Retry = dataWorlds.tierAuditoryFeedback(2, false);
  const t3Retry = dataWorlds.tierAuditoryFeedback(3, false);
  assert.ok(t1Retry.some((e) => e.voice === 'reed'));
  assert.ok(t2Retry.some((e) => e.voice === 'drumLow'));
  assert.ok(t3Retry.every((e) => e.voice === 'woodClick'));

  // play feedback with audioContext and silent fallback
  const mockCalls = [];
  const mockEnv = {
    playVoice: (ac, voice, hz, when) => mockCalls.push({ voice, hz, when }),
    audioContext: { currentTime: 0, state: 'suspended', resume() { this.state = 'running'; } },
  };
  const played = dataWorlds.play({ kind: 'feedback', tier: 1, isCorrect: true }, mockEnv);
  assert.equal(played.notes, 3);
  assert.equal(mockCalls.length, 3);
  assert.equal(mockEnv.audioContext.state, 'running');

  const silentPlay = dataWorlds.play({ kind: 'feedback', tier: 2, isCorrect: false }, {});
  assert.deepEqual(silentPlay, { notes: 2, silent: true });
});

test('mastery: topicMastery evaluates student history accuracy and status', () => {
  const catalog = [
    { id: 'm1', topic: 'ממוצע', standard: 'G6_MEAN', skill: 'data' },
    { id: 'm2', topic: 'ממוצע', standard: 'G6_MEAN', skill: 'data' },
    { id: 'm3', topic: 'ממוצע', standard: 'G6_MEAN', skill: 'data' },
  ];

  // 1. Untested topic -> status 'low', isLowMastery true
  const emptyRes = mastery.topicMastery([], 'ממוצע', catalog);
  assert.equal(emptyRes.attempts, 0);
  assert.equal(emptyRes.status, 'low');
  assert.equal(emptyRes.isLowMastery, true);
  assert.equal(emptyRes.mastered, false);

  // 2. Low accuracy (1 correct out of 3 = 33%) -> status 'low'
  const lowHist = [
    { id: 'm1', correct: false },
    { id: 'm2', correct: true },
    { id: 'm3', correct: false },
  ];
  const lowRes = mastery.topicMastery(lowHist, 'ממוצע', catalog);
  assert.equal(lowRes.attempts, 3);
  assert.equal(lowRes.correct, 1);
  assert.ok(lowRes.accuracy < 0.6);
  assert.equal(lowRes.status, 'low');
  assert.equal(lowRes.isLowMastery, true);

  // 3. Practicing (1 correct out of 1 = 100%, but fewer than 2 hits required)
  const singleHist = [{ id: 'm1', correct: true }];
  const singleRes = mastery.topicMastery(singleHist, 'ממוצע', catalog);
  assert.equal(singleRes.status, 'practicing');
  assert.equal(singleRes.mastered, false);

  // 4. Mastered (3 correct out of 3 = 100%)
  const masterHist = [
    { id: 'm1', correct: true },
    { id: 'm2', correct: true },
    { id: 'm3', correct: true },
  ];
  const masterRes = mastery.topicMastery(masterHist, 'ממוצע', catalog);
  assert.equal(masterRes.status, 'mastered');
  assert.equal(masterRes.mastered, true);
  assert.equal(masterRes.isLowMastery, false);
});

test('mastery: multiGradeProgress scans curriculum matrix and identifies low-mastery topics', () => {
  const catalog = banks.itemsForGrade('ו');
  const sampleHistory = [
    { id: catalog[0].id, topic: 'ממוצע', correct: false },
    { id: catalog[1].id, topic: 'ממוצע', correct: false },
    { topic: 'ספירה עד 100 קדימה ואחורה ממספר כלשהו', correct: true },
    { topic: 'ספירה עד 100 קדימה ואחורה ממספר כלשהו', correct: true },
    { topic: 'מנייה עד 100, קיבוץ ל־10', correct: true },
  ];

  const progress = mastery.multiGradeProgress(sampleHistory, catalog);
  assert.ok(progress.grades);
  assert.ok(progress.grades['ו']);
  assert.ok(progress.lowMasteryTopics.length > 0);
  assert.ok(progress.masteredTopics.length > 0);
  assert.ok(progress.practicingTopics.length > 0);

  // ממוצע has 2 errors, must be detected among lowMasteryTopics
  const meanTopic = progress.lowMasteryTopics.find((t) => t.topic === 'ממוצע');
  assert.ok(meanTopic, 'ממוצע should be flagged as low mastery');
  assert.equal(meanTopic.mastery.status, 'low');
  assert.equal(progress.totalAttempts, 5);
  assert.equal(progress.totalCorrect, 3);
});

test('mastery: buildReviewPath constructs tiered review path with dataWorlds prioritization', () => {
  const grade6Items = banks.itemsForGrade('ו');
  const history = [
    { topic: 'ממוצע', correct: false },
    { topic: 'ממוצע', correct: false },
  ];

  const review = mastery.buildReviewPath(history, grade6Items, { grade: 'ו', strand: 'data' });
  assert.ok(review.path.length > 0, 'review path must have items');
  assert.ok(review.topics.length > 0);
  assert.equal(review.auditoryGuided, true);

  // Auditory feedback method
  const fb1 = review.auditoryFeedback(1, true);
  assert.ok(Array.isArray(fb1) && fb1.length > 0);
  const fb2 = review.auditoryFeedback(2, false);
  assert.ok(Array.isArray(fb2) && fb2.length > 0);

  // Strand fallback when all data topics are mastered
  const allMasteredHistory = [
    { topic: 'ממוצע', correct: true },
    { topic: 'ממוצע', correct: true },
    { topic: 'קריאה והצגה של נתונים', correct: true },
    { topic: 'קריאה והצגה של נתונים', correct: true },
  ];
  const strandReview = mastery.buildReviewPath(allMasteredHistory, grade6Items, { strand: 'data', grade: 'ו' });
  assert.ok(strandReview.path.length > 0);
  assert.ok(strandReview.topics.includes('ממוצע'));

  // Empty topics list allows all items
  const emptyTopicsReview = mastery.buildReviewPath([], [{ level: 1, strand: 'data' }], { topic: '' });
  assert.equal(emptyTopicsReview.path.length, 1);

  // Fallbacks when candidate matching topics are empty
  const fallbackStrand = mastery.buildReviewPath(history, [{ id: 'b1', strand: 'data', level: 1 }], { topic: 'noMatchTopic', strand: 'data' });
  assert.equal(fallbackStrand.path.length, 1);
  const fallbackAll = mastery.buildReviewPath(history, [{ id: 'b2', strand: 'other', level: 1 }], { topic: 'noMatchTopic', strand: 'data' });
  assert.equal(fallbackAll.path.length, 1);

  // Routing with topicId option
  const idPath = mastery.buildReviewPath(history, grade6Items, { topicId: 'mm-cur-58' });
  assert.ok(idPath);
  assert.ok(idPath.path.length > 0);

  // Items are organized into tiers 1, 2, 3
  const tiers = review.tiers;
  assert.ok(Array.isArray(tiers[1]));
  assert.ok(Array.isArray(tiers[2]));
  assert.ok(Array.isArray(tiers[3]));

  // Prioritization: first item in tier 1 is a dataWorlds item if available
  const firstItem = review.path[0];
  assert.ok(firstItem.tier <= 2);
  assert.ok(firstItem.auditoryFeedback, 'item must carry attached auditory feedback');

  // gateItems with { review: true } options returns review path
  const gatedReview = mastery.gateItems(grade6Items, history, grade6Items, { review: true, grade: 'ו', strand: 'data' });
  assert.ok(gatedReview.length > 0);
  assert.equal(gatedReview[0].tier, 1);
});

test('curriculum and grade6 integration: data topics and standards map to mastery review path', () => {
  // Curriculum data strand topics
  const g6DataTopics = curriculum.dataStrandTopics('ו');
  assert.deepEqual(g6DataTopics, ['ממוצע', 'קריאה והצגה של נתונים']);

  const allDataTopics = curriculum.dataStrandTopics();
  assert.ok(allDataTopics.length >= 6, 'must include data topics across א-ו');
  assert.ok(allDataTopics.includes('דיאגרמת עמודות ופיקטוגרם'));
  assert.ok(allDataTopics.includes('ממוצע'));

  // Grade 6 curriculum definitions
  const g6DataRows = grade6.rows.filter((r) => r.strand === 'data').map((r) => r.topic);
  assert.deepEqual(g6DataRows, ['ממוצע', 'קריאה והצגה של נתונים']);
  const g6DataStds = [...new Set(grade6.items.filter((it) => it[0] === 'data').map((it) => it[5]))];
  assert.deepEqual(g6DataStds, ['G6_MEAN', 'G6_DATA_READ', 'G6_DATA_SHOW']);
  const g6Items = grade6.items.filter((it) => it[0] === 'data');
  assert.ok(g6Items.length >= 10, 'grade 6 data items count');

  // Curriculum topicReviewPath connects topic ID to mastery review path
  const g6Catalog = banks.itemsForGrade('ו');
  const topicPath = curriculum.topicReviewPath('mm-cur-58', [{ topic: 'קריאה והצגה של נתונים', correct: false }], g6Catalog);
  assert.ok(topicPath, 'topicReviewPath should return review path');
  assert.ok(topicPath.path.length > 0);
  assert.equal(curriculum.topicReviewPath('nonexistent-id', [], []), null);
});

test('dataWorlds edge cases and mutation coverage: malformed inputs, bounds, and silent specs', () => {
  // Malformed items
  assert.equal(dataWorlds.specForItem(null), null);
  assert.equal(dataWorlds.specForItem(undefined), null);
  assert.equal(dataWorlds.specForItem({}), null);
  assert.equal(dataWorlds.specForItem({ noMusic: true, prompt: '1+1', answer: 2 }), null);
  assert.equal(dataWorlds.specForItem({ music: 'unknownTag', prompt: '1+1', answer: 2 }), null);

  // Mismatched answer
  const wrongAnswerItem = {
    music: 'levelNotes',
    prompt: 'בשלוש עמודות יש 3, 5 ו־7 הקשות. מה הממוצע?',
    answer: 999, // incorrect answer
  };
  assert.equal(dataWorlds.specForItem(wrongAnswerItem), null);

  // longestRun edge cases
  assert.equal(dataWorlds.longestRun([]), 0);
  assert.equal(dataWorlds.longestRun([{ at: 0 }]), 1);
  assert.equal(dataWorlds.longestRun([{ at: 0 }, { at: 0.1 }, { at: 0.2 }]), 3);
  assert.equal(dataWorlds.longestRun([{ at: 0 }, { at: 0.8 }, { at: 1.6 }]), 1); // gap > 0.4 resets run

  // soundEvents with invalid/unknown specs
  assert.deepEqual(dataWorlds.soundEvents(null), []);
  assert.deepEqual(dataWorlds.soundEvents({ kind: 'nonExistentKind' }), []);

  // HTML and printableWidget on null / empty
  assert.equal(dataWorlds.html(null), '');
  assert.equal(dataWorlds.html(undefined), '');
  assert.equal(dataWorlds.printableWidget(null), '');
  assert.equal(dataWorlds.printableWidget({}), '');

  // Column compare with exceeding run length
  const hugeColItem = {
    music: 'showAsBar',
    prompt: 'בגרף, עמודה א׳ היא 300 ועמודה ב׳ 700. בכמה ב׳ גבוהה יותר?',
    answer: 400,
  };
  // unit cannot bring 700 down to <= 12 strokes within standard units
  assert.equal(dataWorlds.specForItem(hugeColItem), null);
});
