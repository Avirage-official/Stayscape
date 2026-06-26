'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { PlaceRow } from './page';

const CATEGORIES = [
  'dining', 'nightlife', 'shopping', 'nature', 'historical',
  'wellness', 'family', 'events', 'local_spots', 'fun_places', 'top_places',
];

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type UploadState = 'idle' | 'uploading' | 'done' | 'error';
type ImageActionState = 'idle' | 'busy' | 'error';

interface EditState {
  name: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  website: string;
  booking_url: string;
  image_url: string;
  image_urls: string;
  editorial_summary: string;
  description: string;
  rating: string;
  price_level: string;
  is_featured: boolean;
  vibes: string;
  best_for: string;
  recommended_duration: string;
}

function toEditState(row: PlaceRow): EditState {
  return {
    name: row.name,
    category: row.category,
    city: row.city,
    address: row.address,
    phone: row.phone ?? '',
    website: row.website ?? '',
    booking_url: row.booking_url ?? '',
    image_url: row.image_url ?? '',
    image_urls: (row.image_urls ?? []).join('\n'),
    editorial_summary: row.editorial_summary ?? '',
    description: row.description ?? '',
    rating: row.rating != null ? String(row.rating) : '',
    price_level: row.price_level != null ? String(row.price_level) : '',
    is_featured: row.is_featured,
    vibes: (row.vibes ?? []).join(', '),
    best_for: (row.best_for ?? []).join(', '),
    recommended_duration: row.recommended_duration ?? '',
  };
}

