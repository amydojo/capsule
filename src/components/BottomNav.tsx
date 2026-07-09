import CapsuleBottomDock from "./system/CapsuleBottomDock";

type BottomNavProps = {
  tone?: "light" | "dark";
};

export default function BottomNav({ tone = "light" }: BottomNavProps) {
  return <CapsuleBottomDock mode={tone === "dark" ? "preservation" : "archive"} />;
}
