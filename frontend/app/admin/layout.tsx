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
  return <>{children}</>;
}