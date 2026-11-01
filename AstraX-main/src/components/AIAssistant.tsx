import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Sparkles, X, Send, Bot, User as UserIcon, RefreshCw, ShieldCheck, ArrowUpRight } from 'lucide-react';
import './AIAssistant.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  source?: 'openrouter' | 'local';
}

const SUGGESTIONS = [
  'Summarize CASE-2026-001',
  'Find patterns across all cases',
  'List all open cases',
  'Evidence overview',
];

// Minimal formatter: **bold**, `code`, newlines, bullets
const renderContent = (text: string): React.ReactNode => {
  return text.split('\n').map((line, i) => {
    const formatted = line
      .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
      .map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={j} style={{ color: '#0b2545' }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={j} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });

    const isBullet = /^\s*-\s/.test(line);
    const isItalic = /^_.+_$/.test(line.trim());

    return (
      <div
        key={i}
        style={{
          paddingLeft: isBullet ? '14px' : '0',
          position: 'relative',
          marginBottom: '2px',
          fontStyle: isItalic ? 'italic' : 'normal',
          color: isItalic ? '#64748b' : 'inherit',
        }}
      >
        {isBullet && (
          <span style={{ position: 'absolute', left: '2px', color: '#1d4ed8' }}>&bull;</span>
        )}
        {formatted}
      </div>
    );
  });
};

export const AIAssistant: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const history = nextMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
      const res = await api.askAssistant(trimmed, history);
      setMessages([...nextMessages, { role: 'assistant', content: res.reply, source: res.source }]);
    } catch (err: any) {
      setError(err?.message || 'Assistant request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showSuggestions = messages.length === 0 && !loading;

  return (
    <>
      {/* Floating action button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Astrax AI — case summaries & pattern analysis"
          aria-label="Open Astrax AI assistant"
          className="astrax-ai-launcher"
        >
          <Sparkles size={22} />
          <span className="astrax-ai-launcher-label">Ask Astrax AI</span>
        </button>
      )}

      {/* Chat drawer */}
      {open && (
        <section className="astrax-ai-panel" aria-label="Astrax AI assistant">
          {/* Header */}
          <div className="astrax-ai-header">
            <div className="astrax-ai-brand">
              <div className="astrax-ai-brand-icon">
                <Bot size={20} />
                <span className="astrax-ai-brand-sparkle"><Sparkles size={10} /></span>
              </div>
              <div className="astrax-ai-brand-copy">
                <div className="astrax-ai-name">Astrax AI</div>
                <div className="astrax-ai-presence"><span /> Evidence &amp; case intelligence</div>
              </div>
            </div>
            <div className="astrax-ai-header-actions">
              {messages.length > 0 && (
                <button
                  onClick={() => {
                    setMessages([]);
                    setError(null);
                  }}
                  title="Clear conversation"
                  aria-label="Clear conversation"
                  className="astrax-ai-icon-button"
                >
                  <RefreshCw size={16} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                title="Close assistant"
                aria-label="Close assistant"
                className="astrax-ai-icon-button"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={bodyRef} className="astrax-ai-messages" aria-live="polite">
            {showSuggestions && (
              <div className="astrax-ai-welcome">
                <div className="astrax-ai-welcome-mark"><Sparkles size={21} /></div>
                <div className="astrax-ai-eyebrow">YOUR SECURE WORKSPACE ASSISTANT</div>
                <h2>How can I help?</h2>
                <p>Explore authorized case records, summarize activity, or ask a general question.</p>
                <div className="astrax-ai-suggestions-heading">TRY ASKING</div>
                <div className="astrax-ai-suggestions">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => send(suggestion)}
                      className="astrax-ai-suggestion"
                    >
                      <span>{suggestion}</span>
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`astrax-ai-message astrax-ai-message-${m.role}`}>
                <div className={`astrax-ai-avatar astrax-ai-avatar-${m.role}`}>
                  {m.role === 'user' ? <UserIcon size={13} /> : <Bot size={13} />}
                </div>
                <div className="astrax-ai-message-content">
                  <div className="astrax-ai-message-author">{m.role === 'assistant' ? 'Astrax AI' : 'You'}</div>
                  <div className="astrax-ai-message-text">{renderContent(m.content)}</div>
                  {m.role === 'assistant' && m.source && (
                    <div className="astrax-ai-source">
                      <ShieldCheck size={12} />
                      {m.source === 'openrouter' ? 'AI RESPONSE' : 'LOCAL RECORD ANALYSIS'} · VERIFY BEFORE USE
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="astrax-ai-thinking">
                <div className="astrax-ai-avatar astrax-ai-avatar-assistant"><Bot size={13} /></div>
                <div className="astrax-ai-thinking-bubble">
                  <span /><span /><span />
                  <span className="astrax-ai-thinking-label">Reviewing authorized records</span>
                </div>
              </div>
            )}

            {error && (
              <div className="astrax-ai-error" role="alert">
                <strong>Couldn’t complete that request</strong>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="astrax-ai-composer-area">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="astrax-ai-composer"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a case, document, or more..."
                aria-label="Message Astrax AI"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send message"
                title="Send message"
              >
                <Send size={17} />
              </button>
            </form>
            <div className="astrax-ai-composer-note">
              <ShieldCheck size={12} />
              AI responses can be inaccurate. Verify important information.
            </div>
          </div>
        </section>
      )}
    </>
  );
};
