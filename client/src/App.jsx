import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import AiOrb from './components/AiOrb';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import ConversationDrawer from './components/ConversationDrawer';
import SettingsModal from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import { useAuth } from './context/AuthContext';
import { useVoice } from './context/VoiceContext';
import { api } from './services/api';

export default function App() {
  const { user } = useAuth();
  const {
    voiceState,
    isListening,
    transcript,
    isSpeaking,
    autoSpeak,
    continuousMode,
    settings,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    interrupt,
    recognitionError
  } = useVoice();

  // App UI State
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [appError, setAppError] = useState(null);

  // Modals & Drawers
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // PWA Prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // 1. Listen for PWA installation prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // 2. Fetch conversations when user logs in or switches
  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
      return;
    }

    try {
      const res = await api.listConversations();
      if (res.success) {
        setConversations(res.conversations);
        if (res.conversations.length > 0) {
          // Select most recent conversation if none is active
          setActiveConversationId(prev => prev || res.conversations[0].id);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.warn('[Load Conversations Failed]', err.message);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 3. Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId || !user) return;

    let isSubscribed = true;
    async function fetchMessages() {
      try {
        const res = await api.getConversation(activeConversationId);
        if (isSubscribed && res.success) {
          setMessages(res.messages || []);
        }
      } catch (err) {
        if (isSubscribed) {
          console.warn('[Fetch Messages Failed]', err.message);
        }
      }
    }

    fetchMessages();
    return () => {
      isSubscribed = false;
    };
  }, [activeConversationId, user]);

  // 4. Calculate actual AI Orb State strictly based on real system state
  const orbState = useMemo(() => {
    if (appError || recognitionError || voiceState === 'error') return 'error';
    if (isAiLoading || voiceState === 'processing') return 'thinking';
    if (isSpeaking || voiceState === 'speaking') return 'speaking';
    if (voiceState === 'transcribing') return 'transcribing';
    if (isListening || voiceState === 'listening') {
      return transcript ? 'transcribing' : 'listening';
    }
    return 'idle';
  }, [isAiLoading, isSpeaking, isListening, transcript, appError, recognitionError, voiceState]);

  // 5. Create New Conversation
  const handleNewConversation = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    try {
      const res = await api.createConversation('New Conversation');
      if (res.success && res.conversation) {
        setConversations(prev => [res.conversation, ...prev]);
        setActiveConversationId(res.conversation.id);
        setMessages([]);
      }
    } catch (err) {
      setAppError(err.message);
    }
  };

  // 6. Delete Conversation
  const handleDeleteConversation = async (id) => {
    try {
      const res = await api.deleteConversation(id);
      if (res.success) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConversationId === id) {
          const remaining = conversations.filter(c => c.id !== id);
          if (remaining.length > 0) {
            setActiveConversationId(remaining[0].id);
          } else {
            setActiveConversationId(null);
            setMessages([]);
          }
        }
      }
    } catch (err) {
      setAppError(err.message);
    }
  };

  // 7. Send Message Flow with Talkative Voice Continuity
  const handleSendMessage = async (text) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    setAppError(null);
    let targetConvId = activeConversationId;

    // Create a conversation if one doesn't exist yet
    if (!targetConvId) {
      try {
        const newConv = await api.createConversation(text.slice(0, 30));
        if (newConv.success && newConv.conversation) {
          targetConvId = newConv.conversation.id;
          setActiveConversationId(targetConvId);
          setConversations(prev => [newConv.conversation, ...prev]);
        } else {
          throw new Error('Failed to create new conversation');
        }
      } catch (err) {
        setAppError(err.message);
        return;
      }
    }

    // Optimistic user message insertion
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsAiLoading(true);

    try {
      const verbosity = settings?.verbosity || 'natural';
      const res = await api.sendMessage(targetConvId, text, { verbosity });

      if (res.success && res.assistantMessage) {
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempUserMsg.id),
          res.userMessage,
          res.assistantMessage
        ]);

        // Speak response aloud if auto-speak is enabled, passing continuous resume loop
        if (autoSpeak) {
          speak(res.assistantMessage.content, () => {
            // Triggered only if continuousMode is true and user hasn't interrupted
            if (continuousMode) {
              startListening((nextSpoken) => {
                if (nextSpoken && nextSpoken.trim()) {
                  handleSendMessage(nextSpoken.trim());
                }
              });
            }
          });
        }

        // Refresh conversation titles in drawer
        loadConversations();
      } else {
        throw new Error(res.error || 'Failed to receive AI response');
      }
    } catch (err) {
      setAppError(err.message || 'Error communicating with AiRus service.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // 8. Tapping Orb activates/interrupts Voice cleanly
  const handleOrbClick = () => {
    if (isSpeaking) {
      interrupt();
    } else if (isListening) {
      stopListening();
    } else {
      startListening((spokenText) => {
        if (spokenText && spokenText.trim()) {
          handleSendMessage(spokenText.trim());
        }
      });
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#090d16] text-slate-100 overflow-hidden select-none">
      
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-600/10 rounded-full filter blur-[100px]" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-[120px]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full filter blur-[120px]" />
      </div>

      {/* Main Navbar */}
      <Navbar
        onToggleDrawer={() => setDrawerOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        pwaInstallable={Boolean(deferredPrompt)}
        onInstallPwa={handleInstallPwa}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden max-w-5xl mx-auto w-full">
        
        {/* Animated AI Orb Centerpiece */}
        <div className="shrink-0 pt-2 pb-1 border-b border-slate-800/40">
          <AiOrb state={orbState} onClick={handleOrbClick} />
        </div>

        {/* Global Error Banner */}
        {appError && (
          <aside
            aria-label="Application alert"
            className="mx-4 mt-2 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between"
          >
            <span>{appError}</span>
            <button
              onClick={() => setAppError(null)}
              className="text-rose-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
            >
              Dismiss
            </button>
          </aside>
        )}

        {/* Conversation Message List */}
        <MessageList
          messages={messages}
          onPromptClick={handleSendMessage}
          isAiLoading={isAiLoading}
        />

        {/* Voice and Text Input Area */}
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!user}
          isAiLoading={isAiLoading}
        />

      </main>

      {/* Conversation Drawer / History */}
      <ConversationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
      />

      {/* PWA Android Install Banner */}
      <PwaInstallPrompt
        deferredPrompt={deferredPrompt}
        onInstall={handleInstallPwa}
        onDismiss={() => setDeferredPrompt(null)}
      />

    </div>
  );
}
