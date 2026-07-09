type CaptureModeToggleProps = {
  mode: "camera" | "upload";
  onModeChange: (mode: "camera" | "upload") => void;
};

export default function CaptureModeToggle({ mode, onModeChange }: CaptureModeToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-[var(--capsule-line)] bg-white/58 p-1">
      <button
        type="button"
        onClick={() => onModeChange("camera")}
        className={`min-h-11 rounded-full px-4 py-2 text-sm font-medium ${mode === "camera" ? "bg-[var(--capsule-graphite)] text-white" : "text-[var(--capsule-ash)]"}`}
      >
        Camera
      </button>
      <button
        type="button"
        onClick={() => onModeChange("upload")}
        className={`min-h-11 rounded-full px-4 py-2 text-sm font-medium ${mode === "upload" ? "bg-[var(--capsule-graphite)] text-white" : "text-[var(--capsule-ash)]"}`}
      >
        Source Image
      </button>
    </div>
  );
}
