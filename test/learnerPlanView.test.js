const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const view = require('../src/lib/learnerPlanView');

test('csv is a local nickname sheet', () => {
  const csv = view.classPlanCsv([{
    name: 'נ-14', grade: 'ג', branch: 'weak', topic: 'לוח כפל',
    paceDone: 1, paceExpected: 3, diagPercent: 25,
  }]);
  assert.match(csv, /^כינוי,כיתה,ענף/);
  assert.match(csv, /נ-14,ג,weak,לוח כפל,1,3,25/);
  assert.doesNotMatch(csv, /תעודת זהות|מספר זהות/);
  const quoted = view.classPlanCsv([{ name: 'א,ב', grade: 'א', branch: 'fresh', topic: 'נושא', paceDone: 0, paceExpected: 3, diagPercent: '' }]);
  assert.match(quoted, /"א,ב"/);
});

// #503 — with no child saved, the diagnostic that just ended still picks the topic.
test('an anonymous diagnostic feeds the plan, only for its own grade', () => {
  const learnerPlan = require('../src/lib/learnerPlan');
  const diag = { grade: 'ב', perSkill: [{ skill: 'multiplication', total: 2, correct: 0 }, { skill: 'addition', total: 2, correct: 2 }] };
  const p = learnerPlan.buildLearnerPlan(view.planInput('ב', '', null, diag));
  assert.equal(p.branch, 'weak');
  assert.match(p.topic, /כפולות 2/);
  assert.equal(view.planInput('ג', '', null, diag).perSkill, undefined);
  const saved = { name: 'נ', sessions: [{ kind: 'class', started: 1, items: [] }] };
  assert.equal(view.planInput('ב', 'נ', saved, diag).perSkill, undefined);
  assert.equal(learnerPlan.buildLearnerPlan(view.planInput('ב', '', null, null)).branch, 'fresh');
});

test('the card hides during a question and returns on the drill\'s last screen', () => {
  function docWith(openIds) {
    return {
      getElementById(id) {
        return { classList: { contains: (c) => c === 'hidden' && openIds.indexOf(id) === -1 } };
      },
    };
  }
  assert.equal(view.hideOnRemediation(docWith([])), false);
  assert.equal(view.hideOnRemediation(docWith(['rmQuiz'])), true);
  assert.equal(view.hideOnRemediation(docWith(['rmPlan'])), true);
  assert.equal(view.hideOnRemediation(docWith(['rmPlan', 'rmPlanDoneActions'])), false);
  assert.equal(view.hideOnRemediation({ getElementById: () => null }), false);
});

test('the plan repaints when any logged session ends', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'learnerPlanView.js'), 'utf8');
  assert.match(src, /'endTeacherSession'\]\.forEach\(hook\)/);
  const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(index, /window\.mmLastDiag=\{grade:selectedGrade/);
});

// #460 — the card repaints from a MutationObserver on #remediation, so the new
// weekly pace shows one microtask after rpAdvance(), not in the same tick.
test('the remediation card repaints when a class toggles under #remediation', () => {
  function el() {
    const node = { className: '', innerHTML: '', children: [] };
    node.classList = {
      contains: (c) => node.className.split(/\s+/).indexOf(c) !== -1,
      toggle(c, force) {
        const list = node.className.split(/\s+/).filter((x) => x && x !== c);
        if (force) list.push(c);
        node.className = list.join(' ');
      },
    };
    node.querySelector = () => node.children[0] || null;
    node.insertBefore = (child) => { child.parentNode = node; node.children.unshift(child); return child; };
    return node;
  }
  const rem = el();
  const observed = [];
  const saved = { document: global.document, MutationObserver: global.MutationObserver, build: global.buildLearnerPlan, render: global.renderLearnerPlanHtml };
  let done = 0;
  try {
    global.document = { readyState: 'complete', getElementById: (id) => (id === 'remediation' ? rem : null), createElement: el, addEventListener() {} };
    global.MutationObserver = function (cb) { this.observe = (target, opts) => observed.push({ target, opts, cb }); };
    global.buildLearnerPlan = () => ({ paceDone: done });
    global.renderLearnerPlanHtml = (p) => p.paceDone + ' מתוך 3 מפגשים השבוע';
    view.mountLearnerPlans();
    assert.equal(observed.length, 1);
    assert.equal(observed[0].target, rem);
    assert.deepEqual(observed[0].opts, { subtree: true, attributes: true, attributeFilter: ['class'] });
    assert.match(rem.children[0].innerHTML, /^0 מתוך 3/);
    done = 1;
    observed[0].cb();
    assert.match(rem.children[0].innerHTML, /^1 מתוך 3/);
  } finally {
    global.document = saved.document;
    global.MutationObserver = saved.MutationObserver;
    global.buildLearnerPlan = saved.build;
    global.renderLearnerPlanHtml = saved.render;
  }
});

