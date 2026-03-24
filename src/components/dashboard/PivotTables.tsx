import { useMemo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesRecord, formatNum } from '@/lib/data-utils';
import { TabType } from '@/hooks/use-dashboard';

interface Props {
  data: SalesRecord[];
  activeTab: TabType;
}

function getPeriodKey(dateStr: string, activeTab: TabType) {
  const d = new Date(dateStr);
  if (activeTab === 'Daily') return dateStr;
  if (activeTab === 'Weekly') {
    // Get ISO week approx
    const dStr = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = dStr.getUTCDay() || 7;
    dStr.setUTCDate(dStr.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(dStr.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((dStr.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return `W${weekNo} ${dStr.getUTCFullYear()}`;
  }
  // MTD
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export function PlatformPerformanceTable({ data, activeTab }: Props) {
  const { periods, rows } = useMemo(() => {
    const periodSet = new Set<string>();
    const rowMap: Record<string, Record<string, any>> = {};

    data.forEach(r => {
      const pKey = getPeriodKey(r.date, activeTab);
      periodSet.add(pKey);

      if (!rowMap[r.platform]) rowMap[r.platform] = { platform: r.platform };
      if (!rowMap[r.platform][pKey]) rowMap[r.platform][pKey] = { adSpend: 0, adSales: 0, revenue: 0 };
      
      rowMap[r.platform][pKey].adSpend += r.adSpend;
      rowMap[r.platform][pKey].adSales += r.adSales;
      rowMap[r.platform][pKey].revenue += r.revenue;
    });

    // Sort periods descending (latest first)
    const sortedPeriods = Array.from(periodSet).sort((a, b) => b.localeCompare(a));
    const sortedRows = Object.values(rowMap);

    return { periods: sortedPeriods.slice(0, 3), rows: sortedRows };
  }, [data, activeTab]);

  return (
    <Card className="shadow-sm border-slate-200 overflow-hidden">
      <CardHeader className="p-4 border-b border-slate-100 bg-[#f8fafc]">
        <CardTitle className="text-[13px] font-bold text-indigo-700 uppercase tracking-wider">{activeTab} Platform Wise Performance</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px] whitespace-nowrap">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b border-r border-slate-200 bg-white sticky left-0 z-10 w-40"></th>
              {periods.map(p => (
                <th key={p} colSpan={6} className="px-4 py-2 border-b border-r border-slate-200 text-center font-bold text-slate-700 bg-slate-50">{p}</th>
              ))}
            </tr>
            <tr className="bg-white text-slate-500 font-medium">
              <th className="px-4 py-2 border-b border-r border-slate-200 sticky left-0 z-10 bg-white shadow-[1px_0_0_0_#e2e8f0]">Platform</th>
              {periods.map(p => (
                <optgroup key={`cols-${p}`} className="contents">
                  <th className="px-4 py-2 border-b border-slate-200 text-right">Ad Spends</th>
                  <th className="px-4 py-2 border-b border-slate-200 text-right">Ad Sales</th>
                  <th className="px-4 py-2 border-b border-slate-200 text-right">ROI</th>
                  <th className="px-4 py-2 border-b border-slate-200 text-right">T.ACOS %</th>
                  <th className="px-4 py-2 border-b border-slate-200 text-right">Organic %</th>
                  <th className="px-4 py-2 border-b border-r border-slate-200 text-right text-indigo-600">T.Sales</th>
                </optgroup>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                <td className="px-4 py-2 border-r border-slate-200 font-semibold text-slate-700 sticky left-0 z-10 bg-white group-hover:bg-indigo-50/50 shadow-[1px_0_0_0_#e2e8f0]">{r.platform}</td>
                {periods.map(p => {
                  const cell = r[p] || { adSpend: 0, adSales: 0, revenue: 0 };
                  const roi = cell.adSpend > 0 ? cell.adSales / cell.adSpend : 0;
                  const tacos = cell.revenue > 0 ? (cell.adSpend / cell.revenue) * 100 : 0;
                  const org = cell.revenue > 0 ? ((cell.revenue - cell.adSales) / cell.revenue) * 100 : 0;
                  return (
                    <optgroup key={`data-${p}`} className="contents">
                      <td className="px-4 py-2 text-right text-slate-600">{formatNum(cell.adSpend)}</td>
                      <td className="px-4 py-2 text-right text-slate-600">{formatNum(cell.adSales)}</td>
                      <td className="px-4 py-2 text-right font-medium text-slate-800">{roi.toFixed(1)}</td>
                      <td className="px-4 py-2 text-right text-slate-600">{tacos.toFixed(0)}%</td>
                      <td className="px-4 py-2 text-right text-slate-600">{org.toFixed(0)}%</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-right font-bold text-slate-800 bg-slate-50/50">{formatNum(cell.revenue)}</td>
                    </optgroup>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="p-8 text-center text-slate-400">No data available for the selected filters.</div>}
      </div>
    </Card>
  );
}

export function CategoryPlatformTable({ data, activeTab }: Props) {
  const { periods, rows } = useMemo(() => {
    const periodSet = new Set<string>();
    const rowMap: Record<string, Record<string, any>> = {};

    data.forEach(r => {
      const pKey = getPeriodKey(r.date, activeTab);
      periodSet.add(pKey);

      const key = `${r.category}|${r.platform}`;
      if (!rowMap[key]) rowMap[key] = { category: r.category, platform: r.platform };
      if (!rowMap[key][pKey]) rowMap[key][pKey] = { adSpend: 0, adSales: 0, revenue: 0 };
      
      rowMap[key][pKey].adSpend += r.adSpend;
      rowMap[key][pKey].adSales += r.adSales;
      rowMap[key][pKey].revenue += r.revenue;
    });

    const sortedPeriods = Array.from(periodSet).sort((a, b) => b.localeCompare(a)).slice(0, 3);
    const sortedRows = Object.values(rowMap).sort((a,b) => a.category.localeCompare(b.category));

    return { periods: sortedPeriods, rows: sortedRows };
  }, [data, activeTab]);

  return (
    <Card className="shadow-sm border-slate-200 overflow-hidden">
      <CardHeader className="p-4 border-b border-slate-100 bg-[#f8fafc]">
        <CardTitle className="text-[13px] font-bold text-indigo-700 uppercase tracking-wider">{activeTab} Category & Platform Performance</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px] whitespace-nowrap">
          <thead>
            <tr>
              <th colSpan={2} className="px-4 py-2 border-b border-r border-slate-200 bg-white sticky left-0 z-10 w-64"></th>
              {periods.map(p => (
                <th key={p} colSpan={4} className="px-4 py-2 border-b border-r border-slate-200 text-center font-bold text-slate-700 bg-slate-50">{p}</th>
              ))}
            </tr>
            <tr className="bg-white text-slate-500 font-medium">
              <th className="px-4 py-2 border-b border-slate-200 sticky left-0 z-10 bg-white">Category</th>
              <th className="px-4 py-2 border-b border-r border-slate-200 sticky left-[120px] z-10 bg-white shadow-[1px_0_0_0_#e2e8f0]">Platform</th>
              {periods.map(p => (
                <optgroup key={`cols-${p}`} className="contents">
                  <th className="px-4 py-2 border-b border-slate-200 text-right">Ad Spends</th>
                  <th className="px-4 py-2 border-b border-slate-200 text-right">Ad Sales</th>
                  <th className="px-4 py-2 border-b border-slate-200 text-right text-indigo-600">ROI</th>
                  <th className="px-4 py-2 border-b border-r border-slate-200 text-right font-bold text-slate-800 bg-slate-50/50">T.Sales</th>
                </optgroup>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                <td className="px-4 py-2 font-semibold text-slate-700 sticky left-0 z-10 bg-white group-hover:bg-indigo-50/50 truncate max-w-[120px]" title={r.category}>{r.category}</td>
                <td className="px-4 py-2 border-r border-slate-200 text-slate-600 sticky left-[120px] z-10 bg-white group-hover:bg-indigo-50/50 shadow-[1px_0_0_0_#e2e8f0] truncate max-w-[120px]" title={r.platform}>{r.platform}</td>
                {periods.map(p => {
                  const cell = r[p] || { adSpend: 0, adSales: 0, revenue: 0 };
                  const roi = cell.adSpend > 0 ? cell.adSales / cell.adSpend : 0;
                  return (
                    <optgroup key={`data-${p}`} className="contents">
                      <td className="px-4 py-2 text-right text-slate-600">{formatNum(cell.adSpend)}</td>
                      <td className="px-4 py-2 text-right text-slate-600">{formatNum(cell.adSales)}</td>
                      <td className="px-4 py-2 text-right font-medium text-indigo-600">{roi.toFixed(1)}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-right font-bold text-slate-800 bg-slate-50/50">{formatNum(cell.revenue)}</td>
                    </optgroup>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="p-8 text-center text-slate-400">No data available for the selected filters.</div>}
      </div>
    </Card>
  );
}
