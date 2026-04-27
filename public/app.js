/* ─── app.js — Instant-Epic Frontend Logic ─────────────────────────────────── */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ─── Firebase Config ─────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCnhk_7GKTWuoHgmX6mKVWeOWlfCTHKoAc",
  authDomain: "social-app-94b55.firebaseapp.com",
  projectId: "social-app-94b55",
  storageBucket: "social-app-94b55.firebasestorage.app",
  messagingSenderId: "1071387367017",
  appId: "1:1071387367017:web:56fb2464c3d15812a774f8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── DOM References ──────────────────────────────────────────────────────────
const ideaInput    = document.getElementById('idea-input');
const charCounter  = document.getElementById('char-counter');
const generateBtn  = document.getElementById('generate-btn');
const regenerateBtn= document.getElementById('regenerate-btn');
const errorMsg     = document.getElementById('error-msg');
const resultsSection = document.getElementById('results-section');

// Output elements
const hookText     = document.getElementById('hook-text');
const promptText   = document.getElementById('prompt-text');
const hashtagsWrap = document.getElementById('hashtags-wrap');
const angleText    = document.getElementById('angle-text');
const fullText     = document.getElementById('full-text');
const fullTag      = document.getElementById('full-tag');
const fullSub      = document.getElementById('full-sub');
const platformVal  = document.getElementById('platform-val');
const vibeVal      = document.getElementById('vibe-val');

// Copy buttons
const copyHook     = document.getElementById('copy-hook');
const copyPrompt   = document.getElementById('copy-prompt');
const copyHashtags = document.getElementById('copy-hashtags');
const copyAngle    = document.getElementById('copy-angle');
const copyFull     = document.getElementById('copy-full');
const exportBtn    = document.getElementById('export-btn');

// History Sidebar
const historyToggleBtn = document.getElementById('history-toggle');
const historySidebar   = document.getElementById('history-sidebar');
const closeHistoryBtn  = document.getElementById('close-history');
const historyList      = document.getElementById('history-list');

let historyData = [];

// ─── Character Counter ────────────────────────────────────────────────────────
ideaInput.addEventListener('input', () => {
  const len = ideaInput.value.length;
  charCounter.textContent = `${len} / 500`;
  charCounter.className = 'char-counter';
  if (len > 400) charCounter.classList.add('warn');
  if (len > 470) charCounter.classList.add('danger');
});

// ─── Example Chips ───────────────────────────────────────────────────────────
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    ideaInput.value = chip.dataset.idea;
    ideaInput.dispatchEvent(new Event('input'));
    ideaInput.focus();
  });
});

// ─── UI State Helpers ─────────────────────────────────────────────────────────
function setLoading(on) {
  generateBtn.classList.toggle('loading', on);
  generateBtn.disabled = on;
  generateBtn.setAttribute('aria-busy', on ? 'true' : 'false');
  if (on) hideError();
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.hidden = false;
}
function hideError() { errorMsg.hidden = true; }

// ─── Render Results ───────────────────────────────────────────────────────────
function renderResults(data) {
  // Hook
  hookText.textContent = data.hook || '—';

  // Cinematic Prompt
  promptText.textContent = data.cinematicPrompt || data.prompt || '—';

  // Platform + Vibe
  platformVal.textContent = data.platform || '—';
  vibeVal.textContent     = data.vibe || '—';

  // Hashtags
  hashtagsWrap.innerHTML = '';
  const tags = data.hashtags || [];
  tags.forEach(tag => {
    const pill = document.createElement('span');
    pill.className = 'hashtag-pill';
    pill.textContent = tag.startsWith('#') ? tag : `#${tag}`;
    pill.title = 'Click to copy';
    pill.addEventListener('click', () => copyText(pill.textContent, pill));
    hashtagsWrap.appendChild(pill);
  });

  // Content Angle
  angleText.textContent = data.contentAngle || '—';

  // Full Content (Script/Thread/Carousel)
  if (data.fullContent) {
    fullText.textContent = data.fullContent;
    // Update labels based on selected format
    const format = document.querySelector('input[name="contentType"]:checked').value;
    if (format === 'video') { fullTag.textContent = '30s Video Script'; fullSub.textContent = 'Ready to shoot'; }
    else if (format === 'thread') { fullTag.textContent = 'Social Thread'; fullSub.textContent = 'Ready to post'; }
    else if (format === 'carousel') { fullTag.textContent = 'Carousel Copy'; fullSub.textContent = 'Ready to design'; }
  } else {
    fullText.textContent = '—';
  }

  // Show results section with animation
  resultsSection.hidden = false;
  resultsSection.style.animation = 'none';
  // Force reflow
  void resultsSection.offsetHeight;
  resultsSection.style.animation = 'fadeUp 0.5s ease both';

  // Smooth scroll to results
  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ─── Copy Helper ──────────────────────────────────────────────────────────────
async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="copy-icon">✅</span> Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.classList.remove('copied');
    }, 2000);
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

