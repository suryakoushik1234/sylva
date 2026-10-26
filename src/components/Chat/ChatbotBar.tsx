import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  ChevronDown,
  Sparkles,
  Bot,
  User,
  X,
  RotateCcw,
  Check,
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
        'Hello! I am Sylva, your crop health and spray advisory agronomist. Ask me any question or use voice control.',
      timestamp: Date.now(),
    },
  ]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  // Setup Web Speech API Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      // Set language code based on current language
      const langCodes: Record<string, string> = {
        en: 'en-US',
        hi: 'hi-IN',
        te: 'te-IN',
        kn: 'kn-IN',
      };
      recognition.lang = langCodes[language] || 'en-US';

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
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setSpeechError(`Voice error: ${event.error}`);
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
      stopVoiceSpeech();
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
        stopVoiceSpeech();
        recognitionRef.current.start();
      } catch (err: any) {
        console.warn('Speech start error:', err);
      }
    }
  };

  const stopVoiceSpeech = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const speakText = (text: string) => {
    if (!voiceSpeechEnabled) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    stopVoiceSpeech();

    // Clean markdown/symbols for clean spoken synthesis
    const cleanText = text
      .replace(/[*#_`]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langCodes: Record<string, string> = {
      en: 'en-US',
      hi: 'hi-IN',
      te: 'te-IN',
      kn: 'kn-IN',
    };
    utterance.lang = langCodes[language] || 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
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
      // Build context for Gemini
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
        };
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-5).map((m) => ({
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
          'Always prioritize sanitation and inspect leaves in the calm early morning hours.';
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: replyText,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        speakText(replyText);
      } else {
        throw new Error('Chat service unavailable');
      }
    } catch {
      // Fallback offline / network response
      const fallbackReply = latestDiagnosis
        ? `For ${latestDiagnosis.cropName} affected by ${latestDiagnosis.conditionName}, prioritize cultural sanitation first: prune and discard infected leaves. Always follow container safety labels and verify with your local agricultural extension office or KVK.`
        : 'To help best, please photograph or upload a leaf on the Scan tab, and I will analyze the symptoms and current spray conditions.';

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: fallbackReply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      speakText(fallbackReply);
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
      : 'What diseases affect tomatoes right now?',
    evaluatedSprayWindow
      ? `Is it safe to spray during ${evaluatedSprayWindow.bestWindowTime}?`
      : 'When is the best time of day to spray?',
    'What organic remedies are safest for foliar mold?',
  ];

  return (
    <div className="fixed bottom-20 md:bottom-4 left-0 right-0 z-40 pointer-events-none flex flex-col items-center px-3 sm:px-6">
      {/* Expanded Chat Drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={BOUNCY_SPRING}
            className="pointer-events-auto w-full max-w-2xl mb-3 rounded-3xl border border-white/90 bg-[#EFF4F2]/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden max-h-[70vh] sm:max-h-[60vh]"
          >
            {/* Drawer Header */}
            <div className="p-4 px-5 border-b border-[#A5C9BC]/35 flex items-center justify-between bg-[#DDEBE5]/70">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#34796E] text-[#EFF4F2] flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#203A37] flex items-center gap-2">
                    <span>Sylva Agronomist Live Voice &amp; Chat</span>
                    {isSpeaking && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#34796E] font-medium animate-pulse">
                        <Volume2 className="w-3 h-3" />
                        Speaking...
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#648078] truncate max-w-xs">
                    {latestDiagnosis
                      ? `Active Context: ${latestDiagnosis.cropName} • ${latestDiagnosis.conditionName}`
                      : 'Grounded in plant pathology & IPM guidelines'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Voice speech toggle */}
                <button
                  onClick={() => {
                    if (isSpeaking) stopVoiceSpeech();
                    setVoiceSpeechEnabled(!voiceSpeechEnabled);
                  }}
                  className={`p-1.5 rounded-lg border border-white/80 transition-colors cursor-pointer ${
                    voiceSpeechEnabled
                      ? 'bg-[#34796E]/12 text-[#34796E]'
                      : 'bg-white/60 text-[#648078]'
                  }`}
                  title={voiceSpeechEnabled ? 'Spoken voice enabled' : 'Mute voice responses'}
                >
                  {voiceSpeechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* Clear chat */}
                <button
                  onClick={() => {
                    stopVoiceSpeech();
                    setMessages([messages[0]]);
                  }}
                  className="p-1.5 rounded-lg border border-white/80 bg-white/60 text-[#648078] hover:text-[#203A37] cursor-pointer"
                  title="Reset conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Minimize drawer */}
                <button
                  onClick={() => {
                    stopVoiceSpeech();
                    setIsChatOpen(false);
                  }}
                  className="p-1.5 rounded-lg border border-white/80 bg-white/60 text-[#648078] hover:text-[#203A37] cursor-pointer"
                  title="Close chat drawer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message History */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[180px]">
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

                      {isAssistant && (
                        <div className="pt-1.5 flex items-center justify-between text-[10px] text-[#648078]">
                          <button
                            onClick={() => speakText(m.content)}
                            className="inline-flex items-center gap-1 hover:text-[#34796E] cursor-pointer"
                            title="Read aloud"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Listen</span>
                          </button>
                        </div>
                      )}
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
                  <span>Sylva is consulting pathology guidelines...</span>
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
          className={`relative rounded-2xl sm:rounded-3xl border border-white/90 bg-[#EFF4F2]/90 backdrop-blur-xl shadow-xl p-2 sm:p-2.5 transition-all duration-200 flex items-center gap-2 ${
            isListening ? 'ring-2 ring-[#34796E] bg-[#DDEBE5]/95' : ''
          }`}
        >
          {/* Sylva Avatar & Expand Trigger */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/60 transition-colors cursor-pointer shrink-0"
            title="Expand agronomist chat"
          >
            <div className="relative w-8 h-8 rounded-xl bg-[#34796E] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
              {isSpeaking && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#A5C9BC] ring-2 ring-white animate-ping" />
              )}
            </div>
            <span className="text-xs font-bold text-[#203A37] hidden sm:inline">
              Sylva
            </span>
          </button>

          {/* Voice Listening indicator or input box */}
          <div className="flex-1 relative flex items-center min-w-0">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (!isChatOpen) setIsChatOpen(true);
              }}
              placeholder={
                isListening
                  ? 'Listening to your voice...'
                  : latestDiagnosis
                  ? `Ask about ${latestDiagnosis.cropName} treatment or spray...`
                  : 'Ask about crop disease, spray windows, or care...'
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

          {/* Action buttons: Live Mic, Voice Toggle, Send */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Mic Button (Web Speech API) */}
            <motion.button
              onClick={toggleListening}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              className={`p-2 sm:px-3 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs ${
                isListening
                  ? 'bg-[#34796E] text-white border-[#34796E]'
                  : 'bg-white/80 text-[#34796E] border-white/90 hover:bg-white'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice speech-to-text'}
            >
              {isListening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
              <span className="text-xs font-semibold hidden md:inline">
                {isListening ? 'Stop' : 'Voice'}
              </span>
            </motion.button>

            {/* Voice Reply Toggle */}
            <button
              onClick={() => {
                if (isSpeaking) stopVoiceSpeech();
                setVoiceSpeechEnabled(!voiceSpeechEnabled);
              }}
              className={`p-2 rounded-xl border border-white/80 hidden sm:flex items-center justify-center transition-colors cursor-pointer shadow-2xs ${
                voiceSpeechEnabled
                  ? 'bg-white/80 text-[#34796E]'
                  : 'bg-white/40 text-[#648078]'
              }`}
              title={voiceSpeechEnabled ? 'Spoken replies ON' : 'Spoken replies OFF'}
            >
              {voiceSpeechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

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
  );
};
