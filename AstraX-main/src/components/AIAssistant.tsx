import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Sparkles, X, Send, Bot, User as UserIcon, RefreshCw } from 'lucide-react';

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
          title="AI Assistant — case summaries & pattern analysis"
          style={{
            position: 'fixed',
            bottom: '48px',
            right: '24px',
            zIndex: 90,
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(59, 130, 246, 0.45)',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* Chat drawer */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '48px',
            right: '24px',
            zIndex: 90,
            width: '400px',
            maxWidth: 'calc(100vw - 48px)',
            height: '560px',
            maxHeight: 'calc(100vh - 96px)',
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 20px 50px rgba(2, 6, 23, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: '#07162c',
              color: '#ffffff',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800 }}>NyayaSahayak AI</div>
                <div style={{ fontSize: '10px', color: '#93c5fd' }}>
                  Vault records & general questions
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setMessages([])}
                title="Clear conversation"
                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '6px' }}
              >
                <RefreshCw size={15} />
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Close"
                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '6px' }}
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={bodyRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {showSuggestions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
                  Ask about accessible case records, documents, or anything else:
                </div>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      textAlign: 'left',
                      padding: '9px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#1d4ed8',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                  flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: m.role === 'user' ? '#1d4ed8' : 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    marginTop: '2px',
                  }}
                >
                  {m.role === 'user' ? <UserIcon size={13} /> : <Bot size={13} />}
                </div>
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    lineHeight: 1.55,
                    background: m.role === 'user' ? '#1d4ed8' : '#ffffff',
                    color: m.role === 'user' ? '#ffffff' : '#1e293b',
                    border: m.role === 'user' ? 'none' : '1px solid #e2e8f0',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {renderContent(m.content)}
                  {m.role === 'assistant' && m.source && (
                    <div
                      style={{
                        marginTop: '8px',
                        paddingTop: '6px',
                        borderTop: '1px solid #f1f5f9',
                        fontSize: '9px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        color: m.source === 'openrouter' ? '#7c3aed' : '#64748b',
                      }}
                    >
                      {m.source === 'openrouter' ? 'OPENROUTER AI' : 'LOCAL ANALYTIC ENGINE'} &bull; VERIFY BEFORE USE
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px' }}>
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid #e2e8f0',
                    borderTopColor: '#1d4ed8',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
                Analyzing vault records...
              </div>
            )}

            {error && (
              <div style={{ fontSize: '12px', color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 10px' }}>
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            style={{
              padding: '10px 12px',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              display: 'flex',
              gap: '8px',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a case, a document, or a general question"
              style={{
                flex: 1,
                padding: '9px 12px',
                fontSize: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: '#1d4ed8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                width: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
