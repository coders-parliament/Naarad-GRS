type Props = {
  status: string;
};

export default function StatusBadge({ status }: Props) {
  let color = "";

  switch (status) {
    case "Pending":
      color = "bg-yellow-500";
      break;

    case "Resolved":
      color = "bg-green-500";
      break;

    case "Urgent":
      color = "bg-red-500";
      break;

    default:
      color = "bg-gray-500";
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-white text-sm ${color}`}
    >
      {status}
    </span>
  );
}