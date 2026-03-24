import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SalesRecord, formatMoney } from '@/lib/data-utils';

export function TopProducts({ data }: { data: SalesRecord[] }) {
  const { top, bottom } = useMemo(() => {
    const grouped = data.reduce((acc, r) => {
      acc[r.product] = (acc[r.product] || 0) + r.revenue;
      return acc;
    }, {} as Record<string, number>);
    
    const sorted = Object.entries(grouped)
      .filter(([k,v]) => k !== 'Unknown' && v > 0)
      .sort((a, b) => b[1] - a[1]);

    return {
      top: sorted.slice(0, 5),
      bottom: sorted.slice(-5).reverse() // worst at the top of the bottom list
    };
  }, [data]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-[13px] font-bold text-emerald-600 uppercase tracking-wider">Top 5 Products / Revenue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-slate-100">
            {top.map(([name, rev], i) => (
              <li key={name} className="flex items-center justify-between p-3 px-4 hover:bg-slate-50 text-[13px]">
                <div className="flex gap-3 items-center overflow-hidden">
                  <span className="font-bold text-slate-400 w-4">{i + 1}</span>
                  <span className="font-medium text-slate-700 truncate">{name}</span>
                </div>
                <span className="font-semibold text-slate-900 ml-4">{formatMoney(rev)}</span>
              </li>
            ))}
            {top.length === 0 && <li className="p-4 text-center text-sm text-slate-400">No data available</li>}
          </ul>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-[13px] font-bold text-rose-500 uppercase tracking-wider">Bottom 5 Products / Revenue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-slate-100">
            {bottom.map(([name, rev], i) => (
              <li key={name} className="flex items-center justify-between p-3 px-4 hover:bg-slate-50 text-[13px]">
                <div className="flex gap-3 items-center overflow-hidden">
                  <span className="font-bold text-slate-400 w-4">{i + 1}</span>
                  <span className="font-medium text-slate-700 truncate">{name}</span>
                </div>
                <span className="font-semibold text-slate-900 ml-4">{formatMoney(rev)}</span>
              </li>
            ))}
            {bottom.length === 0 && <li className="p-4 text-center text-sm text-slate-400">No data available</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
