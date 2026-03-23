import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  trend: "up" | "down" | "neutral";
  trendValue: string;
}

export function KPICard({ title, value, trend, trendValue }: KPICardProps) {
  const isPositive = trend === "up";
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
  const trendColor = isPositive ? "text-emerald-500" : "text-rose-500";
  
  return (
    <Card className="flex flex-col p-4 border border-slate-200 shadow-sm rounded-xl bg-white hover:shadow-md transition-shadow">
      <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase mb-2">
        {title}
      </span>
      <span className="text-2xl font-bold text-slate-800 tracking-tight">
        {value}
      </span>
      <div className={cn("flex items-center mt-2 text-xs font-medium", trendColor)}>
        <TrendIcon className="w-3 h-3 mr-1" />
        <span>{trendValue} vs prev</span>
      </div>
    </Card>
  );
}
