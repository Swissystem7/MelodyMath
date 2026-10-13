/* Find the <script> elements of a page so a test can run them the way a browser
   does. Scanning with indexOf instead of a tag regexp on purpose: a regexp like
   /<script[^>]*>([\s\S]*?)<\/script>/ is the CodeQL js/bad-tag-filter pattern —
   it misses the closing-tag spellings a browser still honours (`</SCRIPT>`,
   `</script >`), so a test built on it can silently skip a script it should run.

   Known limit, same as any non-parser scan: a `>` inside an attribute value
   ends the open tag early. No page here has one, and a malformed page makes the
   test that uses this fail loudly rather than quietly pass. */

// True when html[at..] starts a real `<script`/`</script` tag rather than a
// longer name that merely begins with it (`<scripting>`).
function tagAt(html, at, name) {
  if (html.lastIndexOf(name, at) !== at) return false;
  const after = html[at + name.length];
  return after === undefined || after === '>' || after === '/' || /\s/.test(after);
}

// Every <script> in `html`, in document order, as { tag, src, body }:
//   tag  — the open tag, source-cased, e.g. '<script src="src/lib/core.js">'
//   src  — the src attribute, or undefined for an inline script
//   body — the text between the tags ('' for a <script src>)
function scriptTags(html) {
  const out = [];
  const lower = html.toLowerCase();
  let at = 0;
  while ((at = lower.indexOf('<script', at)) !== -1) {
    if (!tagAt(lower, at, '<script')) {
      at += '<script'.length;
      continue;
    }
    const open = lower.indexOf('>', at);
    if (open === -1) break;
    let close = open;
    while ((close = lower.indexOf('</script', close)) !== -1 && !tagAt(lower, close, '</script')) {
      close += '</script'.length;
    }
    if (close === -1) break;
    const tag = html.slice(at, open + 1);
    // Attribute names are case-insensitive, and either quote style is legal.
    const src = /\ssrc\s*=\s*"([^"]+)"|\ssrc\s*=\s*'([^']+)'/i.exec(tag);
    out.push({ tag: tag, src: src ? (src[1] || src[2]) : undefined, body: html.slice(open + 1, close) });
    at = close + '</script'.length;
  }
  return out;
}

module.exports = { scriptTags: scriptTags };
