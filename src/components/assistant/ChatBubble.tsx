'use client';

import type { Place, MapPlace } from '@/types';

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  place?: Place | MapPlace;
}

export default function ChatBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} animate-fade-in-up`}>
      <div
        className={`max-w-[90%] rounded-[6px] px-3.5 py-2.5 ${
          isAssistant
            ? 'bg-[var(--card-bg)] border border-[var(--card-border)]'
            : 'bg-[var(--gold)]/10 border border-[var(--gold)]/20'
        }`}
      >
        {isAssistant && (
          <div className="flex items-center space-x-1.5 mb-1.5">
            <span className="text-[9px] text-[var(--gold)]">✦</span>
            <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Stayscape</span>
          </div>
        )}
        <p className={`text-[11px] leading-[1.7] ${isAssistant ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
          {message.text}
        </p>
      </div>
    </div>
  );
}
