const test = require('node:test');
const assert = require('node:assert/strict');
const access = require('../src/lib/access.js');

// speechSynthesis.cancel() does not end the cancelled utterance synchronously:
// the browser fires its end/error event later. The queue must ignore that
// late event, or the utterance that replaced it is treated as finished and
// the next announcement is sent while it is still playing.

function withMockSynthesis(fn) {
  const spoken = [];
  const utterances = [];
  const synth = {
    cancel() { /* the real event arrives later, see the tests */ },
    speak(u) { spoken.push(u.text); utterances.push(u); },
  };
  class MockUtterance {
    constructor(text) { this.text = text; this.onend = null; this.onerror = null; }
  }
  const hadSynth = Object.prototype.hasOwnProperty.call(globalThis, 'speechSynthesis');
  const hadUtt = Object.prototype.hasOwnProperty.call(globalThis, 'SpeechSynthesisUtterance');
  const prevSynth = globalThis.speechSynthesis;
  const prevUtt = globalThis.SpeechSynthesisUtterance;
  globalThis.speechSynthesis = synth;
  globalThis.SpeechSynthesisUtterance = MockUtterance;
  access.cancelSpeech();
  try {
    fn({ spoken, utterances });
  } finally {
    access.cancelSpeech();
    if (hadSynth) globalThis.speechSynthesis = prevSynth; else delete globalThis.speechSynthesis;
    if (hadUtt) globalThis.SpeechSynthesisUtterance = prevUtt; else delete globalThis.SpeechSynthesisUtterance;
  }
}

test('a late end event from a cancelled utterance does not release the queue for its replacement', () => {
  withMockSynthesis(({ spoken, utterances }) => {
    access.speakHebrew('ראשונה');
    assert.deepEqual(spoken, ['ראשונה']);
    const first = utterances[0];

    access.speakHebrew('שנייה', { interrupt: true });
    assert.deepEqual(spoken, ['ראשונה', 'שנייה']);

    // The browser now reports the cancelled first utterance as ended.
    first.onerror();

    access.speakHebrew('שלישית');
    assert.deepEqual(spoken, ['ראשונה', 'שנייה'], 'third waits until the second really ends');
    assert.deepEqual(access.getAnnouncementQueue().map((x) => x.text), ['שלישית']);

    utterances[1].onend();
    assert.deepEqual(spoken, ['ראשונה', 'שנייה', 'שלישית']);
    assert.deepEqual(access.getAnnouncementQueue(), []);
  });
});

test('a stale end event does not let a later low-priority message overtake a high-priority one', () => {
  withMockSynthesis(({ spoken, utterances }) => {
    access.speakHebrew('א');
    access.cancelSpeech();
    access.speakHebrew('ב');
    utterances[0].onend(); // stale: belongs to the cancelled first utterance

    access.speakHebrew('רגילה');
    access.speakHebrew('דחופה', { priority: true });
    assert.deepEqual(spoken, ['א', 'ב']);

    utterances[1].onend();
    assert.deepEqual(spoken, ['א', 'ב', 'דחופה']);
    utterances[2].onend();
    assert.deepEqual(spoken, ['א', 'ב', 'דחופה', 'רגילה']);
  });
});

test('the current utterance still frees the queue when it ends normally', () => {
  withMockSynthesis(({ spoken, utterances }) => {
    access.speakHebrew('אחת');
    access.speakHebrew('שתיים');
    assert.deepEqual(spoken, ['אחת']);
    utterances[0].onend();
    assert.deepEqual(spoken, ['אחת', 'שתיים']);
    utterances[1].onend();
    assert.equal(access.dequeueAnnouncement(), null);
  });
});
