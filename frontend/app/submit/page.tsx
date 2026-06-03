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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
          email: form.email || null,
          attachment_url: attachment_url
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
    <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center px-4 py-10 relative transition-colors duration-300">

      {/* Glow */}
      <div className="absolute inset-0 flex justify-center items-center -z-10">
        <div className="w-[500px] h-[500px] bg-accent-primary opacity-10 blur-3xl rounded-full"></div>
      </div>

      <div className="w-full max-w-3xl bg-bg-secondary border border-border-custom rounded-2xl p-8 shadow-2xl">

        <h1 className="text-3xl font-extrabold mb-6 text-center text-text-primary">
          Submit Your Grievance
        </h1>

        {submitted ? (
          <div className="text-center space-y-6">
            <h2 className="text-3xl text-green-400 font-semibold mb-4">
              ✅ Grievance Submitted Successfully!
            </h2>
            <p className="text-text-secondary">
              Your complaint has been recorded. You can track its progress on your dashboard or via the ID below:
            </p>
            
            <div className="bg-bg-primary border border-border-custom p-6 rounded-xl text-left space-y-4 max-w-xl mx-auto">
              <p><strong className="text-text-secondary">Tracking ID:</strong> <span className="text-accent-primary font-mono text-lg font-bold">#{submittedGrievance?.id}</span></p>
              <p><strong className="text-text-secondary">Title:</strong> {submittedGrievance?.title}</p>
              <p><strong className="text-text-secondary">Category:</strong> <span className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-full text-sm font-semibold">{submittedGrievance?.category}</span></p>
              <p>
                <strong className="text-text-secondary">Priority (AI Detected):</strong>{" "}
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
              <p><strong className="text-text-secondary">Status:</strong> <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold">{submittedGrievance?.status}</span></p>
              {submittedGrievance?.attachment_url && (
                <p>
                  <strong className="text-text-secondary">Attachment:</strong>{" "}
                  <a 
                    href={submittedGrievance.attachment_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-accent-primary hover:underline font-semibold"
                  >
                    View Attached File ↗
                  </a>
                </p>
              )}
              <p><strong className="text-text-secondary">Description:</strong> {submittedGrievance?.description}</p>
            </div>
            
            <button 
              onClick={() => {
                setForm({ name: "", email: "", category: "", title: "", description: "" });
                setSelectedFile(null);
                setSubmitted(false);
              }}
              className="mt-6 bg-accent-primary px-6 py-2.5 rounded-lg hover:bg-accent-hover transition cursor-pointer text-white font-semibold shadow-lg shadow-accent-primary/10"
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
              <label className="block mb-2 text-sm text-text-secondary font-semibold">Category</label>

              <div
                onClick={() => setOpen(!open)}
                className="w-full p-3 rounded-lg bg-bg-input border border-border-custom cursor-pointer flex justify-between items-center text-text-primary"
              >
                <span className={form.category ? "text-text-primary font-medium" : "text-text-secondary"}>
                  {form.category || "Select category"}
                </span>
                <span>▼</span>
              </div>

              {open && (
                <div className="absolute w-full mt-2 bg-bg-input border border-border-custom rounded-lg shadow-lg z-50 text-text-primary">
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
              placeholder="Short title"
            />

            {/* Description */}
            <div>
              <label className="block mb-2 text-sm text-text-secondary font-semibold">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Describe your issue..."
                className="w-full p-3 rounded-lg bg-bg-input text-text-primary border border-border-custom placeholder-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent-primary transition duration-200"
              />
            </div>

            {/* File */}
            <div>
              <label className="block mb-2 text-sm text-text-secondary font-semibold">
                Upload File (optional)
              </label>
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setSelectedFile(e.target.files[0]);
                  } else {
                    setSelectedFile(null);
                  }
                }}
                className="w-full text-text-secondary file:bg-accent-primary file:text-white file:border-0 file:px-4 file:py-2 file:rounded-lg hover:file:bg-accent-hover transition cursor-pointer"
              />
            </div>

            {/* Button */}
            <Button disabled={loading}>
              {loading ? "Submitting..." : "Submit Grievance"}
            </Button>

          </form>
        )}
      </div>
    </div>
  );
}