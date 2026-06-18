'use client';

import { useState } from 'react';

export interface MaintenanceRow {
  id: string;
  name: string;
  region: string;
  category: string;
  city: string;
  image_url: string | null;
  ai_enriched_at: string | null;
  enrichment_error: string | null;
}

type ActionState = 'idle' | 'loading' | 'done' | 'error';

function IssueTag({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
        background: color + '20', color, border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
}

function PlaceRow({ row }: { row: MaintenanceRow }) {
  const [enrichState, setEnrichState] = useState<ActionState>('idle');
  const [imageState, setImageState] = useState<ActionState>('idle');
  const [clearState, setClearState] = useState<ActionState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(row.enrichment_error);

  const adminKey = typeof window !== 'undefined'
    ? document.cookie.split('; ').find(r => r.startsWith('admin_key='))?.split('=')[1] ?? ''
    : '';

  async function callAction(
    path: string,
    setState: (s: ActionState) => void,
    onDone?: () => void,
  ) {
    setState('loading');
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setState('done');
      onDone?.();
    } catch (err) {
      setState('error');
      if (path.includes('re-enrich')) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed');
      }
    }
  }

  const issues = [
    !row.image_url && 'No image',
    !row.ai_enriched_at && 'Not enriched',
    errorMsg && 'Enrich error',
  ].filter(Boolean) as string[];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 12,
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        alignItems: 'start',
      }}
    >
      {/* Left: info */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#FAF8F5' }}>{row.name}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)' }}>
            {row.city} · {row.region} · {row.category.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Issue chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: errorMsg ? 8 : 0 }}>
          {issues.map(i => (
            <IssueTag
              key={i}
              label={i}
              color={i === 'No image' ? '#C8965A' : i === 'Not enriched' ? '#7B9FD4' : '#E07070'}
            />
          ))}
        </div>

        {/* Error detail */}
        {errorMsg && (
          <p style={{
            margin: '6px 0 0', fontSize: 12, color: '#E07070',
            background: 'rgba(224,112,112,0.08)', border: '1px solid rgba(224,112,112,0.18)',
            borderRadius: 8, padding: '6px 10px',
            fontFamily: 'monospace', wordBreak: 'break-word',
          }}>
            {errorMsg}
          </p>
        )}
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        {!row.image_url && (
          <ActionButton
            label="Fetch image"
            state={imageState}
            onClick={() => callAction(`/api/admin/places/${row.id}/fetch-image`, setImageState)}
          />
        )}
        {(!row.ai_enriched_at || errorMsg) && (
          <ActionButton
            label="Re-enrich"
            state={enrichState}
            onClick={() => callAction(`/api/admin/places/${row.id}/re-enrich`, setEnrichState, () => setErrorMsg(null))}
          />
        )}
        {errorMsg && (
          <ActionButton
            label="Clear error"
            state={clearState}
            variant="ghost"
            onClick={() => callAction(`/api/admin/places/${row.id}/re-enrich`, setClearState, () => setErrorMsg(null))}
          />
        )}
      </div>
    </div>
  );
}

function ActionButton({
  label, state, onClick, variant = 'primary',
}: {
  label: string;
  state: ActionState;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
}) {
  const done = state === 'done';
  const loading = state === 'loading';
  const err = state === 'error';

  const bg = done ? 'rgba(100,200,120,0.15)'
    : err ? 'rgba(224,112,112,0.15)'
    : variant === 'ghost' ? 'rgba(255,255,255,0.05)'
    : 'rgba(201,168,76,0.15)';

  const color = done ? '#6CC87A'
    : err ? '#E07070'
    : variant === 'ghost' ? 'rgba(255,255,255,0.45)'
    : '#C9A84C';

  return (
    <button
      onClick={onClick}
      disabled={loading || done}
      style={{
        padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
        border: `1px solid ${color}40`,
        background: bg, color,
        cursor: loading || done ? 'default' : 'pointer',
        opacity: loading ? 0.7 : 1,
        transition: 'all 150ms ease',
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? '…' : done ? '✓ Done' : err ? '✗ Failed' : label}
    </button>
  );
}

export default function MaintenanceClient({ rows }: { rows: MaintenanceRow[] }) {
  const [filter, setFilter] = useState<'all' | 'no_image' | 'not_enriched' | 'error'>('all');

  const filtered = rows.filter(r => {
    if (filter === 'no_image') return !r.image_url;
    if (filter === 'not_enriched') return !r.ai_enriched_at;
    if (filter === 'error') return !!r.enrichment_error;
    return true;
  });

  const counts = {
    all: rows.length,
    no_image: rows.filter(r => !r.image_url).length,
    not_enriched: rows.filter(r => !r.ai_enriched_at).length,
    error: rows.filter(r => !!r.enrichment_error).length,
  };

  return (
    <div>
      {/* Sub-filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(
          [
            { key: 'all', label: 'All issues' },
            { key: 'no_image', label: 'No image' },
            { key: 'not_enriched', label: 'Not enriched' },
            { key: 'error', label: 'Error' },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
              border: filter === key ? '1px solid rgba(201,168,76,0.5)' : '1px solid rgba(255,255,255,0.12)',
              background: filter === key ? 'rgba(201,168,76,0.12)' : 'transparent',
              color: filter === key ? '#C9A84C' : 'rgba(255,255,255,0.55)',
              cursor: 'pointer',
            }}
          >
            {label}
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 18, height: 18, borderRadius: 999, padding: '0 4px',
              fontSize: 10, fontWeight: 700,
              background: filter === key ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.08)',
              color: filter === key ? '#C9A84C' : 'rgba(255,255,255,0.45)',
            }}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.02)',
      }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: '48px 24px', textAlign: 'center',
            color: 'rgba(255,255,255,0.35)', fontSize: 14,
          }}>
            No issues found in this category.
          </div>
        ) : (
          filtered.map(row => <PlaceRow key={row.id} row={row} />)
        )}
      </div>

      {filtered.length > 0 && (
        <p style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.30)' }}>
          {filtered.length} place{filtered.length !== 1 ? 's' : ''} with issues
        </p>
      )}
    </div>
  );
}
