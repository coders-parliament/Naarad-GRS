"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthInput from "@/components/AuthInput";
import AuthButton from "@/components/AuthButton";

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
    <div className="min-h-screen flex items-center justify-center bg-bg-primary text-text-primary px-4 py-12 relative transition-colors duration-300">
      {/* Glow background */}
      <div className="absolute inset-0 flex justify-center items-center -z-10 overflow-hidden">
        <div className="w-[500px] h-[500px] bg-accent-primary opacity-10 blur-3xl rounded-full"></div>
      </div>

      <div className="w-full max-w-md bg-bg-secondary border border-border-custom p-8 rounded-2xl shadow-2xl backdrop-blur-md transition-colors duration-300">
        <h1 className="text-3xl font-extrabold text-center mb-6 text-text-primary tracking-tight">
          Login
        </h1>

        {error && (
          <p className="text-red-500 mb-4 text-sm text-center">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <AuthInput
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <AuthInput
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <AuthButton text="Login" onClick={handleLogin} />
        </div>

        <p className="text-center mt-6 text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-accent-primary font-semibold hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}