test('the plan card is wired on every practice surface and the palette file is cached', () => {
  const root = path.join(__dirname, '..');
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(index, /src\/lib\/learnerPlanView\.js/);
  assert.match(index, /src\/sefirot\.css/);
  assert.match(index, /dir="rtl"/);
  view.SLOTS.forEach((id) => assert.match(index, new RegExp('id="' + id + '"')));
  assert.match(sw, /learnerPlanView\.js/);
  assert.match(sw, /sefirot\.css/);
  const curriculum = fs.readFileSync(path.join(root, 'curriculum.html'), 'utf8');
  assert.match(curriculum, /learnerPlanView\.js/);
  assert.match(curriculum, /sefirot\.css/);
});

test('each slot contains .mm-plan-why', () => {
  const learnerPlan = require('../src/lib/learnerPlan');
  const slotsMap = new Map();
  view.SLOTS.forEach((id) => {
    const el = {
      id: id,
      children: [],
      querySelector(sel) {
        if (sel === '.mm-plan-slot') {
          return this.children.find((c) => c.className === 'mm-plan-slot') || null;
        }
        return null;
      },
      insertBefore(child) {
        child.parentNode = this;
        this.children.unshift(child);
        return child;
      },
    };
    slotsMap.set(id, el);
  });

  function createEl() {
    const el = {
      className: '',
      innerHTML: '',
      children: [],
      querySelector(sel) {
        if (sel === '.mm-plan-slot') {
          return this.children.find((c) => (c.className || '').indexOf('mm-plan-slot') !== -1) || null;
        }
        return null;
      },
      insertBefore(child) {
        child.parentNode = this;
        this.children.unshift(child);
        return child;
      },
    };
    el.classList = {
      contains(c) {
        return (el.className || '').split(/\s+/).indexOf(c) !== -1;
      },
      toggle(c, force) {
        const list = (el.className || '').split(/\s+/).filter(Boolean);
        const idx = list.indexOf(c);
        if (force && idx === -1) list.push(c);
        else if (!force && idx !== -1) list.splice(idx, 1);
        el.className = list.join(' ');
      },
    };
    return el;
  }

  view.SLOTS.forEach((id) => {
    const el = createEl();
    el.id = id;
    slotsMap.set(id, el);
  });

  const mockDocument = {
    readyState: 'complete',
    getElementById(id) {
      return slotsMap.get(id) || null;
    },
    createElement() {
      return createEl();
    },
    addEventListener() {},
  };

  const origDoc = global.document;
  const origBuild = global.buildLearnerPlan;
  const origRender = global.renderLearnerPlanHtml;
  try {
    global.document = mockDocument;
    global.buildLearnerPlan = learnerPlan.buildLearnerPlan;
    global.renderLearnerPlanHtml = learnerPlan.renderLearnerPlanHtml;

    view.mountLearnerPlans();

    view.SLOTS.forEach((id) => {
      const slotEl = slotsMap.get(id).children.find((c) => c.className.indexOf('mm-plan-slot') !== -1);
      assert.ok(slotEl, 'slot element exists for ' + id);
      assert.match(slotEl.innerHTML, /class="mm-plan-why"/, 'slot ' + id + ' contains .mm-plan-why');
      assert.match(slotEl.innerHTML, new RegExp(view.TAB_WHY[id]), 'slot ' + id + ' contains correct TAB_WHY text');
    });
  } finally {
    global.document = origDoc;
    global.buildLearnerPlan = origBuild;
    global.renderLearnerPlanHtml = origRender;
  }
});
