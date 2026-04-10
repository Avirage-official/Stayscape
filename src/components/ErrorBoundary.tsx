'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isHovered: boolean;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, isHovered: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, isHovered: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[Stayscape ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle ?? 'This Section';
      const message = this.state.error?.message ?? 'An unexpected error occurred.';

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            flex: '1',
            padding: '32px 24px',
            background: 'var(--background)',
            color: 'var(--text-primary)',
          }}
        >
          <div
            style={{
              maxWidth: '360px',
              width: '100%',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '12px',
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '32px', lineHeight: 1 }}>⚠️</span>
            <p
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Something went wrong with the {title}
            </p>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                maxWidth: '100%',
              }}
            >
              {message}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null, isHovered: false })}
              onMouseEnter={() => this.setState({ isHovered: true })}
              onMouseLeave={() => this.setState({ isHovered: false })}
              style={{
                marginTop: '8px',
                padding: '8px 20px',
                borderRadius: '6px',
                border: '1px solid var(--gold)',
                background: this.state.isHovered
                  ? 'color-mix(in srgb, var(--gold) 12%, transparent)'
                  : 'transparent',
                color: 'var(--gold)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
