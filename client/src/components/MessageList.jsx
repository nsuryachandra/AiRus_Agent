import React, { useEffect, useRef } from 'react';
import { Volume2, Copy, Check, Sparkles, User } from 'lucide-react';
import { useVoice } from '../context/VoiceContext';

export default function MessageList({ messages = [], onPromptClick, isAiLoading }) {
  const messagesEndRef = useRef(null);
  const { speak } = useVoice();
  const [copiedId, setCopiedId] = React.useState(null);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiLoading]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const samplePrompts = [
    { title: "Briefing", text: "What's our agenda and focus today, AiRus?" },
    { title: "Telugu Prompt", text: "హలో బాస్, ఈరోజు వాతావరణం మరియు పనుల గురించి చెప్పు." },
    { title: "Tenglish Query", text: "AiRus, ela unnavu? Quick architecture plan cheppu." },
    { title: "Technical Concept", text: "Explain how transformer self-attention works in simple terms." }
  ];

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-sky-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-100">Welcome back, Boss.</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          AiRus is active and awaiting your voice or text instructions.
        </p>

        {/* Quick Suggestion Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full max-w-lg">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onPromptClick(p.text)}
              className="text-left p-3 rounded-xl glass-panel hover:border-sky-500/40 hover:bg-slate-850/80 transition-all text-xs group cursor-pointer"
            >
              <div className="font-medium text-sky-300 group-hover:text-sky-200 mb-0.5">{p.title}</div>
              <div className="text-slate-400 line-clamp-1">{p.text}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-4xl mx-auto w-full">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        const formattedTime = new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });

        return (
          <div
            key={msg.id || Math.random()}
            className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            {/* Assistant Avatar */}
            {!isUser && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/10 mt-1">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Message Bubble Container */}
            <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-600/15 rounded-tr-sm'
                    : 'glass-panel text-slate-100 border border-slate-800 shadow-md rounded-tl-sm'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                {/* Assistant Controls (Speak aloud & Copy) */}
                {!isUser && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/60 text-slate-400 text-xs">
                    <button
                      onClick={() => speak(msg.content)}
                      className="flex items-center gap-1 hover:text-sky-300 transition-colors cursor-pointer"
                      title="Read Aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Speak</span>
                    </button>
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="flex items-center gap-1 hover:text-sky-300 transition-colors ml-2 cursor-pointer"
                      title="Copy Response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[11px] text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-slate-500 mt-1 px-1">{formattedTime}</span>
            </div>

            {/* User Avatar */}
            {isUser && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        );
      })}

      {/* Thinking Skeleton */}
      {isAiLoading && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 animate-pulse mt-1">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="glass-panel px-4 py-3 rounded-2xl rounded-tl-sm border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.4s]" />
            <span className="text-xs text-slate-400 ml-1">AiRus is processing...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
