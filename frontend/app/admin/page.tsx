"use client";

import StatusBadge from "@/components/ui/StatusBadge";
import useAuth from "@/hooks/useAuth";

export default function AdminDashboard() {

  // Placeholder auth protection
  useAuth(true);

  const grievances = [
    { id: 1, name: "Saket", title: "Water issue", status: "Pending" },
    { id: 2, name: "Rahul", title: "Road damage", status: "Resolved" },
    { id: 3, name: "Amit", title: "Electricity cut", status: "Urgent" },
  ];

  return (
    <div>

      <h2 className="text-xl mb-6">
        Grievances
      </h2>

      <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-xl">

        <table className="w-full text-left">

          <thead className="bg-white/10">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Title</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {grievances.map((g) => (
              <tr
                key={g.id}
                className="border-t border-white/10 hover:bg-white/5"
              >
                <td className="p-4">{g.id}</td>
                <td className="p-4">{g.name}</td>
                <td className="p-4">{g.title}</td>

                <td className="p-4">
                  <StatusBadge status={g.status} />
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>

    </div>
  );
}