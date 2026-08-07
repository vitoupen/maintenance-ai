const VARIANTS = {
  primary:
    "bg-primary text-white hover:bg-primary-700 focus-visible:ring-primary-300 shadow-soft",
  secondary:
    "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus-visible:ring-slate-200",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300 shadow-soft",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-200",
};

const SIZES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium
        transition-all duration-150 ease-out
        focus-visible:outline-none focus-visible:ring-4
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98]
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
