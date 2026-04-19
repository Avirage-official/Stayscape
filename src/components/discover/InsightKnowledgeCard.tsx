'use client';

import { motion } from 'framer-motion';
import type { InsightCard } from '@/lib/data/discover-fallback';

const cardVariants = {
  rest: { y: 0 },
  hover: { y: -3, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
};

const lineVariants = {
  rest: { scaleX: 0 },
  hover: { scaleX: 1, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
};

export default function InsightKnowledgeCard({ insight }: { insight: InsightCard }) {
  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={cardVariants}
      style={{
        width: 240,
        flexShrink: 0,
        borderRadius: 14,
        background: '#1a1916',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: 16,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'default',
        transition: 'border-color 0.2s ease',
      }}
      className="group hover:[border-color:rgba(201,169,110,0.25)]"
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: 'rgba(201,169,110,0.1)',
          border: '1px solid rgba(201,169,110,0.2)',
          borderRadius: 99,
          padding: '3px 10px',
        }}
      >
        <span style={{ fontSize: 12, lineHeight: 1, verticalAlign: 'middle', marginRight: 5 }}>{insight.icon}</span>
        <span style={{ fontSize: 10, color: '#c9a96e', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{insight.subtitle}</span>
      </div>

      <p
        style={{
          marginTop: 10,
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 15,
          fontWeight: 600,
          color: '#e8e4dc',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >{insight.title}</p>

      <p
        style={{
          marginTop: 8,
          fontFamily: 'var(--font-dm-sans), sans-serif',
          fontSize: 11,
          color: '#8a8580',
          lineHeight: 1.65,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >{insight.content}</p>

      <motion.div
        variants={lineVariants}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: '#c9a96e',
          transformOrigin: 'left',
        }}
      />
    </motion.div>
  );
}
