import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const VoiceContext = createContext(null);

const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', label: 'English (India)', speechLang: 'en-IN' },
  { code: 'te-IN', label: 'Telugu (తెలుగు)', speechLang: 'te-IN' },
  { code: 'hi-IN', label: 'Hindi (हिन्दी)', speechLang: 'hi-IN' },
  { code: 'en-US', label: 'English (US)', speechLang: 'en-US' }
];

export function VoiceProvider({ children }) {
  // Speech Recognition State
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognitionError, setRecognitionError] = useState(null);

  // Speech Synthesis State
  const [isSynthesisSupported, setIsSynthesisSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState('');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState(SUPPORTED_LANGUAGES[0]);
  const [lastSpokenText, setLastSpokenText] = useState('');

  const recognitionRef = useRef(null);
  const currentUtteranceRef = useRef(null);

  // Initialize Speech Capabilities
  useEffect(() => {
    // 1. Speech Recognition Check
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsRecognitionSupported(true);
    }

    // 2. Speech Synthesis Check
    if ('speechSynthesis' in window) {
      setIsSynthesisSupported(true);

      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);

          // Find target Indian English voice or regional voice
          const indianVoice = voices.find(v => 
            v.lang === 'en-IN' || 
            v.name.toLowerCase().includes('india') || 
            v.name.toLowerCase().includes('ravi')
          );

          if (indianVoice) {
            setSelectedVoiceUri(indianVoice.voiceURI);
          } else if (voices[0]) {
            setSelectedVoiceUri(voices[0].voiceURI);
          }
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Update voice selection when language changes
  useEffect(() => {
    if (availableVoices.length === 0) return;

    // Try finding matching voice for current language
    const langMatch = availableVoices.find(v => v.lang === selectedLanguage.speechLang);
    if (langMatch) {
      setSelectedVoiceUri(langMatch.voiceURI);
    }
  }, [selectedLanguage, availableVoices]);

  // Start Voice Recognition
  const startListening = useCallback((onFinalResult) => {
    setRecognitionError(null);
    setTranscript('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionError('Speech recognition is not supported in this browser. Please use keyboard input.');
      return;
    }

    // Cancel any ongoing speech synthesis first
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage.speechLang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          currentTranscript += item[0].transcript;
          if (item.isFinal) {
            if (onFinalResult) {
              onFinalResult(item[0].transcript);
            }
          }
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.warn('[Speech Recognition Error]', event.error);
        if (event.error === 'not-allowed') {
          setRecognitionError('Microphone permission was denied. Please allow microphone access in your browser.');
        } else if (event.error === 'no-speech') {
          setRecognitionError('No speech was detected. Please try speaking again.');
        } else {
          setRecognitionError(`Voice recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('[Start Listening Error]', err);
      setRecognitionError('Failed to activate microphone.');
      setIsListening(false);
    }
  }, [selectedLanguage]);

  // Stop / Cancel Voice Recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
  }, []);

  // Text-To-Speech Playback
  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window) || !text) return;

    // Clean text: strip markdown code blocks or excessive symbols for clear spoken audio
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~]/g, '')
      .trim();

    if (!cleanText) return;

    window.speechSynthesis.cancel();
    setLastSpokenText(cleanText);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.lang = selectedLanguage.speechLang;

    // Select chosen voice
    const voice = availableVoices.find(v => v.voiceURI === selectedVoiceUri);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (e) => {
      console.warn('[Speech Synthesis Error]', e);
      setIsSpeaking(false);
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [availableVoices, selectedVoiceUri, speechRate, speechPitch, selectedLanguage]);

  // Stop Speech Playback
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Replay Last Response
  const replayLastResponse = useCallback(() => {
    if (lastSpokenText) {
      speak(lastSpokenText);
    }
  }, [lastSpokenText, speak]);

  return (
    <VoiceContext.Provider
      value={{
        isRecognitionSupported,
        isListening,
        transcript,
        recognitionError,
        setRecognitionError,
        startListening,
        stopListening,

        isSynthesisSupported,
        isSpeaking,
        availableVoices,
        selectedVoiceUri,
        setSelectedVoiceUri,
        speechRate,
        setSpeechRate,
        speechPitch,
        setSpeechPitch,
        autoSpeak,
        setAutoSpeak,
        selectedLanguage,
        setSelectedLanguage,
        supportedLanguages: SUPPORTED_LANGUAGES,

        speak,
        stopSpeaking,
        replayLastResponse,
        hasLastResponse: Boolean(lastSpokenText)
      }}
    >
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
