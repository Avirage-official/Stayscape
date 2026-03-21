const actions = [
  { emoji: '🛎', label: 'Room Service' },
  { emoji: '��', label: 'Housekeeping' },
  { emoji: '🚗', label: 'Valet Parking' },
  { emoji: '💆', label: 'Spa & Wellness' },
  { emoji: '⬆️', label: 'Request Upgrade' },
  { emoji: '📞', label: 'Concierge' },
];

export default function QuickActionsCard() {
  return (
    <div className="bg-[#1A1A1A] rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-300 uppercase tracking-widest mb-4">Hotel Services</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            className="flex flex-col items-center space-y-1.5 p-3 bg-[#111111] rounded-lg border border-[#2A2A2A] hover:border-[#D4AF37] hover:border-opacity-60 transition-all duration-200 group"
          >
            <span className="text-xl">{action.emoji}</span>
            <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors text-center">{action.label}</span>
          </button>
        ))}
      </div>
      <button className="w-full mt-4 text-xs text-gray-600 hover:text-gray-400 transition-colors text-center">
        Report an Issue
      </button>
    </div>
  );
}
