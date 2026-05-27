'use client';

import { useState } from 'react';

const contextSummary = {
  title: 'Current Context',
  text: 'Mr. Anderson is on day 3 of a 5-night anniversary stay. Spa reservation confirmed for today at 4 PM. No pending requests.',
};

const suggestedAction = {
  title: 'Suggested Next',
  action: 'Prepare anniversary amenity',
  detail: 'Anniversary is Dec 17 — 2 days away. Consider arranging a complimentary champagne & dessert delivery to Suite 1204.',
  priority: 'medium' as const,
};

const quickInsight = {
  title: 'Quick Insight',
  text: 'Guest has dined at Le Bernardin on 3 previous stays. Reservation for tomorrow evening is confirmed — consider a follow-up note with sommelier recommendations.',
};

const prompts = [
  'Draft anniversary note',
  'Check dining history',
  'Review preferences',
  'Suggest evening plans',
  'Room upgrade options',
  'Late checkout availability',
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[9px] font-medium text-[var(--text-muted)] uppercase tracking-[0.14em] mb-2.5 ml-0.5">
      {children}
    </h4>
  );
}

export default function AICopilotPanel() {
  const [promptValue, setPromptValue] = useState('');

  return (
    <div className="flex flex-col h-full bg-[var(--panel-bg)] animate-slide-in-right">
      {/* Panel Header */}
      <div className="px-4 pt-4 pb-3.5 border-b border-[var(--charcoal-light)]">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-[4px] bg-[var(--gold)]/8 border border-[var(--gold)]/15 flex items-center justify-center">
            <span className="text-[10px] text-[var(--gold)]">✦</span>
          </div>
          <div>
            <h2 className="text-[12px] font-medium text-[var(--text-primary)] tracking-wide">Concierge AI</h2>
          </div>
        </div>
        <p className="text-[9px] text-[var(--text-faint)] mt-1.5 ml-7 tracking-wide">Guest intelligence · Decision support</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-4">
        {/* Context Summary */}
        <div className="animate-fade-in-up stagger-1">
          <SectionLabel>{contextSummary.title}</SectionLabel>
          <div className="bg-[var(--card-bg)] rounded-[6px] p-3.5 border border-[var(--card-border)]">
            <p className="text-[11px] text-[var(--text-secondary)] leading-[1.7]">
              {contextSummary.text}
            </p>
          </div>
        </div>

        {/* Suggested Action */}
        <div className="animate-fade-in-up stagger-2">
          <SectionLabel>{suggestedAction.title}</SectionLabel>
          <div className="bg-[var(--card-bg)] rounded-[6px] p-3.5 border border-[var(--gold)]/12">
            <div className="flex items-start space-x-2.5">
              <div className="w-[22px] h-[22px] rounded-[5px] bg-[var(--gold)]/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5L20 7" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] text-[var(--text-primary)] font-medium mb-1 tracking-wide">{suggestedAction.action}</p>
                <p className="text-[10px] text-[var(--text-muted)] leading-[1.7]">{suggestedAction.detail}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-3 ml-8">
              <button className="text-[10px] text-[var(--gold)] bg-[var(--gold)]/8 hover:bg-[var(--gold)]/12 border border-[var(--gold)]/15 rounded-[5px] px-3 py-1.5 transition-all duration-200 hover-lift tracking-wide">
                Apply
              </button>
              <button className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[5px] px-3 py-1.5 transition-colors duration-200 tracking-wide">
                Dismiss
              </button>
            </div>
          </div>
        </div>

        {/* Quick Insight */}
        <div className="animate-fade-in-up stagger-3">
          <SectionLabel>{quickInsight.title}</SectionLabel>
          <div className="bg-[var(--card-bg)] rounded-[6px] p-3.5 border border-[var(--card-border)]">
            <div className="flex items-start space-x-2.5">
              <span className="text-[10px] mt-[2px] flex-shrink-0 text-[var(--text-faint)]">◇</span>
              <p className="text-[10px] text-[var(--text-secondary)] leading-[1.7]">{quickInsight.text}</p>
            </div>
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="animate-fade-in-up stagger-4">
          <SectionLabel>Quick Prompts</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                className="text-[10px] text-[var(--text-secondary)] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[5px] px-2.5 py-[5px] hover:border-[var(--gold)]/20 hover:text-[var(--text-primary)] transition-all duration-200 tracking-wide"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prompt Composer - fixed at bottom */}
      <div className="px-4 py-3 border-t border-[var(--charcoal-light)]">
        <div className="flex items-center space-x-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[6px] px-3 py-2.5 focus-within:border-[var(--gold)]/20 transition-colors duration-200">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <input
            type="text"
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            placeholder="Ask about this guest…"
            className="flex-1 bg-transparent text-[11px] text-[var(--text-secondary)] placeholder-[var(--text-faint)] focus:outline-none tracking-wide"
          />
          <button className="text-[var(--text-faint)] hover:text-[var(--gold)] transition-colors duration-200">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12 14-7-4 7 4 7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
