'use client';

import { useEffect, useState, useRef } from 'react';
import SectionHeader from '@/components/admin/SectionHeader';

interface RegionCardData {
  id: string;
  name: string;
  countryCode: string;
  placesCount: number;
  enrichedCount: number;
  lastSyncAt: string | null;
  healthStatus: string;
  imagePath: string | null;
}

function formatDate(date: string | null): string {
  if (!date) return 'Never';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Never';
  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getHealthClass(status: string): string {
  if (status === 'healthy') return 'border-emerald-400/30 bg-emerald-400/15 text-emerald-300';
  if (status === 'warning') return 'border-amber-400/30 bg-amber-400/15 text-amber-300';
  return 'border-red-400/30 bg-red-400/15 text-red-300';
}

function getImagePublicUrl(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/region-images/${path}`;
}

export default function AdminRegionsPage() {
  const [regions, setRegions] = useState<RegionCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState<Record<string, string>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch('/api/admin/regions')
      .then((r) => r.json())
      .then((data) => {
        setRegions(data.regions ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleUpload(regionId: string, file: File) {
    setUploading(regionId);
    setUploadMsg((prev) => ({ ...prev, [regionId]: '' }));

    const form = new FormData();
    form.append('file', file);
    form.append('regionId', regionId);

    try {
      const res = await fetch('/api/admin/regions/upload-image', {
        method: 'POST',
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Upload failed');

      setRegions((prev) =>
        prev.map((r) =>
          r.id === regionId ? { ...r, imagePath: json.path } : r,
        ),
      );
      setUploadMsg((prev) => ({ ...prev, [regionId]: 'Saved ✓' }));
    } catch (err) {
      setUploadMsg((prev) => ({ ...prev, [regionId]: (err as Error).message }));
    } finally {
      setUploading(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <SectionHeader title="Regions" />
        <p className="text-white/40 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Regions" />

      <div className="grid gap-4 lg:grid-cols-2">
        {regions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/50">
            No regions found.
          </div>
        ) : (
          regions.map((region) => {
            const imgUrl = getImagePublicUrl(region.imagePath);
            const isUploading = uploading === region.id;
            const msg = uploadMsg[region.id];

            return (
              <article key={region.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl text-white">{region.name}</h2>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/55">{region.countryCode}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize ${getHealthClass(region.healthStatus)}`}
                  >
                    {region.healthStatus.replaceAll('_', ' ')}
                  </span>
                </div>

                {/* Image preview + upload */}
                <div className="mb-4">
                  {imgUrl ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgUrl} alt={region.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-xl border border-dashed border-white/20 bg-white/[0.02] flex items-center justify-center mb-2">
                      <p className="text-white/30 text-xs">No image</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      ref={(el) => { fileRefs.current[region.id] = el; }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(region.id, file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileRefs.current[region.id]?.click()}
                      className="rounded-lg border border-white/20 bg-white/[0.03] px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-white/75 disabled:opacity-40"
                    >
                      {isUploading ? 'Uploading…' : imgUrl ? 'Replace image' : 'Upload image'}
                    </button>
                    {msg && (
                      <span className={`text-xs ${msg.startsWith('Saved') ? 'text-emerald-400' : 'text-red-400'}`}>
                        {msg}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-5 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">Places</p>
                    <p className="font-serif text-xl text-white">{region.placesCount}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">Enriched</p>
                    <p className="font-serif text-xl text-white">{region.enrichedCount}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">Coverage</p>
                    <p className="font-serif text-xl text-white">
                      {region.placesCount === 0
                        ? '0%'
                        : `${Math.round((region.enrichedCount / region.placesCount) * 100)}%`}
                    </p>
                  </div>
                </div>

                <p className="mb-4 text-sm text-white/60">Last sync: {formatDate(region.lastSyncAt)}</p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-[#C9A84C]/40 bg-[#C9A84C]/15 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-[#C9A84C]"
                  >
                    Trigger Sync
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-white/20 bg-white/[0.03] px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-white/75"
                  >
                    Enrich Pending
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
