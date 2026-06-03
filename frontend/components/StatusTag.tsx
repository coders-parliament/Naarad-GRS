type Props = {
  status: string;
};

export default function StatusBadge({ status }: Props) {
  const styles =
    status === "Pending"
      ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
      : status === "Resolved"
      ? "bg-green-500/10 text-green-500 border border-green-500/20"
      : "bg-red-500/10 text-red-500 border border-red-500/20";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles}`}>
      {status}
    </span>
  );
}