export default function PlacesTableClient({ rows: initialRows }: { rows: PlaceRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [rows, setRows] = useState(initialRows);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({});
  const [imageActionStates, setImageActionStates] = useState<Record<string, ImageActionState>>({});
  const primaryInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const extraInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const allChecked = rows.length > 0 && selected.size === rows.length;
  const someChecked = selected.size > 0 && !allChecked;

  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));
  }

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggle(id: string, row: PlaceRow) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!edits[id]) setEdits((e) => ({ ...e, [id]: toEditState(row) }));
  }

  function setField(id: string, field: keyof EditState, value: string | boolean) {
    setEdits((e) => ({ ...e, [id]: { ...e[id], [field]: value } }));
    setSaveStates((s) => ({ ...s, [id]: 'idle' }));
  }

  async function deleteSingle(id: string) {
    if (!confirm('Delete this place? This cannot be undone.')) return;
    const res = await fetch(`/api/admin/places/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    if (res.ok) {
      setRows((r) => r.filter((row) => row.id !== id));
      setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
      startTransition(() => router.refresh());
    }
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} place(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    const ids = Array.from(selected);
    const res = await fetch('/api/admin/places/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      setRows((r) => r.filter((row) => !ids.includes(row.id)));
      setSelected(new Set());
      startTransition(() => router.refresh());
    }
    setBulkDeleting(false);
  }

  async function uploadImage(placeId: string, file: File, slot: 'primary' | 'extra') {
    const key = `${placeId}_${slot}`;
    setUploadStates((s) => ({ ...s, [key]: 'uploading' }));
    const form = new FormData();
    form.append('file', file);
    form.append('placeId', placeId);
    form.append('slot', slot);
    try {
      const res = await fetch('/api/admin/places/upload-image', { method: 'POST', body: form });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed');
      setUploadStates((s) => ({ ...s, [key]: 'done' }));
      setEdits((e) => {
        const edit = e[placeId];
        if (!edit) return e;
        if (slot === 'primary') return { ...e, [placeId]: { ...edit, image_url: data.url! } };
        const existing = edit.image_urls.trim();
        return { ...e, [placeId]: { ...edit, image_urls: existing ? `${existing}\n${data.url!}` : data.url! } };
      });
      setTimeout(() => setUploadStates((s) => ({ ...s, [key]: 'idle' })), 2000);
    } catch {
      setUploadStates((s) => ({ ...s, [key]: 'error' }));
    }
  }

  async function deleteImage(placeId: string, url: string, slot: 'primary' | 'extra') {
    const key = `${placeId}_del_${url}`;
    setImageActionStates((s) => ({ ...s, [key]: 'busy' }));
    try {
      const res = await fetch('/api/admin/places/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, url, slot }),
      });
      const data = await res.json() as { image_url?: string | null; image_urls?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Delete failed');
      // Update local edit state with new image lists from server
      setEdits((e) => {
        const edit = e[placeId];
        if (!edit) return e;
        return {
          ...e,
          [placeId]: {
            ...edit,
            image_url: data.image_url ?? '',
            image_urls: (data.image_urls ?? []).join('\n'),
          },
        };
      });
      // Also update the row thumbnail
      setRows((r) => r.map((row) => row.id === placeId ? { ...row, image_url: data.image_url ?? null } : row));
    } catch {
      setImageActionStates((s) => ({ ...s, [key]: 'error' }));
    } finally {
      setImageActionStates((s) => { const next = { ...s }; delete next[key]; return next; });
    }
  }

  async function setAsPrimary(placeId: string, url: string) {
    const key = `${placeId}_promote_${url}`;
    setImageActionStates((s) => ({ ...s, [key]: 'busy' }));
    try {
      const res = await fetch('/api/admin/places/set-primary-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, url }),
      });
      const data = await res.json() as { image_url?: string; image_urls?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setEdits((e) => {
        const edit = e[placeId];
        if (!edit) return e;
        return {
          ...e,
          [placeId]: {
            ...edit,
            image_url: data.image_url ?? '',
            image_urls: (data.image_urls ?? []).join('\n'),
          },
        };
      });
      setRows((r) => r.map((row) => row.id === placeId ? { ...row, image_url: data.image_url ?? null } : row));
    } catch {
      setImageActionStates((s) => ({ ...s, [key]: 'error' }));
    } finally {
      setImageActionStates((s) => { const next = { ...s }; delete next[key]; return next; });
    }
  }

  async function handleSave(id: string) {
    const edit = edits[id];
    if (!edit) return;
    setSaveStates((s) => ({ ...s, [id]: 'saving' }));
    setSaveErrors((e) => { const next = { ...e }; delete next[id]; return next; });

    const payload = {
      name: edit.name.trim(),
      category: edit.category,
      city: edit.city.trim(),
      address: edit.address.trim(),
      phone: edit.phone.trim() || null,
      website: edit.website.trim() || null,
      booking_url: edit.booking_url.trim() || null,
      image_url: edit.image_url.trim() || null,
      image_urls: edit.image_urls.split('\n').map((u) => u.trim()).filter(Boolean),
      editorial_summary: edit.editorial_summary.trim() || null,
      description: edit.description.trim(),
      rating: edit.rating ? Number(edit.rating) : null,
      price_level: edit.price_level ? Number(edit.price_level) : null,
      is_featured: edit.is_featured,
      vibes: edit.vibes.split(',').map((v) => v.trim()).filter(Boolean),
      best_for: edit.best_for.split(',').map((v) => v.trim()).filter(Boolean),
      recommended_duration: edit.recommended_duration.trim() || null,
    };

    try {
      const res = await fetch(`/api/admin/places/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? String(res.status));
      }
      setSaveStates((s) => ({ ...s, [id]: 'saved' }));
      setRows((r) => r.map((row) => row.id === id ? { ...row, ...payload, enriched: Boolean(payload.editorial_summary) } : row));
      startTransition(() => router.refresh());
      setTimeout(() => setSaveStates((s) => ({ ...s, [id]: 'idle' })), 2500);
    } catch (err) {
      setSaveStates((s) => ({ ...s, [id]: 'error' }));
      setSaveErrors((e) => ({ ...e, [id]: err instanceof Error ? err.message : 'Save failed' }));
    }
  }

  if (rows.length === 0) {
    return <div className="flex items-center justify-center py-16"><p className="text-sm text-white/40">No places match the current filters.</p></div>;
  }

  return (
    <div className="space-y-2">
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5">
          <p className="text-sm text-red-300">{selected.size} place{selected.size > 1 ? 's' : ''} selected</p>
          <button
            type="button"
            disabled={bulkDeleting}
            onClick={() => void bulkDelete()}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            {bulkDeleting ? 'Deleting…' : `Delete ${selected.size}`}
          </button>
        </div>
      )}

      <div className="divide-y divide-white/[0.06] rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {/* Select-all header */}
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.06] bg-white/[0.015]">
          <input
            type="checkbox"
            checked={allChecked}
            ref={(el) => { if (el) el.indeterminate = someChecked; }}
            onChange={toggleAll}
            className="h-4 w-4 accent-[#C9A84C] cursor-pointer"
          />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Select all</span>
        </div>

        {rows.map((row) => {
          const isOpen = expanded === row.id;
          const edit = edits[row.id];
          const saveState = saveStates[row.id] ?? 'idle';
          const saveError = saveErrors[row.id];
          const isSelected = selected.has(row.id);
          const primaryUploadState = uploadStates[`${row.id}_primary`] ?? 'idle';
          const extraUploadState = uploadStates[`${row.id}_extra`] ?? 'idle';

          return (
            <div key={row.id} className={isSelected ? 'bg-[#C9A84C]/[0.04]' : ''}>
              {/* Row */}
              <div className="flex items-center gap-3 px-5 py-3.5">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOne(row.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 accent-[#C9A84C] cursor-pointer shrink-0"
                />

                {/* Expand button */}
                <button
                  type="button"
                  onClick={() => toggle(row.id, row)}
                  className="flex flex-1 items-center gap-4 text-left hover:opacity-80 transition-opacity min-w-0"
                >
                  {/* Thumb */}
                  <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-white/5">
                    {row.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{row.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">{row.region} · {row.category} · {row.city}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${
                      row.enriched ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${row.enriched ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {row.enriched ? 'Enriched' : 'Pending'}
                    </span>
                    {row.is_featured && <span className="text-xs px-2 py-0.5 rounded-full bg-[#C9A84C]/15 text-[#C9A84C]">Featured</span>}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`shrink-0 text-white/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Delete single */}
                <button
                  type="button"
                  onClick={() => void deleteSingle(row.id)}
                  className="shrink-0 p-2 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete place"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>

              {/* Expanded editor */}
              {isOpen && edit && (
                <div className="border-t border-white/[0.06] bg-black/20 px-5 py-5 space-y-5">

                  {/* Images */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">
                        Images
                        <span className="ml-2 text-white/20 normal-case font-normal tracking-normal">
                          {(() => {
                            const total = (edit.image_url ? 1 : 0) + edit.image_urls.split('\n').filter(u => u.trim()).length;
                            return `${total} image${total !== 1 ? 's' : ''}`;
                          })()}
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                      {/* Primary image */}
                      {edit.image_url ? (
                        <div className="space-y-1.5">
                          <div className="relative h-24 w-36 rounded-lg overflow-hidden bg-white/5 border border-[#C9A84C]/30 group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={edit.image_url} alt="" className="h-full w-full object-cover" />
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                title="Delete primary image"
                                onClick={() => void deleteImage(row.id, edit.image_url, 'primary')}
                                disabled={imageActionStates[`${row.id}_del_${edit.image_url}`] === 'busy'}
                                className="flex h-7 w-7 items-center justify-center rounded-md bg-red-500/80 hover:bg-red-500 text-white disabled:opacity-50 transition-colors"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                              </button>
                            </div>
                            {primaryUploadState === 'uploading' && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                <span className="text-xs text-white">Uploading…</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <span className="flex-1 text-center text-[9px] font-semibold uppercase tracking-widest text-[#C9A84C]/70">Primary</span>
                            <button
                              type="button"
                              onClick={() => primaryInputRefs.current[row.id]?.click()}
                              className="text-[9px] text-white/30 hover:text-white/60 transition-colors"
                              title="Replace primary image"
                            >Replace</button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="h-24 w-36 rounded-lg border border-dashed border-white/15 bg-white/[0.02] flex items-center justify-center">
                            <span className="text-[10px] text-white/20">No primary</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => primaryInputRefs.current[row.id]?.click()}
                            className="w-full rounded-md border border-white/10 bg-white/[0.03] py-1 text-[10px] text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
                          >
                            {primaryUploadState === 'done' ? '✓ Uploaded' : 'Upload primary'}
                          </button>
                        </div>
                      )}

                      <input
                        ref={(el) => { primaryInputRefs.current[row.id] = el; }}
                        type="file" accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadImage(row.id, file, 'primary');
                        }}
                      />

                      {/* Extra images */}
                      {edit.image_urls.split('\n').map((u) => u.trim()).filter(Boolean).map((imgUrl) => (
                        <div key={imgUrl} className="space-y-1.5">
                          <div className="relative h-24 w-36 rounded-lg overflow-hidden bg-white/5 border border-white/10 group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              {/* Set as primary */}
                              <button
                                type="button"
                                title="Set as primary"
                                onClick={() => void setAsPrimary(row.id, imgUrl)}
                                disabled={imageActionStates[`${row.id}_promote_${imgUrl}`] === 'busy'}
                                className="flex h-7 w-7 items-center justify-center rounded-md bg-[#C9A84C]/80 hover:bg-[#C9A84C] text-black disabled:opacity-50 transition-colors"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                              </button>
                              {/* Delete extra */}
                              <button
                                type="button"
                                title="Delete image"
                                onClick={() => void deleteImage(row.id, imgUrl, 'extra')}
                                disabled={imageActionStates[`${row.id}_del_${imgUrl}`] === 'busy'}
                                className="flex h-7 w-7 items-center justify-center rounded-md bg-red-500/80 hover:bg-red-500 text-white disabled:opacity-50 transition-colors"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                              </button>
                            </div>
                          </div>
                          <p className="text-center text-[9px] text-white/20">Extra</p>
                        </div>
                      ))}

                      {/* Add extra image slot */}
                      <div className="space-y-1.5">
                        <div
                          className="h-24 w-36 rounded-lg border border-dashed border-white/15 bg-white/[0.02] flex items-center justify-center cursor-pointer hover:border-white/30 hover:bg-white/[0.04] transition-colors"
                          onClick={() => extraInputRefs.current[row.id]?.click()}
                        >
                          {extraUploadState === 'uploading' ? (
                            <span className="text-[10px] text-white/40">Uploading…</span>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20"><path d="M12 5v14M5 12h14"/></svg>
                          )}
                        </div>
                        <input
                          ref={(el) => { extraInputRefs.current[row.id] = el; }}
                          type="file" accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void uploadImage(row.id, file, 'extra');
                          }}
                        />
                        <p className="text-center text-[9px] text-white/20">
                          {extraUploadState === 'done' ? '✓ Added' : 'Add image'}
                        </p>
                      </div>
                    </div>

                    {/* Manual URL fallback (collapsed by default) */}
                    <details className="group">
                      <summary className="cursor-pointer text-[10px] text-white/25 hover:text-white/50 transition-colors select-none list-none flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-open:rotate-90 transition-transform"><path d="M9 18l6-6-6-6"/></svg>
                        Edit URLs manually
                      </summary>
                      <div className="mt-2 grid gap-3 md:grid-cols-2">
                        <Field label="Primary Image URL">
                          <input type="url" value={edit.image_url} onChange={(e) => setField(row.id, 'image_url', e.target.value)} placeholder="https://…" className={inputCls} />
                        </Field>
                        <Field label="Additional Image URLs (one per line)">
                          <textarea rows={3} value={edit.image_urls} onChange={(e) => setField(row.id, 'image_urls', e.target.value)} placeholder={"https://…\nhttps://…"} className={`${inputCls} resize-none py-2 h-auto`} />
                        </Field>
                      </div>
                    </details>
                  </div>

                  <hr className="border-white/[0.06]" />

                  {/* Core details */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Core Details</p>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Field label="Name">
                        <input type="text" value={edit.name} onChange={(e) => setField(row.id, 'name', e.target.value)} className={inputCls} />
                      </Field>
                      <Field label="Category">
                        <select value={edit.category} onChange={(e) => setField(row.id, 'category', e.target.value)} className={inputCls}>
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </Field>
                      <Field label="City">
                        <input type="text" value={edit.city} onChange={(e) => setField(row.id, 'city', e.target.value)} className={inputCls} />
                      </Field>
                      <Field label="Address" className="md:col-span-2">
                        <input type="text" value={edit.address} onChange={(e) => setField(row.id, 'address', e.target.value)} className={inputCls} />
                      </Field>
                      <Field label="Price Level (1–4)">
                        <input type="number" min={1} max={4} value={edit.price_level} onChange={(e) => setField(row.id, 'price_level', e.target.value)} className={inputCls} />
                      </Field>
                    </div>
                  </div>

                  <hr className="border-white/[0.06]" />

                  {/* Contact & links */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Contact & Links</p>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Field label="Phone"><input type="text" value={edit.phone} onChange={(e) => setField(row.id, 'phone', e.target.value)} className={inputCls} /></Field>
                      <Field label="Website"><input type="url" value={edit.website} onChange={(e) => setField(row.id, 'website', e.target.value)} placeholder="https://…" className={inputCls} /></Field>
                      <Field label="Booking URL"><input type="url" value={edit.booking_url} onChange={(e) => setField(row.id, 'booking_url', e.target.value)} placeholder="https://…" className={inputCls} /></Field>
                    </div>
                  </div>

                  <hr className="border-white/[0.06]" />

                  {/* Editorial */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Editorial</p>
                    <div className="grid gap-3">
                      <Field label="Editorial Summary">
                        <textarea rows={3} value={edit.editorial_summary} onChange={(e) => setField(row.id, 'editorial_summary', e.target.value)} className={`${inputCls} resize-none py-2 h-auto`} />
                      </Field>
                      <Field label="Description">
                        <textarea rows={4} value={edit.description} onChange={(e) => setField(row.id, 'description', e.target.value)} className={`${inputCls} resize-none py-2 h-auto`} />
                      </Field>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Recommended Duration">
                          <input type="text" value={edit.recommended_duration} onChange={(e) => setField(row.id, 'recommended_duration', e.target.value)} placeholder="e.g. 1–2 hours" className={inputCls} />
                        </Field>
                        <Field label="Vibes (comma-separated)">
                          <input type="text" value={edit.vibes} onChange={(e) => setField(row.id, 'vibes', e.target.value)} placeholder="romantic, scenic…" className={inputCls} />
                        </Field>
                        <Field label="Best For (comma-separated)">
                          <input type="text" value={edit.best_for} onChange={(e) => setField(row.id, 'best_for', e.target.value)} placeholder="couples, solo…" className={inputCls} />
                        </Field>
                      </div>
                    </div>
                  </div>

                  <hr className="border-white/[0.06]" />

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={edit.is_featured} onChange={(e) => setField(row.id, 'is_featured', e.target.checked)} className="h-4 w-4 accent-[#C9A84C] cursor-pointer" />
                      <span className="text-sm text-white/70">Featured</span>
                    </label>
                  </div>

                  {/* Save bar */}
                  <div className="flex items-center justify-between pt-1">
                    {saveError && <p className="text-xs text-red-400">{saveError}</p>}
                    {!saveError && saveState === 'saved' && <p className="text-xs text-emerald-400">✓ Saved successfully</p>}
                    {!saveError && saveState !== 'saved' && <span />}
                    <button
                      type="button"
                      disabled={saveState === 'saving'}
                      onClick={() => void handleSave(row.id)}
                      className="h-9 rounded-lg bg-[#C9A84C] px-5 text-xs font-semibold text-black transition-colors hover:bg-[#d4b35f] disabled:opacity-50"
                    >
                      {saveState === 'saving' ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 h-9 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#C9A84C]/40 focus:bg-white/[0.06] transition-colors';
