function generateFirstWeekPlan(teacherGrade, studentMusicExperience, classSize) {
  if (!Number.isInteger(teacherGrade) || teacherGrade < 1 || teacherGrade > 12) {
    throw new Error('Invalid teacherGrade');
  }
  if (studentMusicExperience !== 'beginner' && studentMusicExperience !== 'intermediate') {
    studentMusicExperience = 'beginner';
  }
  if (!Number.isInteger(classSize) || classSize <= 0) {
    return { planDays: [], totalMinutes: 0, recommendedSchedule: '' };
  }

  const gradeBand = teacherGrade <= 5 ? 'elementary' : teacherGrade <= 8 ? 'middle' : 'high';
  const experience = studentMusicExperience;

  const plans = {
    elementary: {
      beginner: {
        days: [
          { day: 1, lessonTitle: 'Rhythm & Counting', exercises: [{ type: 'clapPattern', params: { pattern: 'quarter,quarter,quarter,quarter', bpm: 80 } }, { type: 'countBeats', params: { measures: 4, timeSignature: '4/4' } }] },
          { day: 2, lessonTitle: 'Fractions in Music', exercises: [{ type: 'noteValues', params: { notes: ['whole','half','quarter'], totalBeats: 4 } }, { type: 'fillMeasure', params: { timeSignature: '4/4', missingBeats: 2 } }] },
          { day: 3, lessonTitle: 'Pulse & Patterns', exercises: [{ type: 'bodyPercussion', params: { pattern: 'stomp,clap,stomp,clap', repeats: 4 } }, { type: 'identifyPattern', params: { patternLength: 4, options: ['A','B','A','B'] } }] },
          { day: 4, lessonTitle: 'Math Beats', exercises: [{ type: 'addBeats', params: { equation: 'quarter+quarter=half', verify: true } }, { type: 'rhythmDictation', params: { measures: 2, difficulty: 'easy' } }] },
          { day: 5, lessonTitle: 'Create Your Rhythm', exercises: [{ type: 'composePattern', params: { measures: 4, allowedNotes: ['quarter','eighth','half'] } }, { type: 'performPattern', params: { groupSize: classSize > 20 ? 'small' : 'whole' } }] }
        ],
        totalMinutes: 25 * 5,
        recommendedSchedule: '5 days, 25 minutes each'
      },
      intermediate: {
        days: [
          { day: 1, lessonTitle: 'Time Signatures', exercises: [{ type: 'identifyTimeSig', params: { examples: ['3/4','4/4','6/8'], audio: false } }, { type: 'countInTime', params: { timeSignature: '6/8', measures: 2 } }] },
          { day: 2, lessonTitle: 'Note Math', exercises: [{ type: 'addNotes', params: { notes: ['dottedHalf','quarter','eighth'], totalBeats: 4 } }, { type: 'subtractNotes', params: { measure: '4/4', remove: 'quarter' } }] },
          { day: 3, lessonTitle: 'Syncopation', exercises: [{ type: 'clapSyncopated', params: { pattern: 'eighth,quarter,eighth,quarter', bpm: 90 } }, { type: 'findOffbeats', params: { measure: '4/4', offbeatCount: 2 } }] },
          { day: 4, lessonTitle: 'Compose with Math', exercises: [{ type: 'writeMeasure', params: { timeSignature: '4/4', totalBeats: 4, constraints: 'use at least one dotted note' } }, { type: 'analyzePattern', params: { pattern: 'quarter,quarter,quarter,quarter', mathRelation: 'addition' } }] },
          { day: 5, lessonTitle: 'Group Performance', exercises: [{ type: 'ensembleRhythm', params: { parts: 2, measures: 8, tempo: 100 } }, { type: 'reflectOnMath', params: { prompt: 'How did fractions help us create this piece?' } }] }
        ],
        totalMinutes: 30 * 5,
        recommendedSchedule: '5 days, 30 minutes each'
      }
    },
    middle: {
      beginner: {
        days: [
          { day: 1, lessonTitle: 'Rhythm Foundations', exercises: [{ type: 'clapPattern', params: { pattern: 'quarter,quarter,quarter,quarter', bpm: 90 } }, { type: 'countBeats', params: { measures: 4, timeSignature: '4/4' } }] },
          { day: 2, lessonTitle: 'Fractions & Notes', exercises: [{ type: 'noteValues', params: { notes: ['whole','half','quarter','eighth'], totalBeats: 4 } }, { type: 'fillMeasure', params: { timeSignature: '4/4', missingBeats: 3 } }] },
          { day: 3, lessonTitle: 'Pattern Recognition', exercises: [{ type: 'bodyPercussion', params: { pattern: 'stomp,clap,stomp,clap', repeats: 4 } }, { type: 'identifyPattern', params: { patternLength: 4, options: ['A','B','A','B'] } }] },
          { day: 4, lessonTitle: 'Math in Music', exercises: [{ type: 'addBeats', params: { equation: 'quarter+quarter+quarter+quarter=whole', verify: true } }, { type: 'rhythmDictation', params: { measures: 2, difficulty: 'medium' } }] },
          { day: 5, lessonTitle: 'Create & Perform', exercises: [{ type: 'composePattern', params: { measures: 4, allowedNotes: ['quarter','eighth','half','dottedHalf'] } }, { type: 'performPattern', params: { groupSize: classSize > 25 ? 'small' : 'whole' } }] }
        ],
        totalMinutes: 30 * 5,
        recommendedSchedule: '5 days, 30 minutes each'
      },
      intermediate: {
        days: [
          { day: 1, lessonTitle: 'Complex Time Signatures', exercises: [{ type: 'identifyTimeSig', params: { examples: ['5/4','7/8','4/4'], audio: false } }, { type: 'countInTime', params: { timeSignature: '5/4', measures: 2 } }] },
          { day: 2, lessonTitle: 'Advanced Note Math', exercises: [{ type: 'addNotes', params: { notes: ['dottedHalf','quarter','eighth','sixteenth'], totalBeats: 4 } }, { type: 'subtractNotes', params: { measure: '4/4', remove: 'dottedQuarter' } }] },
          { day: 3, lessonTitle: 'Syncopation & Groove', exercises: [{ type: 'clapSyncopated', params: { pattern: 'eighth,quarter,eighth,quarter', bpm: 100 } }, { type: 'findOffbeats', params: { measure: '4/4', offbeatCount: 3 } }] },
          { day: 4, lessonTitle: 'Composition Challenge', exercises: [{ type: 'writeMeasure', params: { timeSignature: '7/8', totalBeats: 7, constraints: 'use at least one dotted note and one rest' } }, { type: 'analyzePattern', params: { pattern: 'quarter,quarter,quarter,quarter', mathRelation: 'multiplication' } }] },
          { day: 5, lessonTitle: 'Ensemble Project', exercises: [{ type: 'ensembleRhythm', params: { parts: 3, measures: 8, tempo: 110 } }, { type: 'reflectOnMath', params: { prompt: 'How did ratios and proportions help us coordinate?' } }] }
        ],
        totalMinutes: 35 * 5,
        recommendedSchedule: '5 days, 35 minutes each'
      }
    },
    high: {
      beginner: {
        days: [
          { day: 1, lessonTitle: 'Rhythm Basics', exercises: [{ type: 'clapPattern', params: { pattern: 'quarter,quarter,quarter,quarter', bpm: 100 } }, { type: 'countBeats', params: { measures: 4, timeSignature: '4/4' } }] },
          { day: 2, lessonTitle: 'Fractional Note Values', exercises: [{ type: 'noteValues', params: { notes: ['whole','half','quarter','eighth','sixteenth'], totalBeats: 4 } }, { type: 'fillMeasure', params: { timeSignature: '4/4', missingBeats: 3 } }] },
          { day: 3, lessonTitle: 'Patterns & Sequences', exercises: [{ type: 'bodyPercussion', params: { pattern: 'stomp,clap,stomp,clap', repeats: 4 } }, { type: 'identifyPattern', params: { patternLength: 4, options: ['A','B','A','B'] } }] },
          { day: 4, lessonTitle: 'Math & Music', exercises: [{ type: 'addBeats', params: { equation: 'quarter+quarter+quarter+quarter=whole', verify: true } }, { type: 'rhythmDictation', params: { measures: 2, difficulty: 'medium' } }] },
          { day: 5, lessonTitle: 'Create & Share', exercises: [{ type: 'composePattern', params: { measures: 4, allowedNotes: ['quarter','eighth','half','dottedHalf','sixteenth'] } }, { type: 'performPattern', params: { groupSize: classSize > 30 ? 'small' : 'whole' } }] }
        ],
        totalMinutes: 35 * 5,
        recommendedSchedule: '5 days, 35 minutes each'
      },
      intermediate: {
        days: [
          { day: 1, lessonTitle: 'Irregular Time Signatures', exercises: [{ type: 'identifyTimeSig', params: { examples: ['5/4','7/8','11/8','4/4'], audio: false } }, { type: 'countInTime', params: { timeSignature: '11/8', measures: 2 } }] },
          { day: 2, lessonTitle: 'Complex Note Math', exercises: [{ type: 'addNotes', params: { notes: ['dottedHalf','quarter','eighth','sixteenth','thirtySecond'], totalBeats: 4 } }, { type: 'subtractNotes', params: { measure: '4/4', remove: 'dottedEighth' } }] },
          { day: 3, lessonTitle: 'Polyrhythms', exercises: [{ type: 'clapPolyrhythm', params: { pattern: '3:2', bpm: 80 } }, { type: 'findOffbeats', params: { measure: '4/4', offbeatCount: 4 } }] },
          { day: 4, lessonTitle: 'Composition with Constraints', exercises: [{ type: 'writeMeasure', params: { timeSignature: '7/8', totalBeats: 7, constraints: 'use at least one dotted note, one rest, and one sixteenth' } }, { type: 'analyzePattern', params: { pattern: 'quarter,quarter,quarter,quarter', mathRelation: 'division' } }] },
          { day: 5, lessonTitle: 'Full Ensemble', exercises: [{ type: 'ensembleRhythm', params: { parts: 4, measures: 16, tempo: 120 } }, { type: 'reflectOnMath', params: { prompt: 'How did mathematical concepts like ratios and fractions enhance our musical creation?' } }] }
        ],
        totalMinutes: 40 * 5,
        recommendedSchedule: '5 days, 40 minutes each'
      }
    }
  };

  const plan = plans[gradeBand][experience];
  return {
    planDays: plan.days,
    totalMinutes: plan.totalMinutes,
    recommendedSchedule: plan.recommendedSchedule
  };
}

module.exports = { generateFirstWeekPlan };
