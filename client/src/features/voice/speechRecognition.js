/**
 * Browser Speech Recognition Module
 * Wraps SpeechRecognition / webkitSpeechRecognition with capability detection,
 * interim transcripts, duplicate prevention, and clean error handling.
 */

export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export class SpeechRecognitionController {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.callbacks = {};
    this.hasSubmittedFinal = false;
  }

  isSupported() {
    return isSpeechRecognitionSupported();
  }

  start(options = {}) {
    if (!this.isSupported()) {
      if (options.onError) {
        options.onError(new Error('Speech recognition is not supported in this browser. Please use text input.'));
      }
      return;
    }

    // Stop existing instance
    this.stop();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = options.continuous ?? false;
    recognition.interimResults = true;
    recognition.lang = options.lang || 'en-IN';
    recognition.maxAlternatives = 1;

    this.callbacks = {
      onStart: options.onStart,
      onInterim: options.onInterim,
      onFinal: options.onFinal,
      onError: options.onError,
      onEnd: options.onEnd
    };

    this.hasSubmittedFinal = false;

    recognition.onstart = () => {
      this.isListening = true;
      if (this.callbacks.onStart) this.callbacks.onStart();
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (interim && this.callbacks.onInterim) {
        this.callbacks.onInterim(interim);
      }

      if (final && !this.hasSubmittedFinal) {
        this.hasSubmittedFinal = true;
        if (this.callbacks.onFinal) {
          this.callbacks.onFinal(final.trim());
        }
      }
    };

    recognition.onerror = (event) => {
      this.isListening = false;
      const errorType = event.error;

      let message = `Microphone error: ${errorType}`;
      if (errorType === 'not-allowed') {
        message = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
      } else if (errorType === 'no-speech') {
        message = 'No speech detected. Please try again.';
      } else if (errorType === 'network') {
        message = 'Speech recognition network connection error.';
      } else if (errorType === 'aborted') {
        return; // user cancelled deliberately
      }

      if (this.callbacks.onError) {
        this.callbacks.onError(new Error(message), errorType);
      }
    };

    recognition.onend = () => {
      this.isListening = false;
      if (this.callbacks.onEnd) {
        this.callbacks.onEnd();
      }
    };

    this.recognition = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.warn('[Speech Recognition Start Error]', err);
      this.isListening = false;
      if (this.callbacks.onError) {
        this.callbacks.onError(err, 'start_failed');
      }
    }
  }

  stop() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
      this.recognition = null;
    }
    this.isListening = false;
  }

  abort() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (_) {}
      this.recognition = null;
    }
    this.isListening = false;
  }
}

export const speechRecognizer = new SpeechRecognitionController();
