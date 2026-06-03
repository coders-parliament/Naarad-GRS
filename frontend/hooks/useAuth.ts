"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function useAuth(requireAdmin = false) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://127.0.0.1:8000/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then((data) => {
        setUser(data);
        if (requireAdmin && data.role !== "admin") {
          router.push("/dashboard");
        }
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("token");
        router.push("/login");
      });
  }, [requireAdmin, router]);

  return { user, loading };
}