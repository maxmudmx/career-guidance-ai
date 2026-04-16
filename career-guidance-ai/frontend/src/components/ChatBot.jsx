import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader } from 'lucide-react';

export default function ChatBot({ careerContext }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Salom! Men KasbYo'lAI yordamchisiman. Kasb tanlash, ko'nikmalar yoki IT soha haqida savollaringizga javob beraman!",
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
        { role: 'assistant', content: 'Xatolik yuz berdi. Iltimos qayta urinib ko\'ring.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK = ["Qaysi kasb eng ko'p maosh oladi?", "RIASEC nima?", "Qayerdan o'rganishni boshlash kerak?"];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00D4AA, #635BFF)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,212,170,0.4)',
          animation: 'bounceIn 0.5s ease both',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,212,170,0.6)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,212,170,0.4)'; }}
        title="AI yordamchi"
      >
        {open ? <X size={22} color="white" /> : <MessageCircle size={22} color="white" />}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 999,
          width: 340, maxHeight: 480,
          background: 'var(--card)', borderRadius: 16,
          border: '1px solid var(--border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column',
          animation: 'chatSlideIn 0.25s ease both',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, #0A2540, #1B3A5C)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00D4AA, #635BFF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={18} color="white" />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>AI Maslahatchi</div>
              <div style={{ color: '#00D4AA', fontSize: 11 }}>● Onlayn</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8,
                flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, #635BFF, #00D4AA)'
                    : 'linear-gradient(135deg, #0A2540, #1B3A5C)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {m.role === 'user' ? <User size={14} color="white" /> : <Bot size={14} color="white" />}
                </div>
                <div style={{
                  maxWidth: '78%',
                  padding: '9px 12px',
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, #635BFF, #00D4AA)'
                    : 'var(--bg)',
                  color: m.role === 'user' ? 'white' : 'var(--text)',
                  fontSize: 13, lineHeight: 1.5,
                  border: m.role !== 'user' ? '1px solid var(--border)' : 'none',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0A2540, #1B3A5C)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bot size={14} color="white" />
                </div>
                <div style={{
                  padding: '10px 14px', borderRadius: '14px 14px 14px 4px',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  display: 'flex', gap: 4, alignItems: 'center',
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--accent)',
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length === 1 && (
            <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {QUICK.map((q, i) => (
                <button key={i} onClick={() => { setInput(q); }}
                  style={{
                    padding: '5px 10px', borderRadius: 20,
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--border)',
            display: 'flex', gap: 8,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Savol yozing..."
              style={{
                flex: 1, padding: '9px 12px',
                borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--bg)', color: 'var(--text)',
                fontSize: 13, outline: 'none',
              }}
            />
            <button onClick={send} disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: input.trim() ? 'linear-gradient(135deg, #00D4AA, #635BFF)' : 'var(--border)',
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              {loading ? <Loader size={14} color="white" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} color="white" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
