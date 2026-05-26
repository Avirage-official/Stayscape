'use client';

import { useEffect, useRef, useState } from 'react';

const GOLD = '#C8965A';
const GOLD_DIM = 'rgba(200,150,90,0.18)';
const BG = '#181412';
const SURFACE = 'rgba(255,255,255,0.05)';
const SURFACE_2 = 'rgba(255,255,255,0.09)';
const BORDER = 'rgba(255,255,255,0.10)';
const BORDER_2 = 'rgba(255,255,255,0.18)';
const TEXT = '#FAF8F5';
const TEXT_MUTED = 'rgba(250,248,245,0.45)';
const TEXT_FAINT = 'rgba(250,248,245,0.22)';

export interface PickerPlace {
  id: string;
  name: string;
  category?: string | null;
  image_url?: string | null;
}

interface SlimItinerary {
  id: string;
  title: string | null;
  stayid: string | null;
  startdate: string | null;
  enddate: string | null;
}

interface ItineraryPickerSheetProps {
  place: PickerPlace;
  onClose: () => void;
  onAdded: () => void;
  getBearerToken: () => Promise<string | null>;
}

type Step = 'select' | 'create' | 'date';

function formatDateDisplay(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ItineraryPickerSheet({
  place,
  onClose,
  onAdded,
  getBearerToken,
}: ItineraryPickerSheetProps) {
  const [step, setStep] = useState<Step>('select');
  const [visible, setVisible] = useState(false);

  // Step 1
  const [itineraries, setItineraries] = useState<SlimItinerary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Step 2 — create
  const [newTitle, setNewTitle] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Step 3 — date + time for this place
  const [selectedItinId, setSelectedItinId] = useState<string | null>(null);
  const [selectedItin, setSelectedItin] = useState<SlimItinerary | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') handleClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step === 'create') setTimeout(() => titleInputRef.current?.focus(), 80);
  }, [step]);

  useEffect(() => {
    async function load() {
      setListLoading(true); setListError(null);
      const token = await getBearerToken();
      if (!token) { setListLoading(false); return; }
      try {
        const res = await fetch('/api/customer/itineraries', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const json = await res.json() as { itineraries: SlimItinerary[] };
        setItineraries(json.itineraries.filter(i => !i.stayid));
      } catch {
        setListError('Could not load itineraries.');
      } finally {
        setListLoading(false);
      }
    }
    void load();
  }, [getBearerToken]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 260);
  }

  function pickItinerary(itin: SlimItinerary) {
    setSelectedItinId(itin.id);
    setSelectedItin(itin);
    // Default date to start date if set, otherwise today
    setSelectedDate(itin.startdate ?? new Date().toISOString().split('T')[0]);
    setStep('date');
  }

  async function handleCreate() {
    const title = newTitle.trim();
    if (!title) { setCreateError('Please enter a name.'); return; }
    if (!newStartDate) { setCreateError('Please choose a start date.'); return; }
    if (!newEndDate) { setCreateError('Please choose an end date.'); return; }
    if (newEndDate < newStartDate) { setCreateError('End date must be after start date.'); return; }

    setCreating(true); setCreateError(null);
    const token = await getBearerToken();
    if (!token) { setCreating(false); setCreateError('Session expired.'); return; }
    try {
      const res = await fetch('/api/customer/itineraries', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, startdate: newStartDate, enddate: newEndDate }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? 'Failed to create');
      }
      const { id } = await res.json() as { id: string };
      const newItin: SlimItinerary = { id, title, stayid: null, startdate: newStartDate, enddate: newEndDate };
      setItineraries(prev => [newItin, ...prev]);
      setNewTitle('');
      pickItinerary(newItin);
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setCreating(false);
    }
  }

  async function handleAddItem() {
    if (!selectedItinId || adding) return;
    setAdding(true); setAddError(null);
    const token = await getBearerToken();
    if (!token) { setAdding(false); setAddError('Session expired.'); return; }
    try {
      const res = await fetch(`/api/customer/itineraries/${selectedItinId}/items`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_id: place.id,
          name: place.name,
          category: place.category ?? null,
          image: place.image_url ?? null,
          scheduleddate: selectedDate,
          starttime: selectedTime,
          durationhours: 1,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? 'Failed to add');
      }
      onAdded();
      handleClose();
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setAdding(false);
    }
  }

  const sheetStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end',
  };
  const panelStyle: React.CSSProperties = {
    width: '100%', background: BG, borderRadius: '20px 20px 0 0',
    border: `1px solid ${BORDER}`, borderBottom: 'none',
    padding: '0 20px 36px', maxHeight: '88dvh', overflowY: 'auto',
    transform: visible ? 'translateY(0)' : 'translateY(100%)',
    transition: visible ? 'transform 300ms cubic-bezier(0.16,1,0.3,1)' : 'transform 240ms ease-in',
    willChange: 'transform',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', height: 46, borderRadius: 10, background: SURFACE,
    border: `1px solid ${BORDER_2}`, color: TEXT, fontSize: 14,
    padding: '0 12px', fontFamily: "'DM Sans', sans-serif",
    outline: 'none', colorScheme: 'dark', transition: 'border-color 180ms ease',
  };

  return (
    <div style={sheetStyle} onClick={handleClose} role="dialog" aria-modal="true">
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', opacity: visible ? 1 : 0, transition: 'opacity 260ms ease' }} />
      <div style={panelStyle} onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.12)' }} />
        </div>

        {/* ── STEP 1: SELECT ITINERARY ── */}
        {step === 'select' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0 16px' }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, fontFamily: "'DM Sans', sans-serif" }}>Add to Itinerary</p>
                <h3 style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 600, color: TEXT, fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{place.name}</h3>
              </div>
              <button onClick={handleClose} aria-label="Close"
                style={{ width: 32, height: 32, borderRadius: '50%', background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ height: 1, background: BORDER, marginBottom: 16 }} />

            {listLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {[1, 2].map(i => <div key={i} style={{ height: 56, borderRadius: 12, background: SURFACE, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
              </div>
            )}
            {!listLoading && listError && (
              <p style={{ color: 'rgba(220,80,80,0.85)', fontSize: 13, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>{listError}</p>
            )}
            {!listLoading && !listError && itineraries.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0 24px' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: GOLD_DIM, border: `1px solid rgba(200,150,90,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeOpacity="0.75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: '0 0 4px', fontFamily: "'DM Sans', sans-serif" }}>No itineraries yet</p>
                <p style={{ color: TEXT_FAINT, fontSize: 12, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>Create one to start planning your trip.</p>
              </div>
            )}
            {!listLoading && !listError && itineraries.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {itineraries.map(itin => (
                  <button key={itin.id} onClick={() => pickItinerary(itin)}
                    style={{ width: '100%', textAlign: 'left', borderRadius: 12, padding: '13px 14px', background: SURFACE, border: `1px solid ${BORDER}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, transition: 'background 180ms ease, border-color 180ms ease' }}
                    onMouseEnter={e => { e.currentTarget.style.background = SURFACE_2; e.currentTarget.style.borderColor = BORDER_2; }}
                    onMouseLeave={e => { e.currentTarget.style.background = SURFACE; e.currentTarget.style.borderColor = BORDER; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: TEXT, fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {itin.title ?? 'Untitled itinerary'}
                      </p>
                      {itin.startdate && itin.enddate && (
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: TEXT_MUTED, fontFamily: "'DM Sans', sans-serif" }}>
                          {formatDateDisplay(itin.startdate)} – {formatDateDisplay(itin.enddate)}
                        </p>
                      )}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {!listLoading && (
              <button onClick={() => setStep('create')}
                style={{ width: '100%', height: 46, borderRadius: 12, background: 'transparent', border: `1px dashed rgba(200,150,90,0.35)`, color: GOLD, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 180ms ease, border-color 180ms ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = GOLD_DIM; e.currentTarget.style.borderColor = 'rgba(200,150,90,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(200,150,90,0.35)'; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                New itinerary
              </button>
            )}
          </>
        )}

        {/* ── STEP 2: CREATE ITINERARY ── */}
        {step === 'create' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0 16px' }}>
              <button onClick={() => setStep('select')} aria-label="Back"
                style={{ width: 32, height: 32, borderRadius: 10, background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: TEXT, fontFamily: "'DM Sans', sans-serif" }}>New Itinerary</h3>
            </div>
            <div style={{ height: 1, background: BORDER, marginBottom: 20 }} />

            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
              Trip name
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void handleCreate(); }}
              placeholder="e.g. Tokyo Trip, Weekend Getaway…"
              maxLength={100}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = GOLD; }}
              onBlur={e => { e.target.style.borderColor = BORDER_2; }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                  Start date
                </label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={e => {
                    setNewStartDate(e.target.value);
                    if (newEndDate && e.target.value > newEndDate) setNewEndDate('');
                  }}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = GOLD; }}
                  onBlur={e => { e.target.style.borderColor = BORDER_2; }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                  End date
                </label>
                <input
                  type="date"
                  value={newEndDate}
                  min={newStartDate || undefined}
                  onChange={e => setNewEndDate(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = GOLD; }}
                  onBlur={e => { e.target.style.borderColor = BORDER_2; }}
                />
              </div>
            </div>

            {createError && (
              <p style={{ color: 'rgba(220,80,80,0.85)', fontSize: 12, margin: '8px 0 0', fontFamily: "'DM Sans', sans-serif" }}>{createError}</p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setStep('select')}
                style={{ flex: 1, height: 46, borderRadius: 10, background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_MUTED, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
              <button onClick={() => void handleCreate()} disabled={creating || !newTitle.trim() || !newStartDate || !newEndDate}
                style={{ flex: 2, height: 46, borderRadius: 10, background: (creating || !newTitle.trim() || !newStartDate || !newEndDate) ? GOLD_DIM : GOLD, border: 'none', color: (creating || !newTitle.trim() || !newStartDate || !newEndDate) ? GOLD : '#0A0806', fontSize: 13, fontWeight: 700, cursor: (creating || !newTitle.trim() || !newStartDate || !newEndDate) ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'background 180ms ease, color 180ms ease' }}>
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: PICK A DATE ── */}
        {step === 'date' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0 16px' }}>
              <button onClick={() => setStep('select')} aria-label="Back"
                style={{ width: 32, height: 32, borderRadius: 10, background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, fontFamily: "'DM Sans', sans-serif" }}>When are you going?</p>
                <h3 style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: TEXT, fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name}</h3>
              </div>
            </div>
            <div style={{ height: 1, background: BORDER, marginBottom: 20 }} />

            {/* Trip date range badge */}
            {selectedItin?.startdate && selectedItin.enddate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', borderRadius: 10, background: GOLD_DIM, border: `1px solid rgba(200,150,90,0.2)` }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span style={{ fontSize: 12, color: GOLD, fontFamily: "'DM Sans', sans-serif" }}>
                  {formatDateDisplay(selectedItin.startdate)} – {formatDateDisplay(selectedItin.enddate)}
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={selectedItin?.startdate ?? undefined}
                  max={selectedItin?.enddate ?? undefined}
                  onChange={e => setSelectedDate(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = GOLD; }}
                  onBlur={e => { e.target.style.borderColor = BORDER_2; }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                  Time
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={e => setSelectedTime(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = GOLD; }}
                  onBlur={e => { e.target.style.borderColor = BORDER_2; }}
                />
              </div>
            </div>

            {addError && (
              <p style={{ color: 'rgba(220,80,80,0.85)', fontSize: 12, margin: '8px 0 0', fontFamily: "'DM Sans', sans-serif" }}>{addError}</p>
            )}

            <button onClick={() => void handleAddItem()} disabled={adding || !selectedDate}
              style={{ width: '100%', height: 48, borderRadius: 12, background: adding || !selectedDate ? GOLD_DIM : GOLD, border: 'none', color: adding || !selectedDate ? GOLD : '#0A0806', fontSize: 14, fontWeight: 700, cursor: adding || !selectedDate ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 180ms ease, color 180ms ease' }}>
              {adding ? 'Adding…' : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  Add to Itinerary
                </>
              )}
            </button>
          </>
        )}

        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
      </div>
    </div>
  );
}
