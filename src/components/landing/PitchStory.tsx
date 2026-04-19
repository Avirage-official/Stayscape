'use client'

import { motion, useReducedMotion } from 'framer-motion'

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const
const CHAPTER_LABEL_CLASS = 'text-[11px] uppercase tracking-[0.2em]'
const CHAPTER_LABEL_STYLE = {
  fontFamily: "'DM Sans', sans-serif",
  color: '#c9a96e',
  opacity: 0.8,
} as const

const SCENE_MOTION = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.8, ease: REVEAL_EASE },
} as const

const FEATURE_CARDS = [
  {
    title: "Acts as the hotel's digital concierge",
    body: 'Hotel-branded recommendations, not generic search results.',
  },
  {
    title: 'AI-powered personalization',
    body: 'Recommendations adapt to guest preferences, stay context, and trip intent.',
  },
  {
    title: 'Itinerary and in-stay planning',
    body: 'Guests can organise options into a lightweight trip plan.',
  },
  {
    title: 'Connects to the PMS',
    body: 'Tied to reservation data, guest context, and operational workflows.',
  },
] as const

const JOURNEY_COLUMNS = [
  {
    number: '01',
    title: 'Pre-arrival',
    body: 'Welcome guests early with destination guidance, personalised recommendations, and itinerary inspiration before check-in.',
  },
  {
    number: '02',
    title: 'During Stay',
    body: "Act as the hotel's digital concierge for discovery, requests, planning, and relevant local or on-property offers.",
  },
  {
    number: '03',
    title: 'Post-stay',
    body: 'Extend the relationship through feedback, re-engagement, and better guest understanding for future stays.',
  },
] as const

