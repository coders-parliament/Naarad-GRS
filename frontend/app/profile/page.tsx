"use client";

import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    ward: "",
    preferred_language: "English",
  });

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        phone: user.phone || "",
        address: user.address || "",
        ward: user.ward || "",
        preferred_language: user.preferred_language || "English",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://127.0.0.1:8000/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast("Profile updated successfully!");
        // Optional: Dispatch change to sync details across app
        window.dispatchEvent(new Event("auth-change"));
      } else {
        const errData = await res.json();
        showToast(errData.detail || "Failed to update profile", "error");
      }
    } catch (err) {
      showToast("Could not connect to backend server", "error");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center">
        <div className="text-xl text-text-secondary animate-pulse">Loading profile settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-6 relative transition-colors duration-300">
      {/* Glow background */}
      <div className="absolute inset-0 flex justify-center items-center -z-10 overflow-hidden">
        <div className="w-[500px] h-[500px] bg-accent-primary opacity-10 blur-3xl rounded-full"></div>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-text-primary text-center">
          My Profile Settings
        </h1>
        <p className="text-text-secondary text-center mb-8">
          Personalize your dashboard and pre-fill future grievance applications.
        </p>

        {toast && (
          <div className="mb-6">
            <Toast message={toast.message} type={toast.type} />
          </div>
        )}

        <div className="bg-bg-secondary border border-border-custom p-8 rounded-2xl shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Account Details (Read-only) */}
            <div className="p-4 bg-bg-primary rounded-xl border border-border-custom flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Account Email</p>
                <p className="text-lg font-bold text-text-primary">{user?.email}</p>
              </div>
              <span className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-full text-xs font-semibold uppercase tracking-wider">
                {user?.role || "Citizen"}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Full Name */}
              <Input
                label="Full Name"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Rajesh Kumar"
              />

              {/* Phone Number */}
              <Input
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Ward / Locality */}
              <div>
                <label className="block mb-2 text-sm text-text-secondary font-semibold">Ward / Locality</label>
                <select
                  name="ward"
                  value={form.ward}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-bg-input text-text-primary border border-border-custom focus:outline-none focus:ring-2 focus:ring-accent-primary transition duration-200"
                >
                  <option value="">Select your Ward / Area</option>
                  <option value="Ward 10 - Downtown">Ward 10 - Downtown</option>
                  <option value="Ward 11 - Metro Vista">Ward 11 - Metro Vista</option>
                  <option value="Ward 12 - Green Valley">Ward 12 - Green Valley</option>
                  <option value="Ward 13 - Port Area">Ward 13 - Port Area</option>
                  <option value="Ward 14 - Industrial Zone">Ward 14 - Industrial Zone</option>
                </select>
              </div>

              {/* Preferred Language */}
              <div>
                <label className="block mb-2 text-sm text-text-secondary font-semibold">Preferred Language</label>
                <select
                  name="preferred_language"
                  value={form.preferred_language}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-bg-input text-text-primary border border-border-custom focus:outline-none focus:ring-2 focus:ring-accent-primary transition duration-200"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block mb-2 text-sm text-text-secondary font-semibold">Residential Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                placeholder="Flat/House No., Street Name, Landmark"
                className="w-full p-3 rounded-lg bg-bg-input text-text-primary border border-border-custom placeholder-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent-primary transition duration-200"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button disabled={saving}>
                {saving ? "Saving Changes..." : "Save Profile Details"}
              </Button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
