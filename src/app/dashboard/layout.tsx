import GuestNavBar from '@/components/guest-lounge/GuestNavBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GuestNavBar />
      {/* Offset content on desktop so it clears the 68px sidebar */}
      <div
        style={{
          paddingLeft: 0,
        }}
        className="md:pl-[68px]"
      >
        {children}
      </div>
    </>
  );
}
