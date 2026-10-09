import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function PwaInstallPrompt({ deferredPrompt, onInstall, onDismiss }) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Only show if prompt is available and not dismissed in this session
    if (deferredPrompt && !sessionStorage.getItem('airus_pwa_dismissed')) {
      setShowBanner(true);
    }
  }, [deferredPrompt]);

  if (!showBanner) return null;

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('airus_pwa_dismissed', 'true');
    if (onDismiss) onDismiss();
  };

  return (
    <aside
      aria-label="App installation prompt"
      className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 p-3 rounded-2xl glass-panel border border-sky-500/30 shadow-2xl flex items-center justify-between gap-3 animate-fade-in"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="font-semibold text-xs text-slate-100">Install AiRus on your phone</h4>
          <p className="text-[11px] text-slate-400">Add to home screen for instant voice access.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => {
            onInstall();
            setShowBanner(false);
          }}
          className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
