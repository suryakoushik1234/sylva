import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Send,
  X,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Tag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ASSISTANT_SPRING } from '../../theme';
import { ChatMessage } from '../../types';

export const ChatbotBar: React.FC = () => {
  const {
    language,
    activeTab,
    latestDiagnosis,
    setLatestDiagnosis,
    evaluatedSprayWindow,
    isChatOpen,
    setIsChatOpen,
    pendingChatPrompt,
    setPendingChatPrompt,
  } = useApp();

  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am Sylva, your agricultural agronomist and crop pathologist. Ask me any question about crop symptoms, IPM treatment plans, organic remedies, or optimal spraying weather.',
      timestamp: Date.now(),
    },
  ]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // First-time visit "Ask Sylva" pill hint (auto-dismiss after 4 seconds or on click)
  const [showHint, setShowHint] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return !localStorage.getItem('sylva_chat_hint_dismissed_v1');
      } catch {
        return false;
      }
    }
    return false;
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-dismiss hint after 4s
  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => {
        dismissHint();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showHint]);

  const dismissHint = () => {
    setShowHint(false);
    try {
      localStorage.setItem('sylva_chat_hint_dismissed_v1', 'true');
    } catch {}
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  // Close chat on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChatOpen) {
        setIsChatOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen, setIsChatOpen]);

  // Handle external pending prompt (e.g. from diagnosis card "Ask Sylva about this")
  useEffect(() => {
    if (pendingChatPrompt && isChatOpen) {
      const prompt = pendingChatPrompt;
      setPendingChatPrompt(null);
      handleSendMessage(prompt);
    }
  }, [pendingChatPrompt, isChatOpen]);

  // Setup Web Speech API Recognition for voice STT (typing assistance only, NO TTS)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      const langCodes: Record<string, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        te: 'te-IN',
        kn: 'kn-IN',
      };
      recognition.lang = langCodes[language] || 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setInputMessage(transcript);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition error:', event.error);
          setSpeechError(`Voice: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        setSpeechError('Microphone speech recognition is not supported in this browser.');
        return;
      }
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        console.warn('Speech start error:', err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      const contextPayload: any = {
        activeTab,
      };

      if (latestDiagnosis) {
        contextPayload.diagnosis = {
          cropName: latestDiagnosis.cropName,
          conditionName: latestDiagnosis.conditionName,
          severity: latestDiagnosis.severity,
          urgency: latestDiagnosis.urgency,
          today_steps: latestDiagnosis.today_steps,
          actions: latestDiagnosis.actions,
        };
      }

      if (evaluatedSprayWindow) {
        contextPayload.sprayWindow = {
          title: evaluatedSprayWindow.bestWindowTime,
          status: evaluatedSprayWindow.status,
          wind: `${evaluatedSprayWindow.currentWind} km/h`,
          rain: evaluatedSprayWindow.currentRainRisk,
          location: evaluatedSprayWindow.locationName,
        };
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: contextPayload,
          language,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText =
          data.reply ||
          'Inspect foliage in calm early morning hours, prune infected leaves, and follow product label instructions and local KVK guidance.';
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: replyText,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error('Chat service unavailable');
      }
    } catch {
      const fallbackReply = latestDiagnosis
        ? `For ${latestDiagnosis.cropName} showing ${latestDiagnosis.conditionName}, prioritize cultural sanitation: safely prune diseased leaves away from the plot. Always check the chemical label and verify with your local agricultural officer / Krishi Vigyan Kendra (KVK).`
        : 'To evaluate your crop, capture or upload a leaf photo in the Scan tab, and I will identify the pathogen and prescribe an IPM treatment schedule.';

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: fallbackReply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    latestDiagnosis
      ? `Why this treatment for ${latestDiagnosis.cropName}?`
      : 'What foliar diseases are common right now?',
    evaluatedSprayWindow
      ? `When should I spray in ${evaluatedSprayWindow.locationName}?`
      : 'What is the optimal spray window for foliar fungicides?',
    'Can I use neem oil or bio-fungicide safely?',
  ];

  return (
    <>
      {/* Backdrop scrim to close chat when clicking outside */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsChatOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity cursor-pointer"
            aria-label="Close assistant backdrop"
          />
        )}
      </AnimatePresence>

      {/* Floating Container: Anchored bottom-right */}
      <div
        className="fixed z-50 pointer-events-none flex flex-col items-end right-4 sm:right-6"
        style={{
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Expanded Assistant Panel */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={ASSISTANT_SPRING}
              className="pointer-events-auto fixed sm:absolute inset-x-2 bottom-0 sm:bottom-16 sm:right-0 sm:left-auto w-auto sm:w-[380px] max-h-[85vh] sm:max-h-[70vh] rounded-t-[28px] sm:rounded-[28px] border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] backdrop-blur-[24px] shadow-[var(--glass-shadow-elevated)] flex flex-col overflow-hidden mb-2 z-50"
            >
              {/* Header */}
              <div className="p-4 px-5 border-b border-[var(--glass-border-subtle)] flex items-center justify-between bg-[var(--surface-glass)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--primary-accent)] text-[var(--text-on-accent)] flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        Sylva
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[var(--status-good)]/15 text-[var(--status-good)] text-[10px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-good)] animate-pulse" />
                        Ready
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      Agronomist AI · Field Pathologist
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setMessages([messages[0]])}
                    className="p-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-glass)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                    title="Reset conversation"
                    aria-label="Reset conversation"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-glass)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                    title="Close assistant"
                    aria-label="Close assistant"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Diagnosis Context Indicator Pill */}
              {latestDiagnosis && (
                <div className="px-4 py-2 border-b border-[var(--glass-border-subtle)] bg-[var(--surface-glass)]/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Tag className="w-3 h-3 text-[var(--primary-accent)] shrink-0" />
                    <span className="text-[11px] font-medium text-[var(--text-secondary)] truncate">
                      Context:{' '}
                      <strong className="text-[var(--text-primary)] font-semibold">
                        {latestDiagnosis.cropName} · {latestDiagnosis.conditionName}
                      </strong>
                    </span>
                  </div>
                  <button
                    onClick={() => setLatestDiagnosis(null)}
                    className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline shrink-0 cursor-pointer"
                    title="Clear crop context"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[220px]">
                {messages.map((m) => {
                  const isAssistant = m.role === 'assistant';
                  return (
                    <div
                      key={m.id}
                      className={`flex items-start gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                    >
                      {isAssistant && (
                        <div className="w-6 h-6 rounded-lg bg-[var(--primary-accent)]/15 text-[var(--primary-accent)] flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                          isAssistant
                            ? 'bg-[var(--surface-glass)] border border-[var(--glass-border)] text-[var(--text-primary)]'
                            : 'bg-[var(--primary-accent)] text-[var(--text-on-accent)] font-medium'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>

                      {!isAssistant && (
                        <div className="w-6 h-6 rounded-lg bg-[var(--surface-highlight)]/30 text-[var(--text-primary)] flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {isSending && (
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] p-2">
                    <Bot className="w-4 h-4 text-[var(--primary-accent)] animate-pulse" />
                    <span>Sylva is formulating agronomist advice...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Contextual Suggestion Chips */}
              <div className="px-3.5 py-2 border-t border-[var(--glass-border-subtle)] flex items-center gap-1.5 overflow-x-auto bg-[var(--surface-glass)]/40 no-scrollbar">
                {quickPrompts.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="px-2.5 py-1 rounded-full bg-[var(--surface-glass)] border border-[var(--glass-border)] text-[11px] text-[var(--text-primary)] hover:border-[var(--primary-accent)] shrink-0 cursor-pointer shadow-2xs transition-all whitespace-nowrap"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="p-3 border-t border-[var(--glass-border)] bg-[var(--surface-glass)] flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isListening
                      ? 'Listening to speech...'
                      : latestDiagnosis
                      ? `Ask about ${latestDiagnosis.cropName}...`
                      : 'Ask about crop care, treatments, or spray...'
                  }
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-transparent border-0 focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] min-w-0"
                />

                {/* Voice Speech-to-Text Button */}
                <button
                  onClick={toggleListening}
                  className={`p-2 rounded-xl border flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-2xs ${
                    isListening
                      ? 'bg-[var(--status-poor)] text-white border-transparent animate-pulse'
                      : 'bg-[var(--surface-glass-elevated)] text-[var(--primary-accent)] border-[var(--glass-border)] hover:bg-[var(--surface-glass)]'
                  }`}
                  title={isListening ? 'Stop voice input' : 'Speak your question'}
                  aria-label="Voice speech to text"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Send Button */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isSending}
                  className={`p-2 rounded-xl cursor-pointer transition-all shrink-0 shadow-xs flex items-center justify-center ${
                    inputMessage.trim() && !isSending
                      ? 'bg-[var(--primary-accent)] text-[var(--text-on-accent)] hover:opacity-90'
                      : 'bg-[var(--glass-border-subtle)] text-[var(--text-secondary)] opacity-50 cursor-not-allowed'
                  }`}
                  title="Send message"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {speechError && (
                <div className="text-[10px] text-[var(--status-poor)] text-center py-1 bg-[var(--surface-glass)]">
                  {speechError}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB (Collapsed Floating Action Button) */}
        <div className="pointer-events-auto relative flex items-center gap-2">
          {/* First-time "Ask Sylva" dismissible hint pill */}
          <AnimatePresence>
            {showHint && !isChatOpen && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.9 }}
                transition={ASSISTANT_SPRING}
                onClick={() => {
                  dismissHint();
                  setIsChatOpen(true);
                }}
                className="cursor-pointer px-3 py-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] backdrop-blur-md shadow-md text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 hover:scale-105 transition-transform"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--primary-accent)]" />
                <span>Ask Sylva</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissHint();
                  }}
                  className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 56×56px Action Button with Liquid Glass Highlight & Breathing Glow */}
          <div className="relative w-14 h-14">
            {!isChatOpen && (
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl sm:rounded-3xl sylva-fab-pulse pointer-events-none -z-10"
              />
            )}
            <motion.button
              onClick={() => {
                if (showHint) dismissHint();
                setIsChatOpen(!isChatOpen);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              className="w-14 h-14 rounded-2xl sm:rounded-3xl border border-[var(--glass-border)] bg-[var(--primary-accent)] text-[var(--text-on-accent)] shadow-[var(--glass-shadow-elevated)] flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent)]"
              title={isChatOpen ? 'Close Sylva assistant' : 'Ask Sylva Agronomist AI'}
              aria-label="Toggle Sylva Assistant"
              aria-expanded={isChatOpen}
            >
              {isChatOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Sparkles className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
};
