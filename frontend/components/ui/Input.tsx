type InputProps = {
  label: string;
  name: string;
  value: string;
  onChange: any;
  placeholder?: string;
};

export default function Input({ label, name, value, onChange, placeholder }: InputProps) {
  return (
    <div>
      <label className="block mb-2 text-sm text-text-secondary font-semibold">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-3 rounded-lg bg-bg-input text-text-primary border border-border-custom placeholder-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent-primary transition duration-200"
      />
    </div>
  );
}