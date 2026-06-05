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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getDisplayName = () => {
    if (user?.full_name) {
      return user.full_name;
    }
    return user?.email ? user.email.split("@")[0] : "Citizen";
  };

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

  // Statistics calculation
  const totalCount = grievances.length;
  const pendingCount = grievances.filter((g) => g.status === "Pending").length;
  const inProgressCount = grievances.filter((g) => g.status === "In Progress" || (g.status !== "Pending" && g.status !== "Resolved")).length;
  const resolvedCount = grievances.filter((g) => g.status === "Resolved").length;

  // Mock announcements based on ward
  const getWardAnnouncements = (ward: string) => {
    if (ward.includes("12")) {
      return [
        { id: 1, type: "water", title: "Water Supply Downtime", text: "Water pipeline maintenance scheduled for Sunday in Green Valley. Supply interrupted between 8:00 AM - 12:00 PM." },
        { id: 2, type: "road", title: "Road Tarring Initiated", text: "Repair and tarring work on Sector 4 Main Road will start Monday. Expect traffic diversions." }
      ];
    }
    if (ward.includes("10")) {
      return [
        { id: 1, type: "electricity", title: "Grid Maintenance", text: "Electricity board will conduct preventive tree trimming around power lines on Saturday. Power cuts expected from 2:00 PM to 4:00 PM." }
      ];
    }
    return [
      { id: 1, type: "general", title: "Waste Management Drive", text: "E-waste collection drive organized this Saturday at the local Ward Office lobby." }
    ];
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center transition-colors duration-300">
        <div className="text-xl text-text-secondary animate-pulse">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-6 relative transition-colors duration-300">
      {/* Glow background */}
      <div className="absolute inset-0 flex justify-center items-center -z-10 overflow-hidden">
        <div className="w-[500px] h-[500px] bg-accent-primary opacity-10 blur-3xl rounded-full"></div>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-custom pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">
              {getGreeting()}, <span className="text-accent-primary">{getDisplayName()}</span>!
            </h1>
            <p className="text-text-secondary mt-1 text-sm">
              Welcome back to your civic dashboard. We are helping you keep your community safe and clean.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/profile">
              <button className="bg-bg-secondary text-text-primary border border-border-custom px-5 py-2.5 rounded-xl hover:bg-bg-input transition font-semibold cursor-pointer">
                Manage Profile
              </button>
            </Link>
            <Link href="/submit">
              <button className="bg-accent-primary text-white px-5 py-2.5 rounded-xl hover:bg-accent-hover transition font-semibold hover:scale-105 cursor-pointer shadow-lg shadow-accent-primary/20">
                Submit Grievance
              </button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Statistics Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-bg-secondary border border-border-custom p-5 rounded-2xl shadow-md">
            <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">Total Filed</p>
            <p className="text-3xl font-extrabold text-text-primary mt-1">{totalCount}</p>
          </div>
          <div className="bg-bg-secondary border border-border-custom p-5 rounded-2xl shadow-md">
            <p className="text-xs text-yellow-500 font-bold uppercase tracking-wider">Pending</p>
            <p className="text-3xl font-extrabold text-yellow-400 mt-1">{pendingCount}</p>
          </div>
          <div className="bg-bg-secondary border border-border-custom p-5 rounded-2xl shadow-md">
            <p className="text-xs text-blue-500 font-bold uppercase tracking-wider">In Progress</p>
            <p className="text-3xl font-extrabold text-blue-400 mt-1">{inProgressCount}</p>
          </div>
          <div className="bg-bg-secondary border border-border-custom p-5 rounded-2xl shadow-md">
            <p className="text-xs text-green-500 font-bold uppercase tracking-wider">Resolved</p>
            <p className="text-3xl font-extrabold text-green-400 mt-1">{resolvedCount}</p>
          </div>
        </div>

        {/* Local Ward Panel / Bulletin */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              📋 My Grievance Submissions
            </h2>

            {grievances.length === 0 ? (
              <div className="text-center py-16 bg-bg-secondary border border-border-custom rounded-2xl p-8 backdrop-blur-md">
                <p className="text-text-secondary text-lg mb-6">You haven&apos;t submitted any grievances yet.</p>
                <Link href="/submit">
                  <button className="bg-accent-primary text-white px-6 py-3 rounded-xl hover:bg-accent-hover transition font-semibold hover:scale-105 cursor-pointer shadow-lg shadow-accent-primary/20">
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

          {/* Local Information Widgets */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">
              📢 Local Updates
            </h2>

            {user?.ward ? (
              <div className="bg-bg-secondary border border-border-custom rounded-2xl p-6 space-y-4 shadow-md">
                <div className="flex justify-between items-center border-b border-border-custom pb-3">
                  <h3 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                    📍 {user.ward}
                  </h3>
                  <span className="text-xs text-accent-primary font-semibold bg-accent-primary/10 px-2 py-0.5 rounded">Active Ward</span>
                </div>
                
                <div className="space-y-3">
                  {getWardAnnouncements(user.ward).map((ann) => (
                    <div key={ann.id} className="p-3 bg-bg-primary rounded-xl border border-border-custom text-xs">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-ping"></span>
                        <strong className="text-text-primary">{ann.title}</strong>
                      </div>
                      <p className="text-text-secondary leading-relaxed">{ann.text}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border-custom pt-4 text-xs space-y-2">
                  <p className="text-text-secondary font-semibold uppercase tracking-wider text-[10px]">Ward Contact</p>
                  <p className="text-text-primary font-medium">Ward Officer: Shri Sunil G. (Assistant Commissioner)</p>
                  <p className="text-text-secondary">📞 +91 22 2456 7890</p>
                </div>
              </div>
            ) : (
              <div className="bg-bg-secondary border border-border-custom rounded-2xl p-6 text-center space-y-4 shadow-md">
                <div className="text-3xl text-accent-primary">📍</div>
                <h3 className="font-bold text-text-primary text-sm">Ward Bulletin Unavailable</h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Configure your ward/locality details in your profile settings to receive local civic announcements and contact details of your ward officer.
                </p>
                <Link href="/profile">
                  <button className="bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 transition text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer">
                    Setup Ward Profile
                  </button>
                </Link>
              </div>
            )}

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-accent-primary/5 to-accent-primary/10 border border-accent-primary/20 rounded-2xl p-6 space-y-3">
              <h3 className="font-bold text-text-primary text-sm">💡 Did you know?</h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                Naarad-GRS uses AI to scan details, classify categories, detect severity, and route grievances directly to department officers in your ward. This saves an average of 48 hours in resolution time!
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}