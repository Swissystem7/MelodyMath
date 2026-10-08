const assert = require('node:assert');
const test = require('node:test');

let dashboardLogic = null;
try {
  dashboardLogic = require('../src/lib/dashboardLogic.js');
} catch (e) {
  // On base commit dashboardLogic.js does not exist yet
}

const teacherStore = require('../src/lib/teacherStore.js');

test('returns a structured array of student objects containing success rates and total practices extracted from raw teacher store data', () => {
  assert.ok(dashboardLogic, 'dashboardLogic module must be loaded');
  assert.strictEqual(typeof dashboardLogic.getDashboardData, 'function', 'dashboardLogic.getDashboardData must be a function');

  const rawRoster = {
    classCode: 'gimel1',
    students: {
      'נועה': {
        name: 'נועה',
        created: 1000,
        sessions: [
          {
            id: 's1',
            kind: 'practice',
            started: 1000,
            ended: 1100,
            items: [
              { skill: 'חיבור', prompt: '3+4', answer: 7, given: 7, correct: true, at: 1010 },
              { skill: 'חיבור', prompt: '5+2', answer: 7, given: 7, correct: true, at: 1020 },
              { skill: 'כפל', prompt: '3*4', answer: 12, given: 10, correct: false, at: 1030 },
              { skill: 'כפל', prompt: '3*4', answer: 12, given: 11, correct: false, at: 1040 }
            ]
          }
        ]
      },
      'איתי': {
        name: 'איתי',
        created: 1000,
        sessions: [
          {
            id: 's2',
            kind: 'practice',
            started: 1050,
            ended: 1150,
            items: [
              { skill: 'חיסור', prompt: '10-3', answer: 7, given: 7, correct: true, at: 1060 }
            ]
          }
        ]
      }
    }
  };

  const results = dashboardLogic.getDashboardData(rawRoster);

  assert.ok(Array.isArray(results), 'result should be an array');
  assert.strictEqual(results.length, 2, 'should have 2 students');

  const noa = results.find(s => s.name === 'נועה');
  assert.ok(noa, 'student נועה should be present');
  assert.strictEqual(noa.totalPractices, 4, 'total practices should be 4');
  assert.strictEqual(noa.total, 4);
  assert.strictEqual(noa.correct, 2, 'correct count should be 2');
  assert.strictEqual(noa.successRate, 0.5, 'success rate should be 0.5');
  assert.strictEqual(noa.accuracy, 0.5);

  // Skill breakdown to identify gaps
  assert.ok(Array.isArray(noa.perSkill), 'perSkill should be an array');
  const addSkill = noa.perSkill.find(s => s.skill === 'חיבור');
  assert.ok(addSkill, 'addition skill should be present');
  assert.strictEqual(addSkill.total, 2);
  assert.strictEqual(addSkill.correct, 2);
  assert.strictEqual(addSkill.successRate, 1);

  const mulSkill = noa.perSkill.find(s => s.skill === 'כפל');
  assert.ok(mulSkill, 'multiplication skill should be present');
  assert.strictEqual(mulSkill.total, 2);
  assert.strictEqual(mulSkill.correct, 0);
  assert.strictEqual(mulSkill.successRate, 0);

  // Repeating errors to identify gaps
  assert.ok(Array.isArray(noa.repeatingErrors), 'repeatingErrors should be an array');
  assert.strictEqual(noa.repeatingErrors.length, 1, 'should have 1 repeating error');
  assert.strictEqual(noa.repeatingErrors[0].prompt, '3*4');
  assert.strictEqual(noa.repeatingErrors[0].count, 2);

  const itai = results.find(s => s.name === 'איתי');
  assert.ok(itai, 'student איתי should be present');
  assert.strictEqual(itai.totalPractices, 1);
  assert.strictEqual(itai.successRate, 1);
});

test('handles raw JSON string input and empty store data', () => {
  assert.ok(dashboardLogic, 'dashboardLogic module must be loaded');

  const rawJson = JSON.stringify({
    students: {
      'דן': {
        name: 'דן',
        sessions: [
          {
            items: [
              { skill: 'חיבור', prompt: '1+1', answer: 2, given: 2, correct: true }
            ]
          }
        ]
      }
    }
  });

  const fromJson = dashboardLogic.getDashboardData(rawJson);
  assert.strictEqual(fromJson.length, 1);
  assert.strictEqual(fromJson[0].name, 'דן');
  assert.strictEqual(fromJson[0].totalPractices, 1);
  assert.strictEqual(fromJson[0].successRate, 1);

  const empty = dashboardLogic.getDashboardData({});
  assert.deepStrictEqual(empty, []);
});

test('teacherStore also provides getDashboardData and enriched overview', () => {
  assert.strictEqual(typeof teacherStore.getDashboardData, 'function', 'teacherStore.getDashboardData must be a function');

  const mockStorage = {
    getItem: function () {
      return JSON.stringify({
        classCode: 'test-class',
        students: {
          'שרה': {
            name: 'שרה',
            sessions: [
              {
                id: 's1',
                items: [
                  { skill: 'חיבור', prompt: '2+2', correct: true },
                  { skill: 'חיבור', prompt: '3+3', correct: false }
                ]
              }
            ]
          }
        }
      });
    }
  };

  const data = teacherStore.getDashboardData('test-class', mockStorage);
  assert.strictEqual(data.length, 1);
  assert.strictEqual(data[0].name, 'שרה');
  assert.strictEqual(data[0].totalPractices, 2);
  assert.strictEqual(data[0].successRate, 0.5);
  assert.ok(Array.isArray(data[0].perSkill));
});
