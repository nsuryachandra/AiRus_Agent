import { useState, useEffect, useCallback, useRef } from 'react';
import { voiceController, VOICE_STATES } from './VoiceController.js';
import { discoverVoices, findBestVoice, auditionVoice, isSpeechSynthesisSupported } from './voiceDiscovery.js';
import { isSpeechRecognitionSupported } from './speechRecognition.js';
import { SUPPORTED_LANGUAGES, getLanguageProfile, getDefaultLanguage } from './languageProfiles.js';

const SETTINGS_STORAGE_KEY = 'airus_voice_settings_v2';

const DEFAULT_SETTINGS = {
  languageCode: 'en-IN',
  selectedVoiceUri: '',
  speechRate: 1.0,
  speechPitch: 1.0,
  autoSpeak: true,
  continuousMode: false,
  voiceFirstMode: true,
  verbosity: 'natural', // 'concise' | 'natural' | 'detailed'
  preferredGender: 'male'
};

function loadStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (_) {}
  return DEFAULT_SETTINGS;
}

function saveStoredSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (_) {}
}

export function useVoiceAssistant() {
  const [controllerState, setControllerState] = useState({
    state: voiceController.state,
    continuousMode: voiceController.continuousMode,
    error: null,
    interimTranscript: ''
  });

  const [availableVoices, setAvailableVoices] = useState([]);
  const [settings, setSettings] = useState(loadStoredSettings);
  const [lastSpokenText, setLastSpokenText] = useState('');

  const activeLanguage = getLanguageProfile(settings.languageCode);

  // Subscribe to voice controller
  useEffect(() => {
    const unsubscribe = voiceController.subscribe((update) => {
      setControllerState(update);
    });
    return unsubscribe;
  }, []);

  // Discover voices at runtime
  useEffect(() => {
    const cleanup = discoverVoices((loadedVoices) => {
      setAvailableVoices(loadedVoices);
    });
    return cleanup;
  }, []);

  // Keep continuousMode synced with controller
  useEffect(() => {
    voiceController.setContinuousMode(settings.continuousMode);
  }, [settings.continuousMode]);

  // Persist settings whenever changed
  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      saveStoredSettings(updated);
      return updated;
    });
  }, []);

  // Determine active voice object
  const selectedVoice = availableVoices.find(v => v.voiceURI === settings.selectedVoiceUri)
    || findBestVoice(availableVoices, activeLanguage, settings.preferredGender);

  // Automatically select best voice if none is explicitly chosen or language changed
  useEffect(() => {
    if (availableVoices.length > 0 && !settings.selectedVoiceUri) {
      const best = findBestVoice(availableVoices, activeLanguage, settings.preferredGender);
      if (best) {
        updateSetting('selectedVoiceUri', best.voiceURI);
      }
    }
  }, [availableVoices, activeLanguage, settings.preferredGender, settings.selectedVoiceUri, updateSetting]);

  // Actions
  const startListening = useCallback((onFinal) => {
    voiceController.startListening(activeLanguage.recognitionLang, onFinal);
  }, [activeLanguage]);

  const stopListening = useCallback(() => {
    voiceController.stopListening();
  }, []);

  const interrupt = useCallback(() => {
    voiceController.interrupt();
  }, []);

  const stopSpeaking = useCallback(() => {
    voiceController.stopSpeaking();
  }, []);

  const speak = useCallback((text, onContinuousResume) => {
    if (!text) return;
    setLastSpokenText(text);

    voiceController.speakResponse(
      text,
      {
        voice: selectedVoice,
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        onContinuousResume
      }
    );
  }, [selectedVoice, settings.speechRate, settings.speechPitch]);

  const replayLast = useCallback(() => {
    if (lastSpokenText) {
      speak(lastSpokenText);
    }
  }, [lastSpokenText, speak]);

  const audition = useCallback((testText) => {
    const phrase = testText || activeLanguage.testPhrase || 'AiRus voice test.';
    auditionVoice(selectedVoice, phrase, {
      rate: settings.speechRate,
      pitch: settings.speechPitch
    });
  }, [selectedVoice, activeLanguage, settings.speechRate, settings.speechPitch]);

  return {
    // State
    voiceState: controllerState.state,
    isListening: controllerState.state === VOICE_STATES.LISTENING || controllerState.state === VOICE_STATES.TRANSCRIBING,
    isSpeaking: controllerState.state === VOICE_STATES.SPEAKING,
    isProcessing: controllerState.state === VOICE_STATES.PROCESSING,
    interimTranscript: controllerState.interimTranscript,
    voiceError: controllerState.error,

    // Capabilities
    isRecognitionSupported: isSpeechRecognitionSupported(),
    isSynthesisSupported: isSpeechSynthesisSupported(),

    // Voices & Languages
    availableVoices,
    selectedVoice,
    activeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,

    // Settings
    settings,
    updateSetting,

    // Actions
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    replayLast,
    interrupt,
    audition,
    hasLastResponse: Boolean(lastSpokenText)
  };
}
