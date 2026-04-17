'use client';

import { useState } from 'react';

interface QuickActionsProps {
  stayId?: string | null;
  onContactAI: () => void;
}

export default function QuickActions({ stayId, onContactAI }: QuickActionsProps) {
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const savePreference = async (
    payload: Record<string, unknown>,
    successLabel: string,
    errorLabel: string,
  ) => {
    if (!stayId) return;
    setIsSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/pms/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus(successLabel);
    } catch {
      setStatus(errorLabel);
    } finally {
      setIsSaving(false);
    }
  };

  const handleHousekeeping = () => {
    if (!stayId) return;
    void savePreference(
      {
        stay_id: stayId,
        preference_type: 'room_service',
        preference_data: { request: 'housekeeping' },
      },
      'Housekeeping request sent',
      'Unable to save housekeeping request',
    );
  };

  const handleSaveNote = () => {
    const trimmed = note.trim();
    if (!stayId || !trimmed) return;
    void savePreference(
      {
        stay_id: stayId,
        preference_type: 'general',
        preference_data: { note: trimmed },
      },
      'Note saved',
      'Unable to save note',
    );
    setNote('');
    setShowNoteInput(false);
  };

  const actionBase =
    'w-full rounded-xl border border-white/10 bg-white/[0.07] px-3.5 py-3 text-left text-[12px] text-white/85 transition-colors hover:bg-white/[0.11] disabled:cursor-not-allowed disabled:opacity-50';
  const noteToggleButton =
    'w-full text-left text-[12px] text-white/85 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
      <h3 className="text-[14px] font-serif text-white/90 mb-3">Quick Actions</h3>
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleHousekeeping}
          disabled={!stayId || isSaving}
          className={actionBase}
        >
          Request Housekeeping
        </button>

        <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
          <button
            type="button"
            onClick={() => setShowNoteInput((v) => !v)}
            disabled={!stayId}
            className={noteToggleButton}
          >
            Leave a Note
          </button>
          {showNoteInput && (
            <div className="mt-2.5 space-y-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Share your request..."
                className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-[12px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50"
              />
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={!note.trim() || isSaving}
                className="rounded-lg border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[11px] text-white/90 hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save Note
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onContactAI}
          className={actionBase}
        >
          Contact Concierge
        </button>
      </div>
      {status && <p className="mt-2.5 text-[10px] text-white/55">{status}</p>}
    </section>
  );
}
