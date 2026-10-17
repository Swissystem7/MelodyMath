// Scenario pass over the one-topic plan. Needs learnerPlan.js on the page
// (PR that adds the model). Run:
//   npx --yes playwright@1.49 test --config e2e/plan.config.js
const { test, expect } = require('@playwright/test');

function roster(name, skill, correct, total) {
  const items = [];
  for (let i = 0; i < total; i++) items.push({ skill: skill, correct: i < correct, prompt: 'q', answer: 1, given: 1 });
  const started = Date.now() - 1000;
  return {
    classCode: 'דמו',
    students: {
      [name]: {
        name: name, created: 1, assignments: [],
        sessions: [{ id: 's1', kind: 'diag', started: started, items: items }],
      },
    },
  };
}

async function openWith(page, grade, student) {
  await page.addInitScript((data) => {
    localStorage.setItem('mm-grade', data.grade);
    if (!data.student) return;
    localStorage.setItem('mm-who-v1', JSON.stringify({ classCode: 'דמו', name: data.studentName }));
    localStorage.setItem('mm-roster-v1:דמו', JSON.stringify(data.roster));
  }, student
    ? { grade: grade, student: true, studentName: student.name, roster: roster(student.name, student.skill, student.correct, student.total) }
    : { grade: grade, student: false });
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.goto('/index.html');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
  return errors;
}

test('each grade א׳–ג׳ shows one fresh reinforcement', async ({ page }) => {
  const errors = await openWith(page, 'א');
  for (const g of ['א', 'ב', 'ג']) {
    await page.locator('#gradePick button[data-grade="' + g + '"]').click();
    const plan = page.locator('#remediation .mm-plan');
    await expect(plan).toHaveCount(1);
    await expect(plan).toHaveAttribute('data-branch', 'fresh');
    await expect(plan).toHaveAttribute('data-grade', g);
    await expect(plan.locator('.mm-plan-topic')).toHaveCount(1);
    await expect(plan.locator('[role="progressbar"]')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('weak, mixed and strong results stay one topic', async ({ page }) => {
  const errors = await openWith(page, 'א', { name: 'נועה', skill: 'מנייה', correct: 1, total: 5 });
  const plan = page.locator('#remediation .mm-plan');
  await expect(plan).toHaveAttribute('data-branch', 'weak');
  await expect(plan).toContainText('ספירה עד 100');
  await expect(plan).toContainText('1 מתוך 3');
  expect(errors).toEqual([]);
});

test('a strong count opens the next topic', async ({ page }) => {
  const errors = await openWith(page, 'א', { name: 'נועה', skill: 'מנייה', correct: 4, total: 4 });
  await expect(page.locator('#remediation .mm-plan')).toHaveAttribute('data-branch', 'strong');
  await expect(page.locator('#remediation .mm-plan')).toContainText('מנייה עד 100');
  expect(errors).toEqual([]);
});

test('an invalid stored grade does not throw', async ({ page }) => {
  const errors = await openWith(page, 'constructor');
  await expect(page.locator('#remediation .mm-plan')).toHaveAttribute('data-branch', 'fresh');
  await expect(page.locator('body')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the same plan is on the teacher tab', async ({ page }) => {
  await openWith(page, 'ב');
  await page.locator('#tab-teacherReport').click();
  await expect(page.locator('#teacherReport .mm-plan')).toHaveCount(1);
  await expect(page.locator('#teacherReport .mm-plan')).toHaveAttribute('data-grade', 'ב');
});
