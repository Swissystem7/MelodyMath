// MelodyMath — the one place that says how to reach the project.
//
// CONTACT holds the only contact values in the repo.
//   email: the owner put this address in offer.js on 13.8.2026 (c94fdd8); it
//          moved here unchanged. '' hides the email link.
//   form:  the public channel. The owner decided on 28.9 that it is his Google
//          Form "משוב על האפליקציות", with the app field pre-filled as MelodyMath.
//          https only; '' (or anything else) brings back the Hebrew GitHub issue form.
// Nothing here invents a phone, a WhatsApp or a name.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    Object.assign(root, api);
    if (typeof document !== 'undefined') {
      const mount = function () { api.mountContactBlocks(document); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
      else mount();
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CONTACT = {
    email: 'aviran2606@gmail.com',
    form: 'https://docs.google.com/forms/d/e/1FAIpQLSdT8YduNx-VWKM3bWGUJdiSj4Sw9D-EA6R6c-oYVYCQmOVXxQ/viewform?usp=pp_url&entry.368039752=MelodyMath',
  };
  const ISSUE_FORM_URL = 'https://github.com/Swissystem7/MelodyMath/issues/new?template=pilot.yml';
  const EMAIL_RE = /^[^\s@<>"'()]+@[^\s@<>"'()]+\.[a-z]{2,}$/i;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function contactChannels(cfg) {
    const c = cfg && typeof cfg === 'object' ? cfg : CONTACT;
    const raw = String(c.email == null ? '' : c.email).trim();
    const form = String(c.form == null ? '' : c.form).trim();
    return {
      email: EMAIL_RE.test(raw) ? raw : '',
      formUrl: /^https:\/\/[^\s"'<>]+$/i.test(form) ? form : '',
      issueUrl: ISSUE_FORM_URL,
    };
  }

  function projectEmail() {
    return contactChannels(CONTACT).email;
  }

  function renderContactHtml(cfg, subjectHe) {
    const ch = contactChannels(cfg);
    const subject = subjectHe || 'MelodyMath · ניסוי כיתתי';
    let html = '<div class="mm-contact-links">';
    if (ch.email) {
      html += '<a class="btn primary" href="mailto:' + esc(encodeURIComponent(ch.email))
        + '?subject=' + esc(encodeURIComponent(subject)) + '">דוא״ל לפרויקט</a> ';
    }
    if (ch.formUrl) {
      return html + '<a class="btn ghost" href="' + esc(ch.formUrl) + '" target="_blank" rel="noopener">טופס פנייה או משוב (טופס Google)</a>'
        + '</div>'
        + '<p class="mm-contact-note">הטופס נפתח בחלון חדש. אל תכתבו שמות של ילדים, טלפון או כתובת.'
        + (ch.email ? ' אם תרצו תשובה — הדוא״ל.' : '')
        + '</p>';
    }
    html += '<a class="btn ghost" href="' + esc(ch.issueUrl) + '">טופס פנייה או משוב בגיטהאב</a>'
      + '</div>'
      + '<p class="mm-contact-note">הטופס בגיטהאב <b>ציבורי</b>: כל אחד יכול לקרוא אותו, וצריך חשבון GitHub. '
      + 'אל תכתבו שמות של ילדים, טלפון או כתובת. התשובה תגיע שם, כתגובה.'
      + (ch.email ? ' לפנייה פרטית — הדוא״ל.' : '')
      + '</p>';
    return html;
  }

  function mountContactBlocks(doc) {
    const d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.querySelectorAll) return 0;
    const blocks = d.querySelectorAll('[data-mm-contact]');
    blocks.forEach(function (el) {
      el.innerHTML = renderContactHtml(CONTACT, el.getAttribute('data-subject') || '');
    });
    return blocks.length;
  }

  return {
    CONTACT: CONTACT,
    ISSUE_FORM_URL: ISSUE_FORM_URL,
    contactChannels: contactChannels,
    projectEmail: projectEmail,
    renderContactHtml: renderContactHtml,
    mountContactBlocks: mountContactBlocks,
  };
});
