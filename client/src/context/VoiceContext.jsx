import React, { createContext, useContext } from 'react';
import { useVoiceAssistant } from '../features/voice/useVoiceAssistant.js';

const VoiceContext = createContext(null);

export function VoiceProvider({ children }) {
  const voiceAssistant = useVoiceAssistant();

  // Map into unified context object supporting both legacy and upgraded features
  const contextValue = {
    // Upgraded Core
    ...voiceAssistant,

    // Backward-compatibility aliases
    transcript: voiceAssistant.interimTranscript,
    recognitionError: voiceAssistant.voiceError,
    speechRate: voiceAssistant.settings.speechRate,
    speechPitch: voiceAssistant.settings.speechPitch,
    autoSpeak: voiceAssistant.settings.autoSpeak,
    continuousMode: voiceAssistant.settings.continuousMode,
    verbosity: voiceAssistant.settings.verbosity,
    selectedVoiceUri: voiceAssistant.settings.selectedVoiceUri,
    selectedLanguage: voiceAssistant.activeLanguage,

    setSpeechRate: (rate) => voiceAssistant.updateSetting('speechRate', rate),
    setSpeechPitch: (pitch) => voiceAssistant.updateSetting('speechPitch', pitch),
    setAutoSpeak: (val) => voiceAssistant.updateSetting('autoSpeak', val),
    setContinuousMode: (val) => voiceAssistant.updateSetting('continuousMode', val),
    setVerbosity: (val) => voiceAssistant.updateSetting('verbosity', val),
    setSelectedVoiceUri: (uri) => voiceAssistant.updateSetting('selectedVoiceUri', uri),
    setSelectedLanguage: (lang) => voiceAssistant.updateSetting('languageCode', lang.code),
    replayLastResponse: voiceAssistant.replayLast
  };

  return (
    <VoiceContext.Provider value={contextValue}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
