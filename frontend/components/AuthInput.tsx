type Props = {
  type: string;
  placeholder: string;
};

export default function AuthInput({
  type,
  placeholder,
}: Props) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="
        w-full
        p-3
        border
        rounded-lg
        outline-none
        focus:ring-2
        focus:ring-blue-500
      "
    />
  );
}