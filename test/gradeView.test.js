// The exercise screen uses the grade picture and the wide pitch match (Refs #685).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const GV = require('../src/lib/gradeView');

function makeEl(tag) {
  return {
    tag: tag, className: '', textContent: '', type: '', hidden: false,
    children: [], attrs: {}, clicks: [], ownerDocument: null,
    classList: {
      names: [],
      add(c) { if (this.names.indexOf(c) === -1) this.names.push(c); },
      remove(c) { this.names = this.names.filter((n) => n !== c); },
      contains(c) { return this.names.indexOf(c) !== -1; },
    },
    appendChild(c) { this.children.push(c); return c; },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; },
    addEventListener(ev, fn) { if (ev === 'click') this.clicks.push(fn); },
    set innerHTML(v) { this._html = v; if (v === '') this.children = []; },
    get innerHTML() { return this._html || ''; },
  };
}

function walk(root, pred) {
  if (pred(root)) return root;
  for (const c of root.children || []) {
    const hit = walk(c, pred);
    if (hit) return hit;
  }
  return null;
}

function byAct(root, act) {
  return walk(root, (n) => n.attrs && n.attrs['data-act'] === act && n.attrs['data-hz'] == null);
}

function byText(root, text) {
  return walk(root, (n) => n.tag === 'button' && n.textContent === text);
}

function screen() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const src = html.match(/function setNumberPlay\(id,it\)\{.*\}/)[0];
  const host = makeEl('div');
  host.classList.add('hidden');
  host.ownerDocument = { createElement: makeEl };
  const played = [];
  host.playFreq = (hz) => { played.push(hz); };
  const ctx = {
    selectedGrade: 'א',
    $: () => host,
    MM_NUMBER_PLAY: { mount(el) { el._np = true; el.classList.remove('hidden'); } },
    MM_GRADE_VIEW: GV,
  };
  vm.createContext(ctx);
  vm.runInContext(src + '\nthis.setNumberPlay = setNumberPlay;', ctx);
  return { host: host, setNumberPlay: ctx.setNumberPlay, played: played };
}

test('the exercise screen shows blocks and no staff for grades א׳ and ב׳', () => {
  const s = screen();
  s.setNumberPlay('practiceNumberPlay', { grade: 'א', prompt: '2+2' });
  const view = walk(s.host, (n) => n.className === 'gv');
  assert.equal(view.getAttribute('data-kind'), 'blocks');
  assert.equal(view.getAttribute('data-staff-default'), '0');
  assert.equal(walk(view, (n) => n.className === 'gv-blocks').children.length, 4);
  assert.equal(byAct(view, 'staff'), null);
  assert.equal(walk(view, (n) => String(n.className).indexOf('gv-staff') === 0), null);
  assert.ok(!s.host.classList.contains('hidden'));
  assert.equal(s.host._np, true);
  const quiet = screen();
  quiet.setNumberPlay('practiceNumberPlay', { grade: 'א', noMusic: true, prompt: '2+2' });
  assert.equal(walk(quiet.host, (n) => n.className === 'gv'), null);
  assert.equal(quiet.host.innerHTML, '');
  assert.ok(quiet.host.classList.contains('hidden'));
});

test('from grade ג׳ the same screen keeps staff optional until the child asks', () => {
  const s = screen();
  s.setNumberPlay('rmNumberPlay', { grade: 'ג', prompt: '3×4' });
  const view = walk(s.host, (n) => n.className === 'gv');
  assert.equal(s.host._np, true);
  assert.equal(view.getAttribute('data-staff-default'), '0');
  const staff = walk(view, (n) => String(n.className).indexOf('gv-staff') === 0);
  assert.equal(staff.className, 'gv-staff');
  assert.equal(staff.children.length, 5);
  const toggle = byAct(view, 'staff');
  assert.equal(toggle.getAttribute('aria-pressed'), 'false');
  toggle.clicks[0]();
  assert.equal(staff.className, 'gv-staff gv-on');
  assert.equal(toggle.getAttribute('aria-pressed'), 'true');
  toggle.clicks[0]();
  assert.equal(staff.className, 'gv-staff');
});

test('the exercise screen judges a pitch with matchPitch and plays what the child chose', () => {
  const s = screen();
  s.setNumberPlay('practiceNumberPlay', { grade: 'ב', prompt: '5-1' });
  const view = walk(s.host, (n) => n.className === 'gv');
  const read = walk(view, (n) => n.className === 'gv-read');
  byText(view, 'קרוב').clicks[0]();
  assert.equal(read.textContent, 'קרוב');
  assert.equal(s.played[s.played.length - 1], GV.NEAR_HZ);
  byText(view, 'רחוק').clicks[0]();
  assert.equal(read.textContent, 'רחוק');
  assert.equal(s.played[s.played.length - 1], GV.FAR_HZ);
  const before = s.played.length;
  byAct(view, 'skip').clicks[0]();
  assert.equal(read.textContent, 'דילגתם');
  assert.equal(s.played.length, before);
  byAct(view, 'hear').clicks[0]();
  assert.equal(s.played[s.played.length - 1], GV.TARGET_HZ);
});

test('index.html and the offline list load the grade view', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /src="src\/lib\/gradeView\.js"/);
  assert.match(html, /MM_GRADE_VIEW\.mount\(el,\(it&&it\.grade\)\|\|selectedGrade\)/);
  assert.match(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), /'\.\/src\/lib\/gradeView\.js'/);
});
