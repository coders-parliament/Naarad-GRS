import StatusBadge from "./StatusTag";

type Props = {
  grievance: {
    id: number;
    title: string;
    description: string;
    department: string;
    status: string;
    date: string;
  };
};

export default function GrievanceCard({ grievance }: Props) {
  return (
    <div className="border rounded-lg p-5 shadow-md bg-white">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">
          {grievance.title}
        </h2>

        <StatusBadge status={grievance.status} />
      </div>

      <p className="text-gray-600 mt-2">
        {grievance.department}
      </p>

      <p className="mt-3">
        {grievance.description}
      </p>

      <p className="text-sm text-gray-500 mt-4">
        Submitted: {grievance.date}
      </p>
    </div>
  );
}