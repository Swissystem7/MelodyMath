// MelodyMath — Spoken Instructions & Audio Fallback (Issue #676, Refs #665).
// Child-eye rule 5: Every exercise instruction and feedback line is spoken automatically.
// Hebrew TTS is used when available; pre-recorded audio in sounds/voice/he/ is used as fallback.
// All child prompts and voice lines are concrete actions strictly limited to <= 15 words.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_VOICE_PROMPT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  function countWords(str) {
    if (!str) return 0;
    return String(str).trim().split(/\s+/).filter(Boolean).length;
  }

  const EXERCISE_VOICE_MAP = {
    addition: {
      key: 'addition',
      voicePrompt: 'הקשיבו לצלילים וספרו כמה בסך הכל. הקישו את התשובה.',
      fallbackAsset: 'prompt_addition.wav'
    },
    subtraction: {
      key: 'subtraction',
      voicePrompt: 'הקשיבו לפעימות הראשונות ולפעימות שנלקחו. כמה נשארו? הקישו את התשובה.',
      fallbackAsset: 'prompt_subtraction.wav'
    },
    multiplication: {
      key: 'multiplication',
      voicePrompt: 'הקשיבו לקבוצות הפעימות. כמה פעימות יש בסך הכל? הקישו תשובה.',
      fallbackAsset: 'prompt_multiplication.wav'
    },
    division: {
      key: 'division',
      voicePrompt: 'הקשיבו לחלוקת הפעימות לקבוצות שוות. כמה פעימות בכל קבוצה?',
      fallbackAsset: 'prompt_division.wav'
    },
    fractions: {
      key: 'fractions',
      voicePrompt: 'הקשיבו לחלוקת התיבה לשברים. איזה שבר שמעתם? הקישו תשובה.',
      fallbackAsset: 'prompt_fractions.wav'
    },
    counting: {
      key: 'counting',
      voicePrompt: 'הקשיבו לפעימות התוף. הקישו 3 פעמים על התוף.',
      fallbackAsset: 'prompt_counting.wav'
    },
    number_line: {
      key: 'number_line',
      voicePrompt: 'הביטו על ישר המספרים והקשיבו לצליל. איזה מספר מסומן?',
      fallbackAsset: 'prompt_number_line.wav'
    },
    even_odd: {
      key: 'even_odd',
      voicePrompt: 'הקשיבו לפעימות התופים בזוגות. האם המספר זוגי או אי-זוגי?',
      fallbackAsset: 'prompt_even_odd.wav'
    },
    groups_mult: {
      key: 'groups_mult',
      voicePrompt: 'הקשיבו לקבוצות הפעימות שחוזרות. כמה פעימות יש בסך הכל?',
      fallbackAsset: 'prompt_groups_mult.wav'
    },
    geometry: {
      key: 'geometry',
      voicePrompt: 'התבוננו בצורה הגיאומטרית. כמה צלעות או קודקודים יש לה?',
      fallbackAsset: 'prompt_geometry.wav'
    },
    measurement: {
      key: 'measurement',
      voicePrompt: 'הקשיבו לפעימות המקצב. כמה יחידות זמן או אורך נמדדו?',
      fallbackAsset: 'prompt_measurement.wav'
    },
    data: {
      key: 'data',
      voicePrompt: 'התבוננו בדיאגרמה או בטבלה. מהו הנתון המבוקש? הקישו תשובה.',
      fallbackAsset: 'prompt_data.wav'
    },
    word_problems: {
      key: 'word_problems',
      voicePrompt: 'הקשיבו לסיפור החשבוני הקצר. חשבו וסמנו את התשובה הנכונה.',
      fallbackAsset: 'prompt_word_problems.wav'
    }
  };

  const FEEDBACK_VOICE_MAP = {
    correct: {
      key: 'correct',
      voicePrompt: 'כל הכבוד! תשובה נכונה ומדויקת.',
      fallbackAsset: 'feedback_correct.wav'
    },
    retry: {
      key: 'retry',
      voicePrompt: 'כמעט! הקשיבו שוב לצלילים ונסו עוד פעם.',
      fallbackAsset: 'feedback_retry.wav'
    },
    shown: {
      key: 'shown',
      voicePrompt: 'לא נורא! הנה התשובה. נתרגל שוב ביחד.',
      fallbackAsset: 'feedback_shown.wav'
    }
  };

  function cleanChildPrompt(str) {
    if (!str) return '';
    let res = String(str).replace(/הקישו את המספר/g, 'הקישו 3 פעמים על התוף');
    return res;
  }

  function hebrewVoice(synth) {
    const s = synth || (typeof window !== 'undefined' ? window.speechSynthesis : root.speechSynthesis);
    if (!s || typeof s.getVoices !== 'function') return null;
    const voices = s.getVoices() || [];
    return voices.filter(function (v) { return /^he/i.test(v.lang); })[0] || null;
  }

  function speechRoute(key, hasHebrewVoice, clips) {
    const item = EXERCISE_VOICE_MAP[key] || FEEDBACK_VOICE_MAP[key];
    if (!item) return 'none';
    if (hasHebrewVoice) return 'tts';
    const fallback = (clips && clips[key]) || item.fallbackAsset;
    return fallback ? 'clip' : 'none';
  }

  let activeAudioClip = null;

  function speakInstruction(itemOrKey, options) {
    const opts = options || {};
    let key = typeof itemOrKey === 'string' ? itemOrKey : (itemOrKey && (itemOrKey.skill || itemOrKey.kind || itemOrKey.mathTopic || itemOrKey.key)) || 'addition';
    if (itemOrKey && itemOrKey.mathTopic) {
      if (/חיבור|קצב|סכום/.test(itemOrKey.mathTopic)) key = 'addition';
      else if (/חיסור|הפרש/.test(itemOrKey.mathTopic)) key = 'subtraction';
      else if (/כפל/.test(itemOrKey.mathTopic)) key = 'multiplication';
      else if (/חילוק/.test(itemOrKey.mathTopic)) key = 'division';
      else if (/שברים/.test(itemOrKey.mathTopic)) key = 'fractions';
      else if (/יחסים|מרווחים/.test(itemOrKey.mathTopic)) key = 'fractions';
      else if (/פונקציות/.test(itemOrKey.mathTopic)) key = 'number_line';
    }
    const def = EXERCISE_VOICE_MAP[key] || FEEDBACK_VOICE_MAP[key] || EXERCISE_VOICE_MAP.addition;
    const text = cleanChildPrompt(opts.text || (itemOrKey && itemOrKey.prompt) || def.voicePrompt);
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : root.speechSynthesis;
    const voice = opts.mockVoice !== undefined ? opts.mockVoice : hebrewVoice(synth);
    const route = speechRoute(key, !!voice, opts.clips);

    if (route === 'tts' && synth && typeof root.SpeechSynthesisUtterance !== 'undefined') {
      try {
        synth.cancel();
        const u = new root.SpeechSynthesisUtterance(text);
        if (voice) { u.voice = voice; u.lang = voice.lang || 'he-IL'; }
        else { u.lang = 'he-IL'; }
        u.rate = opts.rate || 0.95;
        synth.speak(u);
        return { route: 'tts', text: text, key: key };
      } catch (e) {
        // Fall back to clip if synthesis throws
      }
    }

    if (route === 'clip') {
      const asset = def.fallbackAsset;
      const audioUrl = (opts.basePath || 'sounds/voice/he/') + asset;
      const AudioCtor = opts.Audio || (typeof window !== 'undefined' ? window.Audio : root.Audio);
      if (typeof AudioCtor === 'function') {
        try {
          if (activeAudioClip && typeof activeAudioClip.pause === 'function') {
            activeAudioClip.pause();
          }
          activeAudioClip = new AudioCtor(audioUrl);
          const playPromise = activeAudioClip.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () { /* user interaction required */ });
          }
          return { route: 'clip', asset: asset, audioUrl: audioUrl, key: key };
        } catch (err) {
          return { route: 'clip', asset: asset, error: err };
        }
      }
      return { route: 'clip', asset: asset, audioUrl: audioUrl, key: key };
    }

    return { route: 'none', key: key };
  }

  function mountReplayButton(container, onReplay, doc) {
    if (!container) return null;
    const d = doc || container.ownerDocument || (typeof document !== 'undefined' ? document : null);
    if (!d || typeof d.createElement !== 'function') return null;
    const existing = container.querySelector ? container.querySelector('.voice-replay-btn') : null;
    if (existing && existing.remove) existing.remove();
    const btn = d.createElement('button');
    btn.type = 'button';
    btn.className = 'secondary voice-replay-btn';
    btn.setAttribute('aria-label', 'השמעת ההוראה שוב');
    btn.title = 'השמעת ההוראה שוב';
    btn.style.minWidth = '44px';
    btn.style.minHeight = '44px';
    btn.style.padding = '4px 10px';
    btn.style.fontSize = '1.15rem';
    btn.style.marginInlineStart = '8px';
    btn.style.verticalAlign = 'middle';
    btn.style.cursor = 'pointer';
    btn.style.borderRadius = '99px';
    btn.innerHTML = '🔊 <span class="sr-only">השמעת ההוראה</span>';
    btn.onclick = function (ev) {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      if (typeof onReplay === 'function') onReplay();
    };
    container.appendChild(btn);
    return btn;
  }

  return {
    EXERCISE_VOICE_MAP: EXERCISE_VOICE_MAP,
    FEEDBACK_VOICE_MAP: FEEDBACK_VOICE_MAP,
    countWords: countWords,
    cleanChildPrompt: cleanChildPrompt,
    hebrewVoice: hebrewVoice,
    speechRoute: speechRoute,
    speakInstruction: speakInstruction,
    mountReplayButton: mountReplayButton
  };
});
