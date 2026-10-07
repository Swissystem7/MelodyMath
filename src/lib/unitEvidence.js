// MelodyMath — per-unit evidence for music activities (plan §10, R4/R6/R10/R11).
//
// Every music unit has to show that it adds learning, not engagement:
//
//   assignArm      each learner is randomly put, once per unit, in the music
//                  arm or the visual-only arm (same items, no sound) — R11.
//   recordStage    pre-check, post-check, near transfer, far transfer (no
//                  sound, no colour hint) and retention (≥14 days) — R10.
//   unitLearned    a unit counts as learned only when the no-music transfer
//                  step is right; right-with-sound-only is not enough — R4.
//   retrievalDue   a missed transfer brings the skill back on days 1, 3, 7
//                  and 14, the last one without music — R6.
//   fixOrRemove    with fewer than 30 learners per arm it says so; after that
//                  a music arm that is not at least as good as visual-only on
//                  far transfer and retention is flagged "fix" — R11.
//
// Local only (localStorage), one key per device. No server, no efficacy claim.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const EVIDENCE_KEY = 'mm-unit-evidence-v1';
  const ARMS = ['music', 'visual'];
  const STAGES = ['pre', 'post', 'near', 'far', 'retention'];
  const RETRIEVAL_DAYS = [1, 3, 7, 14];
  const RETENTION_DAYS = 14;
  const MIN_PER_ARM = 30;
  const DAY = 24 * 60 * 60 * 1000;

  function defaultStorage() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) { /* private mode */ }
    return null;
  }

  function load(storage) {
    const ls = storage === undefined ? defaultStorage() : storage;
    if (!ls) return {};
    try {
      const raw = JSON.parse(ls.getItem(EVIDENCE_KEY) || '{}');
      return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    } catch (e) {
      return {};
    }
  }

  function save(data, storage) {
    const ls = storage === undefined ? defaultStorage() : storage;
    if (!ls) return;
    try { ls.setItem(EVIDENCE_KEY, JSON.stringify(data)); } catch (e) { /* quota */ }
  }

  function own(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
  }

  function learnerRecord(data, unitId, learner) {
    const unit = own(data, unitId);
    if (!unit || typeof unit !== 'object') return null;
    const rec = own(unit, learner);
    return rec && typeof rec === 'object' ? rec : null;
  }

  function ensureRecord(data, unitId, learner) {
    if (!own(data, unitId) || typeof data[unitId] !== 'object') data[unitId] = {};
    if (!learnerRecord(data, unitId, learner)) data[unitId][learner] = { stages: {} };
    const rec = data[unitId][learner];
    if (!rec.stages || typeof rec.stages !== 'object') rec.stages = {};
    return rec;
  }

  function assignArm(unitId, learner, storage, random) {
    const data = load(storage);
    const rec = ensureRecord(data, unitId, learner);
    if (ARMS.indexOf(rec.arm) === -1) {
      const r = typeof random === 'function' ? random() : Math.random();
      rec.arm = r < 0.5 ? 'music' : 'visual';
      save(data, storage);
    }
    return rec.arm;
  }

  // score: { right, total }. A later attempt at the same stage is kept apart
  // from the first one, so a retry cannot overwrite the honest first result.
  function recordStage(unitId, learner, stage, score, now, storage) {
    if (STAGES.indexOf(stage) === -1) return null;
    const right = Math.max(0, Math.floor(Number(score && score.right) || 0));
    const total = Math.max(0, Math.floor(Number(score && score.total) || 0));
    if (total === 0 || right > total) return null;
    const data = load(storage);
    const rec = ensureRecord(data, unitId, learner);
    const entry = { right: right, total: total, at: now == null ? Date.now() : Number(now) };
    const first = !rec.stages[stage];
    if (first) rec.stages[stage] = entry;
    else rec.stages[stage + 'Retry'] = entry;
    if (stage === 'far') {
      // A served review drops out; the later ones stay. A miss with nothing
      // left on the calendar starts the 1-3-7-14 cycle again.
      rec.due = first ? [] : (Array.isArray(rec.due) ? rec.due : []).filter(function (d) {
        return d && d.at > entry.at;
      });
      if (!full(entry) && rec.due.length === 0) rec.due = retrievalSchedule(entry.at);
    }
    save(data, storage);
    return rec;
  }

  function retrievalSchedule(from) {
    return RETRIEVAL_DAYS.map(function (d) {
      return { day: d, at: from + d * DAY, noMusic: d === RETRIEVAL_DAYS[RETRIEVAL_DAYS.length - 1] };
    });
  }

  function full(stage) {
    return !!stage && stage.total > 0 && stage.right === stage.total;
  }

  function unitLearned(rec) {
    if (!rec || !rec.stages) return false;
    return full(rec.stages.far) || full(rec.stages.farRetry);
  }

  function retrievalDue(rec, now) {
    if (!rec || !Array.isArray(rec.due)) return null;
    const t = now == null ? Date.now() : Number(now);
    const due = rec.due.filter(function (d) { return d && d.at <= t; });
    return due.length ? due[due.length - 1] : null;
  }

  function retentionDue(rec, now) {
    if (!rec || !rec.stages || !rec.stages.far || rec.stages.retention) return false;
    return (now == null ? Date.now() : Number(now)) - rec.stages.far.at >= RETENTION_DAYS * DAY;
  }

  function rate(recs, stage) {
    let right = 0;
    let total = 0;
    recs.forEach(function (r) {
      const s = r.stages && r.stages[stage];
      if (s && s.total > 0) { right += s.right; total += s.total; }
    });
    return total ? right / total : null;
  }

  function armSummary(unit, arm) {
    const recs = Object.keys(unit || {}).map(function (k) { return unit[k]; })
      .filter(function (r) { return r && r.arm === arm && r.stages && r.stages.far; });
    return {
      n: recs.length,
      pre: rate(recs, 'pre'),
      post: rate(recs, 'post'),
      far: rate(recs, 'far'),
      retention: rate(recs, 'retention'),
    };
  }

  function fixOrRemove(unitId, storage) {
    const unit = own(load(storage), unitId) || {};
    const music = armSummary(unit, 'music');
    const visual = armSummary(unit, 'visual');
    const out = { music: music, visual: visual };
    if (music.n < MIN_PER_ARM || visual.n < MIN_PER_ARM) {
      out.verdict = 'collecting';
      return out;
    }
    const keys = ['far', 'retention'].filter(function (k) {
      return music[k] != null && visual[k] != null;
    });
    const worse = keys.some(function (k) { return music[k] < visual[k]; });
    out.verdict = keys.length && !worse ? 'keep' : 'fix';
    return out;
  }

  return {
    EVIDENCE_KEY, ARMS, STAGES, RETRIEVAL_DAYS, RETENTION_DAYS, MIN_PER_ARM,
    loadEvidence: load, assignArm, recordStage, retrievalSchedule, unitLearned,
    retrievalDue, retentionDue, armSummary, fixOrRemove,
  };
});
