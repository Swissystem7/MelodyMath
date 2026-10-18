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
