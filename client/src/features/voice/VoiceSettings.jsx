import React from 'react';
import { Volume2, Globe, Sliders, Check, Info, Radio, Sparkles, MessageSquare, Play, RefreshCw } from 'lucide-react';
import { useVoice } from '../../context/VoiceContext.jsx';

export default function VoiceSettings() {
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
    continuousMode,
    setContinuousMode,
    verbosity,
    setVerbosity,
    audition,
    isRecognitionSupported,
    isSynthesisSupported
  } = useVoice();

  return (
    <div className="space-y-5 text-xs text-slate-300">
      
      {/* 1. Conversational Verbosity Style */}
      <div>
        <label className="flex items-center gap-1.5 font-medium text-slate-200 mb-2">
          <MessageSquare className="w-4 h-4 text-sky-400" />
          <span>Conversational Response Style</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'concise', label: 'Concise', desc: 'Crisp & short' },
            { id: 'natural', label: 'Natural', desc: 'Talkative & engaging' },
            { id: 'detailed', label: 'Detailed', desc: 'In-depth analysis' }
          ].map((style) => {
            const isSelected = (verbosity || 'natural') === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setVerbosity(style.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-sky-500/15 border-sky-500/50 text-sky-200 shadow-sm'
                    : 'border-slate-800 hover:bg-slate-800/60 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-xs">{style.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </div>
                <span className="text-[10px] text-slate-400">{style.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Spoken & Recognition Language */}
      <div>
        <label className="flex items-center gap-1.5 font-medium text-slate-200 mb-2">
          <Globe className="w-4 h-4 text-indigo-400" />
          <span>Language Profile & Accent</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {supportedLanguages.map((lang) => {
            const isSelected = lang.code === selectedLanguage.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelectedLanguage(lang)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-200 font-semibold shadow-sm'
                    : 'border-slate-800 hover:bg-slate-800/60 text-slate-400'
                }`}
              >
                <div>
                  <div className="text-xs">{lang.nativeLabel || lang.label}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{lang.recognitionLang}</div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Toggles: Continuous Conversation & Auto-Speak */}
      <div className="space-y-2">
        {/* Continuous In-App Loop */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div>
            <div className="font-medium text-slate-200 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-rose-400" />
              <span>Continuous Conversation Mode</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Auto-listens after speaking replies (hands-free talk)
            </div>
          </div>
          <button
            type="button"
            onClick={() => setContinuousMode(!continuousMode)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              continuousMode ? 'bg-rose-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform transform ${
                continuousMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Auto Speak */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div>
            <div className="font-medium text-slate-200 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto-Speak Responses</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Read AI messages aloud automatically
            </div>
          </div>
          <button
            type="button"
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
      </div>

      {/* 4. Device Voice Engine Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-1.5 font-medium text-slate-200">
            <Volume2 className="w-4 h-4 text-sky-400" />
            <span>Device Voice Engine ({availableVoices.length} detected)</span>
          </label>
          <button
            type="button"
            onClick={() => audition()}
            className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3" />
            <span>Audition Voice</span>
          </button>
        </div>

        <select
          value={selectedVoiceUri}
          onChange={(e) => setSelectedVoiceUri(e.target.value)}
          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
        >
          {availableVoices.length === 0 ? (
            <option value="">Default Device Synthesizer</option>
          ) : (
            availableVoices.map((v) => {
              const isIndian = v.lang.includes('IN') || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('ravi');
              return (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {isIndian ? '🇮🇳 ' : ''}{v.name} ({v.lang}){v.localService ? ' • Offline' : ''}
                </option>
              );
            })
          )}
        </select>
      </div>

      {/* 5. Speech Rate & Pitch */}
      <div className="space-y-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-medium">Speech Speed (Rate)</span>
            <span className="font-mono text-sky-400">{speechRate.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.5"
            step="0.1"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="font-medium">Voice Pitch</span>
            <span className="font-mono text-indigo-400">{speechPitch.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.3"
            step="0.1"
            value={speechPitch}
            onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
            className="w-full accent-indigo-400 cursor-pointer"
          />
        </div>
      </div>

      {/* 6. Capability State Information */}
      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1.5 text-slate-400">
        <div className="flex items-center justify-between">
          <span>Speech Recognition (STT):</span>
          <span className={`font-medium ${isRecognitionSupported ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isRecognitionSupported ? 'Available' : 'Unsupported on this browser'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Speech Synthesis (TTS):</span>
          <span className={`font-medium ${isSynthesisSupported ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isSynthesisSupported ? 'Active' : 'Unavailable'}
          </span>
        </div>
        <div className="pt-1.5 border-t border-slate-800 flex items-start gap-1.5 text-slate-500">
          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
          <span>
            Telugu and Hindi voice playback relies on languages installed in your device system settings (e.g. Google Text-to-Speech pack on Android). Tenglish is spoken smoothly via Indian English or Telugu voice engines.
          </span>
        </div>
      </div>

    </div>
  );
}
