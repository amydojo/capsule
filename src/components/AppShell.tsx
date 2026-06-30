import { Outlet } from "react-router-dom";

export default function AppShell() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--capsule-stone)] text-[var(--capsule-graphite)]">
      <Outlet />
    </div>
  );
}
