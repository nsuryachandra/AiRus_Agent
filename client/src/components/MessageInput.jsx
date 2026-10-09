import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Square, VolumeX, AlertCircle } from 'lucide-react';
import { useVoice } from '../context/VoiceContext';

export default function MessageInput({
  onSendMessage,
  disabled = false,
  isAiLoading = false
}) {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef(null);

  const {
    isRecognitionSupported,
    isListening,
    transcript,
    recognitionError,
    startListening,
    stopListening,
    isSpeaking,
    stopSpeaking
  } = useVoice();

  // Update input text with speech transcript in real-time
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (isListening) {
      stopListening();
    }
    const trimmed = inputText.trim();
    if (!trimmed || disabled || isAiLoading) return;

    onSendMessage(trimmed);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleMicToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    if (isListening) {
      stopListening();
    } else {
      startListening((finalTranscript) => {
        if (finalTranscript && finalTranscript.trim()) {
          onSendMessage(finalTranscript.trim());
          setInputText('');
        }
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 safe-bottom pb-3">
      {/* Mic Error Banner if any */}
      {recognitionError && (
        <div className="mb-2 p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{recognitionError}</span>
          </div>
        </div>
      )}

      {/* Real-time speech listening banner */}
      {isListening && (
        <div className="mb-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-medium">Listening:</span>
            <span className="italic truncate">{transcript || 'Speak now...'}</span>
          </div>
          <button
            onClick={stopListening}
            className="p-1 rounded-md text-rose-400 hover:text-white hover:bg-rose-900/50 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Main Composer Box */}
      <form
        onSubmit={handleSubmit}
        className="glass-panel p-2 rounded-2xl flex items-end gap-2 border border-slate-800 focus-within:border-sky-500/50 shadow-xl"
      >
        {/* Stop Speaking Button (if active TTS) */}
        {isSpeaking && (
          <button
            type="button"
            onClick={stopSpeaking}
            title="Stop Speech Playback"
            className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition-all cursor-pointer shrink-0"
          >
            <VolumeX className="w-5 h-5" />
          </button>
        )}

        {/* Microphone Button */}
        <button
          type="button"
          onClick={handleMicToggle}
          disabled={!isRecognitionSupported}
          title={
            !isRecognitionSupported
              ? "Speech recognition is not supported in this browser"
              : isListening
              ? "Stop listening"
              : "Speak with AiRus"
          }
          className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
            isListening
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse'
              : !isRecognitionSupported
              ? 'opacity-40 text-slate-500 cursor-not-allowed bg-slate-800'
              : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700'
          }`}
        >
          {isListening ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening to your voice..." : "Message AiRus... (Shift+Enter for newline)"}
          rows={1}
          disabled={disabled || isAiLoading}
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none py-2 px-1 max-h-32 overflow-y-auto"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || disabled || isAiLoading}
          className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
            inputText.trim() && !disabled && !isAiLoading
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500'
              : 'text-slate-600 bg-slate-850 cursor-not-allowed'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
