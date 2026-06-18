import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Your stay — powered by Stayscape'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

type Props = {
  params: Promise<{ propertySlug: string; stayId: string }>
}

export default async function Image({ params }: Props) {
  const { propertySlug } = await params
  const propertyName = slugToTitle(propertySlug)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #0f0e17 50%, #1a1a2e 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle grid */}
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
            width: 700,
            height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.10) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Content — left-aligned card feel */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 96px',
            height: '100%',
            position: 'relative',
          }}
        >
          {/* Stayscape wordmark */}
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: '#C8A97E',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 40,
            }}
          >
            Stayscape
          </div>

          {/* Eyebrow label */}
          <div
            style={{
              fontSize: 18,
              fontWeight: 400,
              color: 'rgba(232,230,225,0.5)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            Your stay at
          </div>

          {/* Property name */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: '#E8E6E1',
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              marginBottom: 32,
              maxWidth: 860,
            }}
          >
            {propertyName}
          </div>

          {/* Gold divider */}
          <div
            style={{
              width: 64,
              height: 2,
              background: 'linear-gradient(90deg, #C8A97E, transparent)',
              marginBottom: 28,
            }}
          />

          {/* Subtitle */}
          <div
            style={{
              fontSize: 22,
              fontWeight: 400,
              color: 'rgba(232,230,225,0.6)',
              letterSpacing: '0.02em',
            }}
          >
            Concierge · Discovery · Requests
          </div>
        </div>

        {/* Bottom decoration dots */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 96,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(201,168,76,0.4)' }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C8A97E' }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(201,168,76,0.4)' }} />
        </div>
      </div>
    ),
    { ...size },
  )
}
