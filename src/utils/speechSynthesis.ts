// Text-to-Speech wrapper — uses Puter.js (OpenAI voices) for natural speech,
// falls back to browser SpeechSynthesis when Puter credits are exhausted.

let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;
let isPlaying = false;
let onEndCallback: (() => void) | null = null;
let cancelled = false; // Prevents audio from playing after stopSpeaking() is called mid-request

// Persist across page refreshes — once Puter fails (low balance), don't try TTS again
let puterTTSDisabled = false;
try {
  // Check both TTS-specific flag and the global Puter disabled flag (set by puterAI.ts)
  puterTTSDisabled = localStorage.getItem('suprik_puter_tts_disabled') === 'true'
    || localStorage.getItem('suprik_puter_disabled') === 'true';
} catch {}

function disablePuterTTS() {
  puterTTSDisabled = true;
  try { localStorage.setItem('suprik_puter_tts_disabled', 'true'); } catch {}
}

// --- Prefetch state (reduces TTS latency by starting API call during AI streaming) ---
let prefetchPromise: Promise<HTMLAudioElement | null> | null = null;
let prefetchedCleanText: string = '';
let prefetchAgentId: string | undefined;

// OpenAI voice IDs mapped to each agent for distinct personalities
// alloy=neutral, ash=sharp, coral=warm, echo=deep, nova=bright, onyx=authoritative, sage=calm, shimmer=clear
export const AGENT_VOICES: Record<string, { voice: string; instructions: string }> = {
  alex: {
    voice: 'echo',
    instructions: 'Speak confidently and clearly like a professional market analyst. Natural pace, direct tone.',
  },
  warren: {
    voice: 'onyx',
    instructions: 'Speak slowly and thoughtfully like a wise experienced investor. Deep, calm, deliberate pace.',
  },
  cathie: {
    voice: 'nova',
    instructions: 'Speak with energy and optimism like an enthusiastic growth analyst. Bright, engaging, slightly fast pace.',
  },
  linda: {
    voice: 'sage',
    instructions: 'Speak precisely and clearly like a meticulous technical analyst. Measured, methodical tone.',
  },
  ray: {
    voice: 'ash',
    instructions: 'Speak with authority and gravitas like a macro strategist. Steady, commanding, clear.',
  },
  nassim: {
    voice: 'coral',
    instructions: 'Speak with intensity and conviction like a risk analyst. Warm but sharp, slightly dramatic.',
  },
  moderator: {
    voice: 'shimmer',
    instructions: 'Speak in a balanced, neutral, professional tone. Clear and composed summary voice.',
  },
};

const DEFAULT_VOICE = { voice: 'nova', instructions: 'Speak clearly and naturally like a helpful assistant.' };

export function isTTSSupported(): boolean {
  return !!(window as any).puter?.ai || 'speechSynthesis' in window;
}

