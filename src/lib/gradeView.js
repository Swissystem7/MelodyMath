// The picture and the pitch try on the exercise screen (Refs #685, Refs #665).
//
// representationFor / showsStaffByDefault decide what is on screen: blocks in
// every grade, staff only after the child asks, and only from grade ג׳.
// A pitch button is judged by matchPitch (wide tolerance, or a skip).
(function (root, factory) {
  const meta = (typeof module === 'object' && module.exports)
    ? require('./curriculum/evidenceMeta')
    : root.MM_EVIDENCE_META;
  const api = factory(meta || {});
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_GRADE_VIEW = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (meta) {
  const TARGET_HZ = 440;
  const NEAR_HZ = TARGET_HZ * Math.pow(2, 2 / 12);
  const FAR_HZ = TARGET_HZ * Math.pow(2, 5 / 12);

  function picture(grade) {
    if (typeof meta.representationFor !== 'function') return null;
    const r = meta.representationFor(grade);
    if (!r || r.kind !== 'blocks') return null;
    const staff = typeof meta.showsStaffByDefault === 'function' && meta.showsStaffByDefault(grade);
    return { staff: !!staff, optionalStaff: !!r.optionalStaff && !staff };
  }

  function node(doc, tag, cls, text) {
    const el = doc.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }

  function button(doc, label, act, hz) {
    const b = node(doc, 'button', 'gv-btn', label);
    b.type = 'button';
    if (act) b.setAttribute('data-act', act);
    if (hz != null) b.setAttribute('data-hz', String(hz));
    return b;
  }

  function playHz(container, hz) {
    const local = container && typeof container.playFreq === 'function' ? container.playFreq : null;
    const play = local || (typeof playFreq === 'function' ? playFreq : null);
    if (play) play(hz, 280);
  }

  function mount(container, grade) {
    const pic = picture(grade);
    const doc = container && (container.ownerDocument || (typeof document !== 'undefined' ? document : null));
    if (!pic || !doc || !container) return null;
    const view = node(doc, 'div', 'gv');
    view.setAttribute('data-grade', grade);
    view.setAttribute('data-kind', 'blocks');
    view.setAttribute('data-staff-default', pic.staff ? '1' : '0');
    const blocks = node(doc, 'div', 'gv-blocks');
    blocks.setAttribute('aria-label', 'בלוקים');
    for (let i = 0; i < 4; i++) blocks.appendChild(node(doc, 'i', 'gv-block'));
    view.appendChild(node(doc, 'p', 'gv-label', 'בלוקים'));
    view.appendChild(blocks);
    let staff = null;
    if (pic.optionalStaff || pic.staff) {
      const toggle = button(doc, 'תווים (רשות)', 'staff');
      toggle.setAttribute('aria-pressed', pic.staff ? 'true' : 'false');
      staff = node(doc, 'div', pic.staff ? 'gv-staff gv-on' : 'gv-staff');
      staff.setAttribute('aria-label', 'חמשה');
      for (let i = 0; i < 5; i++) staff.appendChild(node(doc, 'span', 'gv-line'));
      toggle.addEventListener('click', function () {
        const on = staff.className.indexOf('gv-on') === -1;
        staff.className = on ? 'gv-staff gv-on' : 'gv-staff';
        toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      view.appendChild(toggle);
      view.appendChild(staff);
    }
    const read = node(doc, 'p', 'gv-read', '');
    read.setAttribute('aria-live', 'polite');
    function judge(heard, opts) {
      const result = meta.matchPitch(heard, TARGET_HZ, opts);
      if (result.skipped) read.textContent = 'דילגתם';
      else read.textContent = result.matched ? 'קרוב' : 'רחוק';
      if (!result.skipped) playHz(container, heard);
      return result;
    }
    const hear = button(doc, 'שמעו את הצליל', 'hear');
    hear.addEventListener('click', function () { playHz(container, TARGET_HZ); });
    const same = button(doc, 'אותו צליל', 'pitch', TARGET_HZ);
    same.addEventListener('click', function () { judge(TARGET_HZ); });
    const near = button(doc, 'קרוב', 'pitch', NEAR_HZ);
    near.addEventListener('click', function () { judge(NEAR_HZ); });
    const far = button(doc, 'רחוק', 'pitch', FAR_HZ);
    far.addEventListener('click', function () { judge(FAR_HZ); });
    const skip = button(doc, 'דילוג', 'skip');
    skip.addEventListener('click', function () { judge(0, { skip: true }); });
    view.appendChild(hear);
    view.appendChild(same);
    view.appendChild(near);
    view.appendChild(far);
    view.appendChild(skip);
    view.appendChild(read);
    container.appendChild(view);
    return view;
  }

  return { TARGET_HZ: TARGET_HZ, NEAR_HZ: NEAR_HZ, FAR_HZ: FAR_HZ, picture: picture, mount: mount };
});
