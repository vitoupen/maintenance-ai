import { NavLink } from "react-router-dom";

// Generic app sidebar. `items` is [{ label, icon, to?, onClick? }].
// Items with `to` render as NavLinks; items with `onClick` render as buttons
// (used for actions like "New Chat" or "Logout").
export default function Sidebar({
  title = "Maintenance AI",
  items = [],
  footerItems = [],
  children,
}) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-100 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold">
          M
        </div>
        <span className="text-sm font-semibold text-slate-800">{title}</span>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3">
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <SidebarItem key={item.label} item={item} />
          ))}
        </ul>
        {children}
      </nav>

      {footerItems.length > 0 && (
        <div className="border-t border-slate-100 px-3 py-3">
          <ul className="flex flex-col gap-1">
            {footerItems.map((item) => (
              <SidebarItem key={item.label} item={item} />
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

function SidebarItem({ item }) {
  const baseClasses =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors";

  if (item.to) {
    return (
      <li>
        <NavLink
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `${baseClasses} ${
              isActive
                ? "bg-primary-50 text-primary-700"
                : "text-slate-600 hover:bg-slate-50"
            }`
          }
        >
          {item.icon && <span className="text-base">{item.icon}</span>}
          {item.label}
        </NavLink>
      </li>
    );
  }

  return (
    <li>
      <button
        onClick={item.onClick}
        className={`${baseClasses} text-slate-600 hover:bg-slate-50`}
      >
        {item.icon && <span className="text-base">{item.icon}</span>}
        {item.label}
      </button>
    </li>
  );
}
