const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const banks = require('../src/lib/banks');

function makeEl(tag) {
  return {
    tag: tag, className: '', textContent: '', innerHTML: '',
    children: [], attrs: {},
    classList: {
      names: ['hidden'],
      add(c) { if (this.names.indexOf(c) === -1) this.names.push(c); },
      remove(c) { this.names = this.names.filter((n) => n !== c); },
    },
    appendChild(c) { this.children.push(c); return c; },
  };
}

test('grade א music items keep a g1 spec through the shipped bank', () => {
  const items = banks.itemsForGrade('א').filter((it) => it.widget === 'g1');
  const kinds = items.map((it) => it.g1 && it.g1.kind).sort();
  assert.deepEqual(kinds, ['beats', 'chart100', 'pattern']);
  const beats = items.find((it) => it.g1.kind === 'beats');
  assert.equal(beats.g1.step, 2);
  assert.equal(items.find((it) => it.g1.kind === 'chart100').g1.number, 34);
});

test('renderWidget calls bindGrade1 and hides the host when the binder refuses', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /item\.widget==='g1' && item\.g1 && typeof bindGrade1==='function'/);
  const src = html.match(/function renderWidget\(hostId, item, inputId\)\{[\s\S]*?\n\}/)[0];
  const host = makeEl('div');
  const seen = [];
  const ctx = {
    $: () => host,
    bindGrade1(el, spec) { seen.push(spec.kind); el.appendChild(makeEl('div')); return spec.kind !== 'nope'; },
  };
  vm.createContext(ctx);
  const render = vm.runInContext(src + '\nrenderWidget;', ctx);
  const item = banks.itemsForGrade('א').find((it) => it.widget === 'g1');
  render('widgetHost', item, null);
  assert.deepEqual(seen, [item.g1.kind]);
  assert.deepEqual(host.classList.names, []);
  host.classList.names = ['hidden'];
  host.children = [];
  render('widgetHost', { widget: 'g1', g1: { kind: 'nope' } }, null);
  assert.deepEqual(host.classList.names, ['hidden']);
});

// #415: the stub above proves the call; this runs the real bindGrade1 on every
// shipped g1 spec, so a bank spec the binder refuses (hidden widget) fails here.
test('every shipped g1 item renders through the real renderWidget and bindGrade1', (t) => {
  const g1 = require('../src/lib/grade1Music');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const src = html.match(/function renderWidget\(hostId, item, inputId\)\{[\s\S]*?\n\}/)[0];
  global.document = { createElement: makeBoxEl };
  t.after(() => { delete global.document; });

  const items = banks.itemsForGrade('א').filter((it) => it.widget === 'g1');
  assert.ok(items.length > 0);
  items.forEach((item) => {
    const host = makeEl('div');
    const ctx = { $: () => host, bindGrade1: g1.bindGrade1 };
    vm.createContext(ctx);
    vm.runInContext(src + '\nrenderWidget;', ctx)('widgetHost', item, null);
    assert.deepEqual(host.classList.names, [], `g1 ${item.g1.kind} widget stayed hidden`);
    assert.equal(host.children.length, 1, `g1 ${item.g1.kind} drew nothing`);
  });
});

test('grade1Music.js loads before the inline app script and is cached offline', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const tag = html.indexOf('<script src="src/lib/grade1Music.js"></script>');
  assert.ok(tag !== -1, 'index.html does not load grade1Music.js');
  assert.ok(tag < html.indexOf('function renderWidget('), 'grade1Music.js loads after renderWidget');
  assert.match(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), /'\.\/src\/lib\/grade1Music\.js'/);
});

function makeBoxEl(tag) {
  return {
    tag: tag, className: '', textContent: '', children: [], attrs: {},
    appendChild(c) { this.children.push(c); return c; },
    insertBefore(c) { this.children.unshift(c); return c; },
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k]; },
    addEventListener() {},
    querySelector(sel) { return findByClass(this, sel.replace('.', '')); },
  };
}

function findByClass(root, cls) {
  for (const c of root.children) {
    if (String(c.className).split(' ').indexOf(cls) !== -1) return c;
    const deep = findByClass(c, cls);
    if (deep) return deep;
  }
  return null;
}
