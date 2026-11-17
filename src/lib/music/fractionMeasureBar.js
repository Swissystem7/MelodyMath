// MelodyMath — MM-UI-707: Musical measure fraction bar (grades 2-4 / כיתות ב׳-ד׳)
// Pure logic and accessible HTML rendering for a 4/4 musical measure fraction bar.

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MM_FRACTION_MEASURE_BAR = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PARTITIONS = {
    1: { id: 'whole', he: 'שלם', altHe: 'תיבה שלמה', beats: 4, color: '#2563eb', colorClass: 'bar-part-whole', className: 'bar-part-whole' },
    2: { id: 'half', he: 'חצי תיבה', altHe: 'חצי', beats: 2, color: '#059669', colorClass: 'bar-part-half', className: 'bar-part-half' },
    4: { id: 'quarter', he: 'רבע תיבה', altHe: 'רבע', beats: 1, color: '#d97706', colorClass: 'bar-part-quarter', className: 'bar-part-quarter' },
    8: { id: 'eighth', he: 'שמינית תיבה', altHe: 'שמינית', beats: 0.5, color: '#7c3aed', colorClass: 'bar-part-eighth', className: 'bar-part-eighth' }
  };
  const DENOMINATORS = PARTITIONS;
  const SUPPORTED_DENOMINATORS = [1, 2, 4, 8];

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function validateMeasureConfig(config) {
    const cfg = typeof config === 'number' ? { denominator: config } : (config || {});
    const rawDenom = Number(cfg.denominator);
    const valid = SUPPORTED_DENOMINATORS.includes(rawDenom);
    const denominator = valid ? rawDenom : (cfg.fallbackDenominator || 4);
    const totalParts = denominator;

    let activeIndices = [];
    let activeCount = 0;

    if (Array.isArray(cfg.activeIndices)) {
      activeIndices = cfg.activeIndices
        .map(Number)
        .filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < totalParts);
      activeCount = activeIndices.length;
    } else if (typeof cfg.activeCount === 'number') {
      activeCount = Math.max(0, Math.min(totalParts, Math.floor(cfg.activeCount)));
      activeIndices = Array.from({ length: activeCount }, (_, i) => i);
    }

    return {
      valid,
      isValid: valid,
      denominator,
      totalParts,
      totalBeats: 4,
      activeCount,
      activeIndices
    };
  }

  function getPartition(denominator, activeCountOrIndices, options) {
    let denom = denominator;
    let activeArg = activeCountOrIndices;
    let opts = options || {};

    if (typeof denominator === 'object' && denominator !== null && !Array.isArray(denominator)) {
      opts = denominator;
      denom = opts.denominator;
      activeArg = activeCountOrIndices !== undefined ? activeCountOrIndices : (opts.activeCount !== undefined ? opts.activeCount : opts.activeIndices);
    }

    const config = validateMeasureConfig({
      denominator: denom,
      activeCount: typeof activeArg === 'number' ? activeArg : opts.activeCount,
      activeIndices: Array.isArray(activeArg) ? activeArg : opts.activeIndices,
      fallbackDenominator: opts.fallbackDenominator || 4
    });

    const info = PARTITIONS[config.denominator];
    const activeSet = new Set(config.activeIndices);

    const parts = [];
    for (let i = 0; i < config.totalParts; i++) {
      const active = activeSet.has(i);
      parts.push({
        index: i,
        beats: info.beats,
        label: info.he,
        color: info.color,
        colorClass: info.colorClass,
        className: info.className,
        active,
        ariaLabel: `${info.he} ${i + 1} מתוך ${config.totalParts}${active ? ' (פעיל)' : ' (לא פעיל)'}`
      });
    }

    const activeParts = parts.filter((p) => p.active).length;
    const activeBeats = activeParts * info.beats;

    return {
      denominator: config.denominator,
      totalParts: config.totalParts,
      totalBeats: 4,
      activeParts,
      activeCount: activeParts,
      activeBeats,
      parts
    };
  }

  function renderMeasureBarHtml(options) {
    const opts = typeof options === 'number' ? { denominator: options } : (options || {});
    const partition = opts.parts && opts.totalParts
      ? opts
      : getPartition(opts.denominator, opts.activeCount !== undefined ? opts.activeCount : opts.activeIndices, opts);

    const info = PARTITIONS[partition.denominator] || PARTITIONS[4];
    const defaultLabel = `סרגל שברים תיבת 4/4: ${partition.activeParts} מתוך ${partition.totalParts} חלקים פעילים (${partition.activeBeats}/4 פעימות)`;
    const containerLabel = opts.ariaLabel ? escapeHtml(opts.ariaLabel) : escapeHtml(defaultLabel);

    const blocksHtml = partition.parts.map((part) => {
      const stateClass = part.active ? 'part-active active' : 'part-inactive inactive';
      const blockClass = `measure-bar-part ${escapeHtml(info.colorClass)} ${stateClass}`;
      const blockAria = escapeHtml(part.ariaLabel);
      const style = `flex: 1; --part-color: ${info.color}; background-color: ${part.active ? info.color : 'transparent'};`;
      return `<div class="${blockClass}" role="img" aria-label="${blockAria}" style="${style}" data-index="${part.index}" data-beats="${part.beats}"></div>`;
    }).join('');

    const extraClass = opts.className ? ` ${escapeHtml(opts.className)}` : '';
    return `<div class="fraction-measure-bar measure-bar${extraClass}" role="group" aria-label="${containerLabel}">${blocksHtml}</div>`;
  }

  return {
    PARTITIONS,
    DENOMINATORS,
    SUPPORTED_DENOMINATORS,
    getPartition,
    renderMeasureBarHtml,
    validateMeasureConfig,
    escapeHtml
  };
});
