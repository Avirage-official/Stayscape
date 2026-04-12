'use client';

import { useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

const QUICK_SUGGESTIONS = [
  'Plan my afternoon nearby',
  'Dinner recommendation tonight',
  'What can I do within walking distance?',
];

interface ConciergePromptProps {
  firstName: string;
}

/**
 * ConciergePrompt — the centered AI concierge input area.
 * Soft glass surface, generous width, refined placeholder.
 */
export default function ConciergePrompt({ firstName }: ConciergePromptProps) {
  const prefersReducedMotion = useReducedMotion();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  });

  const fadeIn = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, ease: REVEAL_EASE, delay },
        };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Future: send to concierge API
    setQuery('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 sm:px-8">
      {/* Greeting headline */}
      <motion.h1
        className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] mb-3"
        style={{ letterSpacing: '-0.01em' }}
        {...fadeIn(0.5)}
      >
        Good {greeting}, {firstName}.
      </motion.h1>

      {/* Sub-line */}
      <motion.p
        className="text-[15px] sm:text-[16px] text-white/50 mb-10 sm:mb-12 max-w-md"
        {...fadeIn(0.7)}
      >
        Your concierge is ready
      </motion.p>

      {/* Prompt surface — glass / translucent */}
      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-[640px]"
        {...fadeIn(0.9)}
      >
        <div
          className={`
            relative flex items-center rounded-2xl
            transition-all duration-500
            ${
              isFocused
                ? 'bg-white/[0.12] border-white/20 shadow-[0_8px_40px_rgba(0,0,0,0.3)]'
                : 'bg-white/[0.07] border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.2)]'
            }
            border backdrop-blur-xl
          `}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask your concierge anything…"
            className="
              flex-1 bg-transparent text-[15px] sm:text-[16px] text-white/90
              placeholder:text-white/30 px-6 sm:px-7 py-4 sm:py-5
              focus:outline-none
            "
            autoComplete="off"
          />

          {/* Submit affordance */}
          <button
            type="submit"
            className={`
              flex-shrink-0 mr-3 sm:mr-4 w-9 h-9 sm:w-10 sm:h-10 rounded-xl
              flex items-center justify-center
              transition-all duration-300 cursor-pointer
              ${
                query.trim()
                  ? 'bg-white/15 text-white hover:bg-white/25'
                  : 'bg-white/5 text-white/20'
              }
            `}
            aria-label="Send message"
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
      <motion.div
        className="flex flex-wrap justify-center gap-2 mt-5 sm:mt-6"
        {...fadeIn(1.1)}
      >
        {QUICK_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleSuggestionClick(s)}
            className="
              px-4 py-2 rounded-full text-[12px] sm:text-[13px] text-white/40
              bg-white/[0.04] border border-white/[0.06]
              hover:bg-white/[0.08] hover:text-white/60 hover:border-white/10
              transition-all duration-300 cursor-pointer
            "
          >
            {s}
          </button>
        ))}
      </motion.div>
    </div>
  );
}
