import { Badge } from "@/components/ui/badge";
import { CrisisLevel } from "@/types";

export function CrisisBanner({ level }: { level: CrisisLevel }) {
  const config = {
    normal: { text: "Normal operations", variant: "success" as const },
    alert: { text: "Alert: managed scarcity mode", variant: "warning" as const },
    emergency: { text: "Emergency: strict fair allocation", variant: "danger" as const },
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-300">Crisis Status</h2>
        <Badge variant={config[level].variant}>{level.toUpperCase()}</Badge>
      </div>
      <p className="mt-2 text-sm text-slate-200">{config[level].text}</p>
    </div>
  );
}
