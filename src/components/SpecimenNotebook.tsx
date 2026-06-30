type SpecimenNotebookProps = {
  small?: boolean;
  refined?: boolean;
};

export default function SpecimenNotebook({ small = false, refined = false }: SpecimenNotebookProps) {
  return (
    <div
      className={`relative ${small ? "h-28 w-36" : "h-48 w-64 sm:h-56 sm:w-72"} specimen-shadow`}
      aria-label="Field notebook specimen"
      role="img"
    >
      <div className="absolute inset-x-3 bottom-2 h-4 rounded-[50%] bg-[rgba(23,25,24,0.12)] blur-xl" />
      <div className="absolute inset-0 rotate-[-3deg] rounded-md border border-[rgba(23,25,24,0.16)] bg-[#f1eee6] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <div className="absolute inset-y-0 left-7 w-px bg-[rgba(23,25,24,0.12)]" />
        <div className="absolute inset-y-0 left-9 w-[3px] bg-[rgba(23,25,24,0.06)]" />
        <div className="absolute left-12 right-6 top-8 h-px bg-[rgba(23,25,24,0.12)]" />
        <div className="absolute left-12 right-10 top-14 h-px bg-[rgba(23,25,24,0.1)]" />
        <div className="absolute left-12 top-20 h-px w-2/3 bg-[rgba(23,25,24,0.09)]" />
        <div className="absolute bottom-8 left-12 h-px w-1/2 bg-[rgba(39,110,241,0.25)]" />
        <div className="absolute right-5 top-5 h-10 w-7 rounded-sm border border-[rgba(23,25,24,0.12)] bg-white/35" />
      </div>
      <div className="absolute -right-1 top-5 h-[76%] w-2 rotate-[-3deg] rounded-full bg-[rgba(23,25,24,0.58)] shadow-[inset_1px_0_0_rgba(255,255,255,0.18)]" />
      <div className="absolute bottom-5 left-10 right-9 h-2 rotate-[-3deg] rounded-full bg-[rgba(23,25,24,0.08)]" />
      {refined && (
        <div className="absolute -inset-4 rotate-[-3deg] rounded-xl border border-[rgba(39,110,241,0.18)]" />
      )}
    </div>
  );
}
