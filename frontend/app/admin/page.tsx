"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";

type Grievance = {
  id: number;
  name: string;
  title: string;
  status?: string;
};

export default function AdminDashboard() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchGrievances = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiBase}/grievances`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load grievances");
        }

        const data: Grievance[] = await response.json();
        setGrievances(data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError("Unable to fetch grievances right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchGrievances();

    return () => controller.abort();
  }, []);

  return (
    <div>
      <h2 className="text-xl mb-6">Grievances</h2>

      {loading && <p className="text-gray-300">Loading grievances...</p>}

      {!loading && error && <p className="text-red-400">{error}</p>}

      {!loading && !error && grievances.length === 0 && (
        <p className="text-gray-300">No grievances submitted yet.</p>
      )}

      {!loading && !error && grievances.length > 0 && (
        <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-xl">
          <table className="w-full text-left">
            <thead className="bg-white/10">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Title</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {grievances.map((g) => (
                <tr key={g.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="p-4">{g.id}</td>
                  <td className="p-4">{g.name}</td>
                  <td className="p-4">{g.title}</td>
                  <td className="p-4">
                    <StatusBadge status={g.status || "Pending"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
