'use client';

import { useEffect, useState, useRef } from 'react';
import SectionHeader from '@/components/admin/SectionHeader';

interface RegionCardData {
  id: string;
  name: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  radius_km: number | null;
  placesCount: number;
  enrichedCount: number;
  lastSyncAt: string | null;
  healthStatus: string;
  imagePath: string | null;
  isActive: boolean;
}

type ActionKey = 'seed' | 'enrich' | 'reverify' | 'images'; // reverify kept for type compat, not shown in UI
type ActionState = 'idle' | 'loading' | 'done' | 'error';

interface RegionAction {
  state: ActionState;
  message: string;
}

type ActionsMap = Record<string, Record<ActionKey, RegionAction>>;

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

function defaultAction(): RegionAction {
  return { state: 'idle', message: '' };
}

function defaultActions(): Record<ActionKey, RegionAction> {
  return { seed: defaultAction(), enrich: defaultAction(), reverify: defaultAction(), images: defaultAction() };
}

export default function AdminRegionsPage() {
  const [regions, setRegions] = useState<RegionCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState<Record<string, string>>({});
  const [actions, setActions] = useState<ActionsMap>({});
  const [seedExpanded, setSeedExpanded] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch('/api/admin/regions')
      .then((r) => r.json())
      .then((data) => {
        const loaded: RegionCardData[] = data.regions ?? [];
        setRegions(loaded);
        const initial: ActionsMap = {};
        for (const r of loaded) initial[r.id] = defaultActions();
        setActions(initial);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function setAction(regionId: string, key: ActionKey, patch: Partial<RegionAction>) {
    setActions((prev) => ({
      ...prev,
      [regionId]: {
        ...prev[regionId],
        [key]: { ...(prev[regionId]?.[key] ?? defaultAction()), ...patch },
      },
    }));
  }

  async function handleAction(regionId: string, key: ActionKey, region: RegionCardData, radiusKm?: number) {
    const endpoints: Record<ActionKey, string> = {
      seed: '/api/admin/sync/places',
      enrich: '/api/admin/enrich/places',
      reverify: '/api/admin/places/reverify',
      images: '/api/admin/places/fetch-images',
    };

    setAction(regionId, key, { state: 'loading', message: '' });
    if (key === 'seed') setSeedExpanded(null);

    const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY ?? '';

    const body: Record<string, unknown> = { region_id: regionId };
    if (key === 'seed') {
      if (region.latitude != null) body.latitude = region.latitude;
      if (region.longitude != null) body.longitude = region.longitude;
      const km = radiusKm ?? region.radius_km;
      if (km != null) body.radius_meters = Math.round(km * 1000);
      if (region.countryCode) body.country_code = region.countryCode;
    }

    try {
      const res = await fetch(endpoints[key], {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Request failed');

      const d = json.data ?? {};
      let msg = '';
      if (key === 'seed') {
        msg = `Seeded ${d.records_created ?? d.upserted ?? d.total ?? 0} new, ${d.records_updated ?? 0} updated`;
      } else if (key === 'enrich') {
        msg = `Enriched ${d.enriched ?? 0}${d.failed ? `, ${d.failed} failed` : ''}`;
      } else if (key === 'reverify') {
        msg = `Re-verified ${d.reverified ?? 0}${d.flagged ? `, ${d.flagged} flagged` : ''}`;
      } else if (key === 'images') {
        msg = `Updated images for ${d.updated ?? 0} places${d.skipped ? `, ${d.skipped} skipped` : ''}${d.failed ? `, ${d.failed} failed` : ''}`;
      }

      setAction(regionId, key, { state: 'done', message: msg });

      if (key === 'seed' || key === 'enrich' || key === 'reverify') {
        setTimeout(() => {
          fetch('/api/admin/regions')
            .then((r) => r.json())
            .then((data) => setRegions(data.regions ?? []))
            .catch(() => null);
        }, 1500);
      }
    } catch (err) {
      setAction(regionId, key, { state: 'error', message: (err as Error).message });
    }
  }

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
        prev.map((r) => (r.id === regionId ? { ...r, imagePath: json.path } : r)),
      );
      setUploadMsg((prev) => ({ ...prev, [regionId]: 'Saved ✓' }));
    } catch (err) {
      setUploadMsg((prev) => ({ ...prev, [regionId]: (err as Error).message }));
    } finally {
      setUploading(null);
    }
  }

  async function handleToggle(regionId: string, currentIsActive: boolean) {
    setToggling(regionId);
    setRegions((prev) =>
      prev.map((r) => (r.id === regionId ? { ...r, isActive: !currentIsActive } : r)),
    );
    try {
      const res = await fetch('/api/admin/regions', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ regionId, is_active: !currentIsActive }),
      });
      if (!res.ok) throw new Error('Failed');
    } catch {
      setRegions((prev) =>
        prev.map((r) => (r.id === regionId ? { ...r, isActive: currentIsActive } : r)),
      );
    } finally {
      setToggling(null);
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
            const uploadMessage = uploadMsg[region.id];
            const regionActions = actions[region.id] ?? defaultActions();

            return (
              <article key={region.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                {/* Header */}
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl text-white">{region.name}</h2>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/55">{region.countryCode}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize ${getHealthClass(region.healthStatus)}`}>
                      {region.healthStatus.replaceAll('_', ' ')}
                    </span>
                    <button
                      type="button"
                      disabled={toggling === region.id}
                      onClick={() => void handleToggle(region.id, region.isActive)}
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-40 ${
                        region.isActive
                          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300 hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300'
                          : 'border-amber-400/30 bg-amber-400/10 text-amber-300 hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-300'
                      }`}
                    >
                      {toggling === region.id ? '…' : region.isActive ? 'Open' : 'Closed'}
                    </button>
                  </div>
                </div>

                {/* Region image upload */}
                <div className="mb-4">
                  {imgUrl ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgUrl} alt={region.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-xl border border-dashed border-white/20 bg-white/[0.02] flex items-center justify-center mb-2">
                      <p className="text-white/30 text-xs">No region image</p>
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
                    {uploadMessage && (
                      <span className={`text-xs ${uploadMessage.startsWith('Saved') ? 'text-emerald-400' : 'text-red-400'}`}>
                        {uploadMessage}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
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

                {/* Action buttons */}
                <div className="space-y-2">
                  {/* Seed button — expands to radius picker */}
                  <div className="flex flex-col gap-1">
                    {seedExpanded === region.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] uppercase tracking-[0.12em] text-blue-400/70">Radius:</span>
                        {[25, 50, 100].map((km) => (
                          <button
                            key={km}
                            type="button"
                            onClick={() => void handleAction(region.id, 'seed', region, km)}
                            className="rounded-lg border border-blue-400/40 bg-blue-400/15 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-blue-300 hover:bg-blue-400/25 transition-colors"
                          >
                            {km} km
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setSeedExpanded(null)}
                          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-white/40 hover:text-white/60 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={regionActions.seed.state === 'loading'}
                        onClick={() => setSeedExpanded(region.id)}
                        className="self-start rounded-lg border border-blue-400/40 bg-blue-400/15 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-blue-300 disabled:opacity-40"
                      >
                        {regionActions.seed.state === 'loading' ? 'Seeding…' : '⬡ Seed from Google Places'}
                      </button>
                    )}
                    {regionActions.seed.message && (
                      <span className={`text-[11px] ${regionActions.seed.state === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {regionActions.seed.message}
                      </span>
                    )}
                  </div>

                  {/* Enrich + Fetch Images */}
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        {
                          key: 'enrich' as ActionKey,
                          label: 'Enrich with AI',
                          loadingLabel: 'Enriching…',
                          google: false,
                        },
                        {
                          key: 'images' as ActionKey,
                          label: '⬡ Fetch Google Images',
                          loadingLabel: 'Fetching images…',
                          google: true,
                        },
                      ] as const
                    ).map(({ key, label, loadingLabel, google }) => {
                      const action = regionActions[key];
                      const isLoading = action.state === 'loading';
                      return (
                        <div key={key} className="flex flex-col gap-1">
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => void handleAction(region.id, key, region)}
                            className={`rounded-lg border px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] disabled:opacity-40 ${
                              google
                                ? 'border-blue-400/40 bg-blue-400/15 text-blue-300'
                                : 'border-white/20 bg-white/[0.03] text-white/75'
                            }`}
                          >
                            {isLoading ? loadingLabel : label}
                          </button>
                          {action.message && (
                            <span className={`text-[11px] ${action.state === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                              {action.message}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
