// MelodyMath — ElevenLabs Hebrew Narration Generator (Refs #515)
// Generates pre-recorded Hebrew audio assets for lessons/exercises once using student subscription.
// If ELEVENLABS_API_KEY is not set, skips silently without failing.

const fs = require('fs');
const path = require('path');

const ELEVEN_CONFIG = {
  apiUrl: 'https://api.elevenlabs.io/v1/text-to-speech',
  defaultVoiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel / Multilingual
  modelId: 'eleven_multilingual_v2',
  outputDir: path.join(__dirname, '..', 'sounds', 'voice', 'he')
};

const HEBREW_VOICE_PROMPTS = [
  {
    key: 'prompt_addition',
    text: 'הקשיבו לצלילים וספרו כמה בסך הכל. הקישו את התשובה.',
    filename: 'prompt_addition.mp3',
    category: 'exercise'
  },
  {
    key: 'prompt_subtraction',
    text: 'הקשיבו לפעימות הראשונות ולפעימות שנלקחו. כמה נשארו? הקישו את התשובה.',
    filename: 'prompt_subtraction.mp3',
    category: 'exercise'
  },
  {
    key: 'prompt_multiplication',
    text: 'הקשיבו לקבוצות הפעימות. כמה פעימות יש בסך הכל? הקישו תשובה.',
    filename: 'prompt_multiplication.mp3',
    category: 'exercise'
  },
  {
    key: 'prompt_division',
    text: 'הקשיבו לחלוקת הפעימות לקבוצות שוות. כמה פעימות בכל קבוצה?',
    filename: 'prompt_division.mp3',
    category: 'exercise'
  },
  {
    key: 'feedback_good',
    text: 'כל הכבוד! תשובה נכונה ומדויקת.',
    filename: 'feedback_good.mp3',
    category: 'feedback'
  },
  {
    key: 'feedback_retry',
    text: 'כמעט! הקשיבו שוב לצלילים ונסו עוד פעם.',
    filename: 'feedback_retry.mp3',
    category: 'feedback'
  }
];

async function generatePreRecordedNarration(apiKey, options = {}) {
  const key = apiKey || process.env.ELEVENLABS_API_KEY;
  if (!key) {
    // Decision 1.11.2026: בלי מפתח - לדלג בשקט
    return { skipped: true, reason: 'ELEVENLABS_API_KEY absent — skipped silently' };
  }

  const dryRun = Boolean(options.dryRun);
  const voiceId = options.voiceId || ELEVEN_CONFIG.defaultVoiceId;
  const prompts = Array.isArray(options.prompts) ? options.prompts : HEBREW_VOICE_PROMPTS;

  const results = [];
  for (const item of prompts) {
    if (dryRun) {
      results.push({ key: item.key, text: item.text, file: item.filename, status: 'dry_run' });
      continue;
    }

    try {
      const response = await fetch(`${ELEVEN_CONFIG.apiUrl}/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: item.text,
          model_id: ELEVEN_CONFIG.modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8
          }
        })
      });

      if (!response.ok) {
        results.push({ key: item.key, status: 'error', statusCode: response.status });
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.mkdirSync(ELEVEN_CONFIG.outputDir, { recursive: true });
      fs.writeFileSync(path.join(ELEVEN_CONFIG.outputDir, item.filename), buffer);
      results.push({ key: item.key, file: item.filename, status: 'generated', bytes: buffer.length });
    } catch (err) {
      results.push({ key: item.key, status: 'error', message: err.message });
    }
  }

  return { skipped: false, generatedCount: results.filter(r => r.status === 'generated').length, results };
}

if (require.main === module) {
  generatePreRecordedNarration().then(res => {
    if (res.skipped) {
      console.log(res.reason);
    } else {
      console.log('Narration generation complete:', res);
    }
  }).catch(err => {
    console.error('Narration generation error:', err);
  });
}

module.exports = {
  ELEVEN_CONFIG,
  HEBREW_VOICE_PROMPTS,
  generatePreRecordedNarration
};
