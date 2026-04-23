'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isWelcome?: boolean;
}

const STORAGE_KEY = 'verelus-chat-messages';
const MAX_STORED_MESSAGES = 50;
const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content:
    'Ola! Eu sou a Vee, assistente virtual do Verelus. Como posso te ajudar hoje? Posso tirar duvidas sobre a plataforma, funcionalidades, planos e muito mais!',
  isWelcome: true,
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
    setMessages([WELCOME_MESSAGE]);
  }, []);

  // Persist messages to sessionStorage (capped to prevent unbounded growth)
  useEffect(() => {
    if (messages.length > 0) {
      try {
        const toStore = messages.length > MAX_STORED_MESSAGES
          ? messages.slice(-MAX_STORED_MESSAGES)
          : messages;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      } catch {
        // ignore storage errors
      }
    }
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Filter out the welcome message to avoid wasting API tokens
      const apiMessages = updatedMessages
        .filter((m) => !m.isWelcome)
        .map(({ role, content }) => ({ role, content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.error || 'Muitas mensagens. Aguarde um momento.' },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply || 'Desculpe, nao consegui responder.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Erro de conexão. Verifique sua internet e tente novamente.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Panel */}
      <div
        className={`fixed bottom-20 right-4 z-50 transition-all duration-300 ease-in-out ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ width: 'min(400px, calc(100vw - 2rem))' }}
      >
        <div className="bg-brand-card border border-white/10 rounded-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden"
          style={{ height: 'min(500px, calc(100vh - 10rem))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-brand-surface border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-green to-brand-purple flex items-center justify-center text-white text-sm font-bold">
                V
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Vee - Assistente Verelus</h3>
                <p className="text-[11px] text-brand-muted">Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Fechar chat"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-brand-green/20 text-brand-green rounded-br-md'
                      : 'bg-brand-surface text-brand-text rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-brand-surface text-brand-muted px-3.5 py-2.5 rounded-2xl rounded-bl-md text-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-brand-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-brand-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-brand-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                disabled={isLoading}
                className="flex-1 bg-brand-surface text-brand-text text-sm rounded-xl px-4 py-2.5 border border-white/5 focus:border-brand-green/50 focus:outline-none placeholder:text-brand-muted/50 disabled:opacity-50 transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-green/20 text-brand-green hover:bg-brand-green/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                aria-label="Enviar mensagem"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg shadow-black/30 flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-brand-surface text-white/60 hover:text-white rotate-0'
            : 'bg-gradient-to-br from-brand-green to-brand-purple text-white hover:scale-105'
        }`}
        aria-label={isOpen ? 'Fechar chat' : 'Abrir chat'}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )}
      </button>
    </>
  );
}
