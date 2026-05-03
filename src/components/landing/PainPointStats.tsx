'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useCountUp } from '@/hooks/useCountUp'

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const

const STATS = [
  {
    end: 23,
    decimals: 0,
    suffix: '%',
    prefix: '',
    description:
      'of hotel guests report experiencing high levels of personalisation during their stay.',
  },
  {
    end: 61,
    decimals: 0,
    suffix: '%',
    prefix: '',
    description:
      'of guests are willing to spend more with hotels that offer a personalised experience.',
  },
  {
    end: 156,
    decimals: 0,
    suffix: '',
    prefix: '$',
    description:
      'average ancillary revenue generated per concierge interaction at properties with optimised guest services.',
  },
] as const

function StatBlock({
  end,
  decimals,
  suffix,
  prefix,
  description,
  index,
  disabled,
}: {
  end: number
  decimals: number
  suffix: string
  prefix: string
  description: string
  index: number
  disabled: boolean
}) {
  const { ref, formattedValue } = useCountUp({ end, decimals, suffix })

  return (
    <motion.div
      initial={disabled ? false : { clipPath: 'inset(100% 0 0 0)' }}
      whileInView={{ clipPath: 'inset(0 0 0 0)' }}
      viewport={{ once: true }}
      transition={
        disabled
          ? undefined
          : { duration: 0.7, ease: REVEAL_EASE, delay: index * 0.1 }
      }
    >
      <span
        ref={ref as React.RefObject<HTMLSpanElement>}
        className="block text-6xl md:text-7xl lg:text-8xl"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 700,
          color: '#c9a96e',
          lineHeight: 1.1,
        }}
      >
        {prefix}
        {formattedValue}
      </span>
      <p
        className="mt-4 max-w-[400px] text-base"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          color: '#8a8580',
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
    </motion.div>
  )
}

export default function PainPointStats() {
  const prefersReducedMotion = useReducedMotion()
  const disabled = !!prefersReducedMotion

  return (
    <section
      className="w-full"
      style={{
        background: '#0f0e0d',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-12 md:px-20 md:py-32 lg:px-28">
        <div className="grid grid-cols-1 gap-20 md:grid-cols-12 md:gap-y-28">

          {/* Stat 1 */}
          <div className="md:col-span-6 lg:col-span-5">
            <StatBlock {...STATS[0]} index={0} disabled={disabled} />
          </div>

          {/* Stat 2 — offset right */}
          <div className="md:col-start-6 md:col-span-6 lg:col-start-7 lg:col-span-5">
            <StatBlock {...STATS[1]} index={1} disabled={disabled} />
          </div>

          {/* Pull quote */}
          <div className="md:col-span-12">
            <motion.blockquote
              className="max-w-2xl"
              style={{
                borderLeft: '3px solid #c9a96e',
                paddingLeft: '24px',
              }}
              initial={disabled ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={
                disabled
                  ? undefined
                  : { duration: 0.7, ease: REVEAL_EASE, delay: 0.2 }
              }
            >
              <p
                className="text-2xl md:text-3xl"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: 'italic',
                  color: '#e8e4dc',
                  lineHeight: 1.4,
                }}
              >
                Guests don&rsquo;t lack options. They lack a trusted guide.
              </p>
            </motion.blockquote>
          </div>

          {/* Stat 3 */}
          <div className="md:col-span-7 lg:col-span-5">
            <StatBlock {...STATS[2]} index={2} disabled={disabled} />
          </div>

        </div>

        {/* Source attribution */}
        <p
          className="mt-20 text-[11px]"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: 'rgba(255,255,255,0.22)',
            lineHeight: 1.6,
          }}
        >
          Sources: Medallia Hotel Personalization Study, 2024 (1,749 hotel guests) ·
          Vynta Hospitality Benchmarks, 2025
        </p>

      </div>
    </section>
  )
}
