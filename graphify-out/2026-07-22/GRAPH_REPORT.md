# Graph Report - MelodyMath  (2026-07-21)

## Corpus Check
- 39 files · ~12,698 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 106 nodes · 78 edges · 40 communities (35 shown, 5 thin omitted)
- Extraction: 42% EXTRACTED · 58% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `969f01d9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Functions Page
- processReferral.js
- generateProgressSnapshot.js
- safeLyricsModerator.js
- studentDataAnonymizer.js
- updateStreak.js
- Factory CI
- MelodyMath — דף אימות שוק (גרסה ראשונית)

## God Nodes (most connected - your core abstractions)
1. `Functions Page` - 8 edges
2. `MelodyMath — דף אימות שוק (גרסה ראשונית)` - 6 edges
3. `807 Practice Page` - 6 edges
4. `Index Home` - 6 edges
5. `processReferral()` - 5 edges
6. `README` - 4 edges
7. `Landing Page` - 4 edges
8. `getUserById()` - 3 edges
9. `markUserAsReferred()` - 3 edges
10. `getReferralByCode()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `README` --references--> `807 Practice Page`  [EXTRACTED]
  README.md → 807.html
- `README` --references--> `Functions Page`  [EXTRACTED]
  README.md → functions.html
- `807 Practice Page` --references--> `Functions Page`  [EXTRACTED]
  807.html → functions.html
- `Functions Page` --references--> `Index Home`  [EXTRACTED]
  functions.html → index.html
- `Landing Page` --references--> `Functions Page`  [EXTRACTED]
  landing.html → functions.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Sonification Pipeline** — functions, 807, sonification, logarithmic_mapping, function_families [INFERRED 0.80]
- **Adaptive Pedagogy** — index, readme, rhythmic_training, adaptive_tempo, spaced_repetition, lesson_generator [INFERRED 0.85]

## Communities (40 total, 5 thin omitted)

### Community 0 - "Functions Page"
Cohesion: 0.19
Nodes (15): 807 Practice Page, Adaptive Tempo, B2B Licensing Model, Exponential Growth/Decay, Seven Function Families, Functions Page, Index Home, Landing Page (+7 more)

### Community 1 - "processReferral.js"
Cohesion: 0.52
Nodes (6): addToInventory(), getReferralByCode(), getUserById(), markUserAsReferred(), processReferral(), referralUsers

### Community 36 - "MelodyMath — דף אימות שוק (גרסה ראשונית)"
Cohesion: 0.25
Nodes (7): 1. ICP מדויק (ישראל), 2. מחיר + מודל, 3. זווית מול המתחרה המרכזי, 4. תוכנית 100 המשתמשים הראשונים (תקציב 0), 5. קריטריון המשך/פיבוט/הריגה (30 יום), MelodyMath — Market Validation (auto, DeepSeek 2026-07-20), MelodyMath — דף אימות שוק (גרסה ראשונית)

## Knowledge Gaps
- **11 isolated node(s):** `progressSnapshots`, `referralUsers`, `crypto`, `streakStore`, `MelodyMath — Market Validation (auto, DeepSeek 2026-07-20)` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 4 inferred relationships involving `Functions Page` (e.g. with `Seven Function Families` and `Logarithmic Mapping`) actually correct?**
  _`Functions Page` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `807 Practice Page` (e.g. with `Exponential Growth/Decay` and `Logarithmic Mapping`) actually correct?**
  _`807 Practice Page` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `Index Home` (e.g. with `Adaptive Tempo` and `Lesson Generator`) actually correct?**
  _`Index Home` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `progressSnapshots`, `referralUsers`, `crypto` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._