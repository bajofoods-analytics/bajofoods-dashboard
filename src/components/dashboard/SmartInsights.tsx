import { useMemo } from 'react';
import { SalesRecord, formatMoney } from '@/lib/data-utils';
import { Lightbulb, TrendingUp, TrendingDown, MapPin, Target } from 'lucide-react';

interface Props {
  data: SalesRecord[];
}

export function SmartInsights({ data }: Props) {
  const insights = useMemo(() => {
    if (!data.length) return [];

    const getTopAndBottom = (key: keyof SalesRecord) => {
      const grouped = data.reduce((acc, r) => {
        const val = String(r[key]);
        acc[val] = (acc[val] || 0) + r.revenue;
        return acc;
      }, {} as Record<string, number>);
      
      const sorted = Object.entries(grouped).filter(([k]) => k !== 'Unknown' && k.trim() !== '').sort((a, b) => b[1] - a[1]);
      if (sorted.length === 0) return null;
      return {
        top: sorted[0],
        bottom: sorted[sorted.length - 1]
      };
    };

    const cit = getTopAndBottom('city');
    const cat = getTopAndBottom('category');
    const plat = getTopAndBottom('platform');

    const list = [];
    if (cit && cit.top[1] > 0) list.push({ icon: <MapPin className="w-4 h-4 text-emerald-500" />, text: <span key="1"><b>{cit.top[0]}</b> is the top performing city generating {formatMoney(cit.top[1])}.</span> });
    if (cat && cat.top[1] > 0) list.push({ icon: <TrendingUp className="w-4 h-4 text-indigo-500" />, text: <span key="2"><b>{cat.top[0]}</b> leads category sales, while <b>{cat.bottom[0]}</b> is the lowest performing.</span> });
    if (plat && plat.top[1] > 0) list.push({ icon: <Target className="w-4 h-4 text-amber-500" />, text: <span key="3">Highest revenue is sourced from <b>{plat.top[0]}</b> ({formatMoney(plat.top[1])}).</span> });

    return list;
  }, [data]);

  if (insights.length === 0) return null;

  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-indigo-600 font-semibold text-[13px] tracking-wider uppercase">
        <Lightbulb className="w-4 h-4" />
        <span>Smart Insights</span>
      </div>
      <ul className="space-y-3 text-[13px] text-slate-700">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="mt-0.5">{insight.icon}</div>
            <div className="leading-5">{insight.text}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
