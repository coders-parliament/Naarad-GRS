import StatusBadge from "./StatusTag";

type Props = {
  grievance: {
    id: number;
    title: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    created_at: string;
  };
};

export default function GrievanceCard({ grievance }: Props) {
  const formattedDate = new Date(grievance.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="border border-white/10 rounded-xl p-6 shadow-lg bg-white/5 backdrop-blur-lg hover:border-indigo-500/50 transition duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            {grievance.title}
            <span className="text-sm font-mono text-gray-400">#{grievance.id}</span>
          </h2>
          <span className="inline-block mt-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold">
            {grievance.category}
          </span>
        </div>

        <div className="flex flex-col items-end gap-2">
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

      <p className="mt-4 text-gray-300 text-sm leading-relaxed">
        {grievance.description}
      </p>

      <div className="flex justify-between items-center text-xs text-gray-500 mt-6 border-t border-white/5 pt-4">
        <span>Submitted: {formattedDate}</span>
      </div>
    </div>
  );
}