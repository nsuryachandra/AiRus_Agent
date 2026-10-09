import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AiOrb from '../src/components/AiOrb';
import MessageList from '../src/components/MessageList';
import Navbar from '../src/components/Navbar';
import { AuthProvider } from '../src/context/AuthContext';
import { VoiceProvider } from '../src/context/VoiceContext';

// Mock Web Speech API and matchMedia for testing environment
global.SpeechSynthesisUtterance = vi.fn();
global.speechSynthesis = {
  getVoices: vi.fn().mockReturnValue([]),
  speak: vi.fn(),
  cancel: vi.fn()
};

describe('AiRus Frontend Component Test Suite', () => {
  describe('1. AiOrb Component State Responses', () => {
    it('Renders idle state correctly', () => {
      render(<AiOrb state="idle" />);
      expect(screen.getByText(/Ready — Speak or Type/i)).toBeDefined();
    });

    it('Renders listening state correctly', () => {
      render(<AiOrb state="listening" />);
      expect(screen.getByText(/Listening.../i)).toBeDefined();
    });

    it('Renders transcribing state correctly', () => {
      render(<AiOrb state="transcribing" />);
      expect(screen.getByText(/Transcribing Audio.../i)).toBeDefined();
    });

    it('Renders thinking state correctly', () => {
      render(<AiOrb state="thinking" />);
      expect(screen.getByText(/AiRus is thinking.../i)).toBeDefined();
    });

    it('Renders speaking state correctly', () => {
      render(<AiOrb state="speaking" />);
      expect(screen.getByText(/Speaking.../i)).toBeDefined();
    });

    it('Renders error state correctly', () => {
      render(<AiOrb state="error" />);
      expect(screen.getByText(/Action Failed/i)).toBeDefined();
    });
  });

  describe('2. MessageList Component', () => {
    it('Renders welcoming empty state when no messages exist', () => {
      render(
        <VoiceProvider>
          <MessageList messages={[]} onPromptClick={vi.fn()} isAiLoading={false} />
        </VoiceProvider>
      );
      expect(screen.getByText(/Welcome back, Boss./i)).toBeDefined();
      expect(screen.getByText(/Briefing/i)).toBeDefined();
      expect(screen.getByText(/Telugu Prompt/i)).toBeDefined();
    });

    it('Renders user and assistant messages properly', () => {
      const sampleMessages = [
        { id: '1', role: 'user', content: 'Good morning AiRus', created_at: new Date().toISOString() },
        { id: '2', role: 'assistant', content: 'Good morning Boss! Ready when you are.', created_at: new Date().toISOString() }
      ];

      render(
        <VoiceProvider>
          <MessageList messages={sampleMessages} onPromptClick={vi.fn()} isAiLoading={false} />
        </VoiceProvider>
      );

      expect(screen.getByText('Good morning AiRus')).toBeDefined();
      expect(screen.getByText('Good morning Boss! Ready when you are.')).toBeDefined();
      expect(screen.getByText('Speak')).toBeDefined();
      expect(screen.getByText('Copy')).toBeDefined();
    });
  });

  describe('3. Navbar Component', () => {
    it('Renders branding and sign in button for unauthenticated users', () => {
      render(
        <AuthProvider>
          <VoiceProvider>
            <Navbar
              onToggleDrawer={vi.fn()}
              onOpenSettings={vi.fn()}
              onOpenAuth={vi.fn()}
              pwaInstallable={false}
              onInstallPwa={vi.fn()}
            />
          </VoiceProvider>
        </AuthProvider>
      );

      expect(screen.getByText('AiRus')).toBeDefined();
      expect(screen.getByText('Sign In')).toBeDefined();
    });
  });
});
