import { LayoutDashboard, Tags, PackageSearch, MapPin, CalendarClock, Megaphone } from 'lucide-react';
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'category', label: 'Category Analysis', icon: Tags },
  { id: 'product', label: 'Product Deep Dive', icon: PackageSearch },
  { id: 'city', label: 'City Analysis', icon: MapPin },
  { id: 'time', label: 'Time Comparison', icon: CalendarClock },
  { id: 'ads', label: 'Ads Dashboard', icon: Megaphone },
];

export function Sidebar({ activePage, setActivePage }: { activePage: string, setActivePage: (p: string) => void }) {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-slate-900 transition-transform">
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <span className="text-xl font-bold text-white tracking-tight">
          Bajo<span className="text-indigo-400">Foods</span>
        </span>
      </div>
      
      <div className="flex flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="absolute bottom-0 left-0 w-full border-t border-white/10 p-4">
        <div className="flex items-center gap-2 px-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
          <span className="text-xs font-medium text-slate-400">Live Connection</span>
        </div>
      </div>
    </aside>
  );
}
