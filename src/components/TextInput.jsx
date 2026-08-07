export default function TextInput({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  className = "",
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm
          text-slate-800 placeholder:text-slate-400 shadow-sm
          transition-colors duration-150
          focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary"
        {...props}
      />
    </div>
  );
}
