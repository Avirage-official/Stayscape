'use client';

import { useEffect, useState } from 'react';

interface Props {
  notice?: string;
  email?: string;
  warn?: string;
}

export default function HotelsNoticeBanner({ notice, email, warn }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notice) setVisible(true);
  }, [notice]);

  if (!visible || !notice) return null;

  const isError = notice === 'created' && warn;

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-[13px] flex items-start justify-between gap-4 ${
        isError
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          : 'border-green-500/30 bg-green-500/10 text-green-400'
      }`}
    >
      <span>
        {isError
          ? `Hotel created. Note: ${warn}`
          : `Hotel created and invite sent to ${email ?? 'admin'}.`}
      </span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="text-current opacity-60 hover:opacity-100 flex-shrink-0"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
