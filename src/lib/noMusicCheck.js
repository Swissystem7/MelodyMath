// MelodyMath — end-of-topic no-music check (Refs #747, Refs #665, Refs #681).
//
// The scaffolding fades from sound to picture to nothing: every topic ends with
// three plain questions, no sound and no picture ("עכשיו בלי להקה, רק אתם!").
// Two mistakes send the child back to the picture stage, cued on the
// instrument they picked. Fading worked-example support until the learner
// solves alone: Renkl & Atkinson (2003), Educational Psychologist 38(1), 15–22,
// https://doi.org/10.1207/S15326985EP3801_3
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MM_NO_MUSIC_CHECK = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ROUND = 3;
  const MAX_WRONG = 2;
  const PICK_KEY = 'mm-tap-instrument';

  // missing_factor topics: [a, b, hidden] stands for a × b, with factor
  // `hidden` (0 = left, 1 = right) shown as ☐. No two facts in a topic share a
  // product, so the three questions never read as the same one twice.
  const MISSING_FACTOR = {
    'mm-cur-18': [[4, 5, 1], [3, 6, 0], [2, 8, 1]],
    'mm-cur-24': [[7, 6, 1], [7, 8, 0], [9, 4, 1]],
    'mm-cur-25': [[70, 10, 1], [30, 10, 0], [6, 100, 1]],
    'mm-cur-31': [[6, 8, 1], [9, 7, 0], [12, 5, 1]]
  };
  // Which missing_factor topic closes a screen skill in each grade.
  const SKILL_TOPIC = {
    multiplication: { 'ב': 'mm-cur-18', 'ג': 'mm-cur-24', 'ד': 'mm-cur-31' },
    division: { 'ג': 'mm-cur-25' }
  };

  function factItem(topicId, fact, i) {
    const a = fact[0], b = fact[1], left = fact[2] === 0;
    return {
      id: 'mf-nm-' + topicId.slice(7) + '-' + (i + 1),
      topicId: topicId,
      exerciseType: 'missing_factor',
      prompt: (left ? '☐ × ' + b : a + ' × ☐') + ' = ' + a * b + '. מהו המספר החסר?',
      answer: left ? a : b,
      noMusic: true,
      plain: true,
      musicStage: 'no_music_check'
    };
  }

  function checkItemsForTopic(topicId) {
    const facts = MISSING_FACTOR[topicId];
    return facts ? facts.map(function (f, i) { return factItem(topicId, f, i); }) : [];
  }

  function topicForSkill(skill, grade) {
    const byGrade = SKILL_TOPIC[skill];
    return (byGrade && byGrade[grade]) || null;
  }

  // Every topic gets a check: the missing_factor set when there is one,
  // otherwise three of the topic's own items with the sound and picture removed.
  function checkItemsFor(skill, grade, pool) {
    const topicId = topicForSkill(skill, grade);
    if (topicId) return checkItemsForTopic(topicId);
    const seen = {};
    return (Array.isArray(pool) ? pool : []).filter(function (it) {
      if (!it || it.prompt == null || it.answer == null || seen[it.prompt]) return false;
      seen[it.prompt] = true;
      return true;
    }).slice(0, ROUND).map(function (it) {
      return { id: it.id, skill: skill, prompt: it.prompt, answer: it.answer, noMusic: true, plain: true, musicStage: 'no_music_check' };
    });
  }

  // Three questions; done after the third, or as soon as two are wrong.
  function createRound(items) {
    const list = (items || []).slice(0, ROUND);
    const round = { index: 0, wrong: 0, total: list.length };
    round.item = function () { return list[round.index] || null; };
    round.answer = function (correct) {
      if (!correct) round.wrong += 1;
      round.index += 1;
      const failed = round.wrong >= MAX_WRONG;
      const done = failed || round.index >= list.length;
      return { done: done, passed: done && !failed, backTo: failed ? 'picture' : null };
    };
    return round;
  }

  // The child's pick from the tap chooser (#750), else the topic's instrument.
  function childInstrument(storage, topic, g) {
    try { const id = storage && storage.getItem(PICK_KEY); if (id) return id; } catch (e) { /* private mode */ }
    const env = g || (typeof globalThis !== 'undefined' ? globalThis : {});
    const list = typeof env.forTopic === 'function' ? env.forTopic(topic) : [];
    return list && list[0] ? list[0].id : null;
  }

  // A short rising phrase on that instrument as the band comes back in.
  function cueInstrument(instrumentId, g) {
    const env = g || (typeof globalThis !== 'undefined' ? globalThis : {});
    const x = instrumentId && typeof env.instrumentById === 'function' ? env.instrumentById(instrumentId) : null;
    const ac = typeof env.getSharedAudioContext === 'function' ? env.getSharedAudioContext() : null;
    if (!x || !ac || typeof env.playVoice !== 'function') return null;
    [262, 330, 392].forEach(function (hz, i) { env.playVoice(ac, x.voice, hz, ac.currentTime + 0.05 + i * 0.18); });
    return x.voice;
  }

  return {
    ROUND: ROUND, MAX_WRONG: MAX_WRONG, PICK_KEY: PICK_KEY, MISSING_FACTOR: MISSING_FACTOR,
    checkItemsForTopic: checkItemsForTopic, topicForSkill: topicForSkill, checkItemsFor: checkItemsFor,
    createRound: createRound, childInstrument: childInstrument, cueInstrument: cueInstrument
  };
});
