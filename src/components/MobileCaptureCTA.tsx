type MobileCaptureCTAProps = {
  disabled?: boolean;
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
};

export default function MobileCaptureCTA({ disabled = false, label, onClick, type = "button" }: MobileCaptureCTAProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--capsule-line-dark)] bg-[rgba(13,14,16,0.9)] px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur md:hidden">
      <button type={type} onClick={onClick} disabled={disabled} className="min-h-11 w-full rounded-full bg-[var(--capsule-bone)] px-6 py-4 text-sm font-semibold text-[var(--capsule-graphite-black)] shadow-[0_18px_42px_rgba(0,0,0,0.34)] disabled:opacity-45">
        {label}
      </button>
    </div>
  );
}
