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
| `tablaBol` | tabla (library) | synthesised, ringing pitched drum | project code |
| `taiko` | taiko (library) | synthesised, very low drum | project code |
| `xylo` | xylophone (library) | synthesised, bright short bar | project code |
| `sitar` | sitar (library) | synthesised, buzzy sawtooth | project code |
| `koto` | koto (library) | synthesised, triangle pluck | project code |
| `nylon` | guitar (library) | synthesised, soft triangle pluck | project code |
| `harp` | harp (library) | synthesised, long sine pluck | project code |
| `qanun` | qanun (library) | synthesised, bright plucked sawtooth | project code |
| `flute` | transverse flute (library) | synthesised, sine + breath | project code |
| `recorderPipe` | recorder (library) | synthesised, pure triangle pipe | project code |
| `trumpet` | trumpet (library) | synthesised, brassy sawtooth | project code |
| `clarinet` | clarinet (library) | synthesised, odd-harmonic square | project code |

`instruments/LICENSES.json` repeats this table as data: one record per voice
(source, author, licence), and `test/instrumentLibrary.test.js` fails when a
library instrument uses a voice without a record.

## Audio files

None.
