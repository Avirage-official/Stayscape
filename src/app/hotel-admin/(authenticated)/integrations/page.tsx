'use client';

/**
 * /hotel-admin/integrations
 *
 * PMS Integration settings for hotel admins.
 * Shows current connection status, allows changing provider + credentials,
 * and provides a live "Test connection" button.
 */

import { useEffect, useState } from 'react';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { Loader2, Check, Plug, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '600'], style: ['normal', 'italic'], display: 'swap' });
const dmSans    = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600'], display: 'swap' });

const PROVIDERS = [
  { value: 'manual',  label: 'Manual entry',  desc: 'No PMS — hotel staff enter stays directly in Stayscape.' },
  { value: 'mews',    label: 'Mews',           desc: 'Connect via the Mews Connector API. Reservations sync automatically.' },
];

const MEWS_DEMO_ENDPOINT = 'https://api.mews-demo.com';
const MEWS_LIVE_ENDPOINT = 'https://api.mews.com';

type HealthStatus = 'healthy' | 'degraded' | 'error' | null;

interface IntegrationConfig {
  provider: string;
  api_endpoint: string | null;
  has_credentials: boolean;
  has_webhook_secret: boolean;
  is_active: boolean;
  health_status: HealthStatus;
  last_health_check: string | null;
  mews_enterprise_id: string | null;
}

async function getToken(): Promise<string | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;
  return (await sb.auth.getSession()).data.session?.access_token ?? null;
}

function healthBadge(status: HealthStatus) {
  if (!status) return null;
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    healthy: { label: 'Connected', color: '#22c55e', icon: <CheckCircle2 size={13} /> },
    degraded: { label: 'Degraded', color: '#f59e0b', icon: <AlertTriangle size={13} /> },
    error:    { label: 'Error',    color: '#ef4444', icon: <XCircle size={13} /> },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: s.color, fontSize: 12, fontWeight: 500 }}>
      {s.icon} {s.label}
    </span>
  );
}

