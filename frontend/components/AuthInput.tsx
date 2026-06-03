type Props = {
  type: string;
  placeholder: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
};

export default function AuthInput({
  type,
  placeholder,
  value,
  onChange,
  name,
}: Props) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      className="
        w-full
        p-3
        border
        rounded-lg
        outline-none
        focus:ring-2
        focus:ring-blue-500
        text-black
      "
    />
  );
}