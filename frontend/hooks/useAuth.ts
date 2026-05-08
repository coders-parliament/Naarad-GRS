"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function useAuth(
  authenticated: boolean
) {
  const router = useRouter();

  useEffect(() => {
    if (!authenticated) {
      router.push("/login");
    }
  }, [authenticated, router]);
}