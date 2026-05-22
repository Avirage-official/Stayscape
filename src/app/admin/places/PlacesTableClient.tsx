'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { PlaceRow } from './page';

const CATEGORIES = [
  'dining', 'nightlife', 'shopping', 'nature', 'historical',
  'wellness', 'family', 'events', 'local_spots', 'fun_places', 'top_places',
];

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

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

  function toggle(id: string, row: PlaceRow) {
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
      if (!edits[id]) setEdits((e) => ({ ...e, [id]: toEditState(row) }));
    }
  }

  function setField(id: string, field: keyof EditState, value: string | boolean) {
    setEdits((e) => ({ ...e, [id]: { ...e[id], [field]: value } }));
    setSaveStates((s) => ({ ...s, [id]: 'idle' }));
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
        throw new Error((body.error as string | undefined) ?? String(res.status));
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
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-sm text-white/40">No places match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/[0.06] rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      {rows.map((row) => {
        const isOpen = expanded === row.id;
        const edit = edits[row.id];
        const saveState = saveStates[row.id] ?? 'idle';
        const saveError = saveErrors[row.id];

        return (
          <div key={row.id}>
            {/* Row header — click to expand */}
            <button
              type="button"
              onClick={() => toggle(row.id, row)}
              className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-white/[0.025] transition-colors"
            >
              {/* Thumb */}
              <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-white/5">
                {row.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{row.name}</p>
                <p className="text-xs text-white/40 mt-0.5">{row.region} · {row.category} · {row.city}</p>
              </div>

              {/* Badges */}
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${
                  row.enriched ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${row.enriched ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {row.enriched ? 'Enriched' : 'Pending'}
                </span>
                {row.is_featured && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#C9A84C]/15 text-[#C9A84C]">Featured</span>
                )}
              </div>

              {/* Chevron */}
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`shrink-0 text-white/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Expanded editor */}
            {isOpen && edit && (
              <div className="border-t border-white/[0.06] bg-black/20 px-5 py-5 space-y-5">

                {/* Images section */}
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Images</p>
                  <div className="flex gap-3 flex-wrap">
                    {/* Primary image preview */}
                    <div className="relative group">
                      <div className="h-24 w-36 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                        {edit.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={edit.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-white/20 text-xs">No image</div>
                        )}
                      </div>
                      <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white/60 px-1.5 py-0.5 rounded">Primary</span>
                    </div>
                    {/* Extra images */}
                    {edit.image_urls.split('\n').map((u) => u.trim()).filter(Boolean).map((url, i) => (
                      <div key={i} className="h-24 w-36 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Primary Image URL">
                      <input
                        type="url"
                        value={edit.image_url}
                        onChange={(e) => setField(row.id, 'image_url', e.target.value)}
                        placeholder="https://…"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Additional Image URLs (one per line)">
                      <textarea
                        rows={3}
                        value={edit.image_urls}
                        onChange={(e) => setField(row.id, 'image_urls', e.target.value)}
                        placeholder={"https://…\nhttps://…"}
                        className={`${inputCls} resize-none py-2`}
                      />
                    </Field>
                  </div>
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
                    <Field label="Phone">
                      <input type="text" value={edit.phone} onChange={(e) => setField(row.id, 'phone', e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Website">
                      <input type="url" value={edit.website} onChange={(e) => setField(row.id, 'website', e.target.value)} placeholder="https://…" className={inputCls} />
                    </Field>
                    <Field label="Booking URL">
                      <input type="url" value={edit.booking_url} onChange={(e) => setField(row.id, 'booking_url', e.target.value)} placeholder="https://…" className={inputCls} />
                    </Field>
                  </div>
                </div>

                <hr className="border-white/[0.06]" />

                {/* Editorial */}
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Editorial</p>
                  <div className="grid gap-3">
                    <Field label="Editorial Summary">
                      <textarea rows={3} value={edit.editorial_summary} onChange={(e) => setField(row.id, 'editorial_summary', e.target.value)} className={`${inputCls} resize-none py-2`} />
                    </Field>
                    <Field label="Description">
                      <textarea rows={4} value={edit.description} onChange={(e) => setField(row.id, 'description', e.target.value)} className={`${inputCls} resize-none py-2`} />
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

                {/* Flags */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={edit.is_featured}
                      onChange={(e) => setField(row.id, 'is_featured', e.target.checked)}
                      className="h-4 w-4 accent-[#C9A84C] cursor-pointer"
                    />
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
