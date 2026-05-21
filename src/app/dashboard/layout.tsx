import GuestNavBar from '@/components/guest-lounge/GuestNavBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GuestNavBar />
      {/* Offset content on desktop — padding driven by --sidebar-w CSS var */}
      <div className="dashboard-content">
        {children}
      </div>
    </>
  );
}
