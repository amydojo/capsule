type SpecimenNotebookProps = {
  small?: boolean;
  refined?: boolean;
};

export default function SpecimenNotebook({ small = false, refined = false }: SpecimenNotebookProps) {
  return (
    <div
      className={`relative ${small ? "h-32 w-40" : "aspect-[1.28/1] w-[82vw] max-w-[32rem] sm:w-[32rem]"} specimen-shadow`}
      aria-label="Field notebook specimen"
      role="img"
    >
      <div className="absolute inset-x-8 bottom-[-0.15rem] h-8 rounded-[50%] bg-[rgba(23,25,28,0.18)] blur-2xl" />
      <div className="notebook-perspective absolute inset-0">
        <div className="notebook-pages notebook-edge-shadow absolute -bottom-3 left-6 right-4 top-4 rounded-lg border border-[rgba(23,25,28,0.16)]" />
        <div className="notebook-cover absolute inset-0 rounded-lg border border-[rgba(23,25,28,0.24)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_-22px_0_38px_rgba(23,25,28,0.07),0_6px_10px_rgba(23,25,28,0.07)]">
          <div className="absolute inset-y-0 left-[18%] w-px bg-[rgba(23,25,28,0.18)]" />
          <div className="absolute inset-y-5 left-[22%] w-[3px] rounded-full bg-[rgba(23,25,28,0.06)]" />
          <div className="absolute left-[30%] right-[16%] top-[20%] h-px bg-[rgba(23,25,28,0.18)]" />
          <div className="absolute left-[30%] right-[22%] top-[29%] h-px bg-[rgba(23,25,28,0.13)]" />
          <div className="absolute left-[30%] top-[38%] h-px w-[44%] bg-[rgba(23,25,28,0.11)]" />
          <div className="absolute left-[30%] top-[47%] h-px w-[35%] bg-[rgba(23,25,28,0.08)]" />
          <div className="absolute bottom-[24%] left-[30%] h-px w-[34%] bg-[rgba(47,126,247,0.36)]" />
          <div className="absolute right-[9%] top-[12%] h-[19%] w-[12%] rounded border border-[rgba(23,25,28,0.16)] bg-white/42 shadow-[inset_0_1px_0_rgba(255,255,255,0.76),0_3px_8px_rgba(23,25,28,0.045)]" />
          <div className="absolute left-[12%] top-[10%] h-2 w-2 rounded-full bg-[rgba(23,25,28,0.14)]" />
          <div className="absolute left-[12%] top-[19%] h-2 w-2 rounded-full bg-[rgba(23,25,28,0.115)]" />
          <div className="absolute left-[12%] top-[28%] h-2 w-2 rounded-full bg-[rgba(23,25,28,0.095)]" />
        </div>
        <div className="absolute -right-1 top-[10%] h-[76%] w-[4.4%] rounded-full bg-[rgba(17,18,20,0.88)] shadow-[inset_1px_0_0_rgba(255,255,255,0.14),-3px_0_8px_rgba(23,25,28,0.08),0_10px_18px_rgba(23,25,28,0.16)]" />
        <div className="absolute bottom-[10%] left-[18%] right-[13%] h-[4%] rounded-full bg-[rgba(23,25,28,0.13)]" />
      </div>
      {refined && (
        <div className="absolute -inset-5 rounded-2xl border border-[rgba(47,126,247,0.18)] shadow-[0_0_42px_rgba(47,126,247,0.08)]" />
      )}
    </div>
  );
}
