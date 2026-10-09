import React from 'react';
import { Menu, Settings, LogOut, User, Sparkles, Download, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';

export default function Navbar({
  onToggleDrawer,
  onOpenSettings,
  onOpenAuth,
  pwaInstallable,
  onInstallPwa
}) {
  const { user, logout } = useAuth();
  const { selectedLanguage, isSpeaking, stopSpeaking } = useVoice();

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800/80 px-4 py-2.5 safe-top">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Left: Drawer Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDrawer}
            aria-label="Toggle Conversation History"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-wide bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  AiRus
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/50">
                  Voice
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Active Speaking Indicator with quick mute */}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-medium hover:bg-emerald-900/60 transition-all cursor-pointer animate-pulse"
              title="Stop Voice Playback"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Speaking</span>
            </button>
          )}

          {/* Active Language Badge */}
          <button
            onClick={onOpenSettings}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-pill text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>{selectedLanguage.label}</span>
          </button>

          {/* PWA Install Button */}
          {pwaInstallable && (
            <button
              onClick={onInstallPwa}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/40 text-sky-300 hover:bg-sky-500/20 text-xs font-medium transition-colors cursor-pointer"
              title="Install AiRus as an Android / Desktop App"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User Auth Info */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-200">{user.name}</span>
                <span className="text-[10px] text-slate-400">{user.email}</span>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
