export type CapsuleDockDestination = "Vault" | "Preserve" | "Rediscover";
export type CapsuleDockMode = "archive" | "preservation";

export type CapsuleDockProps = {
  active?: CapsuleDockDestination;
  mode?: CapsuleDockMode;
  onSelect?: (destination: CapsuleDockDestination) => void;
  className?: string;
  ariaLabel?: string;
};

const dockDestinations: CapsuleDockDestination[] = ["Vault", "Preserve", "Rediscover"];
const joinClasses = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export default function CapsuleDock({
  active = "Vault",
  mode = "archive",
  onSelect,
  className,
  ariaLabel = "Capsule navigation",
}: CapsuleDockProps) {
  const preservation = mode === "preservation";

  return (
    <nav
      aria-label={ariaLabel}
      className={joinClasses(
        "mx-auto grid h-[42px] w-full max-w-[272px] grid-cols-3 items-center rounded-full border p-1",
        preservation ? "border-white/10 bg-[rgba(17,16,17,0.48)] text-[var(--capsule-linen-ash)]" : "border-black/10 bg-[var(--capsule-paper)] text-[var(--capsule-muted)]",
        className,
      )}
    >
      {dockDestinations.map((destination) => {
        const isActive = active === destination;

        return (
          <button
            key={destination}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onSelect?.(destination)}
            className={joinClasses(
              "relative h-full min-w-0 rounded-full px-2 text-center text-[0.7rem] font-medium transition",
              isActive ? "text-[var(--capsule-red)]" : preservation ? "hover:text-white" : "hover:text-[var(--capsule-black)]",
            )}
          >
            <span className="truncate">{destination}</span>
            {isActive && <span className="absolute bottom-1 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-full bg-[var(--capsule-red)]" aria-hidden="true" />}
          </button>
        );
      })}
    </nav>
  );
}
