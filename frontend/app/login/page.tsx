"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.access_token) {
        localStorage.setItem("token", data.access_token);
        window.dispatchEvent(new Event("auth-change"));

        // Fetch user info to redirect correctly based on role
        try {
          const profileRes = await fetch("http://127.0.0.1:8000/me", {
            headers: {
              "Authorization": `Bearer ${data.access_token}`,
            },
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.role === "admin") {
              router.push("/admin");
              return;
            }
          }
        } catch (profileErr) {
          console.error("Failed to fetch user profile:", profileErr);
        }

        router.push("/dashboard");
      } else {
        setError(data.detail || "Invalid credentials");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-gray-100
      "
    >
      <div
        className="
          bg-white
          p-8
          rounded-xl
          shadow-lg
          w-full
          max-w-md
        "
      >
        <h1
          className="
            text-3xl
            font-bold
            text-center
            mb-6
          "
        >
          Login
        </h1>

        {error && (
          <p className="text-red-500 mb-4 text-sm">
            {error}
          </p>
        )}

        <div className="space-y-4">

          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="
              w-full
              p-3
              border
              rounded-lg
              outline-none
              focus:ring-2
              focus:ring-blue-500
            "
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="
              w-full
              p-3
              border
              rounded-lg
              outline-none
              focus:ring-2
              focus:ring-blue-500
            "
          />

          <button
            onClick={handleLogin}
            className="
              w-full
              bg-blue-600
              text-white
              p-3
              rounded-lg
              hover:bg-blue-700
              transition
            "
          >
            Login
          </button>
        </div>

        <p className="text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="
              text-blue-600
              font-semibold
            "
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}