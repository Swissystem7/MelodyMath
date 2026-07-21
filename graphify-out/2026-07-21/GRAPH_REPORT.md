# Graph Report - .  (2026-07-20)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 92 nodes · 68 edges · 36 communities (31 shown, 5 thin omitted)
- Extraction: 38% EXTRACTED · 62% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `87e0fc90`
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

## God Nodes (most connected - your core abstractions)
1. `Functions Page` - 8 edges
2. `807 Practice Page` - 6 edges
3. `Index Home` - 6 edges
4. `processReferral()` - 5 edges
5. `README` - 4 edges
6. `Landing Page` - 4 edges
7. `getUserById()` - 3 edges
8. `markUserAsReferred()` - 3 edges
9. `getReferralByCode()` - 2 edges
10. `addToInventory()` - 2 edges

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

## Communities (36 total, 5 thin omitted)

### Community 0 - "Functions Page"
Cohesion: 0.19
Nodes (15): 807 Practice Page, Adaptive Tempo, B2B Licensing Model, Exponential Growth/Decay, Seven Function Families, Functions Page, Index Home, Landing Page (+7 more)

### Community 1 - "processReferral.js"
Cohesion: 0.52
Nodes (6): addToInventory(), getReferralByCode(), getUserById(), markUserAsReferred(), processReferral(), referralUsers

## Knowledge Gaps
- **5 isolated node(s):** `progressSnapshots`, `referralUsers`, `crypto`, `streakStore`, `Factory CI`
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
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._