/**
 * Voice Discovery & Ranking Engine
 * Discovers device speech synthesis voices at runtime and ranks candidates
 * based on locale compatibility, regional accent (India), and gender cues.
 */

export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Discovers all voices available in the browser/device
 * Handles asynchronous voice loading and event listeners cleanly.
 */
export function discoverVoices(onVoicesLoaded) {
  if (!isSpeechSynthesisSupported()) {
    if (onVoicesLoaded) onVoicesLoaded([]);
    return () => {};
  }

  const load = () => {
    try {
      const voices = window.speechSynthesis.getVoices() || [];
      if (onVoicesLoaded) {
        onVoicesLoaded(voices);
      }
    } catch (err) {
      console.warn('[Voice Discovery Error]', err);
      if (onVoicesLoaded) onVoicesLoaded([]);
    }
  };

  // Immediate check
  load();

  // Listen for voiceschanged event (common in Chrome/Android)
  const handler = () => load();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.addEventListener('voiceschanged', handler);
  }

  // Cleanup function
  return () => {
    if (window.speechSynthesis && window.speechSynthesis.removeEventListener) {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
    }
  };
}

/**
 * Score and rank candidate voices for a language profile
 *
 * Preference Hierarchy:
 * 1. Exact locale match (e.g. 'en-IN', 'te-IN')
 * 2. Indian English name/locale hints for Indian profile
 * 3. Male voice cues when preferred (e.g. 'Ravi', 'Male', 'Guy')
 * 4. Local device voice over network voice (lower latency)
 */
export function rankVoices(voices = [], languageProfile, preferredGender = 'male') {
  if (!voices || voices.length === 0) return [];

  const targetLocales = (languageProfile?.synthesisLocales || ['en-IN', 'en-US']).map(l => l.toLowerCase());
  const isIndianTarget = languageProfile?.isIndianProfile ?? true;

  const scored = voices.map((voice) => {
    let score = 0;
    const voiceLang = (voice.lang || '').toLowerCase().replace('_', '-');
    const voiceName = (voice.name || '').toLowerCase();

    // 1. Exact primary locale match (Highest priority)
    if (targetLocales[0] && (voiceLang === targetLocales[0] || voiceLang.startsWith(targetLocales[0]))) {
      score += 100;
    } else if (targetLocales.some(loc => voiceLang === loc || voiceLang.startsWith(loc))) {
      score += 60;
    } else if (voiceLang.split('-')[0] === (targetLocales[0] || '').split('-')[0]) {
      // Same language family (e.g. en-US for en-IN if no en-IN available)
      score += 30;
    } else {
      // Unrelated language
      score -= 50;
    }

    // 2. Indian regional accent cues for Indian profiles
    if (isIndianTarget) {
      if (voiceLang.includes('in') || voiceLang.includes('india')) {
        score += 40;
      }
      if (voiceName.includes('india') || voiceName.includes('indian') || voiceName.includes('ravi') || voiceName.includes('neerja')) {
        score += 30;
      }
    }

    // 3. Gender preference cues
    if (preferredGender === 'male') {
      const maleHints = ['male', 'ravi', 'david', 'george', 'guy', 'prabhat', 'mohan', 'mark'];
      const femaleHints = ['female', 'neerja', 'zira', 'heera', 'samantha', 'victoria', 'kavya'];
      
      if (maleHints.some(h => voiceName.includes(h))) {
        score += 25;
      } else if (femaleHints.some(h => voiceName.includes(h))) {
        score += 5; // still a valid candidate if no male voice exists
      }
    }

    // 4. Local service (faster response and works offline)
    if (voice.localService) {
      score += 10;
    }

    return { voice, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.map(s => s.voice);
}

/**
 * Finds the top candidate voice for the active language profile
 */
export function findBestVoice(voices = [], languageProfile, preferredGender = 'male') {
  const ranked = rankVoices(voices, languageProfile, preferredGender);
  return ranked.length > 0 ? ranked[0] : (voices[0] || null);
}

/**
 * Audition a voice with a test phrase
 */
export function auditionVoice(voice, text, options = {}) {
  if (!isSpeechSynthesisSupported() || !voice || !text) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    if (options.onEnd) utterance.onend = options.onEnd;
    if (options.onError) utterance.onerror = options.onError;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[Audition Voice Error]', err);
  }
}
