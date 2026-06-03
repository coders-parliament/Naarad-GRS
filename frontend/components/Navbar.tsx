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
  const [isLight, setIsLight] = useState(false);
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
    const savedTheme = localStorage.getItem("theme");
    const isLightMode = savedTheme === "light";
    if (isLightMode) {
      document.documentElement.classList.add("light");
      setIsLight(true);
    } else {
      document.documentElement.classList.remove("light");
      setIsLight(false);
    }

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

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains("light")) {
      root.classList.remove("light");
      localStorage.setItem("theme", "dark");
      setIsLight(false);
    } else {
      root.classList.add("light");
      localStorage.setItem("theme", "light");
      setIsLight(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-change"));
    router.push("/login");
  };

  return (
    <nav className="w-full border-b border-border-custom bg-black/30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold tracking-wide text-text-primary"
        >
          Naarad GRS
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6 text-sm text-text-secondary">
          <Link
            href="/"
            className="hover:text-accent-primary transition"
          >
            Home
          </Link>

          {role !== "guest" && (
            <>
              <Link
                href="/dashboard"
                className="hover:text-accent-primary transition"
              >
                Dashboard
              </Link>

              <Link
                href="/submit"
                className="hover:text-accent-primary transition"
              >
                Submit Grievance
              </Link>
            </>
          )}

          {role === "admin" && (
            <Link
              href="/admin"
              className="hover:text-accent-primary transition"
            >
              Admin Panel
            </Link>
          )}

          {role === "guest" ? (
            <>
              <Link
                href="/login"
                className="hover:text-accent-primary transition"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="hover:text-accent-primary transition"
              >
                Register
              </Link>
            </>
          ) : (
            <button 
              onClick={handleLogout}
              className="hover:text-red-400 transition cursor-pointer text-text-secondary"
            >
              Logout
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-custom bg-bg-secondary hover:bg-bg-input transition cursor-pointer text-xs font-semibold text-text-primary"
            title="Toggle Theme"
          >
            {isLight ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </div>
    </nav>
  );
}