export default function PitchStory() {
  const prefersReducedMotion = useReducedMotion()
  const disableMotion = !!prefersReducedMotion

  const lineReveal = (delay: number) =>
    disableMotion
      ? {}
      : {
          initial: { clipPath: 'inset(100% 0 0 0)' },
          whileInView: { clipPath: 'inset(0 0 0 0)' },
          viewport: { once: true, margin: '-80px' },
          transition: { duration: 0.85, ease: REVEAL_EASE, delay },
        }

  return (
    <section id="pitch-story" style={{ scrollMarginTop: '80px' }}>
      <motion.section
        className="bg-[#0f0e0d] py-28 md:py-40"
        initial={SCENE_MOTION.initial}
        whileInView={SCENE_MOTION.whileInView}
        viewport={SCENE_MOTION.viewport}
        transition={SCENE_MOTION.transition}
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-12 md:px-20">
          <span className={CHAPTER_LABEL_CLASS} style={CHAPTER_LABEL_STYLE}>
            Chapter 01
          </span>
          <div
            className="mt-6"
            style={{ width: 40, height: 1, backgroundColor: '#c9a96e' }}
          />
          <div className="mt-10 grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              {'GUEST EXPECTATIONS HAVE CHANGED'.split(' ').map((word, i) => (
                <motion.h2
                  key={`${word}-${i}`}
                  className="font-serif font-semibold leading-[0.95]"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(3.5rem, 6vw, 7rem)',
                    color: '#e8e4dc',
                  }}
                  {...lineReveal(i * 0.08)}
                >
                  {word}
                </motion.h2>
              ))}
            </div>
            <div
              className="space-y-8 border border-white/10 bg-[#161514] p-7 md:p-10 lg:col-span-5"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <div>
                <p
                  className="text-5xl leading-none md:text-[4rem]"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    color: '#c9a96e',
                  }}
                >
                  75%
                </p>
                <p
                  className="mt-2 text-[0.85rem]"
                  style={{ fontFamily: "'DM Sans', sans-serif", color: '#8a8580' }}
                >
                  of travelers want personalised experiences
                </p>
              </div>
              <div>
                <p
                  className="text-5xl leading-none md:text-[4rem]"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    color: '#c9a96e',
                  }}
                >
                  60%
                </p>
                <p
                  className="mt-2 text-[0.85rem]"
                  style={{ fontFamily: "'DM Sans', sans-serif", color: '#8a8580' }}
                >
                  willing to pay extra
                </p>
              </div>
              <div>
                <p
                  className="text-5xl leading-none md:text-[4rem]"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    color: '#c9a96e',
                  }}
                >
                  85%+
                </p>
                <p
                  className="mt-2 text-[0.85rem]"
                  style={{ fontFamily: "'DM Sans', sans-serif", color: '#8a8580' }}
                >
                  of hoteliers expect ancillary revenue &gt;20% by 2025
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="bg-[#111110] py-28 md:py-40"
        initial={SCENE_MOTION.initial}
        whileInView={SCENE_MOTION.whileInView}
        viewport={SCENE_MOTION.viewport}
        transition={SCENE_MOTION.transition}
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-12 md:px-20">
          <span className={CHAPTER_LABEL_CLASS} style={CHAPTER_LABEL_STYLE}>
            Chapter 02
          </span>
          <div className="mx-auto mt-14 max-w-5xl text-center">
            {[
              'THE OPPORTUNITY',
              'IS NOT MORE INFORMATION —',
              'IT IS BETTER GUIDANCE',
            ].map((line, i) => (
              <motion.h2
                key={line}
                className="font-serif font-semibold leading-[1.02]"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  color: '#e8e4dc',
                  fontSize: 'clamp(2rem, 5vw, 4.6rem)',
                }}
                {...lineReveal(i * 0.15)}
              >
                {line}
              </motion.h2>
            ))}
            <p
              className="mx-auto mt-8 max-w-[560px] text-base leading-7"
              style={{ color: '#8a8580', fontFamily: "'DM Sans', sans-serif" }}
            >
              For hotels, the competitive edge is no longer more information —
              it is delivering relevant, timely, branded guidance throughout the
              guest journey.
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="bg-[#0f0e0d] py-28 md:py-40"
        initial={SCENE_MOTION.initial}
        whileInView={SCENE_MOTION.whileInView}
        viewport={SCENE_MOTION.viewport}
        transition={SCENE_MOTION.transition}
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-12 md:px-20">
          <span className={CHAPTER_LABEL_CLASS} style={CHAPTER_LABEL_STYLE}>
            Chapter 03
          </span>
          <h2
            className="mt-8 text-5xl leading-tight md:text-[3rem]"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: '#e8e4dc',
            }}
          >
            WHAT STAYSCAPE DOES
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {FEATURE_CARDS.map((feature, index) => (
              <motion.article
                key={feature.title}
                className="border border-white/10 bg-[#161514] p-7 md:p-8"
                style={{
                  borderLeft: '2px solid rgba(201, 169, 110, 0.3)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
                initial={disableMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{
                  duration: 0.7,
                  ease: REVEAL_EASE,
                  delay: disableMotion ? 0 : index * 0.12,
                }}
              >
                <h3
                  className="text-xl"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    color: '#e8e4dc',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  className="mt-3 text-base leading-7"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#8a8580',
                  }}
                >
                  {feature.body}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="bg-[#111110] py-28 md:py-40"
        initial={SCENE_MOTION.initial}
        whileInView={SCENE_MOTION.whileInView}
        viewport={SCENE_MOTION.viewport}
        transition={SCENE_MOTION.transition}
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-12 md:px-20">
          <span className={CHAPTER_LABEL_CLASS} style={CHAPTER_LABEL_STYLE}>
            Chapter 04
          </span>
          <h2
            className="mx-auto mt-8 max-w-4xl text-center text-4xl leading-tight md:text-[2.5rem]"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: '#e8e4dc',
            }}
          >
            HOW STAYSCAPE FITS INTO THE GUEST JOURNEY
          </h2>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {JOURNEY_COLUMNS.map((item, index) => (
              <motion.article
                key={item.title}
                className="pb-6"
                initial={disableMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{
                  duration: 0.7,
                  ease: REVEAL_EASE,
                  delay: disableMotion ? 0 : index * 0.12,
                }}
              >
                <span
                  className="text-sm"
                  style={{
                    color: '#c9a96e',
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: '0.2em',
                  }}
                >
                  {item.number}
                </span>
                <h3
                  className="mt-3 text-2xl"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    color: '#e8e4dc',
                  }}
                >
                  {item.title}
                </h3>
                <p
                  className="mt-3 text-base leading-7"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#8a8580',
                  }}
                >
                  {item.body}
                </p>
                <motion.div
                  className="mt-6 h-px"
                  style={{ backgroundColor: '#c9a96e' }}
                  initial={disableMotion ? { width: '100%' } : { width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{
                    duration: 0.7,
                    ease: REVEAL_EASE,
                    delay: disableMotion ? 0 : index * 0.12,
                  }}
                />
              </motion.article>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="bg-[#0f0e0d] py-28 md:py-40"
        initial={SCENE_MOTION.initial}
        whileInView={SCENE_MOTION.whileInView}
        viewport={SCENE_MOTION.viewport}
        transition={SCENE_MOTION.transition}
      >
        <div className="mx-auto max-w-7xl px-6 text-center sm:px-12 md:px-20">
          <span className={CHAPTER_LABEL_CLASS} style={CHAPTER_LABEL_STYLE}>
            Chapter 05
          </span>
          <div className="relative mx-auto mt-8 inline-block">
            <h2
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#e8e4dc',
                opacity: 0.05,
                fontSize: 'clamp(5rem, 10vw, 10rem)',
              }}
            >
              WHY NOW
            </h2>
            <h2
              className="relative"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#e8e4dc',
                fontSize: 'clamp(5rem, 10vw, 10rem)',
                lineHeight: 1,
              }}
            >
              WHY NOW
            </h2>
          </div>
          <p
            className="mx-auto mt-8 max-w-3xl text-base leading-8 md:text-lg"
            style={{ fontFamily: "'DM Sans', sans-serif", color: '#8a8580' }}
          >
            Hotels are moving beyond isolated tools toward AI-first operations
            and guest engagement models. Hyper-personalization is moving toward
            a performance requirement, not a premium extra.
          </p>
          <p
            className="mx-auto mt-8 max-w-3xl text-lg italic leading-8"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#c9a96e' }}
          >
            The goal is not immediate scale — it is proving a better guest
            experience model.
          </p>
        </div>
      </motion.section>
    </section>
  )
}
