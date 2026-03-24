import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SalesRecord, formatMoney, formatNum } from '@/lib/data-utils';

export type MetricType = 'revenue' | 'units' | 'adSales' | 'adSpend';

interface Props {
  title: string;
  data: SalesRecord[];
  xAxisKey: keyof SalesRecord;
  defaultMetric?: MetricType;
}

const METRICS: { key: MetricType; label: string; color: string; format: (v: number) => string }[] = [
  { key: 'revenue', label: 'Revenue', color: '#10b981', format: formatMoney },
  { key: 'units', label: 'Units Sold', color: '#6366f1', format: formatNum },
  { key: 'adSales', label: 'Ad Sales', color: '#06b6d4', format: formatMoney },
  { key: 'adSpend', label: 'Ad Spends', color: '#ef4444', format: formatMoney },
];

export function MetricBarChart({ title, data, xAxisKey, defaultMetric = 'revenue' }: Props) {
  const [metric, setMetric] = useState<MetricType>(defaultMetric);

  const chartData = useMemo(() => {
    const grouped = data.reduce((acc, curr) => {
      const key = String(curr[xAxisKey]);
      if (!acc[key]) {
        acc[key] = { name: key, revenue: 0, units: 0, adSales: 0, adSpend: 0 };
      }
      acc[key].revenue += curr.revenue;
      acc[key].units += curr.units;
      acc[key].adSales += curr.adSales;
      acc[key].adSpend += curr.adSpend;
      return acc;
    }, {} as Record<string, any>);
    return Object.values(grouped).sort((a, b) => b[metric] - a[metric]).slice(0, 15);
  }, [data, xAxisKey, metric]);

  const selectedMetric = METRICS.find(m => m.key === metric)!;

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="p-4 flex flex-row items-center justify-between border-b border-slate-100">
        <CardTitle className="text-[13px] font-bold text-slate-600 uppercase tracking-wider">{title}</CardTitle>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as MetricType)}
          className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-md px-2 py-1 outline-none focus:border-indigo-500 text-slate-700 cursor-pointer"
        >
          {METRICS.map(m => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
      </CardHeader>
      <CardContent className="h-[260px] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 15, right: 15, left: -15, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickMargin={10} angle={-25} textAnchor="end" />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => formatNum(v)} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              formatter={(value: number) => [selectedMetric.format(value), selectedMetric.label]}
              cursor={{ fill: '#f8fafc' }}
            />
            <Bar dataKey={metric} fill={selectedMetric.color} radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
