'use client';

import { useEffect, useState } from 'react';

type Platform = 'android' | 'ios' | 'desktop' | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let deferredPrompt: any = null;

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as Record<string, unknown>).MSStream;
  const isAndroid = /Android/.test(ua);
  const isStandalone =
    ('standalone' in navigator && (navigator as unknown as Record<string, unknown>).standalone === true) ||
    window.matchMedia('(display-mode: standalone)').matches;

  if (isStandalone) return null; // already installed
  if (isIOS) return 'ios';
  if (isAndroid) return 'android';
  return 'desktop';
}

const DISMISS_KEY = 'stayscape_install_dismissed';

export default function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [visible, setVisible] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    // Don't show if user dismissed within the last 14 days
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed && Date.now() - Number(dismissed) < 14 * 24 * 60 * 60 * 1000) return;
    } catch { /* ignore */ }

    const p = detectPlatform();
    if (!p) return;
    setPlatform(p);

    if (p === 'android' || p === 'desktop') {
      // Listen for Chrome's beforeinstallprompt
      const handler = (e: Event) => {
        e.preventDefault();
        deferredPrompt = e;
        setCanInstall(true);
        show();
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    } else {
      // iOS — always show the manual instructions banner after 3s
      const t = setTimeout(show, 3000);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function show() {
    setVisible(true);
    setTimeout(() => setAnimIn(true), 16);
  }

  function dismiss() {
    setAnimIn(false);
    setTimeout(() => setVisible(false), 340);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
  }

  async function handleInstall() {
    if (!deferredPrompt) { dismiss(); return; }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === 'accepted') setCanInstall(false);
    dismiss();
  }

  if (!visible) return null;

  const steps =
    platform === 'ios'
      ? [
          { icon: '⎋', text: 'Tap the Share button in Safari' },
          { icon: '＋', text: 'Scroll down and tap "Add to Home Screen"' },
          { icon: '✓', text: 'Tap "Add" — done!' },
        ]
      : platform === 'desktop'
      ? [
          { icon: '⬇', text: 'Click "Install" in your browser address bar' },
          { icon: '✓', text: 'Confirm the install prompt' },
        ]
      : [];

  return (
    <>
      <style>{`
        @keyframes ip-slide-up {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ip-slide-down {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(100%); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.45)',
          opacity: animIn ? 1 : 0,
          transition: 'opacity 320ms ease',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 9001,
          background: '#16100A',
          border: '1px solid rgba(200,150,90,0.18)',
          borderBottom: 'none',
          borderRadius: '24px 24px 0 0',
          padding: '28px 24px 40px',
          animation: `${animIn ? 'ip-slide-up' : 'ip-slide-down'} 340ms cubic-bezier(0.34,1.2,0.64,1) both`,
          maxWidth: 480,
          margin: '0 auto',
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 999,
          background: 'rgba(253,249,242,0.15)',
          margin: '0 auto 24px',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/web-app-manifest-192x192.png"
            alt="Stayscape"
            width={48} height={48}
            style={{ borderRadius: 12, flexShrink: 0 }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <p style={{
              margin: 0, fontSize: 18, fontWeight: 600,
              color: '#FAF8F5', fontFamily: 'DM Sans, sans-serif',
            }}>
              Add Stayscape to your home screen
            </p>
            <p style={{
              margin: '4px 0 0', fontSize: 13, fontWeight: 300,
              color: 'rgba(253,249,242,0.50)',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              Install the app for a faster, fullscreen experience
            </p>
          </div>
        </div>

        {/* Steps (iOS / desktop) or single install button (Android) */}
        {(platform === 'ios' || platform === 'desktop') && (
          <div style={{
            background: 'rgba(253,249,242,0.04)',
            border: '1px solid rgba(253,249,242,0.08)',
            borderRadius: 16, padding: '14px 16px',
            marginBottom: 20,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: 'rgba(200,150,90,0.12)',
                  border: '1px solid rgba(200,150,90,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: '#C8965A',
                }}>
                  {s.icon}
                </div>
                <p style={{
                  margin: 0, fontSize: 13, color: 'rgba(253,249,242,0.75)',
                  fontFamily: 'DM Sans, sans-serif', lineHeight: 1.4,
                }}>
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {(platform === 'android' || platform === 'desktop') && canInstall && (
            <button
              onClick={() => void handleInstall()}
              style={{
                flex: 1, padding: '14px 0',
                background: '#C8965A', border: 'none', borderRadius: 999,
                color: '#0A0806', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                letterSpacing: '0.04em',
              }}
            >
              Install app
            </button>
          )}
          <button
            onClick={dismiss}
            style={{
              flex: platform === 'ios' ? 1 : 0,
              padding: '14px 20px',
              background: 'rgba(253,249,242,0.07)',
              border: '1px solid rgba(253,249,242,0.10)',
              borderRadius: 999,
              color: 'rgba(253,249,242,0.55)', fontSize: 14, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {platform === 'ios' ? 'Got it' : 'Not now'}
          </button>
        </div>
      </div>
    </>
  );
}
