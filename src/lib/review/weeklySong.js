// MelodyMath — the weekly song of DailyJam (#591, proposal 5/5).
//
// Every day a jam is completed adds one bar to the child's song of the week.
// A missed day deletes nothing; the bars already earned stay. On the 7th day
// of the week the whole song plays. No notifications and no pressure: the
// reward is the child's own music, not points (Deci, Koestner & Ryan 1999,
// cited in the proposal). Dates are 'YYYY-MM-DD' strings read in UTC.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_WEEKLY_SONG = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DAY = 86400000;
  const WEEK_DAYS = 7;
  const STORAGE_KEY = 'mm.review.weeklySong';

  function toDay(date) {
    const t = Date.parse(String(date).slice(0, 10) + 'T00:00:00Z');
    return Number.isFinite(t) ? t : null;
  }
  function fmt(t) { return new Date(t).toISOString().slice(0, 10); }

  // A song starts on weekStart (any date) and spans 7 days.
  function createSong(weekStart) {
    return { weekStart: fmt(toDay(weekStart)), bars: [], past: [] };
  }

  // 1-7 inside the song's week, or a number outside that range.
  function dayOfWeek(song, date) {
    return Math.round((toDay(date) - toDay(song.weekStart)) / DAY) + 1;
  }

  // A completed jam on `date` adds one bar (once per day). A date after the
  // week starts a new song and keeps the finished one in `past`.
  // bar is whatever the jam played that day, e.g. { topics: [...] }.
  function completeDay(song, date, bar) {
    let s = { weekStart: song.weekStart, bars: song.bars.slice(), past: (song.past || []).slice() };
    let d = dayOfWeek(s, date);
    if (d < 1) return { song: s, added: false };
    if (d > WEEK_DAYS) {
      const weeks = Math.floor((d - 1) / WEEK_DAYS);
      s.past.push({ weekStart: s.weekStart, bars: s.bars });
      s = { weekStart: fmt(toDay(s.weekStart) + weeks * WEEK_DAYS * DAY), bars: [], past: s.past };
      d = dayOfWeek(s, date);
    }
    const day = fmt(toDay(date));
    if (s.bars.some(function (b) { return b.date === day; })) return { song: s, added: false };
    s.bars.push(Object.assign({ date: day, day: d }, bar || {}));
    return { song: s, added: true };
  }

  // On day 7 the song plays with every bar earned this week (missed days
  // simply have no bar); on other days nothing plays.
  function songToPlay(song, date) {
    if (dayOfWeek(song, date) !== WEEK_DAYS || !song.bars.length) return null;
    return { weekStart: song.weekStart, bars: song.bars.slice() };
  }

  function loadSong(storage, weekStart, key) {
    try {
      const raw = storage && storage.getItem(key || STORAGE_KEY);
      const v = raw ? JSON.parse(raw) : null;
      if (v && v.weekStart && Array.isArray(v.bars)) return v;
    } catch (e) { /* unreadable storage -> start fresh */ }
    return createSong(weekStart);
  }

  function saveSong(storage, song, key) {
    if (!storage) return false;
    try {
      storage.setItem(key || STORAGE_KEY, JSON.stringify(song));
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    WEEK_DAYS: WEEK_DAYS,
    STORAGE_KEY: STORAGE_KEY,
    createSong: createSong,
    dayOfWeek: dayOfWeek,
    completeDay: completeDay,
    songToPlay: songToPlay,
    loadSong: loadSong,
    saveSong: saveSong,
  };
});
