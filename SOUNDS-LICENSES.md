# Sounds and their licences

MelodyMath uses **no third-party audio**: no sample, loop or recording is
downloaded or shipped. Every instrument sound is synthesised in the browser
with the Web Audio API (oscillators, a short generated noise burst and a
filter) from the recipes in `src/lib/instrumentVoices.js`. The code is the
project's own and is covered by the repository `LICENSE`.

If an audio file is ever added, it must be CC0 (or another licence the owner
approved), its licence page must be checked first, and it gets a row in the
second table below. `test/instrumentVoices.test.js` fails when an audio file
in the repository is missing from this file.

## Synthesised voices (no files)

| Voice | Used for | Source of the sound | Licence |
|---|---|---|---|
| `drumLow` | low drum strokes (dum, bass drums) | synthesised, sine with falling pitch | project code |
| `drumHigh` | high drum strokes (tek, slaps) | synthesised, triangle + noise | project code |
| `frameDrum` | frame drums | synthesised | project code |
| `jingle` | jingles, shakers | synthesised, filtered noise | project code |
| `woodClick` | claves, wood blocks, box drums | synthesised | project code |
| `metalBell` | handbells, cowbells, bell timelines | synthesised, inharmonic partials | project code |
| `gong` | gongs and gamelan | synthesised | project code |
| `woodBar` | marimba, balafon, xylophone | synthesised | project code |
| `tine` | mbira, kalimba | synthesised | project code |
| `steelPan` | steel pan | synthesised | project code |
| `pluck` | plucked strings | synthesised, filtered sawtooth | project code |
| `bowed` | bowed strings | synthesised, sawtooth with vibrato | project code |
| `breathy` | flutes and pipes | synthesised, sine + breath noise | project code |
| `reed` | reed instruments | synthesised, filtered square | project code |
| `horn` | horns (shofar) | synthesised | project code |
| `drone` | drones (didgeridoo) | synthesised | project code |
| `keys` | piano and keyboards | synthesised | project code |
| `organ` | organ, harmonium, accordion | synthesised, additive | project code |

## Audio files

Pre-recorded spoken Hebrew instruction prompts and feedback clips for non-readers (#676, Refs #665). Recorded for the project, released as CC0.

| File | Description | Licence |
|---|---|---|
| `sounds/voice/he/prompt_addition.wav` | Hebrew spoken prompt for addition | CC0 (project recorded) |
| `sounds/voice/he/prompt_subtraction.wav` | Hebrew spoken prompt for subtraction | CC0 (project recorded) |
| `sounds/voice/he/prompt_multiplication.wav` | Hebrew spoken prompt for multiplication | CC0 (project recorded) |
| `sounds/voice/he/prompt_division.wav` | Hebrew spoken prompt for division | CC0 (project recorded) |
| `sounds/voice/he/prompt_fractions.wav` | Hebrew spoken prompt for fractions | CC0 (project recorded) |
| `sounds/voice/he/prompt_counting.wav` | Hebrew spoken prompt for counting | CC0 (project recorded) |
| `sounds/voice/he/prompt_number_line.wav` | Hebrew spoken prompt for number line | CC0 (project recorded) |
| `sounds/voice/he/prompt_even_odd.wav` | Hebrew spoken prompt for even/odd | CC0 (project recorded) |
| `sounds/voice/he/prompt_groups_mult.wav` | Hebrew spoken prompt for groups multiplication | CC0 (project recorded) |
| `sounds/voice/he/prompt_geometry.wav` | Hebrew spoken prompt for geometry | CC0 (project recorded) |
| `sounds/voice/he/prompt_measurement.wav` | Hebrew spoken prompt for measurement | CC0 (project recorded) |
| `sounds/voice/he/prompt_data.wav` | Hebrew spoken prompt for data | CC0 (project recorded) |
| `sounds/voice/he/prompt_word_problems.wav` | Hebrew spoken prompt for word problems | CC0 (project recorded) |
| `sounds/voice/he/feedback_correct.wav` | Hebrew spoken feedback for correct answer | CC0 (project recorded) |
| `sounds/voice/he/feedback_retry.wav` | Hebrew spoken feedback for retry/hint | CC0 (project recorded) |
| `sounds/voice/he/feedback_shown.wav` | Hebrew spoken feedback for shown solution | CC0 (project recorded) |
