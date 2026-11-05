// MM-610 pilot — every unit (grades 1–3): open it, pass the short check, answer
// one exercise right and one wrong, and see the "why" feedback both times; the
// teacher's coverage map shows every grades 1–3 topic covered and its links
// open the exercises; a student does pre-check → unit → post-check and the
// teacher report shows before/after. Runs on desktop and at 360px (projects).
'use strict';
const { test, expect } = require('@playwright/test');
const h = require('./helpers');
const Cov = require('../js/coverage.js');
const U = require('../js/unit.js');

const UNITS = Cov.allUnits();

// The child's screens never show the research behind a unit (evidence level,
// sources, limits): that is teacher-view text (MM-610 audit 5.11, section ג).
const RESEARCH_TEXT = /רמת ראיה|מקורות|MM-503|מה זה לא מראה|מטא־אנליזה|Akın|Sala|Azaryahu|Courey|Moreno|Das 2023|Rusconi|Möhring/;
async function expectNoResearch(page) {
  expect(await page.locator('#mm-app').innerText()).not.toMatch(RESEARCH_TEXT);
}

function rightOf(q) {
  if (q.kind === 'choice' || q.kind === 'rhythm') return { pick: q.answer };
  if (!q.kind) return { type: U.answerOf(q) };
  return { type: q.answer };
}
function wrongOf(q) {
  if (q.kind === 'choice') return { pick: q.choices.find((c) => c.id !== q.answer).id };
  if (q.kind === 'rhythm') return { pick: 'quarter' };
  const a = !q.kind ? U.answerOf(q) : q.answer;
  return { type: a + (q.tolerance || 0) + 1 };
}
async function give(page, a) {
  if (a.pick) {
    await page.getByTestId('choice-' + a.pick).click();
    await page.getByTestId('check').click();
  } else {
    await h.answer(page, a.type);
  }
  return page.getByTestId('feedback');
}

async function openUnit(page, unit) {
  const featured = await page.getByTestId('unit-card').getAttribute('data-unit');
  await page.getByTestId(featured === unit.id ? 'open-unit' : 'open-unit-' + unit.id).click();
  await h.passCheck(page, 'pre');
  await expect(page.getByTestId('view-lesson')).toBeVisible();
}

test.describe('every unit: thinking step, music, why after right and wrong', () => {
  for (const unit of UNITS) {
    test(unit.id + ' — ' + unit.title, async ({ page, baseURL }) => {
      const blocked = await h.openDemo(page, baseURL);
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e.message || e)));
      await h.signIn(page, 'student');
      await openUnit(page, unit);
      if (unit.skill) await expect(page.getByTestId('unit-skill')).toContainText(unit.skill.math);
      await expectNoResearch(page);
      await h.expectMobileFriendly(page);
      await page.getByTestId('lesson-play').click();
      await expect(page.getByTestId('lesson-status')).toHaveAttribute('data-audio', 'played');
      await page.getByTestId('lesson-continue').click();

      // Exercise 1: right on the first try.
      const [q1, q2] = unit.questions;
      await h.expectQuestion(page, q1.id);
      await expect(page.getByTestId('think')).toContainText(q1.think.slice(0, 20));
      await expect(page.getByTestId('music-card')).toBeVisible();
      expect(Number(await page.getByTestId('music-notes').getAttribute('data-count'))).toBeGreaterThan(0);
      expect((await h.lastPlay(page, q1.id + ':question')).notes.length).toBeGreaterThan(1);
      await expect(page.getByTestId('why-feedback')).toHaveCount(0); // nothing explained before answering
      await expect(page.getByTestId('narration')).toBeHidden();         // no narration file yet (MM-614 slot)
      await h.expectMobileFriendly(page);
      let fb = await give(page, rightOf(q1));
      await expect(fb).toHaveAttribute('data-result', 'right');
      await expect(page.getByTestId('why-feedback')).toHaveAttribute('data-kind', 'right');
      await expect(page.getByTestId('why-text')).toHaveText(q1.right);
      expect((await h.lastPlay(page, q1.id + ':right')).notes.some((n) => n.role === 'home')).toBe(true);
      await h.expectMobileFriendly(page);
      await page.getByTestId('next').click();

      // Exercise 2: wrong first — the why explains without the answer — then a second try.
      await h.expectQuestion(page, q2.id);
      fb = await give(page, wrongOf(q2));
      await expect(fb).toHaveAttribute('data-result', 'wrong');
      await expect(page.getByTestId('why-feedback')).toHaveAttribute('data-kind', 'wrong');
      await expect(page.getByTestId('why-text')).toHaveText(q2.wrong);
      expect((await h.lastPlay(page, q2.id + ':hint')).notes.some((n) => n.role === 'home')).toBe(false);
      await h.expectMobileFriendly(page);
      fb = await give(page, rightOf(q2));
      await expect(fb).toHaveAttribute('data-result', 'right');
      await expect(page.getByTestId('why-text')).toHaveText(q2.right);
      await expectNoResearch(page);
      expect(errors).toEqual([]);
      expect(blocked).toEqual([]);
    });
  }
});

