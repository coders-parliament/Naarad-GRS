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
      className="
        w-full
        bg-blue-600
        text-white
        p-3
        rounded-lg
        hover:bg-blue-700
        transition
        disabled:opacity-50
      "
    >
      {text}
    </button>
  );
}