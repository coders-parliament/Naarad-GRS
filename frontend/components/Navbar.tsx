"use client";

import Link from "next/link";

type NavbarProps = {
  role?: "guest" | "user" | "admin";
};

export default function Navbar({
  role = "guest",
}: NavbarProps) {
  return (

    <nav className="w-full border-b border-white/10 bg-black/30 backdrop-blur-md">

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold tracking-wide"
        >
          Naarad GRS
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6 text-sm">

          <Link
            href="/"
            className="hover:text-cyan-400 transition"
          >
            Home
          </Link>

          {role !== "guest" && (
            <>
              <Link
                href="/dashboard"
                className="hover:text-cyan-400 transition"
              >
                Dashboard
              </Link>

              <Link
                href="/submit"
                className="hover:text-cyan-400 transition"
              >
                Submit Grievance
              </Link>
            </>
          )}

          {role === "admin" && (
            <Link
              href="/admin"
              className="hover:text-cyan-400 transition"
            >
              Admin Panel
            </Link>
          )}

          {role === "guest" ? (
            <>
              <Link
                href="/login"
                className="hover:text-cyan-400 transition"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="hover:text-cyan-400 transition"
              >
                Register
              </Link>
            </>
          ) : (
            <button className="hover:text-red-400 transition">
              Logout
            </button>
          )}

        </div>

      </div>

    </nav>
  );
}