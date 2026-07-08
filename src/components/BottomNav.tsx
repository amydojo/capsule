import { NavLink, useLocation } from "react-router-dom";
import { isPrimaryNavActive, PRIMARY_NAV_ITEMS } from "../constants/navigation";

type BottomNavProps = {
  tone?: "light" | "dark";
};

export default function BottomNav({ tone = "light" }: BottomNavProps) {
  const dark = tone === "dark";
  const location = useLocation();

  return (
    <nav aria-label="Primary navigation" className={`mx-auto mb-[calc(env(safe-area-inset-bottom)+0.5rem)] mt-10 grid w-full max-w-2xl grid-cols-3 items-center gap-1 rounded-full border p-1.5 backdrop-blur ${dark ? "border-[var(--capsule-line-dark)] bg-[rgba(17,18,22,0.82)] shadow-[0_20px_64px_rgba(0,0,0,0.32)]" : "border-[var(--capsule-line-light)] bg-white/70 shadow-[0_16px_48px_rgba(23,25,24,0.06)]"}`}>
      {PRIMARY_NAV_ITEMS.map((item) => {
        const active = isPrimaryNavActive(location.pathname, item.route);

        return (
          <NavLink
            key={item.label}
            to={item.route}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-2.5 text-center text-xs font-medium transition sm:px-4 ${
              active
                ? "bg-[var(--capsule-mineral-olive)] text-white"
                : dark
                  ? "text-[var(--capsule-ash-dim)] hover:bg-white/[0.07] hover:text-[var(--capsule-bone)]"
                  : "text-[var(--capsule-ash)] hover:bg-white hover:text-[var(--capsule-graphite)]"
            }`}
          >
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
