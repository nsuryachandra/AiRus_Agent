import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Volume2, Cpu, AlertCircle, Sparkles } from 'lucide-react';

const STATE_CONFIGS = {
  idle: {
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.45)',
    label: 'Ready — Speak or Type',
    icon: Sparkles,
    scale: [1, 1.05, 1],
    duration: 4
  },
  listening: {
    color: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.65)',
    label: 'Listening...',
    icon: Mic,
    scale: [1, 1.18, 1.05, 1.22, 1],
    duration: 1.6
  },
  transcribing: {
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.6)',
    label: 'Transcribing Audio...',
    icon: Mic,
    scale: [1.02, 1.1, 1.02],
    duration: 1.2
  },
  thinking: {
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.65)',
    label: 'AiRus is thinking...',
    icon: Cpu,
    scale: [1, 1.12, 0.98, 1.08, 1],
    duration: 2.2
  },
  speaking: {
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.65)',
    label: 'Speaking...',
    icon: Volume2,
    scale: [1, 1.14, 1.03, 1.16, 1],
    duration: 1.4
  },
  error: {
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.6)',
    label: 'Action Failed',
    icon: AlertCircle,
    scale: [1, 1.08, 1],
    duration: 1
  }
};

export default function AiOrb({ state = 'idle', onClick }) {
  const current = STATE_CONFIGS[state] || STATE_CONFIGS.idle;
  const IconComponent = current.icon;

  return (
    <div className="flex flex-col items-center justify-center select-none py-4">
      {/* Interactive Centerpiece Container */}
      <button
        onClick={onClick}
        type="button"
        aria-label={`AiRus status: ${current.label}. Tap to toggle mic.`}
        className="relative flex items-center justify-center w-36 h-36 md:w-44 md:h-44 group cursor-pointer focus:outline-none"
      >
        {/* Outermost Diffused Ambient Halo */}
        <motion.div
          animate={{
            scale: current.scale,
            boxShadow: `0 0 50px 15px ${current.glow}`
          }}
          transition={{
            repeat: Infinity,
            duration: current.duration,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-full opacity-60 filter blur-xl"
        />

        {/* Outer Orbiting Broken Ring */}
        <motion.div
          animate={{
            rotate: 360
          }}
          transition={{
            repeat: Infinity,
            duration: state === 'thinking' ? 4 : 16,
            ease: "linear"
          }}
          className="absolute inset-2 rounded-full border border-dashed opacity-40"
          style={{ borderColor: current.color }}
        />

        {/* Middle Pulse Ring */}
        <motion.div
          animate={{
            scale: [0.95, 1.08, 0.95],
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{
            repeat: Infinity,
            duration: current.duration * 0.75,
            ease: "easeInOut"
          }}
          className="absolute inset-4 rounded-full border border-slate-700/60"
        />

        {/* Central Core Sphere */}
        <motion.div
          animate={{
            scale: current.scale
          }}
          transition={{
            repeat: Infinity,
            duration: current.duration,
            ease: "easeInOut"
          }}
          className="relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 overflow-hidden"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${current.color} 0%, #1e1b4b 65%, #090d16 100%)`,
            boxShadow: `inset 0 0 20px rgba(255,255,255,0.4), 0 0 35px ${current.glow}`
          }}
        >
          {/* Internal Shimmer Wave */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

          {/* Active Audio Waveform bars if speaking or listening */}
          {(state === 'speaking' || state === 'listening') ? (
            <div className="flex items-center gap-1 z-10">
              <span className="w-1 bg-white rounded-full animate-wave-1" />
              <span className="w-1 bg-white rounded-full animate-wave-2" />
              <span className="w-1 bg-white rounded-full animate-wave-3" />
              <span className="w-1 bg-white rounded-full animate-wave-4" />
              <span className="w-1 bg-white rounded-full animate-wave-5" />
            </div>
          ) : (
            <IconComponent className="w-8 h-8 text-white/90 drop-shadow-md z-10 transition-transform group-hover:scale-110" />
          )}
        </motion.div>
      </button>

      {/* Dynamic Status Label */}
      <motion.div
        key={state}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-xs font-medium tracking-wide"
        style={{ color: current.color }}
      >
        <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: current.color }} />
        <span>{current.label}</span>
      </motion.div>
    </div>
  );
}
