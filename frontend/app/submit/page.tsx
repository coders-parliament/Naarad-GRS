"use client";

import { useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";

const categories = ["Electricity", "Water", "Road", "Other"];

export default function SubmitPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "",
    title: "",
    description: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedGrievance, setSubmittedGrievance] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Profile data & anonymous submission option
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // AI analysis preview
  const [aiPreview, setAiPreview] = useState<{ category: string; priority: string; sentiment: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://127.0.0.1:8000/me", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (res.ok) return res.json();
        })
        .then((data) => {
          if (data) {
            setUserProfile(data);
            setForm((prev) => ({
              ...prev,
              email: data.email || "",
              name: data.full_name || data.email.split("@")[0] || "",
            }));
          }
        })
        .catch((err) => console.error("Failed to load user profile", err));
    }
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Reset AI preview if title/description changes to force re-analysis
    if (e.target.name === "title" || e.target.name === "description") {
      setAiPreview(null);
    }
  };

  const handleCategorySelect = (cat: string) => {
    setForm({ ...form, category: cat });
    setOpen(false);
  };

  const triggerAIAnalysis = async () => {
    if (!form.title || !form.description) {
      setError("Please enter a title and description before analyzing.");
      return;
    }
    setError("");
    setAnalyzing(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiPreview(data);
      } else {
        setError("Failed to process text with AI engine.");
      }
    } catch {
      setError("AI Engine offline. Standard rule-based fallback will be used.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!form.title || !form.description) {
      setError("Please enter a Title and Description for your grievance");
      return;
    }

    setLoading(true);
    setError("");

    // Step 1: Upload file if exists
    let attachment_url = null;
    if (selectedFile) {
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await fetch("http://127.0.0.1:8000/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload attachment");
        }

        const uploadData = await uploadRes.json();
        attachment_url = uploadData.url;
      } catch (err: any) {
        setError(err.message || "Failed to upload file attachment");
        setLoading(false);
        return;
      }
    }

    // Step 2: Submit grievance
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Only send Auth token if NOT submitting anonymously
    if (token && !isAnonymous) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/grievance", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category || "Other",
          name: isAnonymous ? null : form.name || null,
          email: isAnonymous ? null : form.email || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmittedGrievance(data);
        setSubmitted(true);
      } else {
        setError(data.detail || "Failed to submit grievance");
      }
    } catch (err) {
      setError("Failed to connect to backend server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center px-4 py-10 relative transition-colors duration-300">
      {/* Glow background */}
      <div className="absolute inset-0 flex justify-center items-center -z-10">
        <div className="w-[500px] h-[500px] bg-accent-primary opacity-10 blur-3xl rounded-full"></div>
      </div>

      <div className="w-full max-w-3xl bg-bg-secondary border border-border-custom rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <h1 className="text-3xl font-extrabold mb-2 text-center text-text-primary">
          Submit Your Grievance
        </h1>
        <p className="text-center text-text-secondary text-sm mb-8">
          File a request with intelligent classification and direct routing.
        </p>

        {submitted ? (
          <div className="text-center space-y-6">
            <h2 className="text-3xl text-green-400 font-semibold mb-4">
              ✅ Grievance Submitted Successfully!
            </h2>
            <p className="text-text-secondary">
              Your complaint has been recorded. You can track its progress on your dashboard or via the ID below:
            </p>

            <div className="bg-bg-primary border border-border-custom p-6 rounded-xl text-left space-y-4 max-w-xl mx-auto shadow-md">
              <p>
                <strong className="text-text-secondary">Tracking ID:</strong>{" "}
                <span className="text-accent-primary font-mono text-lg font-bold">#{submittedGrievance?.id}</span>
              </p>
              <p>
                <strong className="text-text-secondary">Title:</strong> {submittedGrievance?.title}
              </p>
              <p>
                <strong className="text-text-secondary">Category:</strong>{" "}
                <span className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-full text-sm font-semibold">
                  {submittedGrievance?.category}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-4">
                <p>
                  <strong className="text-text-secondary block">Priority (AI):</strong>{" "}
                  <span
                    className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${
                      submittedGrievance?.priority === "High"
                        ? "bg-red-500/20 text-red-400"
                        : submittedGrievance?.priority === "Low"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {submittedGrievance?.priority}
                  </span>
                </p>
                <p>
                  <strong className="text-text-secondary block">Routing Status:</strong>{" "}
                  <span className="inline-block mt-1 px-3 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">
                    {submittedGrievance?.status}
                  </span>
                </p>
              </div>
              <p>
                <strong className="text-text-secondary">Description:</strong> {submittedGrievance?.description}
              </p>
              
              {userProfile?.ward && (
                <div className="border-t border-border-custom pt-3 text-xs text-text-secondary">
                  📍 Auto-routing complaint to: <span className="text-text-primary font-bold">{userProfile.ward} Authorities</span>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => {
                  setForm({ name: "", email: "", category: "", title: "", description: "" });
                  setAiPreview(null);
                  setSubmitted(false);
                }}
              >
                Submit Another Grievance
              </Button>
            </div>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Toast Error */}
            {error && <Toast message={error} type="error" />}

            {/* Anonymity Option (Toggle card) */}
            <div
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`p-4 rounded-xl border transition cursor-pointer flex justify-between items-center ${
                isAnonymous
                  ? "bg-accent-primary/10 border-accent-primary/40 text-accent-primary"
                  : "bg-bg-input border-border-custom text-text-secondary hover:border-text-secondary/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🕵️‍♂️</span>
                <div className="text-left">
                  <p className="font-bold text-sm text-text-primary">File Anonymously</p>
                  <p className="text-xs text-text-secondary">Hide your identity and contact info from public records.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={() => {}}
                className="w-5 h-5 accent-accent-primary cursor-pointer"
              />
            </div>

            {/* Contact Details Fields - Shown only if NOT anonymous */}
            {!isAnonymous && (
              <div className="grid md:grid-cols-2 gap-6 p-4 bg-bg-primary rounded-xl border border-border-custom">
                <Input
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                />
                <Input
                  label="Email Address"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </div>
            )}

            {/* Category */}
            <div className="relative">
              <label className="block mb-2 text-sm text-text-secondary font-semibold">Category (Self Selected)</label>
              <div
                onClick={() => setOpen(!open)}
                className="w-full p-3 rounded-lg bg-bg-input border border-border-custom cursor-pointer flex justify-between items-center text-text-primary hover:border-text-secondary/20 transition"
              >
                <span className={form.category ? "text-text-primary font-medium" : "text-text-secondary"}>
                  {form.category || "Let AI Predict Category (Select to override)"}
                </span>
                <span>▼</span>
              </div>

              {open && (
                <div className="absolute w-full mt-2 bg-bg-input border border-border-custom rounded-lg shadow-lg z-50 text-text-primary">
                  <div
                    onClick={() => handleCategorySelect("")}
                    className="p-3 hover:bg-accent-primary hover:text-white cursor-pointer transition text-text-secondary italic"
                  >
                    Clear - Let AI Decide Category
                  </div>
                  {categories.map((cat) => (
                    <div
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      className="p-3 hover:bg-accent-primary hover:text-white cursor-pointer transition"
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Title */}
            <Input
              label="Grievance Title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="E.g., Broken water pipeline causing waterlogging"
            />

            {/* Description */}
            <div>
              <label className="block mb-2 text-sm text-text-secondary font-semibold">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe your issue with locations, timestamps, and severity details..."
                className="w-full p-3 rounded-lg bg-bg-input text-text-primary border border-border-custom placeholder-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent-primary transition duration-200"
              />
            </div>

            {/* AI Action Panel */}
            <div className="bg-bg-input border border-border-custom rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary font-bold uppercase tracking-wider flex items-center gap-1.5">
                  🧠 AI Diagnostics & Routing Preview
                </span>
                <button
                  type="button"
                  onClick={triggerAIAnalysis}
                  disabled={analyzing}
                  className="bg-accent-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-accent-hover transition font-medium cursor-pointer disabled:opacity-50"
                >
                  {analyzing ? "Analyzing text..." : "Preview AI Routing"}
                </button>
              </div>

              {aiPreview ? (
                <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
                  <div className="p-2.5 bg-bg-secondary rounded-lg border border-border-custom">
                    <p className="text-[10px] text-text-secondary uppercase">Predicted Category</p>
                    <p className="font-bold text-text-primary mt-1">{aiPreview.category}</p>
                  </div>
                  <div className="p-2.5 bg-bg-secondary rounded-lg border border-border-custom">
                    <p className="text-[10px] text-text-secondary uppercase">Assessed Priority</p>
                    <p
                      className={`font-bold mt-1 ${
                        aiPreview.priority === "High"
                          ? "text-red-400"
                          : aiPreview.priority === "Low"
                          ? "text-blue-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {aiPreview.priority}
                    </p>
                  </div>
                  <div className="p-2.5 bg-bg-secondary rounded-lg border border-border-custom">
                    <p className="text-[10px] text-text-secondary uppercase">Detected Sentiment</p>
                    <p className="font-bold text-text-primary mt-1 capitalize">{aiPreview.sentiment}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-secondary leading-relaxed pt-1">
                  Fill in the Title and Description and click &quot;Preview AI Routing&quot; to see how our AI categorizes, assesses priority, and routes your request.
                </p>
              )}
            </div>

            {/* File Upload */}
            <div>
              <label className="block mb-2 text-sm text-text-secondary font-semibold">Upload Photo/Document (Optional)</label>
              <input
                type="file"
                className="w-full text-text-secondary file:bg-bg-input file:text-text-primary file:border file:border-border-custom file:px-4 file:py-2 file:rounded-lg hover:file:bg-bg-secondary transition cursor-pointer file:mr-4 file:text-xs"
              />
            </div>

            {/* Submit Button */}
            <Button disabled={loading}>
              {loading ? "Submitting to Municipal Board..." : "Submit Grievance"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}