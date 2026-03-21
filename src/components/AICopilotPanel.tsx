'use client';

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
    <h4 className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.12em] mb-2">
      {children}
    </h4>
  );
}

function Divider() {
  return <div className="border-t border-[#1E1E1E] my-3" />;
}

export default function AICopilotPanel() {
  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide bg-[#111111]">
      {/* Panel Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#1E1E1E]">
        <div className="flex items-center space-x-2">
          <span className="text-[#D4AF37] text-sm">✦</span>
          <h2 className="text-sm font-medium text-gray-200 tracking-wide">AI Copilot</h2>
        </div>
        <p className="text-[10px] text-gray-600 mt-1 ml-5">Guest intelligence · Decision support</p>
      </div>

      <div className="px-4 py-3 space-y-0">
        {/* Context Summary */}
        <div>
          <SectionLabel>{contextSummary.title}</SectionLabel>
          <div className="bg-[#161616] rounded-lg p-3 border border-[#1E1E1E]">
            <p className="text-[12px] text-gray-300 leading-relaxed">
              {contextSummary.text}
            </p>
          </div>
        </div>

        <Divider />

        {/* Suggested Action */}
        <div>
          <SectionLabel>{suggestedAction.title}</SectionLabel>
          <div className="bg-[#161616] rounded-lg p-3 border border-[#D4AF37]/15">
            <div className="flex items-start space-x-2.5">
              <div className="w-6 h-6 rounded-md bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div>
                <p className="text-[12px] text-gray-200 font-medium mb-1">{suggestedAction.action}</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">{suggestedAction.detail}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-3">
              <button className="text-[11px] text-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/15 border border-[#D4AF37]/20 rounded-md px-3 py-1.5 transition-colors">
                Apply
              </button>
              <button className="text-[11px] text-gray-500 hover:text-gray-400 bg-[#1A1A1A] border border-[#1E1E1E] rounded-md px-3 py-1.5 transition-colors">
                Dismiss
              </button>
            </div>
          </div>
        </div>

        <Divider />

        {/* Quick Insight */}
        <div>
          <SectionLabel>{quickInsight.title}</SectionLabel>
          <div className="bg-[#161616] rounded-lg p-3 border border-[#1E1E1E]">
            <div className="flex items-start space-x-2.5">
              <span className="text-gray-600 text-xs mt-0.5 flex-shrink-0">💡</span>
              <p className="text-[11px] text-gray-400 leading-relaxed">{quickInsight.text}</p>
            </div>
          </div>
        </div>

        <Divider />

        {/* Quick Prompts */}
        <div>
          <SectionLabel>Quick Prompts</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                className="text-[11px] text-gray-400 bg-[#161616] border border-[#1E1E1E] rounded-full px-3 py-1.5 hover:border-[#D4AF37]/30 hover:text-gray-300 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <Divider />

        {/* Minimal Input */}
        <div className="pb-4">
          <div className="flex items-center space-x-2 bg-[#161616] border border-[#1E1E1E] rounded-lg px-3 py-2.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="text-[11px] text-gray-600">Ask about this guest…</span>
          </div>
        </div>
      </div>
    </div>
  );
}
