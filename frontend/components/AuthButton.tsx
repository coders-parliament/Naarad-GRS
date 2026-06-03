type Props = {
  text: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

export default function AuthButton({ text, onClick, type = "submit", disabled }: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-accent-primary hover:bg-accent-hover text-white p-3 rounded-xl transition font-semibold cursor-pointer shadow-lg shadow-accent-primary/10 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] duration-150"
    >
      {text}
    </button>
  );
}