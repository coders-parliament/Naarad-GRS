import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Admin Dashboard | Naarad GRS",
  description: "Admin panel for grievance management",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (

    <div className="min-h-screen bg-[#0B1120] text-white">

      <Navbar role="admin" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

    </div>

  );
}