function cleanTextForSpeech(text: string): string {
  return text
    .replace(/```trade[\s\S]*?```/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_~|]/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Puter txt2speech has a 3000 char limit — truncate cleanly at sentence boundary
function truncateForTTS(text: string, maxLen = 2800): string {
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const lastSentence = truncated.lastIndexOf('.');
  if (lastSentence > maxLen * 0.5) return truncated.slice(0, lastSentence + 1);
  return truncated + '...';
}

/**
 * Pre-generate TTS audio while AI is still streaming.
 * Call once from the streaming callback when the first complete sentence is detected.
 * speak() will automatically use the prefetched audio to eliminate delay.
 */
export function prefetchTTS(rawText: string, agentId?: string): void {
  if (puterTTSDisabled) return;
  const puter = (window as any).puter;
  if (!puter?.ai?.txt2speech) return;

  const clean = cleanTextForSpeech(rawText);
  if (!clean || clean.length < 10) return;

  // Already prefetching? Don't restart (preserve the head start)
  if (prefetchPromise) return;

  prefetchedCleanText = truncateForTTS(clean);
  prefetchAgentId = agentId;

  const profile = (agentId && AGENT_VOICES[agentId]) || DEFAULT_VOICE;

  prefetchPromise = puter.ai.txt2speech(prefetchedCleanText, {
    provider: 'openai',
    model: 'gpt-4o-mini-tts',
    voice: profile.voice,
    instructions: profile.instructions,
    response_format: 'mp3',
  }).then((audio: HTMLAudioElement) => audio)
    .catch(() => {
      disablePuterTTS();
      return null;
    });
}

export function clearPrefetch(): void {
  prefetchPromise = null;
  prefetchedCleanText = '';
  prefetchAgentId = undefined;
}

async function speakWithPuter(text: string, agentId?: string): Promise<boolean> {
  if (puterTTSDisabled) return false;
  const puter = (window as any).puter;
  if (!puter?.ai?.txt2speech) return false;

  try {
    const profile = (agentId && AGENT_VOICES[agentId]) || DEFAULT_VOICE;
    const truncated = truncateForTTS(text);

    let audio: HTMLAudioElement | null = null;
    let remainderText: string | null = null;

    // Try to use prefetched audio (generated during AI streaming)
    if (prefetchPromise && prefetchAgentId === agentId) {
      const prefetched = await prefetchPromise;
      if (prefetched && !cancelled) {
        audio = prefetched;
        // Check if full text extends significantly beyond prefetched portion
        if (truncated.length > prefetchedCleanText.length + 30) {
          remainderText = truncated.slice(prefetchedCleanText.length).trim();
          if (remainderText.length < 10) remainderText = null;
        }
      }
      clearPrefetch();
    } else {
      clearPrefetch();
    }

    // No prefetch available — generate for full text normally
    if (!audio) {
      audio = await puter.ai.txt2speech(truncated, {
        provider: 'openai',
        model: 'gpt-4o-mini-tts',
        voice: profile.voice,
        instructions: profile.instructions,
        response_format: 'mp3',
      });
    }

    if (cancelled) {
      audio.pause();
      return false;
    }

    currentAudio = audio;
    isPlaying = true;

    // Start generating remainder TTS in parallel (plays while first part is heard)
    let remainderPromise: Promise<HTMLAudioElement | null> | null = null;
    if (remainderText) {
      remainderPromise = puter.ai.txt2speech(truncateForTTS(remainderText), {
        provider: 'openai',
        model: 'gpt-4o-mini-tts',
        voice: profile.voice,
        instructions: profile.instructions,
        response_format: 'mp3',
      }).catch(() => null);
    }

    audio.onended = async () => {
      // Chain remainder audio if available
      if (remainderPromise && !cancelled) {
        const remainderAudio = await remainderPromise;
        if (remainderAudio && !cancelled) {
          currentAudio = remainderAudio;
          remainderAudio.onended = () => {
            cleanup();
            onEndCallback?.();
            onEndCallback = null;
          };
          remainderAudio.onerror = () => {
            cleanup();
            onEndCallback?.();
            onEndCallback = null;
          };
          try {
            await remainderAudio.play();
          } catch {
            cleanup();
            onEndCallback?.();
            onEndCallback = null;
          }
          return;
        }
      }
      cleanup();
      onEndCallback?.();
      onEndCallback = null;
    };

    audio.onerror = () => {
      cleanup();
      onEndCallback?.();
      onEndCallback = null;
    };

    await audio.play();
    return true;
  } catch (error) {
    console.warn('[TTS] Puter TTS failed, disabling for session:', error);
    disablePuterTTS();
    clearPrefetch();
    return false;
  }
}

// Fallback: browser SpeechSynthesis
function speakWithBrowser(text: string): void {
  if (!('speechSynthesis' in window)) {
    onEndCallback?.();
    onEndCallback = null;
    return;
  }

  const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > 180) {
      if (current.trim()) chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  if (chunks.length === 0) {
    onEndCallback?.();
    onEndCallback = null;
    return;
  }

  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.name.includes('Samantha') && v.lang.startsWith('en'))
    || voices.find(v => v.lang === 'en-US' && v.localService)
    || voices.find(v => v.lang.startsWith('en'))
    || voices[0] || null;

  let idx = 0;

  function playNext() {
    if (cancelled || idx >= chunks.length) {
      isPlaying = false;
      onEndCallback?.();
      onEndCallback = null;
      return;
    }
    const u = new SpeechSynthesisUtterance(chunks[idx++]);
    u.rate = 0.95;
    u.pitch = 1.0;
    u.volume = 1.0;
    if (voice) u.voice = voice;
    u.onend = playNext;
    u.onerror = playNext;
    window.speechSynthesis.speak(u);
  }

  isPlaying = true;
  playNext();
}

function cleanup() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio = null;
  }
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
  isPlaying = false;
}

/**
 * Speak text aloud with an agent's voice.
 * Uses Puter.js OpenAI TTS for natural human-like speech.
 * Falls back to browser SpeechSynthesis if Puter unavailable.
 */
export async function speak(text: string, onEnd?: () => void, agentId?: string): Promise<void> {
  // Stop current playback WITHOUT clearing prefetch (we want to use it)
  cancelled = true;
  cleanup();
  onEndCallback = null;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  cancelled = false; // Reset for the new request

  const clean = cleanTextForSpeech(text);
  if (!clean) {
    clearPrefetch();
    onEnd?.();
    return;
  }

  onEndCallback = onEnd || null;

  // Try Puter.js first (human-like OpenAI voices, uses prefetched audio if available)
  const puterOk = await speakWithPuter(clean, agentId);
  if (!puterOk) {
    clearPrefetch();
    // Fallback: browser SpeechSynthesis
    speakWithBrowser(clean);
  }
}

export function stopSpeaking(): void {
  cancelled = true;
  cleanup();
  clearPrefetch();
  onEndCallback = null;

  // Also cancel any browser TTS that might be playing
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  return isPlaying;
}

/** Re-enable Puter TTS (e.g. after user upgrades their Puter account) */
export function resetPuterTTS(): void {
  puterTTSDisabled = false;
  try { localStorage.removeItem('suprik_puter_tts_disabled'); } catch {}
}

// Preload browser voices as backup
export function preloadVoices(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
  }
}
