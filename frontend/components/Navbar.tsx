"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type NavbarProps = {
  role?: "guest" | "user" | "admin";
};

export default function Navbar({
  role: initialRole,
}: NavbarProps) {
  const [role, setRole] = useState<"guest" | "user" | "admin">("guest");
  const router = useRouter();

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setRole("guest");
      return;
    }
    try {
      const res = await fetch("http://127.0.0.1:8000/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRole(data.role || "user");
      } else {
        localStorage.removeItem("token");
        setRole("guest");
      }
    } catch {
      // Decode JWT fallback
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setRole(payload.role || "user");
      } catch {
        setRole("guest");
      }
    }
  };

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
      return;
    }

    checkAuth();

    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener("auth-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [initialRole]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-change"));
    router.push("/login");
  };

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
            <button 
              onClick={handleLogout}
              className="hover:text-red-400 transition cursor-pointer"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}