"use client";

import { ChangeEvent, FormEvent, useState } from "react";
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

  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCategorySelect = (cat: string) => {
    setForm({ ...form, category: cat });
    setOpen(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.category || !form.title || !form.description) {
      setError("Please fill all required fields");
      return;
    }

    setError("");

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiBase}/grievances`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to submit grievance");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit grievance");
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
          <div className="text-center">
            <h2 className="text-2xl text-green-400 font-semibold mb-4">
              ✅ Grievance Submitted!
            </h2>
            <p className="text-gray-400">
              Your complaint has been recorded successfully.
            </p>
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
