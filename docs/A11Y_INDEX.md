# A11Y index — MelodyMath

**Canonical checklist:** [`docs/a11y-checklist.md`](./a11y-checklist.md)

That file ships with the **MelodyMath-partb** patch (portfolio Part B). Fresh `master` may not include it yet.

## If `a11y-checklist.md` is missing

```text
apply MelodyMath-partb
```

Then re-open this index. Do not invent a second checklist; keep one SSOT under `docs/a11y-checklist.md` exercised by `test/a11y.test.js`.

## Related

| Surface | Role |
| --- | --- |
| `docs/a11y-checklist.md` | Max-10 screen accessibility checklist |
| `test/a11y.test.js` | Automated a11y / honesty assertions |
| `docs/A11Y_INDEX.md` | This pointer (apply MelodyMath-partb if checklist absent) |

## Checklist

- [ ] `docs/a11y-checklist.md` present (or MelodyMath-partb applied)
- [ ] Index links to `a11y-checklist` (relative `./a11y-checklist.md`)
- [ ] No duplicate competing a11y SSOT docs
