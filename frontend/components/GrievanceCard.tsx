import { useState } from "react";
import StatusBadge from "./StatusTag";

type TimelineEvent = {
  id: number;
  status: string;
  remarks?: string | null;
  action_by?: number | null;
  created_at: string;
};

type Props = {
  grievance: {
    id: number;
    title: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    created_at: string;
    name?: string | null;
    email?: string | null;
    rating?: number | null;
    feedback?: string | null;
    reopened_count?: number;
    timeline?: TimelineEvent[];
  };
  onUpdate?: () => void;
};

export default function GrievanceCard({ grievance, onUpdate }: Props) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const [showReopenForm, setShowReopenForm] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [isSubmittingReopen, setIsSubmittingReopen] = useState(false);
  const [reopenError, setReopenError] = useState("");

  const handleFeedbackSubmit = async () => {
    if (selectedRating === null) return;
    setIsSubmittingFeedback(true);
    setFeedbackError("");
    
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`http://127.0.0.1:8000/grievance/${grievance.id}/feedback`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          rating: selectedRating,
          feedback: feedbackText || null
        }),
      });

      if (res.ok) {
        if (onUpdate) {
          onUpdate();
        }
      } else {
        const errorData = await res.json();
        setFeedbackError(errorData.detail || "Failed to submit feedback");
      }
    } catch (err) {
      setFeedbackError("Failed to connect to the server");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleReopen = async () => {
    if (!reopenReason.trim()) return;
    setIsSubmittingReopen(true);
    setReopenError("");

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`http://127.0.0.1:8000/grievance/${grievance.id}/reopen`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          remarks: reopenReason
        }),
      });

      if (res.ok) {
        setShowReopenForm(false);
        setReopenReason("");
        if (onUpdate) {
          onUpdate();
        }
      } else {
        const errorData = await res.json();
        setReopenError(errorData.detail || "Failed to reopen grievance");
      }
    } catch (err) {
      setReopenError("Failed to connect to the server");
    } finally {
      setIsSubmittingReopen(false);
    }
  };

  const resolvedEvent = grievance.timeline
    ? [...grievance.timeline]
        .reverse()
        .find((event) => event.status === "Resolved")
    : null;
  const resolvedTime = resolvedEvent ? resolvedEvent.created_at : grievance.created_at;
  const daysSinceResolution = (new Date().getTime() - new Date(resolvedTime).getTime()) / (1000 * 60 * 60 * 24);
  const isWithin7Days = daysSinceResolution <= 7;
  const formattedDate = new Date(grievance.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Map status to timeline steps
  let activeStep = 1; // 1: Submitted, 2: AI Classified, 3: Assigned, 4: Resolved
  if (grievance.status === "Pending") {
    activeStep = 2; // AI has processed it, but officer not yet assigned/in progress
  } else if (grievance.status === "Resolved") {
    activeStep = 4;
  } else {
    activeStep = 3; // "In Progress" or similar
  }

  // Get officer details based on category
  const getOfficerDetails = (cat: string) => {
    switch (cat) {
      case "Electricity":
        return { name: "Er. Rajesh Patel", role: "Executive Engineer, Power Distribution Dept", phone: "+91 98234 56789" };
      case "Water":
        return { name: "Er. Anil Kumar", role: "Assistant Commissioner, Water Supply Dept", phone: "+91 98234 11223" };
      case "Road":
        return { name: "Er. Sandeep Shinde", role: "Chief Surveyor, Roads & Traffic Management", phone: "+91 98234 44556" };
      default:
        return { name: "Officer Swati Deshmukh", role: "Senior Officer, Municipal Grievance Cell", phone: "+91 98234 77889" };
    }
  };

  const officer = getOfficerDetails(grievance.category);

  return (
    <div className="border border-border-custom rounded-xl p-6 shadow-lg bg-bg-secondary hover:border-accent-primary transition duration-300 flex flex-col gap-6">
      
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-text-primary">
              {grievance.title}
            </h2>
            <span className="text-sm font-mono text-text-secondary">#{grievance.id}</span>
          </div>
          <div className="flex gap-2 items-center mt-2">
            <span className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-full text-xs font-semibold">
              {grievance.category}
            </span>
            {grievance.name ? (
              <span className="text-xs text-text-secondary bg-bg-input px-2.5 py-0.5 rounded border border-border-custom">
                👤 {grievance.name}
              </span>
            ) : (
              <span className="text-xs text-text-secondary italic bg-bg-input px-2.5 py-0.5 rounded border border-border-custom">
                🕵️‍♂️ Anonymous Submission
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 self-stretch md:self-auto">
          <StatusBadge status={grievance.status} />
          
          <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
            grievance.priority === "High" 
              ? "bg-red-500/20 text-red-400 border border-red-500/30" 
              : grievance.priority === "Low" 
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
          }`}>
            {grievance.priority} Priority
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-text-secondary text-sm leading-relaxed">
        {grievance.description}
      </p>

      {/* Steps Tracking Timeline */}
      <div className="border-t border-b border-border-custom py-6 my-2">
        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-4">Grievance Progress Tracker</p>
        
        <div className="relative flex justify-between items-center w-full">
          {/* Progress bar background line */}
          <div className="absolute left-0 right-0 top-1/2 h-[3px] bg-bg-input -translate-y-1/2 -z-10 rounded"></div>
          
          {/* Progress bar active line */}
          <div 
            className="absolute left-0 top-1/2 h-[3px] bg-accent-primary -translate-y-1/2 -z-10 rounded transition-all duration-500"
            style={{ width: `${((activeStep - 1) / 3) * 100}%` }}
          ></div>

          {/* Step 1: Submitted */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition duration-300 ${
              activeStep >= 1 
                ? "bg-accent-primary text-white shadow-lg shadow-accent-primary/20" 
                : "bg-bg-input text-text-secondary border border-border-custom"
            }`}>
              1
            </div>
            <span className="text-[10px] text-text-primary mt-2 font-semibold">Submitted</span>
          </div>

          {/* Step 2: AI Processed */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition duration-300 ${
              activeStep >= 2 
                ? "bg-accent-primary text-white shadow-lg shadow-accent-primary/20" 
                : "bg-bg-input text-text-secondary border border-border-custom"
            }`}>
              2
            </div>
            <span className="text-[10px] text-text-primary mt-2 font-semibold">AI Classified</span>
          </div>

          {/* Step 3: Officer Assigned */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition duration-300 ${
              activeStep >= 3 
                ? "bg-accent-primary text-white shadow-lg shadow-accent-primary/20" 
                : "bg-bg-input text-text-secondary border border-border-custom"
            }`}>
              3
            </div>
            <span className="text-[10px] text-text-primary mt-2 font-semibold">Officer Action</span>
          </div>

          {/* Step 4: Resolved */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition duration-300 ${
              activeStep >= 4 
                ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
                : "bg-bg-input text-text-secondary border border-border-custom"
            }`}>
              ✓
            </div>
            <span className="text-[10px] text-text-primary mt-2 font-semibold">Resolved</span>
          </div>
        </div>
      </div>

      {/* Assigned Officer / Resolution Panel */}
      {activeStep >= 3 && (
        <div className="bg-bg-primary rounded-xl p-4 border border-border-custom text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1">Assigned Executive Officer</p>
            <p className="text-text-primary font-bold">{officer.name}</p>
            <p className="text-text-secondary">{officer.role}</p>
          </div>
          <a 
            href={`tel:${officer.phone}`}
            className="px-4 py-2 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary rounded-lg transition font-semibold"
          >
            📞 Contact Department
          </a>
        </div>
      )}

      {/* Feedback & Reopen Panel */}
      {grievance.status === "Resolved" && (
        <div className="border-t border-border-custom pt-4 flex flex-col gap-4 animate-fade-in">
          {grievance.rating ? (
            // Feedback already submitted
            <div className="bg-bg-primary/40 rounded-xl p-4 border border-border-custom flex flex-col gap-3 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1">Your Resolution Rating</p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 transition-all duration-300 ${
                          star <= (grievance.rating || 0) 
                            ? "text-yellow-400 fill-current drop-shadow-[0_0_4px_rgba(250,204,21,0.3)] animate-bounce-short" 
                            : "text-text-secondary/20 fill-none"
                        }`}
                        style={{ animationDelay: `${star * 70}ms` }}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                </div>

                {/* Reopen option if rating is low (1 or 2) and within 7 days */}
                {(grievance.rating === 1 || grievance.rating === 2) && (
                  <div>
                    {isWithin7Days ? (
                      !showReopenForm && (
                        <button
                          onClick={() => setShowReopenForm(true)}
                          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 text-xs font-semibold cursor-pointer shadow-sm hover:shadow-red-500/10"
                        >
                          ⚠️ Reopen Grievance
                        </button>
                      )
                    ) : (
                      <span className="text-[10px] text-text-secondary italic">
                        Resolution older than 7 days (cannot reopen)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {grievance.feedback && (
                <div className="text-xs animate-fade-in">
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1">Feedback Comments</p>
                  <p className="text-text-primary italic bg-bg-primary p-2.5 rounded-lg border border-border-custom/50">
                    "{grievance.feedback}"
                  </p>
                </div>
              )}

              {/* Reopen Form */}
              {showReopenForm && (
                <div className="border-t border-border-custom pt-3 mt-1 space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1.5">
                      Reason for Reopening
                    </label>
                    <textarea
                      value={reopenReason}
                      onChange={(e) => setReopenReason(e.target.value)}
                      placeholder="Please explain why the issue was not resolved satisfactorily..."
                      className="w-full bg-bg-input border border-border-custom rounded-lg p-2.5 text-xs text-text-primary focus:border-accent-primary focus:outline-none placeholder-text-secondary/50 resize-none h-20 transition-all duration-200"
                    />
                  </div>

                  {reopenError && (
                    <p className="text-xs text-red-400 animate-pulse-slow">{reopenError}</p>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setShowReopenForm(false);
                        setReopenReason("");
                        setReopenError("");
                      }}
                      className="px-3.5 py-1.5 bg-bg-secondary hover:bg-bg-input border border-border-custom text-text-secondary rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 text-xs font-semibold cursor-pointer"
                      disabled={isSubmittingReopen}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReopen}
                      className="px-3.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-500/20"
                      disabled={isSubmittingReopen || !reopenReason.trim()}
                    >
                      {isSubmittingReopen ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Reopening...
                        </>
                      ) : (
                        "Reopen Grievance"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Feedback needs to be submitted
            <div className="bg-bg-primary/40 rounded-xl p-4 border border-border-custom flex flex-col gap-3 animate-fade-in">
              <div>
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1.5">How would you rate the resolution?</p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = hoverRating !== null ? star <= hoverRating : selectedRating !== null ? star <= selectedRating : false;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSelectedRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="transition-all duration-200 hover:scale-125 focus:outline-none cursor-pointer active:scale-90"
                      >
                        <svg
                          className={`w-7 h-7 transition-all duration-200 ease-out ${
                            isFilled 
                              ? "text-yellow-400 fill-current drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] scale-110" 
                              : "text-text-secondary/40 fill-none hover:text-yellow-300/60"
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedRating !== null && (
                <div className="space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1.5">
                      Your Comments / Feedback (Optional)
                    </label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="What did we do well or how could we improve?"
                      className="w-full bg-bg-input border border-border-custom rounded-lg p-2.5 text-xs text-text-primary focus:border-accent-primary focus:outline-none placeholder-text-secondary/50 resize-none h-20 transition-all duration-200"
                    />
                  </div>

                  {feedbackError && (
                    <p className="text-xs text-red-400 animate-pulse-slow">{feedbackError}</p>
                  )}

                  <div className="flex justify-between items-center">
                    {(selectedRating === 1 || selectedRating === 2) && (
                      <span className="text-[10px] text-yellow-500 font-semibold flex items-center gap-1 animate-pulse-slow">
                        ⚠️ Low rating allows you to reopen this issue
                      </span>
                    )}
                    <button
                      onClick={handleFeedbackSubmit}
                      className="ml-auto px-4 py-2 bg-accent-primary hover:bg-accent-hover text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-md shadow-accent-primary/20"
                      disabled={isSubmittingFeedback}
                    >
                      {isSubmittingFeedback ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Submitting...
                        </>
                      ) : (
                        "Submit Review"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Collapsible Timeline Action Log */}
      <div className="border-t border-border-custom pt-4">
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="flex items-center gap-2 text-xs font-semibold text-accent-primary hover:text-accent-hover transition cursor-pointer select-none"
        >
          <span>🕒</span>
          <span>
            {showTimeline ? "Hide History Log" : `View History Log (${grievance.timeline?.length || 1})`}
          </span>
          <span className={`transform transition-transform duration-200 text-[9px] ${showTimeline ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>

        {showTimeline && (
          <div className="mt-4 pl-2 space-y-4 border-l border-border-custom ml-1.5 animate-fadeIn">
            {(grievance.timeline && grievance.timeline.length > 0 ? grievance.timeline : [
              {
                id: 0,
                status: "Pending",
                remarks: "Grievance submitted successfully. AI auto-assigned category and priority.",
                created_at: grievance.created_at
              }
            ]).map((event, index) => {
              const eventDate = new Date(event.created_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              });
              return (
                <div key={event.id || index} className="relative pl-6 pb-2 last:pb-0">
                  {/* Bullet point indicator */}
                  <span className="absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full border border-bg-secondary bg-accent-primary shadow-sm"></span>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-text-primary">
                        {event.status}
                      </span>
                      <span className="text-[10px] text-text-secondary">
                        {eventDate}
                      </span>
                    </div>
                    {event.remarks && (
                      <p className="text-xs text-text-secondary leading-relaxed bg-bg-primary/50 p-2.5 rounded-lg border border-border-custom/50 mt-0.5">
                        {event.remarks}
                      </p>
                    )}
                    {event.action_by ? (
                      <span className="text-[9px] text-text-secondary font-medium">
                        Action by: Department Official
                      </span>
                    ) : (
                      <span className="text-[9px] text-text-secondary italic">
                        Action by: System
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-xs text-text-secondary mt-1">
        <span>Grievance raised: {formattedDate}</span>
      </div>
      
    </div>
  );
}