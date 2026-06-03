type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

export default function Button({ children, onClick, variant = "primary", type = "submit", disabled }: ButtonProps) {
  const base = "px-5 py-2.5 rounded-xl transition font-semibold w-full cursor-pointer disabled:opacity-50";

  const styles =
    variant === "primary"
      ? "bg-accent-primary hover:bg-accent-hover text-white shadow-lg shadow-accent-primary/10"
      : "bg-bg-input hover:bg-bg-secondary text-text-primary border border-border-custom";

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}