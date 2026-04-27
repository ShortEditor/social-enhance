require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Groq Config ─────────────────────────────────────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';
const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';

// ─── Prompt Builder ──────────────────────────────────────────────────────────
function buildPrompt(userIdea, contentType, tone) {
  let formatInstructions = '';
  if (contentType === 'video') {
    formatInstructions = 'A complete 30-60 second video script. Include visual cues in brackets [like this] and exact spoken dialogue. Break into Hook, Body, and CTA.';
  } else if (contentType === 'thread') {
    formatInstructions = 'A full 5-part Twitter/LinkedIn thread. Separate tweets/posts with 🧵. Include emojis and spacing.';
  } else if (contentType === 'carousel') {
    formatInstructions = 'Slide-by-slide copy for an Instagram carousel (e.g., Slide 1: [Visual] [Text]). Max 8 slides.';
  } else {
    formatInstructions = 'A highly engaging, medium-length post for general social media sharing.';
  }

  return `You are Instant-Epic — an elite AI creative engine that transforms raw ideas into viral social media assets.
Your tone for this generation should be: ${tone.toUpperCase()}.

Given the following raw idea, generate a complete content blueprint in STRICT JSON format only (no markdown, no explanation, just JSON):

{
  "hook": "<A single powerful hook line, max 12 words, scroll-stopping, starts with a bold action or challenge>",
  "cinematicPrompt": "<A detailed AI image generation prompt optimized for 1:1 ratio, cinematic quality, platform-ready visuals. Include lighting, mood, composition, style keywords>",
  "hashtags": ["<hashtag1>", "<hashtag2>", "<hashtag3>", "<hashtag4>", "<hashtag5>"],
  "vibe": "<2-4 word emotional/music vibe e.g. 'Energetic, fast-paced, motivational'>",
  "platform": "<Best platform for this content based on the selected format>",
  "contentAngle": "<One sentence describing the unique angle or narrative framing for this content>",
  "fullContent": "<${formatInstructions}>"
}

Rules:
- Tone MUST strictly match the requested tone (${tone}).
- Hook must feel native to social media — punchy, scroll-stopping
- Cinematic prompt must be detailed enough for MidJourney/DALL-E/Sora
- IMPORTANT: You must properly escape all newlines as \\n within the JSON strings.
- Output ONLY valid JSON, nothing else

Raw Idea: ${userIdea}`;
}

// ─── Generate Endpoint ───────────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { idea, contentType = 'video', tone = 'viral' } = req.body;

  if (!idea || idea.trim().length < 3) {
    return res.status(400).json({ error: 'Please provide a valid idea (at least 3 characters).' });
  }

  if (idea.trim().length > 500) {
    return res.status(400).json({ error: 'Idea too long. Keep it under 500 characters.' });
  }

  try {
    const groqResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: buildPrompt(idea.trim(), contentType, tone) }],
        model: GROQ_MODEL,
        temperature: 0.9,
        max_tokens: 8192,
        response_format: { type: "json_object" }
      })
    });

    if (!groqResponse.ok) {
      const errBody = await groqResponse.text();
      console.error('Groq API error:', errBody);
      return res.status(502).json({ error: 'AI generation failed. Check your API key.' });
    }

    const groqData = await groqResponse.json();
    const rawText = groqData?.choices?.[0]?.message?.content;

    if (!rawText) {
      return res.status(502).json({ error: 'Empty response from AI engine.' });
    }

    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON parse failed:', cleaned);
      return res.status(502).json({ error: 'AI returned malformed content. Please retry.' });
    }

    return res.json({ success: true, data: parsed });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: GROQ_MODEL, timestamp: new Date().toISOString() });
});

// ─── Fallback to SPA ─────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Instant-Epic server running on http://localhost:${PORT}`);
  console.log(`   Model: ${GROQ_MODEL}`);
  console.log(`   Press Ctrl+C to stop\n`);
});
