import React from 'react';
import { X, Volume2, Globe, Sliders, Check, Info } from 'lucide-react';
import { useVoice } from '../context/VoiceContext';

export default function SettingsModal({ isOpen, onClose }) {
  const {
    supportedLanguages,
    selectedLanguage,
    setSelectedLanguage,
    availableVoices,
    selectedVoiceUri,
    setSelectedVoiceUri,
    speechRate,
    setSpeechRate,
    speechPitch,
    setSpeechPitch,
    autoSpeak,
    setAutoSpeak,
    speak
  } = useVoice();

  if (!isOpen) return null;

  const handleTestSpeech = () => {
    const testPhrases = {
      'en-IN': "Hello Boss! AiRus voice synthesis is working smoothly.",
      'te-IN': "నమస్కారం బాస్! AiRus వాయిస్ సేవలు సిద్ధంగా ఉన్నాయి.",
      'hi-IN': "नमस्ते बॉस! AiRus वॉइस असिस्टेंट तैयार है.",
      'en-US': "Hello Boss! AiRus speech engine configured and ready."
    };
    speak(testPhrases[selectedLanguage.speechLang] || "AiRus voice test complete.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative z-50 w-full max-w-md bg-[#0c1220] border border-slate-800 rounded-2xl shadow-2xl p-5 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-base text-slate-100">Voice & Language Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 text-xs text-slate-300">
          
          {/* 1. Language Selection */}
          <div>
            <label className="flex items-center gap-1.5 font-medium text-slate-200 mb-2">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>Spoken & Recognition Language</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {supportedLanguages.map((lang) => {
                const isSelected = lang.code === selectedLanguage.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 font-semibold'
                        : 'border-slate-800 hover:bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Device TTS Voice Selector */}
          <div>
            <label className="flex items-center gap-1.5 font-medium text-slate-200 mb-2">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span>Speech Synthesis Voice Engine</span>
            </label>
            <select
              value={selectedVoiceUri}
              onChange={(e) => setSelectedVoiceUri(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
            >
              {availableVoices.length === 0 ? (
                <option value="">Default System Voice</option>
              ) : (
                availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 3. Speech Rate & Pitch */}
          <div className="space-y-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div>
              <div className="flex justify-between mb-1">
                <span>Speech Speed</span>
                <span className="font-mono text-sky-400">{speechRate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-full accent-sky-400"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Voice Pitch</span>
                <span className="font-mono text-indigo-400">{speechPitch.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.1"
                value={speechPitch}
                onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                className="w-full accent-indigo-400"
              />
            </div>
          </div>

          {/* 4. Auto-Speak Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div>
              <div className="font-medium text-slate-200">Auto-Speak Responses</div>
              <div className="text-[11px] text-slate-500">Automatically speak AiRus answers aloud</div>
            </div>
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                autoSpeak ? 'bg-sky-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform transform ${
                  autoSpeak ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Test Voice Button */}
          <button
            onClick={handleTestSpeech}
            className="w-full py-2.5 rounded-xl border border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Volume2 className="w-4 h-4" />
            <span>Test Voice Playback</span>
          </button>

          {/* Transparent Voice Notice */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              Voice synthesis relies on the voices installed on your device/browser. AiRus can generate Telugu and Hindi text, but speech audio depends on your device having installed Indian language voice packs.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
