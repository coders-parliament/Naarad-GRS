"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import useAuth from "@/hooks/useAuth";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth(true);
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchAllGrievances = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://127.0.0.1:8000/grievances", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setGrievances(data);
      } else {
        setError("Failed to fetch all grievances. Make sure you are an Admin.");
      }
    } catch (err) {
      setError("Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    fetchAllGrievances();
  }, [user, authLoading]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://127.0.0.1:8000/grievance/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (res.ok) {
        // Update local state
        setGrievances((prev) =>
          prev.map((g) => (g.id === id ? { ...g, status: newStatus } : g))
        );
      } else {
        alert("Failed to update grievance status.");
      }
    } catch (err) {
      alert("Network error. Could not update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="text-center py-20 text-gray-400 animate-pulse">
        Loading admin dashboard data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Admin Control Panel</h1>
          <p className="text-sm text-gray-400 mt-1">Manage public citizen grievances</p>
        </div>
        <span className="bg-red-500/20 text-red-400 text-xs px-3 py-1.5 rounded-full font-bold border border-red-500/30">
          Admin Session
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-xl shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/10 text-gray-300 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold">ID</th>
              <th className="p-4 font-semibold">Submitter</th>
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Priority</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {grievances.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 text-sm">
                  No grievances found in database.
                </td>
              </tr>
            ) : (
              grievances.map((g) => (
                <tr key={g.id} className="hover:bg-white/5 transition text-sm">
                  <td className="p-4 font-mono text-indigo-400 font-bold">#{g.id}</td>
                  <td className="p-4">
                    {g.user_id ? (
                      <div>
                        <p className="text-white font-medium">{g.email}</p>
                        <span className="text-xs text-indigo-400">Registered Citizen</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-white font-medium">{g.name || "Anonymous"}</p>
                        <p className="text-xs text-gray-400">{g.email || "No contact email"}</p>
                        <span className="text-xs text-gray-500 font-semibold italic">Guest Submission</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium text-white max-w-xs truncate" title={g.description}>
                    <p className="font-semibold">{g.title}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{g.description}</p>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold">
                      {g.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      g.priority === "High" 
                        ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                        : g.priority === "Low" 
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                        : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    }`}>
                      {g.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={g.status} />
                  </td>
                  <td className="p-4">
                    <select
                      value={g.status}
                      disabled={updatingId === g.id}
                      onChange={(e) => handleStatusChange(g.id, e.target.value)}
                      className="bg-[#1A1F2E] border border-gray-600 rounded px-2.5 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}