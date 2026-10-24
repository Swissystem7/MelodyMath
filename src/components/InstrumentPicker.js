// MelodyMath — InstrumentPicker UI Component (Refs #679, Refs #665).
// Free instrument selector: 4 families, 44x44px touch targets, zero locks.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const Logic = require('../lib/instrumentPicker.js');
    const I = require('../lib/instruments.js');
    module.exports = factory(Logic, I);
  } else {
    root.InstrumentPickerUI = factory(root.InstrumentPickerLogic, root.MelodyMathInstruments || root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Logic, I) {
  'use strict';

  const instrumentById = (I && I.instrumentById) || function () { return null; };

  function renderPickerHtml(options) {
    const opts = options || {};
    const selectedId = opts.selectedId || 'darbuka';
    const families = Logic.CHILD_FAMILIES || [];

    let html = '<div class="mm-instrument-picker" role="region" aria-label="בחירת כלי נגינה" dir="rtl" style="margin:8px 0">';
    html += '<p class="picker-title" style="font-weight:700;margin:0 0 6px">בחרו כלי נגינה לתרגול:</p>';
    html += '<div class="picker-families" style="display:flex;flex-direction:column;gap:8px">';

    families.forEach(function (fam) {
      html += '<div class="fam-row" role="group" aria-label="' + fam.labelHe + '" style="display:flex;flex-wrap:wrap;align-items:center;gap:6px">';
      html += '<span class="fam-badge" style="font-size:0.9rem;min-width:90px;color:var(--muted)">' + fam.icon + ' ' + fam.labelHe + ':</span>';
      
      fam.instruments.forEach(function (instId) {
        const inst = instrumentById(instId);
        const nameHe = (inst && inst.nameHe) || instId;
        const isSel = instId === selectedId;

        html += '<button type="button" class="inst-btn' + (isSel ? ' active' : '') + '" ';
        html += 'data-instrument="' + instId + '" ';
        html += 'aria-pressed="' + (isSel ? 'true' : 'false') + '" ';
        html += 'style="min-width:44px;min-height:44px;padding:6px 12px;border-radius:10px;border:2px solid ' + (isSel ? 'var(--purple)' : 'var(--line)') + ';background:' + (isSel ? 'var(--card-lit, #ede9fe)' : 'var(--card, #fff)') + ';font-size:0.95rem;font-weight:600;cursor:pointer">';
        html += nameHe;
        html += '</button>';
      });

      html += '</div>';
    });

    html += '</div></div>';
    return html;
  }

  function mountInstrumentPicker(container, options) {
    if (!container) return null;
    const opts = options || {};
    let currentId = opts.selectedId || Logic.getChildInstrument(opts.childId, 'darbuka');

    function render() {
      container.innerHTML = renderPickerHtml({ selectedId: currentId });
      const btns = container.querySelectorAll('[data-instrument]');
      btns.forEach(function (btn) {
        btn.onclick = function () {
          const instId = btn.getAttribute('data-instrument');
          if (instId && instId !== currentId) {
            currentId = instId;
            if (opts.childId) {
              Logic.saveChildInstrument(opts.childId, instId);
            }
            if (typeof opts.onChange === 'function') {
              opts.onChange(instId, Logic.resolveInstrumentVoice(instId, opts));
            }
            render();
          }
        };
      });
    }

    render();

    return {
      getSelectedId: function () { return currentId; },
      setSelectedId: function (id) {
        currentId = id;
        render();
      }
    };
  }

  return {
    renderPickerHtml: renderPickerHtml,
    mountInstrumentPicker: mountInstrumentPicker
  };
});
