export default function StatCard({ label, value, icon, trend }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft transition-shadow hover:shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 text-lg">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-slate-900">{value}</span>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.startsWith("-") ? "text-red-500" : "text-emerald-600"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
