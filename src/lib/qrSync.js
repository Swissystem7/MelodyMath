// MelodyMath — Offline QR Progress Sync between devices without cloud.
//
// The QR encoder follows ISO/IEC 18004 (byte mode, error-correction level L,
// mask 0, versions 1-25): finder, timing and alignment patterns, format and
// version information, and Reed-Solomon blocks interleaved as the standard
// requires. Text longer than version 25 holds is never drawn as a broken
// code: qrFits() says so, and generateQrSvg() draws a short notice instead.
/* v8 ignore next 5 */
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

  const MAX_VERSION = 25;
  // Level L, index = version (ISO/IEC 18004, error correction table).
  const EC_PER_BLOCK = [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26];
  const BLOCKS = [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12];

  // Modules left for data and error correction after every function pattern.
  function rawModules(ver) {
    let n = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const align = Math.floor(ver / 7) + 2;
      n -= (25 * align - 10) * align - 55;
      if (ver >= 7) n -= 36;
    }
    return n;
  }

  function dataCodewords(ver) {
    return Math.floor(rawModules(ver) / 8) - EC_PER_BLOCK[ver] * BLOCKS[ver];
  }

  function countBits(ver) { return ver < 10 ? 8 : 16; }

  // Bytes of text one version holds in byte mode.
  function capacity(ver) {
    return Math.floor((dataCodewords(ver) * 8 - 4 - countBits(ver)) / 8);
  }

  function pickVersion(len) {
    for (let v = 1; v <= MAX_VERSION; v++) if (capacity(v) >= len) return v;
    return 0;
  }

  // Generator polynomial of degree `deg`, highest power first, leading 1 left out.
  function rsDivisor(deg) {
    const out = new Array(deg).fill(0);
    out[deg - 1] = 1;
    let root = 1;
    for (let i = 0; i < deg; i++) {
      for (let j = 0; j < deg; j++) {
        out[j] = gfMul(out[j], root);
        if (j + 1 < deg) out[j] ^= out[j + 1];
      }
      root = gfMul(root, 2);
    }
    return out;
  }

  function rsEncode(data, deg) {
    const div = rsDivisor(deg);
    const res = new Array(deg).fill(0);
    for (let i = 0; i < data.length; i++) {
      const f = data[i] ^ res.shift();
      res.push(0);
      for (let j = 0; j < deg; j++) res[j] ^= gfMul(div[j], f);
    }
    return res;
  }

  function utf8Encode(s) {
    return new TextEncoder().encode(s);
  }

  // Mode, count, data, terminator and pad bytes: the data codewords.
  function dataStream(bytes, ver) {
    const total = dataCodewords(ver), bits = [];
    const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    push(4, 4); push(bytes.length, countBits(ver));
    for (let i = 0; i < bytes.length; i++) push(bytes[i], 8);
    for (let i = 0; i < 4 && bits.length < total * 8; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);
    for (let p = 0xec; bits.length < total * 8; p ^= 0xec ^ 0x11) push(p, 8);
    const out = [];
    for (let i = 0; i < total; i++) {
      let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
      out.push(b);
    }
    return out;
  }

  // Split into blocks, add error correction to each, interleave.
  function interleave(data, ver) {
    const nb = BLOCKS[ver], ec = EC_PER_BLOCK[ver];
    const raw = Math.floor(rawModules(ver) / 8);
    const shortLen = Math.floor(raw / nb), numShort = nb - raw % nb;
    const blocks = [];
    for (let i = 0, k = 0; i < nb; i++) {
      const len = shortLen - ec + (i < numShort ? 0 : 1);
      const d = data.slice(k, k + len);
      k += len;
      blocks.push({ d: d, e: rsEncode(d, ec) });
    }
    const out = [];
    for (let i = 0; i <= shortLen - ec; i++) blocks.forEach((b) => { if (i < b.d.length) out.push(b.d[i]); });
    for (let i = 0; i < ec; i++) blocks.forEach((b) => out.push(b.e[i]));
    return out;
  }

  function alignmentPositions(ver) {
    if (ver === 1) return [];
    const n = Math.floor(ver / 7) + 2, size = 17 + 4 * ver;
    const step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
    const out = [6];
    for (let pos = size - 7; out.length < n; pos -= step) out.splice(1, 0, pos);
    return out;
  }

  // Level L (01) and mask 0 (000), BCH(15,5), XOR 0x5412.
  function formatBits() {
    const data = 1 << 3;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    return ((data << 10) | rem) ^ 0x5412;
  }

  // BCH(18,6) for versions 7 and up.
  function versionBits(ver) {
    let rem = ver;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    return (ver << 12) | rem;
  }

  // m[row][col]: 1 dark, 0 light. fn[row][col]: 1 on a function pattern.
  function buildMatrix(codewords, ver) {
    const size = 17 + 4 * ver;
    const m = Array.from({ length: size }, () => new Uint8Array(size));
    const fn = Array.from({ length: size }, () => new Uint8Array(size));
    const set = (r, c, val) => { if (r >= 0 && r < size && c >= 0 && c < size) { m[r][c] = val ? 1 : 0; fn[r][c] = 1; } };
    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    // Finder: dark ring, light ring, dark 3x3 centre, light separator.
    const finder = (r, c) => {
      for (let y = -4; y <= 4; y++) {
        for (let x = -4; x <= 4; x++) {
          const d = Math.max(Math.abs(y), Math.abs(x));
          set(r + y, c + x, d !== 2 && d !== 4);
        }
      }
    };
    finder(3, 3); finder(3, size - 4); finder(size - 4, 3);
    const al = alignmentPositions(ver), last = al.length - 1;
    for (let i = 0; i <= last; i++) {
      for (let j = 0; j <= last; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
        for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) set(al[i] + y, al[j] + x, Math.max(Math.abs(y), Math.abs(x)) !== 1);
      }
    }
    const f = formatBits(), bit = (v, i) => (v >>> i) & 1;
    for (let i = 0; i <= 5; i++) set(i, 8, bit(f, i));
    set(7, 8, bit(f, 6)); set(8, 8, bit(f, 7)); set(8, 7, bit(f, 8));
    for (let i = 9; i < 15; i++) set(8, 14 - i, bit(f, i));
    for (let i = 0; i < 8; i++) set(8, size - 1 - i, bit(f, i));
    for (let i = 8; i < 15; i++) set(size - 15 + i, 8, bit(f, i));
    set(size - 8, 8, 1);
    if (ver >= 7) {
      const v = versionBits(ver);
      for (let i = 0; i < 18; i++) {
        const a = size - 11 + i % 3, b = Math.floor(i / 3);
        set(b, a, bit(v, i)); set(a, b, bit(v, i));
      }
    }
    // Zigzag placement, two columns at a time, skipping the timing column.
    let i = 0;
    const totalBits = codewords.length * 8;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      const upward = ((right + 1) & 2) === 0;
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const c = right - j, r = upward ? size - 1 - vert : vert;
          if (fn[r][c]) continue;
          let val = 0;
          if (i < totalBits) { val = (codewords[i >>> 3] >>> (7 - (i & 7))) & 1; i++; }
          if ((r + c) % 2 === 0) val ^= 1;
          m[r][c] = val;
        }
      }
    }
    return m;
  }

  function qrMatrix(text) {
    const bytes = utf8Encode(String(text == null ? '' : text)), ver = pickVersion(bytes.length);
    if (!ver) return null;
    return buildMatrix(interleave(dataStream(bytes, ver), ver), ver);
  }

  function qrFits(text) {
    return pickVersion(utf8Encode(String(text == null ? '' : text)).length) > 0;
  }

  function generateQrSvg(text, opts) {
    const o = opts || {}, m = o.margin != null ? o.margin : 4;
    const color = o.color || '#21183b', bg = o.background || '#ffffff';
    const matrix = qrMatrix(text);
    if (!matrix) {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" role="img" aria-label="הקוד ארוך מדי ל-QR" shape-rendering="crispEdges">'
        + (bg !== 'none' ? '<rect width="240" height="60" fill="' + bg + '"/>' : '')
        + '<text x="120" y="36" text-anchor="middle" font-size="12" fill="' + color + '">הקוד ארוך מדי ל-QR. שלחו בהעתקה או בקובץ.</text></svg>';
    }
    const s = matrix.length, total = s + m * 2;
    let rects = '';
    for (let r = 0; r < s; r++) {
      for (let c = 0; c < s; c++) if (matrix[r][c] === 1) rects += '<rect x="' + (c + m) + '" y="' + (r + m) + '" width="1" height="1"/>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" fill="' + color + '" shape-rendering="crispEdges">'
      + (bg !== 'none' ? '<rect width="' + total + '" height="' + total + '" fill="' + bg + '"/>' : '') + rects + '</svg>';
  }

  function b64Encode(s) {
    /* v8 ignore next */
    return typeof Buffer !== 'undefined' ? Buffer.from(s, 'utf8').toString('base64') : btoa(unescape(encodeURIComponent(s)));
  }

  function b64Decode(b) {
    /* v8 ignore next */
    return typeof Buffer !== 'undefined' ? Buffer.from(b, 'base64').toString('utf8') : decodeURIComponent(escape(atob(b)));
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

  return { generateQrSvg, qrFits, qrMatrix, packStudent, packRoster, unpackPayload, importPayload, b64Encode, b64Decode };
});
