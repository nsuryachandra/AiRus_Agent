import { speechSynthesizer } from './speechSynthesis.js';
import { speechRecognizer } from './speechRecognition.js';

export const VOICE_STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  TRANSCRIBING: 'transcribing',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  INTERRUPTED: 'interrupted',
  ERROR: 'error'
};

export class VoiceController {
  constructor() {
    this.state = VOICE_STATES.IDLE;
    this.listeners = new Set();
    this.continuousMode = false;
    this.lastError = null;
    this.interimTranscript = '';
    this.loopTimeoutId = null;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener({
        state: this.state,
        continuousMode: this.continuousMode,
        error: this.lastError,
        interimTranscript: this.interimTranscript
      });
    }
  }

  setState(newState, error = null) {
    this.state = newState;
    if (error) this.lastError = error;
    this.notify();
  }

  setContinuousMode(enabled) {
    this.continuousMode = Boolean(enabled);
    this.notify();
  }

  /**
   * Interrupts any active speech synthesis or recognition immediately
   */
  interrupt() {
    if (this.loopTimeoutId) {
      clearTimeout(this.loopTimeoutId);
      this.loopTimeoutId = null;
    }
    speechSynthesizer.stop();
    speechRecognizer.abort();
    this.interimTranscript = '';
    this.setState(VOICE_STATES.INTERRUPTED);
    setTimeout(() => {
      if (this.state === VOICE_STATES.INTERRUPTED) {
        this.setState(VOICE_STATES.IDLE);
      }
    }, 250);
  }

  /**
   * Start voice recognition session
   */
  startListening(languageCode, onFinalTranscript) {
    // Ensure synthesizer is not playing
    speechSynthesizer.stop();
    this.lastError = null;
    this.interimTranscript = '';
    this.setState(VOICE_STATES.LISTENING);

    speechRecognizer.start({
      lang: languageCode,
      onStart: () => {
        this.setState(VOICE_STATES.LISTENING);
      },
      onInterim: (text) => {
        this.interimTranscript = text;
        this.setState(VOICE_STATES.TRANSCRIBING);
      },
      onFinal: (finalText) => {
        this.interimTranscript = '';
        this.setState(VOICE_STATES.PROCESSING);
        if (onFinalTranscript) {
          onFinalTranscript(finalText);
        }
      },
      onError: (err, errorType) => {
        this.interimTranscript = '';
        this.setState(VOICE_STATES.ERROR, err.message);
      },
      onEnd: () => {
        if (this.state === VOICE_STATES.LISTENING || this.state === VOICE_STATES.TRANSCRIBING) {
          this.setState(VOICE_STATES.IDLE);
        }
      }
    });
  }

  stopListening() {
    speechRecognizer.stop();
    this.interimTranscript = '';
    this.setState(VOICE_STATES.IDLE);
  }

  /**
   * Speak response aloud with optional continuous conversation continuation
   */
  speakResponse(text, options = {}, onDoneCallback) {
    if (!text) return;

    // Halt any active mic before speaking to prevent audio feedback loop
    speechRecognizer.stop();
    this.setState(VOICE_STATES.SPEAKING);

    speechSynthesizer.speak(text, {
      voice: options.voice,
      rate: options.rate ?? 1.0,
      pitch: options.pitch ?? 1.0,
      onStart: () => {
        this.setState(VOICE_STATES.SPEAKING);
      },
      onEnd: () => {
        this.setState(VOICE_STATES.IDLE);
        if (onDoneCallback) onDoneCallback();

        // If continuous mode is enabled and user hasn't interrupted, trigger next listen loop
        if (this.continuousMode && this.state === VOICE_STATES.IDLE) {
          this.loopTimeoutId = setTimeout(() => {
            if (this.continuousMode && this.state === VOICE_STATES.IDLE && options.onContinuousResume) {
              options.onContinuousResume();
            }
          }, 600); // 600ms grace period to avoid echoing speaker sound
        }
      },
      onError: (err) => {
        console.warn('[Synthesizer Error]', err);
        this.setState(VOICE_STATES.ERROR, 'Voice output failed.');
      }
    });
  }

  stopSpeaking() {
    speechSynthesizer.stop();
    if (this.loopTimeoutId) {
      clearTimeout(this.loopTimeoutId);
      this.loopTimeoutId = null;
    }
    this.setState(VOICE_STATES.IDLE);
  }
}

export const voiceController = new VoiceController();
