import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Sparkles, X, Send, Bot, User as UserIcon, RefreshCw, ShieldCheck, ArrowUpRight } from 'lucide-react';
import './AIAssistant.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  source?: 'openrouter' | 'local';
}

interface AIAssistantProps {
  mode: 'closed' | 'full' | 'floating';
  onModeChange: (mode: 'closed' | 'full' | 'floating') => void;
}

const SUGGESTIONS = [
  'Summarize CASE-2026-001',
  'Find patterns across all cases',
  'List all open cases',
  'Evidence overview',
];

const renderInlineContent = (text: string): React.ReactNode[] =>
  text.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('_') && part.endsWith('_')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });

const renderContent = (text: string): React.ReactNode =>
  text.split('\n').map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={index} className="astrax-ai-message-spacer" />;

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const HeadingTag = heading[1].length === 1 ? 'h3' : 'h4';
      return <HeadingTag key={index} className="astrax-ai-response-heading">{renderInlineContent(heading[2])}</HeadingTag>;
    }

    const boldHeading = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (boldHeading) {
      return <h4 key={index} className="astrax-ai-response-subheading">{boldHeading[1].replace(/:$/, '')}</h4>;
    }

    const orderedItem = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (orderedItem) {
      return (
        <div key={index} className="astrax-ai-response-list-item">
          <span className="astrax-ai-response-list-marker">{orderedItem[1]}.</span>
          <span>{renderInlineContent(orderedItem[2])}</span>
        </div>
      );
    }

    const bulletItem = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bulletItem) {
      return (
        <div key={index} className="astrax-ai-response-list-item">
          <span className="astrax-ai-response-list-marker" aria-hidden="true">•</span>
          <span>{renderInlineContent(bulletItem[1])}</span>
        </div>
      );
    }

    const isItalic = /^_.+_$/.test(trimmed);
    return (
      <p key={index} className={isItalic ? 'astrax-ai-response-note' : 'astrax-ai-response-paragraph'}>
        {renderInlineContent(trimmed)}
      </p>
    );
  });

export const AIAssistant: React.FC<AIAssistantProps> = ({ mode, onModeChange }) => {
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
  const open = mode !== 'closed';
  const isFloating = mode === 'floating';

  return (
    <>
      {mode === 'closed' && (
        <button
          type="button"
          className="astrax-ai-floating-launcher"
          onClick={() => onModeChange('floating')}
          aria-label="Open AstraX AI in a floating window"
          title="Ask AstraX AI"
        >
          <Bot size={21} />
          <Sparkles size={12} className="astrax-ai-floating-sparkle" />
        </button>
      )}
      {/* Chat drawer */}
      {open && (
        <section
          className={`astrax-ai-panel${isFloating ? ' astrax-ai-panel-floating' : ''}`}
          aria-label={isFloating ? 'AstraX AI floating assistant' : 'Astrax AI assistant'}
        >
          {/* Header */}
          <div className="astrax-ai-header">
            <div className="astrax-ai-brand">
              <div className="astrax-ai-brand-icon">
                <Bot size={20} />
                <span className="astrax-ai-brand-sparkle"><Sparkles size={10} /></span>
              </div>
              <div className="astrax-ai-brand-copy">
                <div className="astrax-ai-name">Astrax AI</div>
                <div className="astrax-ai-presence"><span /> Secure evidence &amp; case intelligence</div>
              </div>
            </div>
            <div className="astrax-ai-header-status">
              <ShieldCheck size={14} />
              <span>AUTHORIZED WORKSPACE</span>
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
                onClick={() => onModeChange('closed')}
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
                <div className="astrax-ai-welcome-mark"><Sparkles size={25} /></div>
                <div className="astrax-ai-eyebrow">YOUR CASE INTELLIGENCE ASSISTANT</div>
                <h2>What would you like to investigate?</h2>
                <p>Ask a question about authorized records, explore patterns, or get a clear case summary.</p>
                <div className="astrax-ai-suggestions-heading">
                  <span>GET STARTED</span>
                  <span>Choose a prompt or type your own</span>
                </div>
                <div className="astrax-ai-suggestions">
                  {SUGGESTIONS.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      onClick={() => send(suggestion)}
                      className="astrax-ai-suggestion"
                    >
                      <span className="astrax-ai-suggestion-index">0{index + 1}</span>
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
            <div className="astrax-ai-composer-inner">
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
                placeholder="Ask AstraX about a case, document, evidence, or legal term..."
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
              <span>AI responses may be inaccurate. Verify important information before use.</span>
            </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};