test.describe('teacher: coverage of every grades 1–3 topic', () => {
  test('the map lists all grades 1–3 topics as covered, with unit skills, and an exercise link opens a preview', async ({ page, baseURL }) => {
    const blocked = await h.openDemo(page, baseURL);
    await h.signIn(page, 'teacher');
    const map = page.getByTestId('coverage-map');
    const sum = map.getByTestId('coverage-summary');
    await expect(sum).toHaveAttribute('data-total', '31');
    await expect(sum).toHaveAttribute('data-covered', '31');
    await expect(map.getByTestId('coverage-map-row')).toHaveCount(31);
    await expect(map.locator('[data-testid="coverage-map-row"][data-status="covered"]')).toHaveCount(31);
    const ids = await map.getByTestId('coverage-map-row').evaluateAll((els) => els.map((e) => e.getAttribute('data-topic-id')));
    expect(ids.sort()).toEqual(Array.from({ length: 31 }, (_, i) => 'mm-cur-' + i).sort());
    expect(await map.getByTestId('coverage-ex-link').count()).toBeGreaterThanOrEqual(31);
    await expect(page.getByTestId('unit-skill-row')).toHaveCount(UNITS.length);
    await expect(page.getByTestId('units-card')).toContainText('רמת ראיה'); // the research stays in the teacher view
    await h.expectMobileFriendly(page);

    // mm-cur-27 (angles) → its first exercise opens as a preview, and the student report stays empty.
    await map.locator('[data-testid="coverage-map-row"][data-topic-id="mm-cur-27"] [data-testid="coverage-ex-link"]').first().click();
    await expect(page.getByTestId('view-exercise')).toHaveAttribute('data-preview', '1');
    await expect(page.getByTestId('view-exercise')).toHaveAttribute('data-unit', 'shapes-1');
    await expect(page.getByTestId('think')).toBeVisible();
    await h.expectMobileFriendly(page);
    await page.getByTestId('preview-exit').click();
    await expect(page.getByTestId('view-teacher')).toBeVisible();
    await expect(page.getByTestId('report-empty')).toBeVisible();
    expect(blocked).toEqual([]);
  });
});

test.describe('pre-check → unit → post-check, and the teacher sees before/after', () => {
  test('a student improves from the check before to the check after; the report shows the change', async ({ page, baseURL }) => {
    const blocked = await h.openDemo(page, baseURL);
    const unit = Cov.unitById('pattern-1');
    await h.signIn(page, 'teacher');
    await page.getByTestId('assign-unit').selectOption(unit.id);
    await page.getByTestId('assign-submit').click();
    await expect(page.getByTestId('assignment-row')).toHaveCount(1);
    await h.signOut(page);

    await h.signIn(page, 'student');
    await expect(page.getByTestId('unit-card')).toHaveAttribute('data-unit', unit.id); // the assigned unit comes first
    await page.getByTestId('open-unit').click();
    await expect(page.locator('[data-testid="view-check"][data-phase="pre"]')).toBeVisible();
    await expect(page.getByTestId('music-card')).toHaveCount(0); // the check has no music
    await expectNoResearch(page);
    await expect(page.getByTestId('check-item')).toHaveCount(3);
    await h.expectMobileFriendly(page);
    await h.passCheck(page, 'pre', { 'pt-pre1': '9', 'pt-pre2': '5' }); // 1 of 3 right before
    await expect(page.getByTestId('view-lesson')).toBeVisible();
    await page.getByTestId('lesson-continue').click();
    for (const q of unit.questions) {
      await h.expectQuestion(page, q.id);
      await give(page, rightOf(q));
      await expect(page.getByTestId('feedback')).toHaveAttribute('data-result', 'right');
      await page.getByTestId('next').click();
    }
    await expect(page.locator('[data-testid="view-check"][data-phase="post"]')).toBeVisible();
    await h.passCheck(page, 'post'); // 3 of 3 after
    await expect(page.getByTestId('view-summary')).toBeVisible();
    const pp = page.getByTestId('prepost');
    await expect(pp).toHaveAttribute('data-pre', '1/3');
    await expect(pp).toHaveAttribute('data-post', '3/3');
    await expect(pp).toContainText('לפני 1/3 · אחרי 3/3');
    await h.expectMobileFriendly(page);
    await page.getByTestId('home').click();
    await expect(page.getByTestId('unit-status')).toHaveAttribute('data-status', 'done');
    await expect(page.getByTestId('unit-prepost')).toHaveAttribute('data-change', '2');
    await h.signOut(page);

    await h.signIn(page, 'teacher');
    await expect(page.getByTestId('assignment-status')).toHaveAttribute('data-status', 'done');
    const block = page.locator('[data-testid="report-student"][data-student="' + h.account('student').id + '"] [data-testid="report-unit"][data-unit="' + unit.id + '"]');
    const rp = block.getByTestId('report-prepost');
    await expect(rp).toHaveAttribute('data-pre', '1/3');
    await expect(rp).toHaveAttribute('data-post', '3/3');
    await expect(rp).toHaveAttribute('data-change', '2');
    await expect(block.getByTestId('report-change')).toHaveText('שיפור של 2');
    await expect(block.getByTestId('report-table')).toBeVisible();
    await h.expectMobileFriendly(page);
    await page.reload();
    await expect(rp).toHaveAttribute('data-change', '2');
    expect(blocked).toEqual([]);
  });
});
