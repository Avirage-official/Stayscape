'use client';

interface MapLocationButtonProps {
  locationState: 'idle' | 'requesting' | 'granted' | 'denied';
  onRequestLocation: () => void;
}

export default function MapLocationButton({ locationState, onRequestLocation }: MapLocationButtonProps) {
  return (
    <div className="absolute bottom-4 right-4 z-10">
      <button
        type="button"
        onClick={onRequestLocation}
        disabled={locationState === 'requesting' || locationState === 'denied'}
        aria-label={
          locationState === 'granted'
            ? 'Re-center on my location'
            : locationState === 'requesting'
            ? 'Getting your location…'
            : locationState === 'denied'
            ? 'Location access denied'
            : 'Show my location'
        }
        title={
          locationState === 'denied'
            ? 'Location access was denied. Please enable it in browser settings.'
            : undefined
        }
        style={{
          width: 44,
          height: 44,
          borderRadius: 9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: locationState === 'denied' ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          background:
            locationState === 'granted'
              ? 'rgba(59,130,246,0.15)'
              : 'var(--dashboard-card-bg)',
          border:
            locationState === 'granted'
              ? '1px solid rgba(59,130,246,0.4)'
              : locationState === 'denied'
              ? '1px solid var(--border-subtle)'
              : '1px solid var(--dashboard-card-border)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
          color:
            locationState === 'granted'
              ? '#3B82F6'
              : locationState === 'denied'
              ? 'var(--text-faint)'
              : 'var(--text-muted)',
          opacity: locationState === 'requesting' ? 0.65 : 1,
        }}
      >
        {locationState === 'requesting' ? (
          /* Loading spinner */
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{ animation: 'locSpin 0.9s linear infinite' }}
          >
            <circle cx="12" cy="12" r="10" stroke="rgba(232,230,225,0.2)" strokeWidth="2" fill="none" />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        ) : locationState === 'denied' ? (
          /* Denied — crossed-out location icon */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
            <line x1="3" y1="3" x2="21" y2="21" />
          </svg>
        ) : (
          /* Crosshair / target icon */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="2" x2="12" y2="7" />
            <line x1="12" y1="17" x2="12" y2="22" />
            <line x1="2" y1="12" x2="7" y2="12" />
            <line x1="17" y1="12" x2="22" y2="12" />
          </svg>
        )}
      </button>
      <style>{`
        @keyframes locSpin { to { transform: rotate(360deg); } }
        @keyframes sonarPing {
          0%   { width: 0;    height: 0;    opacity: 1; }
          100% { width: 40px; height: 40px; opacity: 0; }
        }
        @keyframes filterSlideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
