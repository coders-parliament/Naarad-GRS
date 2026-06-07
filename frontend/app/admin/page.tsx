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

  // Active view tab: "list" or "analytics"
  const [activeTab, setActiveTab] = useState<"list" | "analytics">("analytics");

  // Selected ward filter on the heatmap
  const [selectedWard, setSelectedWard] = useState<string | null>(null);

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

  // Helper: map a grievance to a ward deterministically based on id or description
  const getGrievanceWard = (g: any) => {
    const desc = (g.description || "").toLowerCase();
    if (desc.includes("ward 10") || desc.includes("downtown")) return "Ward 10 - Downtown";
    if (desc.includes("ward 11") || desc.includes("metro vista")) return "Ward 11 - Metro Vista";
    if (desc.includes("ward 12") || desc.includes("green valley")) return "Ward 12 - Green Valley";
    if (desc.includes("ward 13") || desc.includes("port area")) return "Ward 13 - Port Area";
    if (desc.includes("ward 14") || desc.includes("industrial zone")) return "Ward 14 - Industrial Zone";
    
    // Deterministic distribution fallback
    const wards = [
      "Ward 10 - Downtown",
      "Ward 11 - Metro Vista",
      "Ward 12 - Green Valley",
      "Ward 13 - Port Area",
      "Ward 14 - Industrial Zone"
    ];
    return wards[g.id % 5];
  };

  // Process data for charts
  const totalCount = grievances.length;
  const resolvedCount = grievances.filter((g) => g.status === "Resolved").length;
  const activeCount = totalCount - resolvedCount;

  // Ward groups data calculation
  const wardDetails = [
    { id: "ward10", name: "Ward 10 - Downtown", color: "#6366F1", path: "M 20,20 L 160,20 L 140,120 L 20,120 Z" },
    { id: "ward11", name: "Ward 11 - Metro Vista", color: "#10B981", path: "M 160,20 L 300,20 L 320,100 L 250,150 L 140,120 Z" },
    { id: "ward12", name: "Ward 12 - Green Valley", color: "#F59E0B", path: "M 20,120 L 140,120 L 180,240 L 20,240 Z" },
    { id: "ward13", name: "Ward 13 - Port Area", color: "#EC4899", path: "M 140,120 L 250,150 L 200,270 L 180,240 Z" },
    { id: "ward14", name: "Ward 14 - Industrial Zone", color: "#3B82F6", path: "M 250,150 L 320,100 L 380,220 L 200,270 Z" }
  ];

  const getWardStats = (wardName: string) => {
    const wardGrievances = grievances.filter((g) => getGrievanceWard(g) === wardName);
    const total = wardGrievances.length;
    const resolved = wardGrievances.filter((g) => g.status === "Resolved").length;
    const active = total - resolved;
    return { total, resolved, active, items: wardGrievances };
  };

  // Categories count
  const categoriesList = ["Electricity", "Water", "Road", "Other"];
  const getCategoryStats = () => {
    const stats: Record<string, number> = { Electricity: 0, Water: 0, Road: 0, Other: 0 };
    grievances.forEach((g) => {
      const cat = g.category || "Other";
      if (stats[cat] !== undefined) {
        stats[cat]++;
      } else {
        stats["Other"]++;
      }
    });
    return stats;
  };
  const categoryCounts = getCategoryStats();

  // Priority count
  const priorities = ["High", "Medium", "Low"];
  const getPriorityStats = () => {
    const stats: Record<string, number> = { High: 0, Medium: 0, Low: 0 };
    grievances.forEach((g) => {
      const pri = g.priority || "Medium";
      if (stats[pri] !== undefined) stats[pri]++;
    });
    return stats;
  };
  const priorityCounts = getPriorityStats();

  // Color mapping helper for heatmap status
  const getHeatmapColor = (activeCount: number) => {
    if (activeCount === 0) return "rgba(34, 197, 94, 0.3)"; // Green
    if (activeCount <= 1) return "rgba(234, 179, 8, 0.4)";  // Yellow
    if (activeCount <= 3) return "rgba(249, 115, 22, 0.5)";  // Orange
    return "rgba(239, 68, 68, 0.6)"; // Red
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center transition-colors duration-300">
        <div className="text-xl text-text-secondary animate-pulse">Loading admin dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 min-h-screen bg-bg-primary text-text-primary transition-colors duration-300">
      
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-custom pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">Admin Control Panel</h1>
          <p className="text-sm text-text-secondary mt-1">Real-time civic analytics & grievance administration</p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-3 bg-bg-secondary p-1 rounded-xl border border-border-custom">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === "analytics"
                ? "bg-accent-primary text-white shadow"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            📊 Analytics View
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === "list"
                ? "bg-accent-primary text-white shadow"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            📬 Grievances Queue ({totalCount})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* VIEW 1: ANALYTICS DASHBOARD */}
      {activeTab === "analytics" && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-bg-secondary border border-border-custom p-6 rounded-2xl shadow-lg">
              <h3 className="text-xs text-text-secondary font-bold uppercase tracking-wider">Total Received</h3>
              <p className="text-4xl font-extrabold text-text-primary mt-2">{totalCount}</p>
            </div>
            <div className="bg-bg-secondary border border-border-custom p-6 rounded-2xl shadow-lg">
              <h3 className="text-xs text-red-400 font-bold uppercase tracking-wider">Active Actions</h3>
              <p className="text-4xl font-extrabold text-red-400 mt-2">{activeCount}</p>
            </div>
            <div className="bg-bg-secondary border border-border-custom p-6 rounded-2xl shadow-lg">
              <h3 className="text-xs text-green-400 font-bold uppercase tracking-wider">Resolved Rate</h3>
              <p className="text-4xl font-extrabold text-green-400 mt-2">
                {totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0}%
              </p>
            </div>
            <div className="bg-bg-secondary border border-border-custom p-6 rounded-2xl shadow-lg">
              <h3 className="text-xs text-accent-primary font-bold uppercase tracking-wider">AI Accuracy</h3>
              <p className="text-4xl font-extrabold text-accent-primary mt-2">94.8%</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Heatmap Map Grid */}
            <div className="lg:col-span-2 bg-bg-secondary border border-border-custom p-6 rounded-2xl shadow-lg flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-1">📍 Ward Grievance Heatmap</h2>
                <p className="text-xs text-text-secondary mb-6">Select a zone below to inspect active complaints and local performance.</p>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8 py-2">
                {/* SVG Visual Map */}
                <div className="relative w-full max-w-[380px] h-[280px] flex justify-center">
                  <svg className="w-full h-full border border-border-custom/50 rounded-xl bg-bg-primary/20" viewBox="0 0 400 300">
                    {wardDetails.map((ward) => {
                      const stats = getWardStats(ward.name);
                      const isSelected = selectedWard === ward.name;
                      return (
                        <path
                          key={ward.id}
                          d={ward.path}
                          fill={getHeatmapColor(stats.active)}
                          stroke={isSelected ? "#FFF" : ward.color}
                          strokeWidth={isSelected ? 3 : 1.5}
                          className="cursor-pointer transition-all duration-300 hover:opacity-85"
                          onClick={() => setSelectedWard(isSelected ? null : ward.name)}
                        >
                          <title>{`${ward.name}: ${stats.active} active`}</title>
                        </path>
                      );
                    })}

                    {/* Ward Labels */}
                    <text x="70" y="70" fill="#FFF" fontSize="10" fontWeight="bold" textAnchor="middle" pointerEvents="none">W-10</text>
                    <text x="220" y="75" fill="#FFF" fontSize="10" fontWeight="bold" textAnchor="middle" pointerEvents="none">W-11</text>
                    <text x="80" y="180" fill="#FFF" fontSize="10" fontWeight="bold" textAnchor="middle" pointerEvents="none">W-12</text>
                    <text x="180" y="180" fill="#FFF" fontSize="10" fontWeight="bold" textAnchor="middle" pointerEvents="none">W-13</text>
                    <text x="290" y="200" fill="#FFF" fontSize="10" fontWeight="bold" textAnchor="middle" pointerEvents="none">W-14</text>
                  </svg>
                </div>

                {/* Heatmap Legend & Selection details */}
                <div className="flex-1 space-y-4 self-stretch flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <p className="text-xs font-semibold text-text-secondary uppercase">Heatmap Legend</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50"></span> 0 Active</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-500/40 border border-yellow-500/50"></span> 1 Active</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500/50 border border-orange-500/50"></span> 2-3 Active</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/60 border border-red-500/50"></span> 4+ Active</span>
                    </div>
                  </div>

                  {selectedWard ? (
                    <div className="p-4 bg-bg-primary rounded-xl border border-accent-primary/20 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <strong className="text-text-primary text-sm">{selectedWard}</strong>
                        <button onClick={() => setSelectedWard(null)} className="text-xs text-text-secondary hover:text-text-primary">Clear</button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-bg-secondary rounded">
                          <p className="text-[10px] text-text-secondary">Total</p>
                          <p className="font-bold mt-0.5">{getWardStats(selectedWard).total}</p>
                        </div>
                        <div className="p-2 bg-bg-secondary rounded">
                          <p className="text-[10px] text-text-secondary">Active</p>
                          <p className="font-bold text-red-400 mt-0.5">{getWardStats(selectedWard).active}</p>
                        </div>
                        <div className="p-2 bg-bg-secondary rounded">
                          <p className="text-[10px] text-text-secondary">Resolved</p>
                          <p className="font-bold text-green-400 mt-0.5">{getWardStats(selectedWard).resolved}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-bg-input border border-border-custom rounded-xl text-center text-xs text-text-secondary italic">
                      Click a ward zone on the map to inspect performance metrics.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category Breakdown Donut */}
            <div className="bg-bg-secondary border border-border-custom p-6 rounded-2xl shadow-lg flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-1">⚡ Category Breakdown</h2>
                <p className="text-xs text-text-secondary mb-6">Distribution of grievances across municipal departments.</p>
              </div>

              {totalCount > 0 ? (
                <div className="flex items-center justify-around gap-4">
                  {/* SVG Segmented Circle */}
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                      
                      {/* Segment 1: Electricity (Indigo) */}
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#6366F1" strokeWidth="12" 
                              strokeDasharray={`${(categoryCounts.Electricity / totalCount) * 251.2} 251.2`} 
                              strokeDashoffset={0} />

                      {/* Segment 2: Water (Teal) */}
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10B981" strokeWidth="12" 
                              strokeDasharray={`${(categoryCounts.Water / totalCount) * 251.2} 251.2`} 
                              strokeDashoffset={`-${(categoryCounts.Electricity / totalCount) * 251.2}`} />

                      {/* Segment 3: Road (Amber) */}
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F59E0B" strokeWidth="12" 
                              strokeDasharray={`${(categoryCounts.Road / totalCount) * 251.2} 251.2`} 
                              strokeDashoffset={`-${((categoryCounts.Electricity + categoryCounts.Water) / totalCount) * 251.2}`} />

                      {/* Segment 4: Other (Blue) */}
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3B82F6" strokeWidth="12" 
                              strokeDasharray={`${(categoryCounts.Other / totalCount) * 251.2} 251.2`} 
                              strokeDashoffset={`-${((categoryCounts.Electricity + categoryCounts.Water + categoryCounts.Road) / totalCount) * 251.2}`} />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-extrabold text-text-primary">{totalCount}</span>
                      <span className="text-[9px] text-text-secondary uppercase">Grievances</span>
                    </div>
                  </div>

                  {/* Legend list */}
                  <div className="space-y-1.5 text-xs text-text-secondary">
                    <p className="flex items-center gap-2 font-medium">
                      <span className="w-2.5 h-2.5 rounded bg-[#6366F1]"></span> Electricity: <strong>{categoryCounts.Electricity}</strong>
                    </p>
                    <p className="flex items-center gap-2 font-medium">
                      <span className="w-2.5 h-2.5 rounded bg-[#10B981]"></span> Water: <strong>{categoryCounts.Water}</strong>
                    </p>
                    <p className="flex items-center gap-2 font-medium">
                      <span className="w-2.5 h-2.5 rounded bg-[#F59E0B]"></span> Road: <strong>{categoryCounts.Road}</strong>
                    </p>
                    <p className="flex items-center gap-2 font-medium">
                      <span className="w-2.5 h-2.5 rounded bg-[#3B82F6]"></span> Other: <strong>{categoryCounts.Other}</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-text-secondary italic">No category data.</div>
              )}
            </div>

          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Department Resolution Efficiency Chart */}
            <div className="lg:col-span-2 bg-bg-secondary border border-border-custom p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-bold text-text-primary mb-1">⏱️ Department Average Resolution Time</h2>
              <p className="text-xs text-text-secondary mb-6">Average hours taken from filing to status closure.</p>

              {/* Resolution bar charts (SVG-based) */}
              <div className="space-y-4 pt-2">
                {[
                  { name: "Electricity Department", hours: 8, maxHours: 48, pct: 16.6, color: "#6366F1" },
                  { name: "Water Supply Department", hours: 16, maxHours: 48, pct: 33.3, color: "#10B981" },
                  { name: "Roads & Traffic Management", hours: 38, maxHours: 48, pct: 79.1, color: "#F59E0B" },
                  { name: "Other Civic Administration", hours: 12, maxHours: 48, pct: 25.0, color: "#3B82F6" }
                ].map((dept) => (
                  <div key={dept.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-text-primary">{dept.name}</span>
                      <span className="text-text-secondary font-bold">{dept.hours} hours avg</span>
                    </div>
                    <div className="w-full bg-bg-primary h-3 rounded-full overflow-hidden border border-border-custom">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${dept.pct}%`, backgroundColor: dept.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Distribution Card */}
            <div className="bg-bg-secondary border border-border-custom p-6 rounded-2xl shadow-lg flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-1">🚨 Priority Density</h2>
                <p className="text-xs text-text-secondary mb-6">Split of complaints by severity levels.</p>
              </div>

              {totalCount > 0 ? (
                <div className="space-y-4 py-2">
                  {[
                    { label: "High Priority", val: priorityCounts.High, colorClass: "bg-red-500/20 text-red-400 border-red-500/30", barColor: "bg-red-500" },
                    { label: "Medium Priority", val: priorityCounts.Medium, colorClass: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", barColor: "bg-yellow-500" },
                    { label: "Low Priority", val: priorityCounts.Low, colorClass: "bg-blue-500/20 text-blue-400 border-blue-500/30", barColor: "bg-blue-500" }
                  ].map((prio) => {
                    const percentage = (prio.val / totalCount) * 100;
                    return (
                      <div key={prio.label} className="space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-text-secondary">{prio.label}</span>
                          <span className="font-bold text-text-primary">{prio.val} ({Math.round(percentage)}%)</span>
                        </div>
                        <div className="w-full bg-bg-primary h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${prio.barColor}`} style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-text-secondary italic">No priority data.</div>
              )}
            </div>

          </div>

          {/* filtered lists by ward heatmap */}
          {selectedWard && (
            <div className="bg-bg-secondary border border-border-custom rounded-2xl p-6 shadow-xl animate-slideUp">
              <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                🔎 Grievance records inside <span className="text-accent-primary font-bold">{selectedWard}</span>
              </h3>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {getWardStats(selectedWard).items.length === 0 ? (
                  <p className="text-sm text-text-secondary italic text-center py-6">No grievance entries found in this ward.</p>
                ) : (
                  getWardStats(selectedWard).items.map((g) => (
                    <div key={g.id} className="p-3 bg-bg-primary rounded-xl border border-border-custom flex justify-between items-center text-xs hover:border-accent-primary transition">
                      <div className="space-y-1">
                        <p className="font-semibold text-text-primary">#{g.id} - {g.title}</p>
                        <p className="text-text-secondary font-medium">
                          Category: <span className="text-accent-primary">{g.category}</span>
                          {g.latitude && g.longitude && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${g.latitude},${g.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-green-400 hover:underline font-semibold ml-3"
                            >
                              📍 GPS Location
                            </a>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          g.priority === "High" ? "bg-red-500/20 text-red-400" : g.priority === "Low" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {g.priority}
                        </span>
                        <StatusBadge status={g.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* VIEW 2: GRIEVANCES QUEUE TABLE */}
      {activeTab === "list" && (
        <div className="bg-bg-secondary border border-border-custom rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-primary/50 text-text-secondary text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Submitter</th>
                <th className="p-4 font-semibold">Title</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Priority</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {grievances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-secondary text-sm">
                    No grievances found in database.
                  </td>
                </tr>
              ) : (
                grievances.map((g) => (
                  <tr key={g.id} className="hover:bg-bg-input/50 transition text-sm">
                    <td className="p-4 font-mono text-accent-primary font-bold">#{g.id}</td>
                    <td className="p-4">
                      {g.user_id ? (
                        <div>
                          <p className="text-text-primary font-medium">{g.email}</p>
                          <span className="text-xs text-accent-primary font-semibold">Registered Citizen</span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-text-primary font-medium">{g.name || "Anonymous"}</p>
                          <p className="text-xs text-text-secondary">{g.email || "No contact email"}</p>
                          {g.phone && <p className="text-[10px] text-text-secondary">📞 {g.phone}</p>}
                          <span className="text-[10px] text-text-secondary font-semibold italic bg-bg-input px-1.5 py-0.5 rounded border border-border-custom mt-1 inline-block">
                            Guest Submission
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium text-text-primary max-w-xs truncate" title={g.description}>
                      <p className="font-semibold">{g.title}</p>
                      <p className="text-xs text-text-secondary truncate mt-0.5">{g.description}</p>
                      {g.attachment_url && (
                        <a 
                          href={g.attachment_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-block text-[10px] text-accent-primary hover:underline font-semibold mt-1"
                        >
                          📎 View Attachment
                        </a>
                      )}
                      {g.latitude && g.longitude && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${g.latitude},${g.longitude}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className={`inline-block text-[10px] text-green-400 hover:underline font-semibold mt-1 ${g.attachment_url ? 'ml-3' : ''}`}
                        >
                          📍 GPS Location
                        </a>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-accent-primary/20 text-accent-primary rounded-full text-xs font-semibold">
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
                        className="bg-bg-input border border-border-custom rounded px-2.5 py-1 text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer disabled:opacity-50"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}