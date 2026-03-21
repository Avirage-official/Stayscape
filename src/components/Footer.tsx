'use client';

const quickActions = [
  { icon: '🛎', label: 'Service' },
  { icon: '🚗', label: 'Valet' },
  { icon: '💆', label: 'Spa' },
  { icon: '🍽', label: 'Dining' },
  { icon: '📞', label: 'Call' },
];

export default function Footer() {
  return (
    <footer className="flex items-center justify-between px-6 h-[38px] bg-[#0D0D0D] border-t border-[#181818] flex-shrink-0">
      {/* Quick actions */}
      <div className="flex items-center space-x-1">
        {quickActions.map((action) => (
          <button
            key={action.label}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-[10px] text-gray-500 hover:text-gray-300 hover:bg-[#161616] rounded-[5px] transition-colors duration-200"
            title={action.label}
          >
            <span className="text-[11px]">{action.icon}</span>
            <span className="hidden xl:inline">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
          <span className="text-[10px] text-gray-600">System Online</span>
        </div>
        <span className="text-[10px] text-gray-700 font-mono">v2.4</span>
      </div>
    </footer>
  );
}
