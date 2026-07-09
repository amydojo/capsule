import { NavLink, useLocation } from "react-router-dom";
import { isPrimaryNavActive, PRIMARY_NAV_ITEMS } from "../../constants/navigation";

export type CapsuleBottomDockMode = "archive" | "preservation";

export type CapsuleBottomDockProps = {
  mode?: CapsuleBottomDockMode;
  className?: string;
};

const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export default function CapsuleBottomDock({ mode = "archive", className }: CapsuleBottomDockProps) {
  const location = useLocation();
  const preservation = mode === "preservation";

  return (
    <nav
      aria-label="Capsule navigation"
      className={joinClasses(
        "mx-auto grid h-11 w-full max-w-[336px] grid-cols-3 items-center rounded-full border px-2.5",
        preservation ? "border-white/10 bg-[rgba(17,16,17,0.5)] text-[var(--capsule-linen-ash)]" : "border-black/10 bg-[var(--capsule-paper)] text-[var(--capsule-muted)]",
        className,
      )}
    >
      {PRIMARY_NAV_ITEMS.map((item) => {
        const active = isPrimaryNavActive(location.pathname, item.route);

        return (
          <NavLink
            key={item.label}
            to={item.route}
            aria-current={active ? "page" : undefined}
            className={joinClasses(
              "relative grid h-full min-w-0 place-items-center px-1 text-center text-[0.56rem] font-medium transition",
              active ? "text-[var(--capsule-red)]" : preservation ? "hover:text-white" : "hover:text-[var(--capsule-black)]",
            )}
          >
            <span className="truncate">{item.label}</span>
            {active && <span className="absolute bottom-1 h-0.5 w-7 rounded-full bg-[var(--capsule-red)]" aria-hidden="true" />}
          </NavLink>
        );
      })}
    </nav>
  );
}
