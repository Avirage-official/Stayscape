'use client';

/**
 * /stay/[propertySlug]/[stayId]
 *
 * The redesigned Ask Aria chat — full-bleed, warm, rounded.
 * Matches the Home tab's aesthetic. No tabs, no sidebar.
 *
 * Wired to /api/ai/chat (unchanged). Aria's tool-use (log_service_request,
 * get_service_request_status) still fires server-side as before.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';

import { getSupabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth-context';
import { useStay } from './stay-context';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

const QUICK_SUGGESTIONS = [
  'What can I do nearby today?',
  'Recommend a great dinner spot',
  'Can I get extra towels?',
];

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function StayConciergePage() {
  const { stay } = useStay();
  const { user } = useAuth();
  const stayId = stay.id;

  const firstName = useMemo(() => {
    if (user?.email) {
      const local = user.email.split('@')[0].split('.')[0];
      return local.charAt(0).toUpperCase() + local.slice(1);
    }
    return 'Guest';
  }, [user?.email]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const msgIdRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = useCallback(
    async (raw?: string) => {
      const msg = (raw ?? input).trim();
      if (!msg || isTyping) return;

      msgIdRef.current += 1;
      const userMsgId = msgIdRef.current;
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: 'user', content: msg },
      ]);
      setInput('');
      setIsTyping(true);

      try {
        const supabase = getSupabaseBrowser();
        let token: string | null = null;
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          token = session?.access_token ?? null;
        }

        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            message: msg,
            mode: 'concierge',
            stayId: stayId ?? null,
            history: messages.map((m) => ({ role: m.role, text: m.content })),
          }),
        });

        const data = (await res.json()) as { reply?: string; error?: string };
        msgIdRef.current += 1;
        setMessages((prev) => [
          ...prev,
          {
            id: msgIdRef.current,
            role: 'assistant',
            content:
              data.reply ??
              "I'm here to help with your stay. Could you say that again?",
          },
        ]);
      } catch {
        msgIdRef.current += 1;
        setMessages((prev) => [
          ...prev,
          {
            id: msgIdRef.current,
            role: 'assistant',
            content: 'Something went wrong. Please try again in a moment.',
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping, messages, stayId],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const handleSuggestion = (s: string) => {
    void sendMessage(s);
  };

  const hasMessages = messages.length > 0;
  const greeting = useMemo(() => getGreeting(), []);

  return (
    <div
      className={dmSans.className}
      style={{
        position: 'relative',
        height: '100dvh',
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: 'var(--text-primary)',
      }}
    >
      <style>{`
        @keyframes aria-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes aria-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .aria-bubble {
          max-width: 78%;
          padding: 12px 16px;
          font-size: 14px;
          line-height: 1.55;
          font-weight: 400;
          animation: aria-fade-up 0.28s ease;
          word-wrap: break-word;
          white-space: pre-wrap;
        }
        @media (min-width: 768px) {
          .aria-bubble { max-width: 64%; padding: 14px 18px; font-size: 15px; }
        }
        .aria-bubble-user {
          background: var(--gold);
          color: #fdf9f2;
          border-radius: 22px 22px 6px 22px;
          box-shadow: 0 4px 14px rgba(193, 127, 58, 0.18);
        }
        .aria-bubble-assistant {
          background: var(--surface);
          color: var(--text-primary);
          border: 1px solid var(--border);
          border-radius: 22px 22px 22px 6px;
          box-shadow: 0 4px 14px rgba(28, 22, 16, 0.04);
        }
        .aria-suggestion-pill {
          padding: 10px 16px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
        }
        .aria-suggestion-pill:hover {
          border-color: rgba(201, 168, 76, 0.4);
          color: var(--gold);
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(28, 22, 16, 0.06);
        }
      `}</style>

      {/* MESSAGES area (or empty state) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          padding: '32px 20px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 760,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Empty state — greeting + sparkle + suggestions */}
          {!hasMessages && (
            <div
              style={{
                paddingTop: 'clamp(16px, 8vh, 64px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 22,
                animation: 'aria-fade-up 0.45s ease',
              }}
            >
              {/* Sparkle / Aria mark */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  background:
                    'linear-gradient(135deg, rgba(201, 168, 76, 0.18) 0%, rgba(201, 168, 76, 0.06) 100%)',
                  border: '1px solid rgba(201, 168, 76, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold)',
                }}
              >
                <Sparkle />
              </div>

              <div style={{ textAlign: 'center' }}>
                <p
                  className={cormorant.className}
                  style={{
                    margin: 0,
                    fontSize: 'clamp(26px, 4vw, 36px)',
                    fontWeight: 400,
                    lineHeight: 1.2,
                    color: 'var(--text-primary)',
                  }}
                >
                  {greeting},{' '}
                  <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>
                    {firstName}.
                  </span>
                </p>
                <p
                  style={{
                    margin: '8px 0 0',
                    fontSize: 14,
                    color: 'var(--text-muted)',
                    fontWeight: 300,
                  }}
                >
                  How can I help with your stay
                  {stay.property?.name ? ` at ${stay.property.name}` : ''}?
                </p>
              </div>

              {/* Suggestion pills */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  justifyContent: 'center',
                  paddingTop: 6,
                }}
              >
                {QUICK_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`aria-suggestion-pill ${dmSans.className}`}
                    onClick={() => handleSuggestion(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent:
                  msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                className={`aria-bubble ${
                  msg.role === 'user'
                    ? 'aria-bubble-user'
                    : 'aria-bubble-assistant'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
              }}
            >
              <div
                className="aria-bubble aria-bubble-assistant"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '14px 18px',
                }}
              >
                <Dot delay={0} />
                <Dot delay={150} />
                <Dot delay={300} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT bar */}
      <div
        style={{
          flexShrink: 0,
          padding: '12px 20px calc(env(safe-area-inset-bottom) + 18px)',
          background: 'var(--background)',
          borderTop: '1px solid var(--border-subtle, rgba(28, 22, 16, 0.06))',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 760,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: '10px 10px 10px 18px',
            boxShadow: '0 4px 18px rgba(28, 22, 16, 0.05)',
            transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.45)';
            e.currentTarget.style.boxShadow =
              '0 4px 22px rgba(193, 127, 58, 0.12)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow =
              '0 4px 18px rgba(28, 22, 16, 0.05)';
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Aria anything…"
            rows={1}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              resize: 'none',
              fontFamily: 'inherit',
              fontSize: 14,
              lineHeight: 1.5,
              color: 'var(--text-primary)',
              padding: '8px 0',
              maxHeight: 140,
              minHeight: 22,
            }}
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: 'none',
              flexShrink: 0,
              background:
                input.trim() && !isTyping ? 'var(--gold)' : 'var(--border)',
              color: input.trim() && !isTyping ? '#fdf9f2' : 'var(--text-muted)',
              cursor:
                input.trim() && !isTyping ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.18s ease, transform 0.18s ease',
            }}
            onMouseEnter={(e) => {
              if (input.trim() && !isTyping) {
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function Sparkle() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" />
      <path d="M19 16v3M17.5 17.5h3" />
    </svg>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: 'var(--gold)',
        display: 'inline-block',
        animation: `aria-pulse 1.1s ease-in-out infinite`,
        animationDelay: `${delay}ms`,
      }}
    />
  );
}
