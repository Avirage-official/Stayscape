import Link from 'next/link';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function SectionHeader({
  title,
  actionLabel,
  actionHref,
}: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-serif text-2xl text-white">{title}</h2>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="inline-flex rounded-lg border border-[#C9A84C]/40 bg-[#C9A84C]/15 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-[#C9A84C] hover:bg-[#C9A84C]/20"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
