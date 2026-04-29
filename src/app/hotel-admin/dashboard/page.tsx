'use client';

export default function HotelAdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center px-4 py-16">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 w-full max-w-md space-y-3 text-center">
        <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-[0.14em]">
          Hotel Admin
        </p>
        <h1 className="text-[22px] font-semibold text-white">Welcome</h1>
        <p className="text-[13px] text-white/50">
          Your dashboard is being set up.
        </p>
      </div>
    </div>
  );
}
