import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Stayscape — AI Travel Concierge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #0f0e17 50%, #1a1a2e 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle grid lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        {/* Gold radial glow */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Map pin icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C8A97E"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" fill="#C8A97E" stroke="none" />
          </svg>
        </div>

        {/* Logo / Brand name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#C8A97E',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          Stayscape
        </div>

        {/* Divider */}
        <div
          style={{
            width: 64,
            height: 1,
            background:
              'linear-gradient(90deg, transparent, #C8A97E, transparent)',
            marginBottom: 20,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 400,
            color: 'rgba(232,230,225,0.75)',
            letterSpacing: '0.04em',
            textAlign: 'center',
            maxWidth: 700,
          }}
        >
          Your AI-Powered Travel Concierge
        </div>

        {/* Bottom decoration dots */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'rgba(201,168,76,0.4)',
            }}
          />
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#C8A97E',
            }}
          />
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'rgba(201,168,76,0.4)',
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
