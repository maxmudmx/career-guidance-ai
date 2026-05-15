import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader } from 'lucide-react';
import { Button } from './ui';

function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 520 : false,
  );
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= 520);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}

const QUICK = [
  "Qaysi kasb eng ko'p maosh oladi?",
  'RIASEC nima?',
  "Qayerdan o'rganishni boshlash kerak?",
];

export default function ChatBot({ careerContext }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Salom! Men Kasbim yordamchisiman. Kasb tanlash, ko'nikmalar yoki IT soha haqida savollaringizga javob beraman!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          career_context: careerContext || null,
          history: newMessages.slice(-8),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Xatolik yuz berdi. Iltimos qayta urinib ko'ring." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="AI yordamchi"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 text-white rounded-full flex items-center justify-center transition-all hover:scale-105"
          style={{
            background: '#3B82F6',
            boxShadow: '0 0 24px rgba(59,130,246,0.45)',
          }}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className={`fixed z-50 flex flex-col font-sans ${
            isMobile
              ? 'bottom-0 right-0 left-0 rounded-t-2xl max-h-[85vh]'
              : 'bottom-6 right-6 w-96 max-h-[600px] rounded-2xl'
          }`}
          style={{
            height: isMobile ? '85vh' : 600,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-elevated, 0 8px 40px rgba(0,0,0,0.6))',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                  boxShadow: '0 0 12px rgba(59,130,246,0.35)',
                }}
              >
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text)' }}
                >
                  AI Yordamchi
                </div>
                <div
                  className="text-xs flex items-center gap-1.5"
                  style={{ color: '#4ADE80' }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: '#4ADE80',
                      boxShadow: '0 0 6px #4ADE80',
                    }}
                  />
                  Online
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="transition-colors p-1 rounded-lg"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={i}
                  className={`flex gap-2 items-end ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isUser
                        ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
                        : 'var(--surface-subtle)',
                      border: isUser
                        ? 'none'
                        : '1px solid var(--border)',
                    }}
                  >
                    {isUser ? (
                      <User className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Bot
                        className="w-3.5 h-3.5"
                        style={{ color: 'var(--accent)' }}
                      />
                    )}
                  </div>
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 text-sm leading-relaxed ${
                      isUser
                        ? 'rounded-2xl rounded-br-sm'
                        : 'rounded-2xl rounded-bl-sm'
                    }`}
                    style={{
                      background: isUser ? '#3B82F6' : 'var(--bg)',
                      color: isUser ? '#FFFFFF' : 'var(--text)',
                      border: isUser
                        ? 'none'
                        : '1px solid var(--border)',
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex gap-2 items-end">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <Bot className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                </div>
                <div
                  className="rounded-2xl rounded-bl-sm px-3.5 py-3 flex gap-1.5 items-center"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{
                        background: '#60A5FA',
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length === 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {QUICK.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: 'var(--accent-soft)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent-soft-2)';
                    e.currentTarget.style.borderColor = 'var(--accent-border)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--accent-soft)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            className="p-3 flex gap-2"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Savol yozing..."
              className="input-dark flex-1"
            />
            <Button
              variant="primary"
              size="md"
              onClick={send}
              disabled={!input.trim() || loading}
              className="flex-shrink-0"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
