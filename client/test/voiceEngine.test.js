import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prepareTextForSpeech, splitIntoSpeechChunks } from '../src/features/voice/speechText.js';
import { rankVoices, findBestVoice } from '../src/features/voice/voiceDiscovery.js';
import { getLanguageProfile, getDefaultLanguage } from '../src/features/voice/languageProfiles.js';
import { VoiceController, VOICE_STATES } from '../src/features/voice/VoiceController.js';

describe('AiRus Voice Intelligence Engine Tests', () => {
  describe('1. Speech-Friendly Text Preparation (speechText.js)', () => {
    it('converts markdown headings to spoken sentences with periods', () => {
      const input = '# Architecture Overview\nThis is the plan.';
      const output = prepareTextForSpeech(input);
      expect(output).toContain('Architecture Overview.');
      expect(output).not.toContain('#');
    });

    it('summarizes fenced code blocks instead of reading code line-by-line', () => {
      const input = 'Here is the function:\n```javascript\nfunction test() {\n  console.log("hello");\n  return 42;\n}\n```\nAll done.';
      const output = prepareTextForSpeech(input);
      expect(output).toContain('Code block provided in the conversation.');
      expect(output).not.toContain('console.log');
    });

    it('cleans inline code backticks cleanly', () => {
      const input = 'Use `npm run dev` to launch both servers.';
      const output = prepareTextForSpeech(input);
      expect(output).toBe('Use npm run dev to launch both servers.');
    });

    it('replaces raw URLs with spoken link description', () => {
      const input = 'Check out https://integrate.api.nvidia.com/v1 for more info.';
      const output = prepareTextForSpeech(input);
      expect(output).toContain('link provided');
      expect(output).not.toContain('https://');
    });

    it('strips markdown bullet asterisks and dashes', () => {
      const input = '- First point\n- Second point\n* Third point';
      const output = prepareTextForSpeech(input);
      expect(output).toContain('First point');
      expect(output).not.toContain('-');
      expect(output).not.toContain('*');
    });

    it('splits long responses into sentence chunks without breaking mid-sentence', () => {
      const longText = 'First sentence is short. Second sentence explains how AiRus works in depth and gives clarity to the user. Third sentence concludes the thought gracefully.';
      const chunks = splitIntoSpeechChunks(longText, 60);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0]).toContain('First sentence is short.');
    });

    it('returns empty array or handles empty/null text gracefully', () => {
      expect(prepareTextForSpeech('')).toBe('');
      expect(prepareTextForSpeech(null)).toBe('');
      expect(splitIntoSpeechChunks('')).toEqual([]);
    });
  });

  describe('2. Voice Discovery & Locale Ranking (voiceDiscovery.js)', () => {
    const mockVoices = [
      { name: 'Google US English', lang: 'en-US', localService: true, voiceURI: 'google-us' },
      { name: 'Microsoft David Desktop', lang: 'en-US', localService: true, voiceURI: 'ms-david' },
      { name: 'Microsoft Ravi - English (India)', lang: 'en-IN', localService: true, voiceURI: 'ms-ravi' },
      { name: 'Google हिन्दी', lang: 'hi-IN', localService: false, voiceURI: 'google-hi' },
      { name: 'Microsoft Mohan - Telugu (India)', lang: 'te-IN', localService: true, voiceURI: 'ms-te-mohan' }
    ];

    it('ranks Indian English male voice (Ravi) top for en-IN language profile', () => {
      const enProfile = getLanguageProfile('en-IN');
      const ranked = rankVoices(mockVoices, enProfile, 'male');
      expect(ranked[0].name).toContain('Ravi');
      expect(ranked[0].voiceURI).toBe('ms-ravi');
    });

    it('ranks Telugu voice top for te-IN profile', () => {
      const teProfile = getLanguageProfile('te-IN');
      const best = findBestVoice(mockVoices, teProfile, 'male');
      expect(best.name).toContain('Telugu');
      expect(best.lang).toBe('te-IN');
    });

    it('ranks Hindi voice top for hi-IN profile', () => {
      const hiProfile = getLanguageProfile('hi-IN');
      const best = findBestVoice(mockVoices, hiProfile, 'male');
      expect(best.lang).toBe('hi-IN');
    });

    it('falls back gracefully when preferred language is not in voice list', () => {
      const frProfile = { synthesisLocales: ['fr-FR'], isIndianProfile: false };
      const best = findBestVoice(mockVoices, frProfile, 'male');
      expect(best).toBeDefined(); // Returns highest relative candidate or first available
    });
  });

  describe('3. Language Profiles (languageProfiles.js)', () => {
    it('provides English (India) as the default language profile', () => {
      const defaultLang = getDefaultLanguage();
      expect(defaultLang.code).toBe('en-IN');
      expect(defaultLang.isIndianProfile).toBe(true);
    });

    it('correctly resolves Telugu and Hindi profiles', () => {
      const te = getLanguageProfile('te-IN');
      expect(te.recognitionLang).toBe('te-IN');
      expect(te.synthesisLocales).toContain('te-IN');

      const hi = getLanguageProfile('hi-IN');
      expect(hi.recognitionLang).toBe('hi-IN');
      expect(hi.synthesisLocales).toContain('hi-IN');
    });
  });

  describe('4. Centralized Voice State Machine (VoiceController.js)', () => {
    let controller;

    beforeEach(() => {
      controller = new VoiceController();
    });

    it('initializes in IDLE state', () => {
      expect(controller.state).toBe(VOICE_STATES.IDLE);
    });

    it('interrupt() cancels active speech and resets state without hanging', () => {
      controller.setState(VOICE_STATES.SPEAKING);
      expect(controller.state).toBe(VOICE_STATES.SPEAKING);

      controller.interrupt();
      expect(controller.state).toBe(VOICE_STATES.INTERRUPTED);
    });

    it('toggling continuous mode notifies subscribers', () => {
      let notifiedMode = null;
      controller.subscribe((update) => {
        notifiedMode = update.continuousMode;
      });

      controller.setContinuousMode(true);
      expect(notifiedMode).toBe(true);
    });
  });
});
