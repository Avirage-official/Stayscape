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
    <h4 className="text-[9px] font-medium text-gray-500 uppercase tracking-[0.14em] mb-2.5 ml-0.5">
      {children}
    </h4>
  );
}

export default function AICopilotPanel() {
  const [promptValue, setPromptValue] = useState('');

  return (
    <div className="flex flex-col h-full bg-[#0F0F0F] animate-slide-in-right">
      {/* Panel Header */}
      <div className="px-4 pt-4 pb-3.5 border-b border-[#1A1A1A]">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-[4px] bg-[#C9A84C]/8 border border-[#C9A84C]/15 flex items-center justify-center">
            <span className="text-[10px] text-[#C9A84C]">✦</span>
          </div>
          <div>
            <h2 className="text-[12px] font-medium text-gray-200 tracking-wide">Concierge AI</h2>
          </div>
        </div>
        <p className="text-[9px] text-gray-600 mt-1.5 ml-7 tracking-wide">Guest intelligence · Decision support</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-4">
        {/* Context Summary */}
        <div className="animate-fade-in-up stagger-1">
          <SectionLabel>{contextSummary.title}</SectionLabel>
          <div className="bg-[#141414] rounded-[6px] p-3.5 border border-[#1C1C1C]">
            <p className="text-[11px] text-gray-300 leading-[1.7]">
              {contextSummary.text}
            </p>
          </div>
        </div>

        {/* Suggested Action */}
        <div className="animate-fade-in-up stagger-2">
          <SectionLabel>{suggestedAction.title}</SectionLabel>
          <div className="bg-[#141414] rounded-[6px] p-3.5 border border-[#C9A84C]/12">
            <div className="flex items-start space-x-2.5">
              <div className="w-[22px] h-[22px] rounded-[5px] bg-[#C9A84C]/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5L20 7" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] text-gray-200 font-medium mb-1 tracking-wide">{suggestedAction.action}</p>
                <p className="text-[10px] text-gray-500 leading-[1.7]">{suggestedAction.detail}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-3 ml-8">
              <button className="text-[10px] text-[#C9A84C] bg-[#C9A84C]/8 hover:bg-[#C9A84C]/12 border border-[#C9A84C]/15 rounded-[5px] px-3 py-1.5 transition-all duration-200 hover-lift tracking-wide">
                Apply
              </button>
              <button className="text-[10px] text-gray-500 hover:text-gray-400 bg-[#181818] border border-[#1E1E1E] rounded-[5px] px-3 py-1.5 transition-colors duration-200 tracking-wide">
                Dismiss
              </button>
            </div>
          </div>
        </div>

        {/* Quick Insight */}
        <div className="animate-fade-in-up stagger-3">
          <SectionLabel>{quickInsight.title}</SectionLabel>
          <div className="bg-[#141414] rounded-[6px] p-3.5 border border-[#1C1C1C]">
            <div className="flex items-start space-x-2.5">
              <span className="text-[10px] mt-[2px] flex-shrink-0 text-gray-600">◇</span>
              <p className="text-[10px] text-gray-400 leading-[1.7]">{quickInsight.text}</p>
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
                className="text-[10px] text-gray-400 bg-[#141414] border border-[#1C1C1C] rounded-[5px] px-2.5 py-[5px] hover:border-[#C9A84C]/20 hover:text-gray-300 transition-all duration-200 tracking-wide"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prompt Composer - fixed at bottom */}
      <div className="px-4 py-3 border-t border-[#1A1A1A]">
        <div className="flex items-center space-x-2 bg-[#141414] border border-[#1C1C1C] rounded-[6px] px-3 py-2.5 focus-within:border-[#C9A84C]/20 transition-colors duration-200">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <input
            type="text"
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            placeholder="Ask about this guest…"
            className="flex-1 bg-transparent text-[11px] text-gray-300 placeholder-gray-600 focus:outline-none tracking-wide"
          />
          <button className="text-gray-600 hover:text-[#C9A84C] transition-colors duration-200">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12 14-7-4 7 4 7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
