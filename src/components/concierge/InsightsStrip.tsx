'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalInsights } from '@/hooks/useDiscoverData';

export default function InsightsStrip() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dataLoadedRef = useRef<boolean | null>(null);
  const { insights, refetch } = useLocalInsights();

  if (dataLoadedRef.current == null) {
    dataLoadedRef.current = true;
    refetch();
  }

  return (
    <section style={{ padding: '16px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ color: '#C9A84C', fontSize: 14 }}>✦</span>
        <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.95)', margin: 0 }}>Local Insights</h3>
      </div>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
        {insights.map((insight) => {
          const expanded = expandedId === insight.id;
          return (
            <motion.button
              key={insight.id}
              type="button"
              onClick={() => setExpandedId(expanded ? null : insight.id)}
              aria-expanded={expanded}
              aria-controls={`insight-content-${insight.id}`}
              whileHover={!expanded ? { backgroundColor: 'rgba(255,255,255,0.09)' } : undefined}
              transition={{ duration: 0.2 }}
              style={{
                width: 200,
                flexShrink: 0,
                borderRadius: 12,
                background: expanded ? 'rgba(201,169,110,0.06)' : 'rgba(255,255,255,0.06)',
                border: expanded ? '1px solid rgba(201,169,110,0.3)' : '1px solid rgba(255,255,255,0.1)',
                padding: 12,
                textAlign: 'left',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, background 0.2s ease',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(201,169,110,0.1)',
                  border: '1px solid rgba(201,169,110,0.2)',
                  borderRadius: 99,
                  padding: '2px 8px',
                }}
              >
                <span style={{ fontSize: 11, lineHeight: 1, verticalAlign: 'middle', marginRight: 4 }}>{insight.icon}</span>
                <span style={{ fontSize: 9, color: '#c9a96e', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{insight.subtitle}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <p
                  style={{
                    flex: 1,
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#e8e4dc',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    margin: 0,
                  }}
                >{insight.title}</p>
                <motion.span
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0, display: 'flex' }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              </div>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    key="content"
                    id={`insight-content-${insight.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ height: 1, background: 'rgba(201,169,110,0.2)', margin: '10px 0 0' }} />
                    <p
                      style={{
                        paddingTop: 10,
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.6)',
                        lineHeight: 1.65,
                        fontFamily: 'var(--font-dm-sans), sans-serif',
                        margin: 0,
                      }}
                    >{insight.content}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
