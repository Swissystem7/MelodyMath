const test = require('node:test');
const assert = require('node:assert');
const access = require('../src/lib/access.js');

test('access announcer queues string messages and retrieves by priority', () => {
  assert.strictEqual(typeof access.queueAnnouncement, 'function');
  assert.strictEqual(typeof access.dequeueAnnouncement, 'function');

  if (typeof access.clearAnnouncements === 'function') {
    access.clearAnnouncements();
  }

  assert.strictEqual(access.dequeueAnnouncement(), null);

  access.queueAnnouncement('first');
  access.queueAnnouncement('second');
  assert.strictEqual(access.dequeueAnnouncement(), 'first');
  assert.strictEqual(access.dequeueAnnouncement(), 'second');
  assert.strictEqual(access.dequeueAnnouncement(), null);

  access.queueAnnouncement('low-1', false);
  access.queueAnnouncement('high-1', true);
  access.queueAnnouncement('low-2', false);
  access.queueAnnouncement('high-2', true);

  assert.strictEqual(access.dequeueAnnouncement(), 'high-1');
  assert.strictEqual(access.dequeueAnnouncement(), 'high-2');
  assert.strictEqual(access.dequeueAnnouncement(), 'low-1');
  assert.strictEqual(access.dequeueAnnouncement(), 'low-2');
  assert.strictEqual(access.dequeueAnnouncement(), null);
});

test('access announcer ignores empty or invalid messages', () => {
  if (typeof access.clearAnnouncements === 'function') {
    access.clearAnnouncements();
  }

  assert.strictEqual(access.queueAnnouncement(''), false);
  assert.strictEqual(access.queueAnnouncement('   '), false);
  assert.strictEqual(access.queueAnnouncement(null), false);
  assert.strictEqual(access.dequeueAnnouncement(), null);
});

test('access announcer integrates with continuous speech playback without cancel interruptions', () => {
  if (typeof access.clearAnnouncements === 'function') {
    access.clearAnnouncements();
  }

  const spoken = [];
  let cancelCount = 0;
  let activeUtterance = null;

  const mockSynthesis = {
    speaking: false,
    cancel() {
      cancelCount++;
      activeUtterance = null;
      this.speaking = false;
    },
    speak(utterance) {
      activeUtterance = utterance;
      this.speaking = true;
      spoken.push(utterance.text);
    },
  };

  class MockUtterance {
    constructor(text) {
      this.text = text;
      this.lang = '';
      this.rate = 1;
      this.onend = null;
      this.onerror = null;
    }
  }

  const originalSynthesis = globalThis.speechSynthesis;
  const originalUtterance = globalThis.SpeechSynthesisUtterance;

  try {
    globalThis.speechSynthesis = mockSynthesis;
    globalThis.SpeechSynthesisUtterance = MockUtterance;

    access.speakHebrew('הודעה ראשונה');
    assert.strictEqual(spoken.length, 1);
    assert.strictEqual(spoken[0], 'הודעה ראשונה');

    access.speakHebrew('הודעה שניה');
    assert.strictEqual(cancelCount, 0);
    assert.strictEqual(spoken.length, 1);

    access.speakHebrew('הודעה דחופה', { priority: true });
    assert.strictEqual(cancelCount, 0);
    assert.strictEqual(spoken.length, 1);

    const firstEnd = activeUtterance.onend;
    mockSynthesis.speaking = false;
    firstEnd();

    assert.strictEqual(spoken.length, 2);
    assert.strictEqual(spoken[1], 'הודעה דחופה');

    const urgentEnd = activeUtterance.onend;
    mockSynthesis.speaking = false;
    urgentEnd();

    assert.strictEqual(spoken.length, 3);
    assert.strictEqual(spoken[2], 'הודעה שניה');

    const lastEnd = activeUtterance.onend;
    mockSynthesis.speaking = false;
    lastEnd();

    assert.strictEqual(access.dequeueAnnouncement(), null);
  } finally {
    if (originalSynthesis) globalThis.speechSynthesis = originalSynthesis;
    else delete globalThis.speechSynthesis;
    if (originalUtterance) globalThis.SpeechSynthesisUtterance = originalUtterance;
    else delete globalThis.SpeechSynthesisUtterance;
    access.cancelSpeech();
  }
});
