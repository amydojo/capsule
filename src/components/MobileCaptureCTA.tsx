type MobileCaptureCTAProps = {
  disabled?: boolean;
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
};

export default function MobileCaptureCTA({ disabled = false, label, onClick, type = "button" }: MobileCaptureCTAProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(229,226,220,0.72)] bg-[rgba(247,246,242,0.86)] px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur md:hidden">
      <button type={type} onClick={onClick} disabled={disabled} className="primary-button min-h-11 w-full px-6 py-4 text-sm font-semibold disabled:opacity-45">
        {label}
      </button>
    </div>
  );
}
