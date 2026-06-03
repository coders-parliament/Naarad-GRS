import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Naarad GRS",
  description: "AI-powered grievance redressal system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">

      <body className="min-h-screen bg-bg-primary text-text-primary transition-colors duration-300">

        <Navbar />

        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>

      </body>

    </html>
  );
}