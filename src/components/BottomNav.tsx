import { NavLink } from "react-router-dom";

const items = [
  { label: "Archive", to: "/archive" },
  { label: "Capture Point", to: "/capture" },
  { label: "Chamber", to: "/chamber" },
  { label: "Rediscover", to: "/rediscover" },
  { label: "Settings", to: "/archive" },
];

type BottomNavProps = {
  tone?: "light" | "dark";
};

export default function BottomNav({ tone = "light" }: BottomNavProps) {
  const dark = tone === "dark";

  return (
    <nav className={`mx-auto mb-[calc(env(safe-area-inset-bottom)+0.5rem)] mt-10 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 rounded-full border p-1.5 backdrop-blur ${dark ? "border-[var(--capsule-line-dark)] bg-[rgba(17,18,22,0.82)] shadow-[0_20px_64px_rgba(0,0,0,0.32)]" : "border-[var(--capsule-line-light)] bg-white/70 shadow-[0_16px_48px_rgba(23,25,24,0.06)]"}`}>
      {items.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          className={({ isActive }) =>
            `rounded-full px-4 py-2 text-xs font-medium transition ${
              isActive
                ? "bg-[var(--capsule-mineral-olive)] text-white"
                : dark
                  ? "text-[var(--capsule-ash-dim)] hover:bg-white/[0.07] hover:text-[var(--capsule-bone)]"
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
