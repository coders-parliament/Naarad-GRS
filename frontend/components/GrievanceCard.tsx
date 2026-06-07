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
    timeline?: TimelineEvent[];
  };
};

export default function GrievanceCard({ grievance }: Props) {
  const [showTimeline, setShowTimeline] = useState(false);
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