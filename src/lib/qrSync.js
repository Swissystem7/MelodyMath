// MelodyMath — Offline QR Progress Sync between devices without cloud.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const TEACHER = (typeof module === 'object' && module.exports)
    ? require('./teacherStore') : (typeof globalThis !== 'undefined' ? globalThis : {});

  const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x = (x << 1) ^ (x & 128 ? 0x11d : 0); }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  function gfMul(x, y) { return x === 0 || y === 0 ? 0 : EXP[LOG[x] + LOG[y]]; }

  function rsEncode(data, ecCount) {
    let gen = [1];
    for (let i = 0; i < ecCount; i++) {
      const next = new Array(gen.length + 1).fill(0);
      for (let j = 0; j < gen.length; j++) { next[j] ^= gfMul(gen[j], EXP[i]); next[j + 1] ^= gen[j]; }
      gen = next;
    }
    const res = new Uint8Array(ecCount);
    for (let i = 0; i < data.length; i++) {
      const fb = data[i] ^ res[0];
      for (let j = 0; j < ecCount - 1; j++) res[j] = res[j + 1] ^ gfMul(fb, gen[gen.length - 2 - j]);
      res[ecCount - 1] = gfMul(fb, gen[0]);
    }
    return res;
  }

  const V_DATA = [0, 19, 34, 55, 80, 108, 136, 156, 194], V_EC = [0, 7, 10, 15, 20, 26, 36, 40, 48], V_ALIGN = [0, 0, 18, 22, 26, 30, 34, 38, 42];
  function pickVersion(len) {
    for (let v = 1; v < V_DATA.length; v++) if (V_DATA[v] >= len + 2) return v;
    return V_DATA.length - 1;
  }

  function utf8Encode(s) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s);
    const arr = [];
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c < 128) arr.push(c);
      else if (c < 2048) arr.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      else arr.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
    return new Uint8Array(arr);
  }

  function createBitStream(bytes, ver) {
    const dataLen = V_DATA[ver], bits = [];
    const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };
    push(4, 4); push(bytes.length, 8);
    for (let i = 0; i < bytes.length; i++) push(bytes[i], 8);
    for (let i = 0; i < 4 && bits.length < dataLen * 8; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);
    const pad = [0xec, 0x11]; let p = 0;
    while (bits.length < dataLen * 8) { push(pad[p], 8); p ^= 1; }
    const out = new Uint8Array(dataLen);
    for (let i = 0; i < dataLen; i++) {
      let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
      out[i] = b;
    }
    return out;
  }

  function buildMatrix(bytes, ver) {
    const size = 17 + 4 * ver, m = Array.from({ length: size }, () => new Int8Array(size).fill(-1));
    const set = (r, c, val) => { if (r >= 0 && r < size && c >= 0 && c < size) m[r][c] = val ? 1 : 0; };
    const finder = (r, c) => {
      for (let y = -1; y <= 7; y++) {
        for (let x = -1; x <= 7; x++) {
          if (y === -1 || y === 7 || x === -1 || x === 7 || (Math.abs(y - 3) === 1 && Math.abs(x - 3) <= 1) || (Math.abs(x - 3) === 1 && Math.abs(y - 3) <= 1)) set(r + y, c + x, 0);
          else set(r + y, c + x, 1);
        }
      }
    };
    finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
    for (let i = 8; i < size - 8; i++) {
      if (m[6][i] === -1) set(6, i, i % 2 === 0 ? 1 : 0);
      if (m[i][6] === -1) set(i, 6, i % 2 === 0 ? 1 : 0);
    }
    const al = V_ALIGN[ver];
    if (al > 0) {
      for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) set(al + y, al + x, Math.abs(y) === 2 || Math.abs(x) === 2 || (!y && !x) ? 1 : 0);
    }
    const FMT = [0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0];
    for (let i = 0; i < 6; i++) set(8, i, FMT[i]);
    set(8, 7, FMT[6]); set(8, 8, FMT[7]); set(7, 8, FMT[8]);
    for (let i = 9; i < 15; i++) set(14 - i, 8, FMT[i]);
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, FMT[i]);
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, FMT[i]);
    set(size - 8, 8, 1);

    const ec = rsEncode(bytes, V_EC[ver]), full = [];
    for (let i = 0; i < bytes.length; i++) for (let j = 7; j >= 0; j--) full.push((bytes[i] >> j) & 1);
    for (let i = 0; i < ec.length; i++) for (let j = 7; j >= 0; j--) full.push((ec[i] >> j) & 1);

    let idx = 0, up = true;
    for (let c = size - 1; c > 0; c -= 2) {
      if (c === 6) c--;
      const rows = up ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);
      for (let r of rows) {
        for (let col = c; col >= c - 1; col--) {
          if (m[r][col] === -1) {
            let val = idx < full.length ? full[idx++] : 0;
            if ((r + col) % 2 === 0) val ^= 1;
            m[r][col] = val;
          }
        }
      }
      up = !up;
    }
    return m;
  }

  function generateQrSvg(text, opts) {
    const o = opts || {}, m = o.margin != null ? o.margin : 2;
    const color = o.color || '#21183b', bg = o.background || '#ffffff';
    const bytes = utf8Encode(String(text || '')), ver = pickVersion(bytes.length);
    const matrix = buildMatrix(createBitStream(bytes, ver), ver), s = matrix.length, total = s + m * 2;
    let rects = '';
    for (let r = 0; r < s; r++) {
      for (let c = 0; c < s; c++) if (matrix[r][c] === 1) rects += '<rect x="' + (c + m) + '" y="' + (r + m) + '" width="1" height="1"/>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" fill="' + color + '" shape-rendering="crispEdges">'
      + (bg !== 'none' ? '<rect width="' + total + '" height="' + total + '" fill="' + bg + '"/>' : '') + rects + '</svg>';
  }

  function b64Encode(s) {
    if (typeof Buffer !== 'undefined') return Buffer.from(s, 'utf8').toString('base64');
    try { return btoa(unescape(encodeURIComponent(s))); } catch (e) { return btoa(s); }
  }

  function b64Decode(b) {
    if (typeof Buffer !== 'undefined') return Buffer.from(b, 'base64').toString('utf8');
    try { return decodeURIComponent(escape(atob(b))); } catch (e) { return atob(b); }
  }

  function packStudent(name, classCode, storage) {
    const cCode = classCode || 'default';
    const s = (TEACHER.getStudent && TEACHER.getStudent(cCode, name, storage)) || { name: name, grade: 'א', sessions: [], assignments: [] };
    const b64 = b64Encode(JSON.stringify({ v: 1, type: 'student', classCode: cCode, student: s }));
    return { b64: b64, hash: '#import=' + b64, url: 'https://swissystem7.github.io/MelodyMath/#import=' + b64 };
  }

  function packRoster(classCode, storage) {
    const cCode = classCode || 'default';
    const raw = TEACHER.exportRoster ? TEACHER.exportRoster(cCode, storage) : '{}';
    const b64 = b64Encode(raw);
    return { b64: b64, hash: '#import=' + b64, url: 'https://swissystem7.github.io/MelodyMath/#import=' + b64 };
  }

  function unpackPayload(raw) {
    if (!raw) return { ok: false, error: 'empty' };
    let clean = String(raw).trim();
    if (clean.includes('#import=')) clean = clean.split('#import=')[1];
    try {
      const json = clean.startsWith('{') ? clean : b64Decode(clean);
      const data = JSON.parse(json);
      return data && typeof data === 'object' ? { ok: true, data: data } : { ok: false, error: 'not-object' };
    } catch (e) { return { ok: false, error: 'invalid' }; }
  }

  function importPayload(raw, targetClassCode, storage) {
    const unp = typeof raw === 'string' ? unpackPayload(raw) : { ok: true, data: raw };
    if (!unp.ok) return { ok: false, error: unp.error, message: 'קוד QR או מחרוזת שיתוף אינם תקינים.' };
    const data = unp.data, cCode = targetClassCode || data.classCode || 'default';
    if (data.students && TEACHER.importRoster) {
      const res = TEACHER.importRoster(cCode, data, storage);
      return res.ok ? { ok: true, type: 'roster', res: res, message: TEACHER.summarizeImport ? TEACHER.summarizeImport(res) : 'הרוסטר יובא בהצלחה!' }
                     : { ok: false, error: res.error, message: 'ייבוא הרוסטר נכשל.' };
    }
    if (data.type === 'student' && data.student && data.student.name && TEACHER.importRoster) {
      const r = { v: 1, classCode: cCode, students: {} };
      r.students[data.student.name] = data.student;
      TEACHER.importRoster(cCode, r, storage);
      return { ok: true, type: 'student', name: data.student.name, message: 'התקדמות התלמיד/ה ' + data.student.name + ' יובאה בהצלחה!' };
    }
    return { ok: false, error: 'shape', message: 'פורמט הנתונים אינו מוכר.' };
  }

  return { generateQrSvg, packStudent, packRoster, unpackPayload, importPayload };
});
