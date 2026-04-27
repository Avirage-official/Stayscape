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
    'w-full rounded-xl border border-[#EDE8E1] bg-[#F5F2EE] px-3.5 py-3 text-left text-[12px] text-[#1C1A17] transition-colors hover:bg-[#EDE8E1] hover:border-[#C17F3A]/40 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]';
  const noteToggleButton =
    'w-full text-left text-[12px] text-[#1C1A17] transition-colors hover:text-[#C17F3A] disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <section className="rounded-2xl border border-[#EDE8E1] bg-white p-4">
      <h3 className="text-[14px] font-serif italic text-[#1C1A17] mb-3">Quick Actions</h3>
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleHousekeeping}
          disabled={!stayId || isSaving}
          className={actionBase}
        >
          Request Housekeeping
        </button>

        <div className="rounded-xl border border-[#EDE8E1] bg-[#F5F2EE] p-2.5">
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
                className="w-full resize-none rounded-lg border border-[#EDE8E1] bg-white px-3 py-2 text-[12px] text-[#1C1A17] placeholder:text-[#9E9389] focus:outline-none focus:border-[#C17F3A]/40 focus:ring-1 focus:ring-[#C17F3A]/20"
              />
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={!note.trim() || isSaving}
                className="rounded-lg border border-[#C17F3A]/40 bg-[#C17F3A]/10 px-3 py-1.5 text-[11px] text-[#C17F3A] hover:bg-[#C17F3A]/20 disabled:cursor-not-allowed disabled:opacity-50"
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
      {status && <p className="mt-2.5 text-[10px] text-[#6B6158]">{status}</p>}
    </section>
  );
}
