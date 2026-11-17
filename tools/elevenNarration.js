// MelodyMath — ElevenLabs Hebrew Narration Generator (Refs #515)
// Generates pre-recorded Hebrew audio assets for lessons/exercises once using student subscription.
// If ELEVENLABS_API_KEY is not set, skips silently without failing.
// Output: WAV files in sounds/voice/he/, the names src/lib/narrationPlayer.js and
// tools/check-assets.js expect. The API is asked for raw 16-bit mono PCM (output_format
// pcm_<rate>, available on every tier) and the bytes are wrapped in a WAV header here.

const fs = require('fs');
const path = require('path');

const ELEVEN_CONFIG = {
  apiUrl: 'https://api.elevenlabs.io/v1/text-to-speech',
  defaultVoiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel / Multilingual
  modelId: 'eleven_multilingual_v2',
  outputFormat: 'pcm_22050', // raw signed 16-bit little-endian mono PCM at 22.05 kHz
  outputDir: path.join(__dirname, '..', 'sounds', 'voice', 'he')
};

const HEBREW_VOICE_PROMPTS = [
  {
    key: 'prompt_addition',
    text: 'הקשיבו לצלילים וספרו כמה בסך הכל. הקישו את התשובה.',
    filename: 'prompt_addition.wav',
    category: 'exercise'
  },
  {
    key: 'prompt_subtraction',
    text: 'הקשיבו לפעימות הראשונות ולפעימות שנלקחו. כמה נשארו? הקישו את התשובה.',
    filename: 'prompt_subtraction.wav',
    category: 'exercise'
  },
  {
    key: 'prompt_multiplication',
    text: 'הקשיבו לקבוצות הפעימות. כמה פעימות יש בסך הכל? הקישו תשובה.',
    filename: 'prompt_multiplication.wav',
    category: 'exercise'
  },
  {
    key: 'prompt_division',
    text: 'הקשיבו לחלוקת הפעימות לקבוצות שוות. כמה פעימות בכל קבוצה?',
    filename: 'prompt_division.wav',
    category: 'exercise'
  },
  {
    key: 'feedback_good',
    text: 'כל הכבוד! תשובה נכונה ומדויקת.',
    filename: 'feedback_correct.wav', // narrationPlayer maps feedback_good to this file
    category: 'feedback'
  },
  {
    key: 'feedback_retry',
    text: 'כמעט! הקשיבו שוב לצלילים ונסו עוד פעם.',
    filename: 'feedback_retry.wav',
    category: 'feedback'
  }
];

function sampleRateOf(outputFormat) {
  const m = /^pcm_(\d+)$/.exec(String(outputFormat));
  if (!m) throw new Error('outputFormat must be pcm_<sampleRate>, got ' + outputFormat);
  return Number(m[1]);
}

// Wrap raw PCM (signed 16-bit little-endian, mono) in a 44-byte RIFF/WAVE header.
// Bytes that already are a WAV file are returned unchanged.
function pcmToWav(pcm, sampleRate, channels = 1, bitsPerSample = 16) {
  if (pcm.length >= 12 && pcm.toString('ascii', 0, 4) === 'RIFF' && pcm.toString('ascii', 8, 12) === 'WAVE') return pcm;
  const blockAlign = channels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * blockAlign, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function generatePreRecordedNarration(apiKey, options = {}) {
  const key = (apiKey !== undefined) ? apiKey : process.env.ELEVENLABS_API_KEY;
  if (!key) {
    // Decision 1.11.2026: בלי מפתח - לדלג בשקט
    return { skipped: true, reason: 'ELEVENLABS_API_KEY absent — skipped silently' };
  }

  const dryRun = Boolean(options.dryRun);
  const voiceId = options.voiceId || ELEVEN_CONFIG.defaultVoiceId;
  const prompts = Array.isArray(options.prompts) ? options.prompts : HEBREW_VOICE_PROMPTS;
  const outputFormat = options.outputFormat || ELEVEN_CONFIG.outputFormat;
  const sampleRate = sampleRateOf(outputFormat);

  const results = [];
  for (const item of prompts) {
    if (dryRun) {
      results.push({ key: item.key, text: item.text, file: item.filename, status: 'dry_run' });
      continue;
    }

    try {
      const response = await fetch(`${ELEVEN_CONFIG.apiUrl}/${voiceId}?output_format=${encodeURIComponent(outputFormat)}`, {
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

      const buffer = pcmToWav(Buffer.from(await response.arrayBuffer()), sampleRate);
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
  pcmToWav,
  generatePreRecordedNarration
};
