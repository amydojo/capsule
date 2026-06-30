import { NavLink } from "react-router-dom";

const items = [
  { label: "Archive", to: "/archive" },
  { label: "Capture Point", to: "/capture" },
  { label: "Chamber", to: "/chamber" },
  { label: "Rediscover", to: "/rediscover" },
  { label: "Settings", to: "/archive" },
];

export default function BottomNav() {
  return (
    <nav className="mx-auto mt-10 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 rounded-full border border-[var(--capsule-line)] bg-white/70 p-1.5 shadow-[0_16px_48px_rgba(23,25,24,0.06)] backdrop-blur">
      {items.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          className={({ isActive }) =>
            `rounded-full px-4 py-2 text-xs font-medium transition ${
              isActive
                ? "bg-[var(--capsule-graphite)] text-white"
                : "text-[var(--capsule-ash)] hover:bg-white hover:text-[var(--capsule-graphite)]"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