export default function IntegrationsPage() {
  const [config, setConfig]     = useState<IntegrationConfig | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [testing, setTesting]   = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);

  // Form fields
  const [provider, setProvider]               = useState('manual');
  const [isActive, setIsActive]               = useState(false);
  const [apiEndpoint, setApiEndpoint]         = useState('');
  const [clientToken, setClientToken]         = useState('');
  const [accessToken, setAccessToken]         = useState('');
  const [webhookSecret, setWebhookSecret]     = useState('');
  const [enterpriseId, setEnterpriseId]       = useState('');
  const [changeCredentials, setChangeCredentials] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/hotel-admin/integrations', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const json = (await res.json()) as { data: IntegrationConfig };
        const d = json.data;
        setConfig(d);
        setProvider(d.provider);
        setIsActive(d.is_active);
        setApiEndpoint(d.api_endpoint ?? '');
        setEnterpriseId(d.mews_enterprise_id ?? '');
        // Don't pre-fill secrets — show masked indicator instead
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  const save = async () => {
    setSaving(true); setError(null); setSaved(false); setTestResult(null);
    try {
      const token = await getToken();
      const body: Record<string, unknown> = {
        provider,
        is_active: isActive,
        api_endpoint: apiEndpoint.trim() || null,
        mews_enterprise_id: enterpriseId.trim() || null,
      };
      if (changeCredentials || !config?.has_credentials) {
        body.client_token = clientToken.trim();
        body.access_token = accessToken.trim();
      }
      if (changeCredentials || !config?.has_webhook_secret) {
        body.webhook_secret = webhookSecret.trim() || null;
      }

      const res = await fetch('/api/hotel-admin/integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? 'Save failed');
      }
      setSaved(true);
      setChangeCredentials(false);
      // Refresh config to pick up has_credentials
      setConfig((c) => c ? { ...c, provider, is_active: isActive, api_endpoint: apiEndpoint || null, mews_enterprise_id: enterpriseId || null, has_credentials: c.has_credentials || !!(clientToken && accessToken) } : null);
      setTimeout(() => setSaved(false), 2400);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true); setTestResult(null);
    try {
      const token = await getToken();
      const res = await fetch('/api/hotel-admin/integrations/test', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = (await res.json()) as { data: { ok: boolean; error?: string } };
      setTestResult(json.data);
    } catch {
      setTestResult({ ok: false, error: 'Network error — could not reach server.' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={20} className="animate-spin text-white/20" />
      </div>
    );
  }

  const inputCls = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-white/20 outline-none focus:border-[#C9A84C]/50 transition-colors';
  const labelCls = 'block text-[11px] font-medium tracking-widest uppercase text-white/30 mb-1.5';
  const isMews   = provider === 'mews';

  return (
    <div className={`${dmSans.className} p-6 md:p-8 max-w-2xl`}>
      {/* Header */}
      <div className="mb-8">
        <p className={`${cormorant.className} text-[28px] font-400 text-white/90 leading-tight`}>Integrations</p>
        <p className="text-[13px] text-white/30 font-light mt-1">Connect your Property Management System so reservations sync automatically.</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[13px] text-red-400">{error}</div>
      )}

      {/* ── Current status banner ── */}
      {config && config.provider !== 'manual' && (
        <div className="mb-6 flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div>
            <p className="text-[12px] font-semibold text-white/60 uppercase tracking-widest mb-0.5">Current connection</p>
            <p className="text-[13px] text-white/80 font-medium">
              {PROVIDERS.find((p) => p.value === config.provider)?.label ?? config.provider}
              {config.api_endpoint && <span className="text-white/30 font-normal ml-2 text-[12px]">· {config.api_endpoint}</span>}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {healthBadge(config.health_status)}
            {config.last_health_check && (
              <span className="text-[11px] text-white/20">
                Checked {new Date(config.last_health_check).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Section: Provider ── */}
      <div className="mb-5 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white/30"><Plug size={15} /></span>
          <p className="text-[13px] font-semibold text-white/70">PMS Provider</p>
        </div>
        <p className="text-[12px] text-white/25 font-light leading-relaxed mb-5">
          Choose your property management system. Changing provider will not delete existing stays.
        </p>

        <div className="flex flex-col gap-2 mb-5">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => { setProvider(p.value); setTestResult(null); }}
              className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                provider === p.value
                  ? 'border-[#C9A84C]/40 bg-[#C9A84C]/08'
                  : 'border-white/[0.07] bg-white/[0.02] hover:border-white/20'
              }`}
            >
              <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center ${
                provider === p.value ? 'border-[#C9A84C] bg-[#C9A84C]' : 'border-white/20'
              }`}>
                {provider === p.value && <div className="w-1.5 h-1.5 rounded-full bg-[#0d0d0d]" />}
              </div>
              <div>
                <p className="text-[13px] font-medium text-white/80">{p.label}</p>
                <p className="text-[12px] text-white/30 font-light mt-0.5">{p.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between py-3 border-t border-white/[0.06]">
          <div>
            <p className="text-[13px] text-white/70 font-medium">Enable sync</p>
            <p className="text-[11px] text-white/25 mt-0.5">Turn off to pause all PMS syncing without removing credentials.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className={`relative w-10 h-5.5 rounded-full transition-colors ${isActive ? 'bg-[#C9A84C]' : 'bg-white/10'}`}
            style={{ width: 40, height: 22 }}
            aria-pressed={isActive}
          >
            <span
              className="absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white transition-transform"
              style={{ transform: isActive ? 'translateX(18px)' : 'translateX(0)' }}
            />
          </button>
        </div>
      </div>

      {/* ── Section: Mews credentials ── */}
      {isMews && (
        <div className="mb-5 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
          <p className="text-[13px] font-semibold text-white/70 mb-1">Mews Connection Details</p>
          <p className="text-[12px] text-white/25 font-light leading-relaxed mb-5">
            Found in your Mews dashboard under Marketplace → Stayscape connector. Use the demo endpoint for testing.
          </p>

          {/* API Endpoint */}
          <div className="mb-4">
            <label className={labelCls}>API Endpoint</label>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setApiEndpoint(MEWS_DEMO_ENDPOINT)}
                className={`px-3 py-1.5 rounded-md text-[11px] border transition-colors ${apiEndpoint === MEWS_DEMO_ENDPOINT ? 'border-[#C9A84C]/40 text-[#C9A84C] bg-[#C9A84C]/08' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                Demo / Sandbox
              </button>
              <button type="button" onClick={() => setApiEndpoint(MEWS_LIVE_ENDPOINT)}
                className={`px-3 py-1.5 rounded-md text-[11px] border transition-colors ${apiEndpoint === MEWS_LIVE_ENDPOINT ? 'border-[#C9A84C]/40 text-[#C9A84C] bg-[#C9A84C]/08' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                Production
              </button>
            </div>
            <input className={inputCls} type="url" placeholder="https://api.mews-demo.com" value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} />
          </div>

          {/* Enterprise ID */}
          <div className="mb-4">
            <label className={labelCls}>Enterprise ID</label>
            <input className={inputCls} type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={enterpriseId} onChange={(e) => setEnterpriseId(e.target.value)} />
            <p className="mt-1.5 text-[11px] text-white/20">Your Mews property UUID — needed to match incoming webhooks to your property.</p>
          </div>

          {/* Credentials */}
          {config?.has_credentials && !changeCredentials ? (
            <div className="mb-4 flex items-center justify-between px-3.5 py-3 rounded-lg bg-green-500/[0.06] border border-green-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                <span className="text-[13px] text-white/60">API credentials saved</span>
              </div>
              <button type="button" onClick={() => setChangeCredentials(true)}
                className="text-[11px] text-[#C9A84C] hover:text-[#C9A84C]/80 transition-colors">
                Change
              </button>
            </div>
          ) : (
            <>
              {config?.has_credentials && (
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[12px] text-white/40">Enter new credentials to replace the existing ones.</p>
                  <button type="button" onClick={() => setChangeCredentials(false)}
                    className="text-[11px] text-white/30 hover:text-white/50">Cancel</button>
                </div>
              )}
              <div className="mb-4">
                <label className={labelCls}>Client Token</label>
                <input className={inputCls} type="password" placeholder="Issued by Mews to Stayscape partner"
                  value={clientToken} onChange={(e) => setClientToken(e.target.value)} autoComplete="off" />
              </div>
              <div className="mb-4">
                <label className={labelCls}>Access Token</label>
                <input className={inputCls} type="password" placeholder="Issued per-property when hotel connects"
                  value={accessToken} onChange={(e) => setAccessToken(e.target.value)} autoComplete="off" />
              </div>
            </>
          )}

          {/* Webhook Secret */}
          {config?.has_webhook_secret && !changeCredentials ? (
            <div className="flex items-center justify-between px-3.5 py-3 rounded-lg bg-green-500/[0.06] border border-green-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                <span className="text-[13px] text-white/60">Webhook secret saved</span>
              </div>
              <button type="button" onClick={() => setChangeCredentials(true)}
                className="text-[11px] text-[#C9A84C] hover:text-[#C9A84C]/80 transition-colors">
                Change
              </button>
            </div>
          ) : (
            <div>
              <label className={labelCls}>Webhook Secret <span className="normal-case tracking-normal font-normal">(optional)</span></label>
              <input className={inputCls} type="password" placeholder="Used to verify Mews webhook signatures"
                value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} autoComplete="off" />
              <p className="mt-1.5 text-[11px] text-white/20">Set this in Mews → Webhooks → Stayscape. Strongly recommended for production.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Save + Test row ── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Test connection */}
        {isMews && config?.has_credentials && (
          <button
            type="button"
            onClick={testConnection}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium border border-white/10 text-white/50 hover:text-white/70 hover:border-white/20 transition-colors"
          >
            {testing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {testing ? 'Testing…' : 'Test connection'}
          </button>
        )}

        <div className="flex-1" />

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors"
          style={{
            background: saved ? 'rgba(22,163,74,0.15)' : 'rgba(201,168,76,0.12)',
            color: saved ? '#4ade80' : '#C9A84C',
            border: `1px solid ${saved ? 'rgba(22,163,74,0.25)' : 'rgba(201,168,76,0.2)'}`,
          }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : null}
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
        </button>
      </div>

      {/* Test result */}
      {testResult && (
        <div className={`mt-4 flex items-start gap-2.5 px-4 py-3 rounded-lg border text-[13px] ${
          testResult.ok
            ? 'bg-green-500/[0.06] border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {testResult.ok
            ? <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />
            : <XCircle size={15} className="flex-shrink-0 mt-0.5" />}
          <span>{testResult.ok ? 'Connection successful — Mews API is reachable and credentials are valid.' : (testResult.error ?? 'Connection failed.')}</span>
        </div>
      )}

      {/* Mews setup guide */}
      {isMews && (
        <div className="mt-6 px-4 py-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <p className="text-[12px] font-semibold text-white/40 uppercase tracking-widest mb-3">Setup checklist</p>
          <ol className="space-y-2 text-[12px] text-white/30 font-light leading-relaxed list-none">
            {[
              'In Mews → Marketplace, find and connect the Stayscape integration to get your Access Token.',
              'Add the Stayscape webhook URL in Mews → Webhooks: https://[your-domain]/api/pms/webhook/mews',
              'Copy the webhook secret Mews generates and paste it above.',
              'Use the demo endpoint and demo credentials to test before switching to production.',
              'Once saved, click "Test connection" to verify everything is working.',
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-medium text-white/25">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
