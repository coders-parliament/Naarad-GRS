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
    phone: "",
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

  // File preview & compression state
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Revoke object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (filePreview && filePreview !== "pdf") {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  // Compress image helper using Canvas API
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const max_width = 1000;
          const max_height = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > max_width) {
              height *= max_width / width;
              width = max_width;
            }
          } else {
            if (height > max_height) {
              width *= max_height / height;
              height = max_height;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.7
          );
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit. Please choose a smaller file.");
      return;
    }

    // Validate format
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError("Unsupported format. Only JPG, PNG, and PDF are allowed.");
      return;
    }

    // Clean up previous preview if any
    if (filePreview && filePreview !== "pdf") {
      URL.revokeObjectURL(filePreview);
    }

    // If it's an image, perform client-side compression
    if (file.type.startsWith("image/")) {
      setLoading(true);
      try {
        const compressed = await compressImage(file);
        setSelectedFile(compressed);
        const objectUrl = URL.createObjectURL(compressed);
        setFilePreview(objectUrl);
      } catch (err) {
        // Fallback to uncompressed file if error
        setSelectedFile(file);
        const objectUrl = URL.createObjectURL(file);
        setFilePreview(objectUrl);
      } finally {
        setLoading(false);
      }
    } else {
      // PDF or other document
      setSelectedFile(file);
      setFilePreview("pdf"); // Special keyword for PDF display
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreview && filePreview !== "pdf") {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(null);
  };

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
              phone: data.phone || "",
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
          phone: isAnonymous ? null : form.phone || null,
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
                  setForm({ name: "", email: "", phone: "", category: "", title: "", description: "" });
                  setAiPreview(null);
                  handleRemoveFile();
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
              <div className="grid md:grid-cols-3 gap-6 p-4 bg-bg-primary rounded-xl border border-border-custom">
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
                <Input
                  label="Phone Number (for SMS)"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
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
            <div className="space-y-2">
              <label className="block text-sm text-text-secondary font-semibold">Upload Photo/Document (Optional)</label>
              
              {selectedFile ? (
                <div className="p-4 bg-bg-input border border-accent-primary/20 rounded-xl flex items-center justify-between gap-4 animate-fadeIn">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {filePreview === "pdf" ? (
                      <div className="w-12 h-12 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-lg border border-red-500/20 shrink-0">
                        PDF
                      </div>
                    ) : (
                      filePreview && (
                        <img 
                          src={filePreview} 
                          alt="preview" 
                          className="w-12 h-12 rounded-lg object-cover border border-border-custom shrink-0" 
                        />
                      )
                    )}
                    <div className="text-left overflow-hidden">
                      <p className="text-sm font-semibold text-text-primary truncate">{selectedFile.name}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB • <span className="text-green-400 font-semibold">Compressed & Validated</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-xs font-bold text-red-400 hover:text-red-300 transition cursor-pointer bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/20"
                  >
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <div className="relative border-2 border-dashed border-border-custom hover:border-accent-primary rounded-xl p-6 text-center transition cursor-pointer bg-bg-input/30 group">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  />
                  <div className="space-y-2">
                    <div className="text-3xl transition group-hover:scale-110 duration-200">📁</div>
                    <p className="text-sm font-semibold text-text-primary">Click to upload or drag & drop</p>
                    <p className="text-xs text-text-secondary">Supported: JPG, PNG, PDF (Max size: 5MB)</p>
                  </div>
                </div>
              )}
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