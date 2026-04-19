import type { ReactNode } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <AdminSidebar />
        <main className="min-w-0 flex-1 bg-[#0D0D0D] p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
