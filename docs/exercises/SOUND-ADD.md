# SoundAdd: notes for the teacher (#665 example exercise)

These notes used to sit under "למורה ▸" on the child screen. The child-eye
rules of #665 keep teacher text off that screen, so they live here.

**Topic:** addition up to 10, grades א׳–ב׳. Page: `exercise.html`.

**How it sounds:** the first number is heard as low sounds, a pause, then the
second number as high sounds, and every sound lights its own circle. The child
taps the total on one big pad, one tap per sound. The same events play on four
instrument families (drums, keys, strings, winds); the child can switch at any
moment.

**Answer types (#671):** the same sounds, stages and feedback, with another way
to answer. Open the page with `?mode=`:
- `exercise.html?mode=tap` (default): one tap on the pad per sound.
- `exercise.html?mode=choice`: three numbers; a wrong one is crossed out for
  the second try. In the silent stage (the no-music mastery check) the child
  picks from every number 1-10 on a 5x2 grid instead, so a guess is right
  only 1 time in 10 and two right first tries by chance are 1 in 100.
- `exercise.html?mode=drag`: drag one circle per sound into the basket; a
  plain tap (or Enter) on the pile adds one too, so it works without dragging.
- `exercise.html?mode=line`: a 0-10 number line; every sound is one hop on it
  (the tick lights up), and the child moves the thumb where the hops land.
  It mirrors the #singingLine slider (index.html, PR #656): a range input that
  sings each number (numberLine.js soundForTick) plus two 44px step buttons
  ◀ ▶; every target is at least 44x44 at 390px.

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

**Steps (#703):** a mastered step opens the next one, again with sound:
sums within 10, making ten, crossing ten, sums to 20, taking away within 10,
taking away within 20. Two music ways carry the later steps, restored as they
were before #635/#636 (`git show c133190^:src/lib/curriculum/grade3.js`):
`tenExchange` (the 10th sound gets a gong, the bigger instrument of a full ten;
the 10th circle is ringed) and `takeAwayBeats` (all of the first number, then
the same phrase with the taken beats silent; what is still heard is the
answer, and the taken circles are crossed out). Past ten the silent grid has
1-20 and the line runs 0-20. Open a step directly with `?step=` (`add10`,
`makeTen`, `crossTen`, `add20`, `sub10`, `sub20`). The items are a fixed list
until the #687 variation engine generates them.

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
