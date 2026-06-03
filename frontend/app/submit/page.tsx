"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";

const categories = ["Electricity", "Water", "Road", "Other"];

import { useEffect } from "react";

export default function SubmitPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "",
    title: "",
    description: "",
  });

  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedGrievance, setSubmittedGrievance] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://127.0.0.1:8000/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) return res.json();
      })
      .then(data => {
        if (data) {
          setForm(prev => ({
            ...prev,
            email: data.email || "",
            name: data.email.split("@")[0] || ""
          }));
        }
      })
      .catch(err => console.error("Failed to load user profile", err));
    }
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCategorySelect = (cat: string) => {
    setForm({ ...form, category: cat });
    setOpen(false);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!form.title || !form.description) {
      setError("Please enter a Title and Description for your grievance");
      return;
    }

    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (token) {
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
          name: form.name || null,
          email: form.email || null
        })
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
    <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center px-4 py-10 relative">

      {/* Glow */}
      <div className="absolute inset-0 flex justify-center items-center -z-10">
        <div className="w-[500px] h-[500px] bg-indigo-600 opacity-20 blur-3xl rounded-full"></div>
      </div>

      <div className="w-full max-w-3xl bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-lg">

        <h1 className="text-3xl font-bold mb-6 text-center">
          Submit Your Grievance
        </h1>

        {submitted ? (
          <div className="text-center space-y-6">
            <h2 className="text-3xl text-green-400 font-semibold mb-4">
              ✅ Grievance Submitted Successfully!
            </h2>
            <p className="text-gray-300">
              Your complaint has been recorded. You can track its progress on your dashboard or via the ID below:
            </p>
            
            <div className="bg-white/10 p-6 rounded-xl border border-white/10 text-left space-y-4 max-w-xl mx-auto">
              <p><strong className="text-gray-400">Tracking ID:</strong> <span className="text-indigo-400 font-mono text-lg font-bold">#{submittedGrievance?.id}</span></p>
              <p><strong className="text-gray-400">Title:</strong> {submittedGrievance?.title}</p>
              <p><strong className="text-gray-400">Category:</strong> <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm font-semibold">{submittedGrievance?.category}</span></p>
              <p>
                <strong className="text-gray-400">Priority (AI Detected):</strong>{" "}
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  submittedGrievance?.priority === "High" 
                    ? "bg-red-500/20 text-red-400" 
                    : submittedGrievance?.priority === "Low" 
                    ? "bg-blue-500/20 text-blue-400" 
                    : "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {submittedGrievance?.priority}
                </span>
              </p>
              <p><strong className="text-gray-400">Status:</strong> <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold">{submittedGrievance?.status}</span></p>
              <p><strong className="text-gray-400">Description:</strong> {submittedGrievance?.description}</p>
            </div>
            
            <button 
              onClick={() => {
                setForm({ name: "", email: "", category: "", title: "", description: "" });
                setSubmitted(false);
              }}
              className="mt-6 bg-indigo-600 px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition cursor-pointer text-white font-semibold"
            >
              Submit Another Grievance
            </button>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* Toast Error */}
            {error && <Toast message={error} type="error" />}

            {/* Name */}
            <Input
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your name"
            />

            {/* Email */}
            <Input
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />

            {/* Category */}
            <div className="relative">
              <label className="block mb-2 text-sm text-gray-300">Category</label>

              <div
                onClick={() => setOpen(!open)}
                className="w-full p-3 rounded-lg bg-[#1A1F2E] border border-gray-600 cursor-pointer flex justify-between items-center"
              >
                <span className={form.category ? "text-white" : "text-gray-400"}>
                  {form.category || "Select category"}
                </span>
                <span>▼</span>
              </div>

              {open && (
                <div className="absolute w-full mt-2 bg-[#1A1F2E] border border-gray-600 rounded-lg shadow-lg z-50">
                  {categories.map((cat) => (
                    <div
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      className="p-3 hover:bg-indigo-600 cursor-pointer"
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
              placeholder="Short title"
            />

            {/* Description */}
            <div>
              <label className="block mb-2 text-sm text-gray-300">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Describe your issue..."
                className="w-full p-3 rounded-lg bg-[#1A1F2E] text-white border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* File */}
            <div>
              <label className="block mb-2 text-sm text-gray-300">
                Upload File (optional)
              </label>
              <input
                type="file"
                className="w-full text-gray-400 file:bg-indigo-600 file:text-white file:border-0 file:px-4 file:py-2 file:rounded-lg hover:file:bg-indigo-700"
              />
            </div>

            {/* Button */}
            <Button>
              Submit Grievance
            </Button>

          </form>
        )}
      </div>
    </div>
  );
}