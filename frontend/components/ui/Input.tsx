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
      <label className="block mb-2 text-sm text-gray-300">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-3 rounded-lg bg-[#1A1F2E] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}