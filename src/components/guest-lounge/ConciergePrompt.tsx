'use client';

import { useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { sendChatMessage } from '@/lib/ai/chat';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

const QUICK_SUGGESTIONS = [
  'Plan my afternoon nearby',
  'Dinner recommendation tonight',
  'What can I do within walking distance?',
];

interface ConciergePromptProps {
  firstName: string;
  hotelName?: string | null;
  stayId?: string | null;
}

/**
 * ConciergePrompt — Warm Modern AI concierge input area.
 */
export default function ConciergePrompt({ firstName, hotelName, stayId }: ConciergePromptProps) {
  const prefersReducedMotion = useReducedMotion();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);

  const fadeIn = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: REVEAL_EASE, delay },
        };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setReply('');
    setQuery('');

    const updatedHistory: Array<{ role: 'user' | 'assistant'; text: string }> = [
      ...history,
      { role: 'user', text: trimmed },
    ];

    try {
      const response = await sendChatMessage(
        trimmed,
        stayId ?? null,
        'discovery',
      );

      const newHistory: Array<{ role: 'user' | 'assistant'; text: string }> = [
        ...updatedHistory,
        { role: 'assistant', text: response },
      ];

      setHistory(newHistory);
      setReply(response);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col w-full">
      {/* Sub-line / context */}
      <motion.p
        className="text-[14px] mb-4"
        style={{ color: 'var(--text-secondary)' }}
        {...fadeIn(0.05)}
      >
        {hotelName
          ? `How can I help with your stay at ${hotelName}, ${firstName}?`
          : `Your concierge is ready, ${firstName}.`}
      </motion.p>

      {/* Prompt surface — warm card */}
      <motion.form
        onSubmit={handleSubmit}
        className="w-full"
        {...fadeIn(0.15)}
      >
        <div
          className="relative flex items-center rounded-2xl px-5 py-4 transition-all duration-300"
          style={{
            background: 'var(--surface)',
            border: `1px solid ${isFocused ? 'var(--gold)' : 'var(--border)'}`,
            boxShadow: isFocused
              ? '0 0 0 3px var(--input-focus-ring), var(--card-shadow)'
              : 'var(--card-shadow)',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask your concierge anything…"
            className="flex-1 bg-transparent text-[15px] focus:outline-none border-none"
            style={
              {
                color: 'var(--text-primary)',
                '--tw-placeholder-opacity': '1',
              } as React.CSSProperties
            }
            autoComplete="off"
          />

          <button
            type="submit"
            className="flex-shrink-0 ml-3 w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed"
            style={{
              background: query.trim() ? 'var(--gold)' : 'var(--surface-raised)',
              color: query.trim() ? '#FFFFFF' : 'var(--text-faint)',
            }}
            onMouseEnter={(e) => {
              if (query.trim()) e.currentTarget.style.background = 'var(--gold-soft)';
            }}
            onMouseLeave={(e) => {
              if (query.trim()) e.currentTarget.style.background = 'var(--gold)';
            }}
            aria-label={
              query.trim() ? 'Send message' : 'Send message (enter text first)'
            }
            aria-disabled={!query.trim() || isLoading}
            disabled={!query.trim() || isLoading}
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
      </motion.form>

      {/* Quick suggestions */}
      <motion.div className="flex flex-wrap gap-2 mt-4" {...fadeIn(0.25)}>
        {QUICK_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleSuggestionClick(s)}
            className="px-4 py-2 rounded-full text-[12px] sm:text-[13px] transition-all duration-300 cursor-pointer"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold)';
              e.currentTarget.style.color = 'var(--gold)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {s}
          </button>
        ))}
      </motion.div>

      {/* AI response bubble */}
      {(isLoading || reply) && (
        <motion.div
          className="w-full mt-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: REVEAL_EASE }}
        >
          <div
            className="rounded-2xl px-6 py-4"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--card-shadow)',
              color: 'var(--text-primary)',
            }}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0ms]"
                  style={{ background: 'var(--gold)' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:150ms]"
                  style={{ background: 'var(--gold)' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:300ms]"
                  style={{ background: 'var(--gold)' }}
                />
              </div>
            ) : (
              <p
                className="text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap"
                style={{ color: 'var(--text-primary)' }}
              >
                {reply}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
