'use strict';
// #591: every grade ו׳ item has a music side. Items that are not a music
// activity learn their standard through one of several research-backed ways
// listed in curriculum/grade6.js — the way of the item's level — each with a
// source and an evidence label, shown in the feedback once the child answered.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = require('../src/lib/banks');
const g6 = require('../src/lib/curriculum/grade6');

const six = banks.itemsForGrade('ו');
const ACTIVITIES = ['dotted', 'triplet', 'durationDiv', 'ratioHz', 'meanBpm', 'tempo', 'circleFifths', 'mean', 'bars'];
const wayOf = (it) => {
  const key = Object.keys(g6.music).find((k) => banks.ST[k] === it.standard);
  const ways = g6.music[key];
  return ways[Math.min(it.level, ways.length) - 1];
};

test('every grade ו׳ item has a music tag', () => {
  assert.ok(six.length > 150);
  six.forEach((it) => assert.ok(it.music, it.id + ' ' + it.prompt));
});

test('a way never replaces a music activity, and never reuses its tag', () => {
  six.forEach((it) => {
    if (it.musicNote) assert.ok(!ACTIVITIES.includes(it.music), it.id + ' ' + it.music);
    else assert.ok(ACTIVITIES.includes(it.music), it.id + ' ' + it.music);
  });
  Object.values(g6.music).forEach((ways) => ways.forEach(([tag]) => assert.ok(!ACTIVITIES.includes(tag), tag)));
});

test('every standard is met through at least two different musical models', () => {
  Object.keys(g6.music).forEach((k) => {
    assert.ok(banks.ST[k], k);
    const ways = g6.music[k];
    assert.ok(ways.length >= 2 && ways.length <= 3, k);
    assert.equal(new Set(ways.map(([tag]) => tag)).size, ways.length, k + ' repeats a tag');
    assert.equal(new Set(ways.map(([, note]) => note)).size, ways.length, k + ' repeats a note');
  });
  // The items of a standard that span two levels or more use two ways or more.
  const byStd = {};
  six.filter((it) => it.musicNote).forEach((it) => {
    const s = byStd[it.standard] || (byStd[it.standard] = { levels: new Set(), tags: new Set() });
    s.levels.add(it.level);
    s.tags.add(it.music);
  });
  Object.keys(byStd).forEach((std) => {
    if (byStd[std].levels.size >= 2) assert.ok(byStd[std].tags.size >= 2, std);
  });
});

test('each way is Hebrew, short, and carries a real source with an evidence label', () => {
  Object.values(g6.music).forEach((ways) => ways.forEach(([tag, note, src, ev]) => {
    assert.match(tag, /^[a-z][A-Za-z]+$/);
    assert.match(note, /[א-ת]/);
    assert.ok(note.length < 140, note.length + ' ' + note);
    assert.ok(g6.sources[src], tag + ' → ' + src);
    assert.ok(['D', 'R', 'A'].includes(ev), tag + ' ' + ev);
  }));
  Object.keys(g6.sources).forEach((id) => {
    const [label, url] = g6.sources[id];
    assert.ok(label.length > 5, id);
    assert.match(url, /^https:\/\//, id);
    assert.deepEqual(banks.MUSIC_SOURCES[id], g6.sources[id]);
  });
});

test('an item takes the way of its level, with its source and label', () => {
  six.filter((it) => it.musicNote).forEach((it) => {
    const [tag, note, src, ev] = wayOf(it);
    assert.equal(it.music, tag, it.id);
    assert.equal(it.musicNote, note, it.id);
    assert.equal(it.musicSrc, src, it.id);
    assert.equal(it.musicEv, ev, it.id);
  });
  six.filter((it) => !it.musicNote).forEach((it) => assert.equal(it.musicSrc, undefined, it.id));
});

test('other grades are untouched', () => {
  ['א', 'ב', 'ג', 'ד', 'ה'].forEach((g) => {
    banks.itemsForGrade(g).forEach((it) => assert.equal(it.musicNote, undefined, it.id));
  });
});

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fn = (name) => html.split('\n').find((l) => l.startsWith('function ' + name + '('));

test('the way is shown with the prompt in the diagnostic, the plan and class mode; its source only after answering', () => {
  assert.ok(fn('musicWayHtml').includes('mathHtml(it.musicNote)'));
  assert.ok(fn('rmRender').includes("setMusicWay('rmWay',q)"));
  assert.ok(fn('rpRender').includes("setMusicWay('rmPlanWay',it)"));
  assert.ok(fn('nextClassQuestion').includes("setMusicWay('classWay',q)"));
  ['rmWay', 'rmPlanWay', 'classWay'].forEach((id) => assert.ok(html.includes('id="' + id + '" class="music-way hidden"'), id));
  assert.ok(fn('rmCheck').includes('${musicSourceHtml(q)}'));
  assert.ok(fn('rpCheck').includes('${musicSourceHtml(it)}'));
  assert.ok(!fn('rmRender').includes('musicSrc') && !fn('rpRender').includes('musicSrc'));
  assert.ok(!html.includes('musicNoteHtml'));
  const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  assert.ok(Number(sw.match(/melodymath-offline-v(\d+)/)[1]) >= 22, 'index.html changed, so CACHE moves');
});

test('the way and source helpers render the note, the source link and the evidence label, and hide when absent', () => {
  const vm = require('node:vm');
  const el = { innerHTML: '', hidden: null };
  const escAttr = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const escText = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const ctx = {
    mathHtml: (s) => '[' + s + ']',
    MUSIC_SOURCES: banks.MUSIC_SOURCES,
    $: (id) => (id === 'rmWay' ? el : null),
    show: (id, on) => { el.hidden = !on; },
    document: {
      createElement: () => ({
        get outerHTML() { return '<a href="' + escAttr(this.href) + '" target="' + this.target + '" rel="' + this.rel + '">' + escText(this.textContent) + '</a>'; },
      }),
    },
  };
  vm.createContext(ctx);
  vm.runInContext(['musicWayHtml', 'setMusicWay', 'musicEvHe', 'musicSourceHtml'].map(fn).join('\n'), ctx);
  const way = six.find((it) => it.musicNote);
  const activity = six.find((it) => !it.musicNote);
  ctx.setMusicWay('rmWay', way);
  assert.equal(el.innerHTML, '<b>🎵 דרך מוזיקלית:</b> [' + way.musicNote + ']');
  assert.equal(el.hidden, false);
  ctx.setMusicWay('rmWay', activity);
  assert.equal(el.innerHTML, '');
  assert.equal(el.hidden, true);
  ctx.setMusicWay('classWay', way); // no such element in this page: nothing thrown
  const src = ctx.musicSourceHtml(way);
  const [label, url] = banks.MUSIC_SOURCES[way.musicSrc];
  assert.ok(src.includes('href="' + url + '"') && src.includes('rel="noopener"'), src);
  assert.ok(src.includes(label.replace(/&/g, '&amp;')), src);
  assert.ok(src.includes(ctx.musicEvHe(way.musicEv)), src);
  assert.equal(ctx.musicSourceHtml(activity), '');
  assert.equal(ctx.musicSourceHtml(null), '');
  assert.notEqual(ctx.musicEvHe('D'), ctx.musicEvHe('A'));
  assert.match(ctx.musicEvHe('R'), /[א-ת]/);
});
