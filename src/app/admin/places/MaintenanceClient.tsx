'use client';

import React, { useState } from 'react';
import type { PlaceRow } from './page';
import PlacesTableClient from './PlacesTableClient';

export type MaintenanceRow = PlaceRow & {
  enrichment_error: string | null;
  ai_enriched_at: string | null;
};

type ActionState = 'idle' | 'loading' | 'done' | 'error';

function IssueChip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: color + '20', color, border: `1px solid ${color}40`,
    }}>
      {label}
    </span>
  );
}

function ActionBtn({ label, state, onClick }: { label: string; state: ActionState; onClick: () => void }) {
  const done = state === 'done';
  const loading = state === 'loading';
  const err = state === 'error';
  const color = done ? '#6CC87A' : err ? '#E07070' : '#C9A84C';
  return (
    <button
      onClick={onClick}
      disabled={loading || done}
      style={{
        padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
        border: `1px solid ${color}40`,
        background: color + '18', color,
        cursor: loading || done ? 'default' : 'pointer',
        opacity: loading ? 0.65 : 1,
        transition: 'all 150ms ease',
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? '…' : done ? '✓ Done' : err ? '✗ Failed' : label}
    </button>
  );
}

function MaintenanceEntry({ row, selected, onToggle }: { row: MaintenanceRow; selected: boolean; onToggle: () => void }) {
  const [enrichState, setEnrichState] = useState<ActionState>('idle');
  const [imageState, setImageState] = useState<ActionState>('idle');
  const [errorDetail, setErrorDetail] = useState<string | null>(row.enrichment_error);
  const [imageErrorDetail, setImageErrorDetail] = useState<string | null>(null);

  async function callAction(path: string, setState: (s: ActionState) => void, onSuccess?: () => void) {
    setState('loading');
    try {
      const res = await fetch(path, { method: 'POST' });
      const body = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setState('done');
      onSuccess?.();
    } catch (err) {
      setState('error');
      const msg = err instanceof Error ? err.message : 'Failed';
      if (path.includes('re-enrich')) setErrorDetail(msg);
      else setImageErrorDetail(msg);
    }
  }

  const issues = [
    !row.image_url && 'No image',
    !row.ai_enriched_at && 'Not enriched',
    errorDetail && 'Enrich error',
  ].filter(Boolean) as string[];

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: selected ? 'rgba(201,168,76,0.04)' : undefined }}>
      {/* Issue banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 12, padding: '12px 16px',
        background: 'rgba(255,255,255,0.015)',
      }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          style={{ width: 14, height: 14, accentColor: '#C9A84C', cursor: 'pointer', flexShrink: 0, marginTop: 3 }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {issues.map(i => (
              <IssueChip
                key={i}
                label={i}
                color={i === 'No image' ? '#C8965A' : i === 'Not enriched' ? '#7B9FD4' : '#E07070'}
              />
            ))}
          </div>
          {errorDetail && (
            <p style={{
              margin: 0, fontSize: 11, color: '#E07070',
              background: 'rgba(224,112,112,0.08)', border: '1px solid rgba(224,112,112,0.18)',
              borderRadius: 7, padding: '5px 10px',
              fontFamily: 'monospace', wordBreak: 'break-word', maxWidth: 480,
            }}>
              Enrich error: {errorDetail}
            </p>
          )}
          {imageErrorDetail && (
            <p style={{
              margin: errorDetail ? '4px 0 0' : 0, fontSize: 11, color: '#C8965A',
              background: 'rgba(200,150,90,0.08)', border: '1px solid rgba(200,150,90,0.18)',
              borderRadius: 7, padding: '5px 10px',
              fontFamily: 'monospace', wordBreak: 'break-word', maxWidth: 480,
            }}>
              Image error: {imageErrorDetail}
            </p>
          )}
        </div>

        {/* Quick-fix action buttons */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {!row.image_url && (
            <ActionBtn
              label="Fetch image"
              state={imageState}
              onClick={() => void callAction(`/api/admin/places/${row.id}/fetch-image`, setImageState, () => setImageErrorDetail(null))}
            />
          )}
          {(!row.ai_enriched_at || errorDetail) && (
            <ActionBtn
              label="Re-enrich"
              state={enrichState}
              onClick={() => void callAction(`/api/admin/places/${row.id}/re-enrich`, setEnrichState, () => setErrorDetail(null))}
            />
          )}
        </div>
      </div>

      {/* Full editor — reuse PlacesTableClient with single row */}
      <PlacesTableClient rows={[row]} />
    </div>
  );
}

export default function MaintenanceClient({ rows }: { rows: MaintenanceRow[] }) {
  const [filter, setFilter] = useState<'all' | 'no_image' | 'not_enriched' | 'error'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

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

  const allChecked = filtered.length > 0 && filtered.every(r => selected.has(r.id));
  const someChecked = filtered.some(r => selected.has(r.id)) && !allChecked;

  function toggleAll() {
    setSelected(allChecked
      ? new Set([...selected].filter(id => !filtered.find(r => r.id === id)))
      : new Set([...selected, ...filtered.map(r => r.id)])
    );
  }

  function toggleOne(id: string) {
    setSelected((s: Set<string>) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function bulkDelete() {
    const ids = (Array.from(selected) as string[]).filter(id => filtered.some(r => r.id === id));
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} place(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      const res = await fetch('/api/admin/places/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        setSelected((s: Set<string>) => { const n = new Set(s); ids.forEach(id => n.delete(id)); return n; });
        // Refresh the page to re-fetch maintenance data
        window.location.reload();
      }
    } finally {
      setBulkDeleting(false);
    }
  }

  const selectedInView = filtered.filter(r => selected.has(r.id)).length;

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

      {/* Bulk delete bar */}
      {selectedInView > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', marginBottom: 8,
          borderRadius: 12, border: '1px solid rgba(220,80,60,0.25)',
          background: 'rgba(220,80,60,0.08)',
        }}>
          <span style={{ fontSize: 13, color: 'rgba(220,80,60,0.9)' }}>
            {selectedInView} place{selectedInView !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => void bulkDelete()}
            disabled={bulkDeleting}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: '#DC503C', border: 'none', color: '#fff',
              cursor: bulkDeleting ? 'default' : 'pointer',
              opacity: bulkDeleting ? 0.6 : 1,
            }}
          >
            {bulkDeleting ? 'Deleting…' : `Delete ${selectedInView}`}
          </button>
        </div>
      )}

      {/* List */}
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
            No issues in this category.
          </div>
        ) : (
          <>
            {/* Select-all header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.015)',
            }}>
              <input
                type="checkbox"
                checked={allChecked}
                ref={(el: HTMLInputElement | null) => { if (el) el.indeterminate = someChecked; }}
                onChange={toggleAll}
                style={{ width: 14, height: 14, accentColor: '#C9A84C', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)' }}>
                Select all
              </span>
            </div>
            {filtered.map(row => (
              <MaintenanceEntry
                key={row.id}
                row={row}
                selected={selected.has(row.id)}
                onToggle={() => toggleOne(row.id)}
              />
            ))}
          </>
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
