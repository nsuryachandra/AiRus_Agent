import { isSpeechSynthesisSupported } from './voiceDiscovery.js';
import { prepareTextForSpeech, splitIntoSpeechChunks } from './speechText.js';

export class SpeechSynthesisEngine {
  constructor() {
    this.currentChunks = [];
    this.currentChunkIndex = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.activeUtterance = null;
    this.callbacks = {};
  }

  isSupported() {
    return isSpeechSynthesisSupported();
  }

  /**
   * Speak a text response with automatic chunking and queue handling
   */
  speak(rawText, options = {}) {
    if (!this.isSupported() || !rawText) {
      if (options.onError) {
        options.onError(new Error('Speech synthesis is not supported on this device.'));
      }
      return;
    }

    // Cancel any ongoing utterance before beginning a new one
    this.stop();

    const cleanText = prepareTextForSpeech(rawText);
    if (!cleanText) {
      if (options.onEnd) options.onEnd();
      return;
    }

    this.currentChunks = splitIntoSpeechChunks(cleanText);
    this.currentChunkIndex = 0;
    this.callbacks = {
      onStart: options.onStart,
      onChunk: options.onChunk,
      onEnd: options.onEnd,
      onError: options.onError
    };

    this.isPlaying = true;
    this.isPaused = false;

    if (this.callbacks.onStart) {
      this.callbacks.onStart();
    }

    this._speakNextChunk(options);
  }

  _speakNextChunk(options = {}) {
    if (!this.isPlaying || this.currentChunkIndex >= this.currentChunks.length) {
      this.isPlaying = false;
      this.activeUtterance = null;
      if (this.callbacks.onEnd) {
        this.callbacks.onEnd();
      }
      return;
    }

    const chunkText = this.currentChunks[this.currentChunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunkText);

    if (options.voice) {
      utterance.voice = options.voice;
    }
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;

    utterance.onend = () => {
      this.currentChunkIndex++;
      if (this.callbacks.onChunk) {
        this.callbacks.onChunk(this.currentChunkIndex, this.currentChunks.length);
      }
      this._speakNextChunk(options);
    };

    utterance.onerror = (e) => {
      // 'interrupted' or 'canceled' are normal when user clicks stop
      if (e.error === 'interrupted' || e.error === 'canceled') {
        this.isPlaying = false;
        return;
      }
      console.warn('[Speech Synthesis Chunk Error]', e.error);
      this.isPlaying = false;
      if (this.callbacks.onError) {
        this.callbacks.onError(e);
      }
    };

    this.activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Immediately stops speech and flushes any pending utterances
   */
  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentChunks = [];
    this.currentChunkIndex = 0;
    this.activeUtterance = null;

    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
  }

  pause() {
    if (this.isSupported() && this.isPlaying && !this.isPaused) {
      window.speechSynthesis.pause();
      this.isPaused = true;
    }
  }

  resume() {
    if (this.isSupported() && this.isPlaying && this.isPaused) {
      window.speechSynthesis.resume();
      this.isPaused = false;
    }
  }
}

export const speechSynthesizer = new SpeechSynthesisEngine();