// ─── Copy Buttons ─────────────────────────────────────────────────────────────
copyHook.addEventListener('click', () =>
  copyText(hookText.textContent, copyHook));

copyPrompt.addEventListener('click', () =>
  copyText(promptText.textContent, copyPrompt));

copyHashtags.addEventListener('click', () => {
  const tags = [...hashtagsWrap.querySelectorAll('.hashtag-pill')]
    .map(p => p.textContent).join(' ');
  copyText(tags, copyHashtags);
});

copyAngle.addEventListener('click', () =>
  copyText(angleText.textContent, copyAngle));

copyFull.addEventListener('click', () =>
  copyText(fullText.textContent, copyFull));

// ─── Export Full Kit ──────────────────────────────────────────────────────────
exportBtn.addEventListener('click', () => {
  const tags = [...hashtagsWrap.querySelectorAll('.hashtag-pill')]
    .map(p => p.textContent).join(' ');

  const kit = `⚡ INSTANT-EPIC CONTENT KIT
${'─'.repeat(40)}

🎣 HOOK
${hookText.textContent}

🎬 CINEMATIC PROMPT
${promptText.textContent}

📢 HASHTAGS
${tags}

🎯 CONTENT ANGLE
${angleText.textContent}

📝 FULL SCRIPT / THREAD
${fullText.textContent}

📱 BEST PLATFORM: ${platformVal.textContent}
🎵 CONTENT VIBE:  ${vibeVal.textContent}

${'─'.repeat(40)}
Generated by Instant-Epic · Powered by Groq LLaMA 3.3 70B`;

  copyText(kit, exportBtn);
});

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

// ─── Core Generate Function ───────────────────────────────────────────────────
async function generate() {
  const idea = ideaInput.value.trim();
  if (!idea || idea.length < 3) {
    showError('Please enter an idea (at least 3 characters).');
    ideaInput.focus();
    return;
  }

  const contentType = document.querySelector('input[name="contentType"]:checked').value;
  const tone = document.querySelector('input[name="tone"]:checked').value;

  setLoading(true);

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ idea, contentType, tone })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error('API error:', data);
      throw new Error(data.error || 'AI generation failed. Please retry.');
    }

    const parsedData = data.data;

    renderResults(parsedData);
    saveToHistory(idea, parsedData, contentType, tone);

  } catch (err) {
    showError(err.message || 'Network error.');
  } finally {
    setLoading(false);
  }
}

// ─── History Logic (Firebase Firestore) ───────────────────────────────────────
function loadHistory() {
  const q = query(collection(db, "generations"), orderBy("timestamp", "desc"), limit(20));
  
  onSnapshot(q, (snapshot) => {
    historyData = [];
    snapshot.forEach((doc) => {
      historyData.push({ id: doc.id, ...doc.data() });
    });
    renderHistorySidebar();
  }, (error) => {
    console.error("Error fetching history: ", error);
  });
}

async function saveToHistory(idea, data, format, tone) {
  try {
    await addDoc(collection(db, "generations"), {
      idea,
      data,
      format,
      tone,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now()
    });
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

function renderHistorySidebar() {
  if (historyData.length === 0) {
    historyList.innerHTML = '<p class="empty-history">No generated kits yet.</p>';
    return;
  }
  
  historyList.innerHTML = '';
  historyData.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    
    // Emoji based on format
    let emoji = '🎬';
    if (item.format === 'thread') emoji = '🧵';
    if (item.format === 'carousel') emoji = '🖼️';

    div.innerHTML = `
      <div class="history-item-idea">${item.idea}</div>
      <div class="history-item-meta">
        <span>${emoji} ${item.format}</span> • <span>${item.date}</span>
      </div>
    `;
    
    div.addEventListener('click', () => {
      // Re-populate form
      ideaInput.value = item.idea;
      ideaInput.dispatchEvent(new Event('input'));
      document.querySelector(`input[name="contentType"][value="${item.format}"]`).checked = true;
      document.querySelector(`input[name="tone"][value="${item.tone}"]`).checked = true;
      
      // Render saved results
      renderResults(item.data);
      historySidebar.classList.remove('open');
    });
    
    historyList.appendChild(div);
  });
}

// Toggle Sidebar
historyToggleBtn.addEventListener('click', () => historySidebar.classList.add('open'));
closeHistoryBtn.addEventListener('click', () => historySidebar.classList.remove('open'));

// ─── Event Listeners ──────────────────────────────────────────────────────────
generateBtn.addEventListener('click', generate);
regenerateBtn.addEventListener('click', generate);

// Ctrl+Enter / Cmd+Enter shortcut
ideaInput.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generate();
});

// Initialize
loadHistory();
