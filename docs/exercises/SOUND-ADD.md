# SoundAdd: notes for the teacher (#665 example exercise)

These notes used to sit under "למורה ▸" on the child screen. The child-eye
rules of #665 keep teacher text off that screen, so they live here.

**Topic:** addition up to 10, grades א׳–ב׳. Page: `exercise.html`.

**How it sounds:** the first number is heard as low sounds, a pause, then the
second number as high sounds, and every sound lights its own circle. The child
taps the total on one big pad, one tap per sound. The same events play on four
instrument families (drums, keys, strings, winds); the child can switch at any
moment.

**Opening:** the exercise speaks its instruction and plays its sound as soon
as it opens. A browser that blocks audio before the first touch shows one big
▶ over the card; that touch starts the exercise. There is no worked example:
the child solves from the first exercise.

**Stages (fading):** sound and circles, circles only, the symbol, then the
plain written exercise with no sound and no musical cue. Two right first tries
move one stage on. The topic counts as mastered after two right first tries in
the plain stage. A miss in the plain stage goes back to the musical version;
any other shown solution moves one stage back. The plain-stage success rate is
kept in `localStorage` under `mm.soundAdd.plain` (`{ tried, right }`).

**Feedback:** a right answer merges the two groups into one group of the total
and counts it up on a rising scale. A wrong answer says "almost", replays the
exercise counting every circle aloud, marks what is missing or extra and gives
a second try. After two tries the solution is shown, and the next exercise
opens with a word of encouragement.

**Speech:** Hebrew speech synthesis when the device has a Hebrew voice. Without
one, recorded clips from `sounds/voice/he/` are played; they are recorded with
`tools/record-voice.html` and listed in `VOICE_CLIPS` in
`src/components/SoundAdd.js` and in `SOUNDS-LICENSES.md`. Until then the icons
and the numbers on the circles carry the instruction.

**Sources:** Hattie & Timperley 2007 (feedback), Fyfe et al. 2014 (concreteness
fading), Kalyuga 2003 (fading support), Akın (meta-analysis, music and maths).
