import GrievanceCard from "@/components/GrievanceCard";

const grievances = [
  {
    id: 1,
    title: "Water Leakage",
    description: "Pipe leakage near Sector 12",
    department: "Water Department",
    status: "Pending",
    date: "2026-05-06",
  },
  {
    id: 2,
    title: "Street Light Broken",
    description: "Street light not working",
    department: "Electricity Department",
    status: "Resolved",
    date: "2026-05-05",
  },
  {
    id: 3,
    title: "Garbage Collection Delay",
    description: "Garbage not collected for 3 days",
    department: "Municipal Department",
    status: "Urgent",
    date: "2026-05-04",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-bold mb-8">
        User Dashboard
      </h1>

      <div className="grid gap-6">
        {grievances.map((item) => (
          <GrievanceCard
            key={item.id}
            grievance={item}
          />
        ))}
      </div>
    </div>
  );
}