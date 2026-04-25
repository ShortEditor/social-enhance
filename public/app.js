/* ─── app.js — Instant-Epic Frontend Logic ─────────────────────────────────── */

const API_URL = window.location.port === '3000'
  ? '/api/generate'
  : 'http://localhost:3000/api/generate';

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
Generated by Instant-Epic · Powered by Gemini 1.5 Flash`;

  copyText(kit, exportBtn);
});

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
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea, contentType, tone })
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Generation failed. Please retry.');
    }

    renderResults(json.data);
    saveToHistory(idea, json.data, contentType, tone);

  } catch (err) {
    showError(err.message || 'Network error. Is the server running?');
  } finally {
    setLoading(false);
  }
}

// ─── History Logic ────────────────────────────────────────────────────────────
function loadHistory() {
  const stored = localStorage.getItem('instant_epic_history');
  if (stored) {
    try {
      historyData = JSON.parse(stored);
      renderHistorySidebar();
    } catch (e) {}
  }
}

function saveToHistory(idea, data, format, tone) {
  const newItem = {
    id: Date.now(),
    idea,
    data,
    format,
    tone,
    date: new Date().toLocaleDateString()
  };
  historyData.unshift(newItem);
  if (historyData.length > 20) historyData.pop(); // Keep last 20
  localStorage.setItem('instant_epic_history', JSON.stringify(historyData));
  renderHistorySidebar();
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
