"use client";

import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import GrievanceCard from "@/components/GrievanceCard";
import Link from "next/link";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth(false);
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchGrievances = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://127.0.0.1:8000/my-grievances", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setGrievances(data);
        } else {
          setError("Failed to load your grievances");
        }
      } catch (err) {
        setError("Failed to connect to backend");
      } finally {
        setLoading(false);
      }
    };

    fetchGrievances();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <div className="text-xl text-gray-400 animate-pulse">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6 relative">
      {/* Glow background */}
      <div className="absolute inset-0 flex justify-center items-center -z-10 overflow-hidden">
        <div className="w-[500px] h-[500px] bg-indigo-600 opacity-10 blur-3xl rounded-full"></div>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Citizen Dashboard</h1>
            <p className="text-gray-400 mt-2">Logged in as: <span className="text-indigo-400 font-semibold">{user?.email}</span></p>
          </div>
          <Link href="/submit">
            <button className="bg-indigo-600 px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition font-semibold hover:scale-105 cursor-pointer shadow-lg shadow-indigo-600/20">
              Submit Grievance
            </button>
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {grievances.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
            <p className="text-gray-400 text-lg mb-6">You haven&apos;t submitted any grievances yet.</p>
            <Link href="/submit">
              <button className="bg-indigo-600 px-6 py-3 rounded-xl hover:bg-indigo-700 transition font-semibold">
                Submit Your First Complaint
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {grievances.map((item) => (
              <GrievanceCard key={item.id} grievance={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}