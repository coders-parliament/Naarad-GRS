type Props = {
  text: string;
};

export default function AuthButton({ text }: Props) {
  return (
    <button
      className="
        w-full
        bg-blue-600
        text-white
        p-3
        rounded-lg
        hover:bg-blue-700
        transition
      "
    >
      {text}
    </button>
  );
}