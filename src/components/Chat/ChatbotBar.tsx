import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Send,
  ChevronDown,
  Sparkles,
  Bot,
  User,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BOUNCY_SPRING } from '../../theme';
import { ChatMessage } from '../../types';

export const ChatbotBar: React.FC = () => {
  const {
    language,
    activeTab,
    latestDiagnosis,
    evaluatedSprayWindow,
    isChatOpen,
    setIsChatOpen,
  } = useApp();

  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am Sylva, your agricultural agronomist and crop pathologist. Ask me any question about crop health, treatment plans, IPM recovery steps, or spray weather.',
      timestamp: Date.now(),
    },
  ]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  // Setup Web Speech API Recognition for voice STT (typing assistance only, NO TTS)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      // Set language code based on current language
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
          setSpeechError(`Voice input: ${event.error}`);
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
        setSpeechError('Speech recognition is not supported in this browser.');
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
      // Build context for real Gemini AI model
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
      // Fallback response if offline or server is temporarily unreachable
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
      ? `How to treat ${latestDiagnosis.conditionName}?`
      : 'What diseases affect Paddy (धान) and Cotton (कपास) right now?',
    evaluatedSprayWindow
      ? `Is it safe to spray during ${evaluatedSprayWindow.bestWindowTime}?`
      : 'What is the optimal spray window for foliar fungicides?',
    'What organic IPM remedies work best for leaf curl and blight?',
  ];

  return (
    <>
      {/* Backdrop to close chat when clicking outside */}
      {isChatOpen && (
        <div
          onClick={() => setIsChatOpen(false)}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity"
          aria-label="Close Chat Backdrop"
        />
      )}

      <div className="fixed bottom-20 md:bottom-4 left-0 right-0 z-40 pointer-events-none flex flex-col items-center px-3 sm:px-6">
        {/* Expanded Chat Drawer */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={BOUNCY_SPRING}
              className="pointer-events-auto w-full max-w-2xl mb-3 rounded-3xl border border-white/90 bg-[#EFF4F2]/98 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden max-h-[72vh] sm:max-h-[64vh]"
            >
              {/* Drawer Header with Prominent Close Down-Arrow */}
              <div className="p-4 px-5 border-b border-[#A5C9BC]/35 flex items-center justify-between bg-[#DDEBE5]/85">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#34796E] text-[#EFF4F2] flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#203A37] flex items-center gap-2">
                      <span>Sylva Agronomist AI</span>
                    </div>
                    <div className="text-[11px] text-[#648078] truncate max-w-xs">
                      {latestDiagnosis
                        ? `Context: ${latestDiagnosis.cropName} • ${latestDiagnosis.conditionName}`
                        : 'Expert agronomist guidance & IPM action plans'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Clear chat */}
                  <button
                    onClick={() => setMessages([messages[0]])}
                    className="p-1.5 rounded-lg border border-white/80 bg-white/70 text-[#648078] hover:text-[#203A37] cursor-pointer transition-colors"
                    title="Reset conversation"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* PROMINENT CLOSE / MINIMIZE DOWN ARROW BUTTON */}
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#34796E]/30 bg-white hover:bg-[#EFF4F2] text-[#203A37] text-xs font-bold cursor-pointer transition-all shadow-xs"
                    title="Close and minimize chatbar"
                    aria-label="Close and minimize chatbar"
                  >
                    <ChevronDown className="w-4 h-4 text-[#34796E]" />
                    <span>Close</span>
                  </button>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[190px]">
                {messages.map((m) => {
                  const isAssistant = m.role === 'assistant';
                  return (
                    <div
                      key={m.id}
                      className={`flex items-start gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                    >
                      {isAssistant && (
                        <div className="w-6 h-6 rounded-lg bg-[#34796E]/12 text-[#34796E] flex items-center justify-center shrink-0 mt-1">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                          isAssistant
                            ? 'bg-white border border-white/80 text-[#203A37]'
                            : 'bg-[#34796E] text-[#EFF4F2]'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>

                      {!isAssistant && (
                        <div className="w-6 h-6 rounded-lg bg-[#203A37]/10 text-[#203A37] flex items-center justify-center shrink-0 mt-1">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {isSending && (
                  <div className="flex items-center gap-2 text-xs text-[#648078] p-2">
                    <Bot className="w-4 h-4 text-[#34796E] animate-pulse" />
                    <span>Sylva is analyzing agronomic guidelines...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Contextual Quick Suggestions */}
              <div className="px-4 py-2 border-t border-[#A5C9BC]/25 flex items-center gap-1.5 overflow-x-auto bg-[#EFF4F2]/50 no-scrollbar">
                <span className="text-[10px] font-bold text-[#648078] uppercase shrink-0">
                  Suggested:
                </span>
                {quickPrompts.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="px-2.5 py-1 rounded-full bg-white border border-white/80 text-[11px] text-[#203A37] hover:border-[#34796E]/50 shrink-0 cursor-pointer shadow-2xs transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Dedicated minimize strip right above bottom bar */}
              <button
                onClick={() => setIsChatOpen(false)}
                className="w-full py-1.5 bg-[#DDEBE5]/50 hover:bg-[#DDEBE5] text-[11px] font-semibold text-[#648078] hover:text-[#203A37] flex items-center justify-center gap-1 border-t border-[#A5C9BC]/20 cursor-pointer transition-colors"
                title="Minimize chatbar"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Minimize chat window</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FLOATING BOTTOM BAR */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={BOUNCY_SPRING}
          className="pointer-events-auto w-full max-w-2xl"
        >
          <div
            className={`relative rounded-2xl sm:rounded-3xl border border-white/90 bg-[#EFF4F2]/95 backdrop-blur-xl shadow-xl p-2 sm:p-2.5 transition-all duration-200 flex items-center gap-2 ${
              isListening ? 'ring-2 ring-[#34796E] bg-[#DDEBE5]/95' : ''
            }`}
          >
            {/* Sylva Avatar & Expand/Collapse Trigger */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/60 transition-colors cursor-pointer shrink-0"
              title={isChatOpen ? 'Minimize chat' : 'Open agronomist chat'}
            >
              <div className="relative w-8 h-8 rounded-xl bg-[#34796E] text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#203A37] hidden sm:inline">
                Sylva
              </span>
              {isChatOpen ? (
                <ChevronDown className="w-4 h-4 text-[#34796E]" />
              ) : null}
            </button>

            {/* Input box */}
            <div className="flex-1 relative flex items-center min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (!isChatOpen) setIsChatOpen(true);
                }}
                placeholder={
                  isListening
                    ? 'Listening to speech...'
                    : latestDiagnosis
                    ? `Ask about ${latestDiagnosis.cropName} treatment or spray...`
                    : 'Ask about crop care, disease diagnosis, or spray timing...'
                }
                className="w-full px-3 py-2 text-xs sm:text-sm bg-transparent border-0 focus:outline-none text-[#203A37] placeholder-[#648078] truncate"
              />

              {isListening && (
                <span className="absolute right-2 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34796E] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#34796E]" />
                </span>
              )}
            </div>

            {/* Action buttons: Voice STT Dictate, Close down-arrow if open, Send */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Voice Speech-to-Text Dictation Button */}
              <motion.button
                onClick={toggleListening}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className={`p-2 sm:px-3 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs ${
                  isListening
                    ? 'bg-[#34796E] text-white border-[#34796E]'
                    : 'bg-white/80 text-[#34796E] border-white/90 hover:bg-white'
                }`}
                title={isListening ? 'Stop voice input' : 'Dictate question with microphone'}
              >
                {isListening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                <span className="text-xs font-semibold hidden md:inline">
                  {isListening ? 'Stop' : 'Voice'}
                </span>
              </motion.button>

              {/* Down arrow button to close if chat is open */}
              {isChatOpen && (
                <motion.button
                  onClick={() => setIsChatOpen(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  className="p-2 sm:px-2.5 rounded-xl border border-white/90 bg-white hover:bg-[#DDEBE5] text-[#203A37] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title="Close chatbar"
                  aria-label="Close chatbar"
                >
                  <ChevronDown className="w-4 h-4 text-[#34796E]" />
                  <span className="text-xs font-semibold hidden sm:inline">Close</span>
                </motion.button>
              )}

              {/* Send Button */}
              <motion.button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isSending}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className={`p-2 sm:p-2.5 rounded-xl cursor-pointer transition-all shadow-xs ${
                  inputMessage.trim() && !isSending
                    ? 'bg-[#34796E] text-white hover:bg-[#2c655c]'
                    : 'bg-white/50 text-[#648078]/40 border border-white/60 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {speechError && (
            <div className="text-[11px] text-[#A8423F] font-medium text-center pt-1">
              {speechError}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};
