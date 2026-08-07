export default function Navbar({ title, subtitle, right }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </header>
  );
}
