'use client';

import React from 'react';

export type StayTab = 'concierge' | 'discover' | 'itinerary';

export interface StayBottomTabBarProps {
  activeTab: StayTab;
  onTabChange: (tab: StayTab) => void;
}

interface TabDef {
  id: StayTab;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

function iconProps(active: boolean) {
  return {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: active ? 2 : 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
}

const TABS: TabDef[] = [
  {
    id: 'concierge',
    label: 'Concierge',
    icon: (active) => (
      <svg {...iconProps(active)}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    id: 'discover',
    label: 'Discover',
    icon: (active) => (
      <svg {...iconProps(active)}>
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    ),
  },
  {
    id: 'itinerary',
    label: 'Itinerary',
    icon: (active) => (
      <svg {...iconProps(active)}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

function StayBottomTabBar({ activeTab, onTabChange }: StayBottomTabBarProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <div
            key={tab.id}
            role="button"
            tabIndex={0}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTabChange(tab.id);
              }
            }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              cursor: 'pointer',
              position: 'relative',
              color: active ? 'var(--gold)' : 'var(--text-muted)',
            }}
          >
            {active ? (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '25%',
                  right: '25%',
                  height: 3,
                  borderRadius: 2,
                  background: 'var(--gold)',
                }}
                aria-hidden="true"
              />
            ) : null}
            {tab.icon(active)}
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.05em',
              }}
            >
              {tab.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default StayBottomTabBar;
