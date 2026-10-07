import React, { useState, useRef, useEffect } from 'react';
import * as api from '../services/api';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Minimize2 } from 'lucide-react';

const STARTER_QUESTIONS = [
  'Should I buy now or wait?',
  'What\'s the best deal today?',
  'Which products are at lowest price?',
  'When is the best time to buy electronics?',
];

const TypingDots = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    <span className="h-2 w-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <span className="h-2 w-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <span className="h-2 w-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

const AIChatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'ai',
      text: '👋 Hi! I\'m **SmartBot**, your AI shopping assistant powered by Groq AI.\n\nAsk me anything about prices, deals, or when to buy! 🛒',
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [showStarters, setShowStarters] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || thinking) return;

    setInput('');
    setShowStarters(false);

    // Add user message
    const userMsg = { id: Date.now(), role: 'user', text: messageText, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);

    try {
      const res = await api.sendChatMessage(messageText);
      const aiText = res.data.success ? res.data.reply : '🤖 I couldn\'t process that. Please try again!';

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'ai', text: aiText, time: new Date() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          text: '⚠️ Connection error. Please check if the server is running and try again.',
          time: new Date(),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Simple markdown-like bold renderer
  const renderText = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1
        ? <strong key={i} className="font-bold">{part}</strong>
        : <span key={i}>{part}</span>
    );
  };

  return (
    <>
      {/* ── Floating Chat Button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        id="ai-chatbot-toggle"
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl transition-all duration-300 ${
          open
            ? 'bg-slate-800 dark:bg-slate-700 rotate-0 scale-95'
            : 'bg-gradient-to-tr from-violet-600 to-indigo-500 hover:scale-110 animate-pulse-glow'
        } text-white`}
        title={open ? 'Close SmartBot' : 'Ask SmartBot AI'}
      >
        {open ? <X className="h-5 w-5" /> : (
          <div className="relative">
            <MessageCircle className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-emerald-400 rounded-full border border-white animate-ping" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-emerald-400 rounded-full border border-white" />
          </div>
        )}
      </button>

      {/* ── Chat Window ── */}
      {open && (
        <div
          id="ai-chatbot-window"
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-violet-500/20 dark:border-violet-500/15 animate-scale-in"
          style={{ maxHeight: '520px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 flex items-center gap-3">
            <div className="p-1.5 bg-white/20 rounded-xl">
              <Bot className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="flex-grow">
              <p className="font-black text-sm text-white">SmartBot AI</p>
              <p className="text-[10px] text-violet-100 flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-emerald-300 rounded-full inline-block" />
                Powered by Groq AI
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-xl transition-all text-white"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 px-3 py-3 space-y-3" style={{ minHeight: '300px', maxHeight: '340px' }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 h-7 w-7 rounded-xl flex items-center justify-center ${
                  msg.role === 'ai'
                    ? 'bg-gradient-to-tr from-violet-600 to-indigo-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}>
                  {msg.role === 'ai'
                    ? <Sparkles className="h-3.5 w-3.5 text-white" />
                    : <User className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                  }
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'ai'
                      ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-sm'
                      : 'bg-gradient-to-br from-violet-600 to-indigo-500 text-white rounded-tr-sm'
                  }`}
                >
                  {renderText(msg.text)}
                  <p className={`text-[9px] mt-1 ${msg.role === 'ai' ? 'text-slate-400' : 'text-violet-200'}`}>
                    {msg.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {thinking && (
              <div className="flex gap-2">
                <div className="flex-shrink-0 h-7 w-7 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Starter Questions (shown initially) */}
          {showStarters && (
            <div className="bg-slate-50 dark:bg-slate-900 px-3 pb-2 flex flex-wrap gap-1.5">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-[10px] font-semibold px-2.5 py-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 rounded-full transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 px-3 py-3 flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask SmartBot..."
              disabled={thinking}
              maxLength={500}
              className="flex-grow text-xs px-3 py-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/25 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-violet-500/30 transition-all text-slate-700 dark:text-slate-200 placeholder-slate-400 disabled:opacity-60"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || thinking}
              className="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-500 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-md shadow-violet-500/20 flex-shrink-0"
            >
              {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
