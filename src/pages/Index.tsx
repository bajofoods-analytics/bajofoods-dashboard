import { useState, useRef, useEffect } from 'react';
import { useDashboard, DashboardProvider, Filters } from '@/hooks/use-dashboard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/kpi-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatMoney, formatNum, formatPct, groupByDate } from '@/lib/data-utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Calendar as CalendarIcon, ChevronDown, X, BarChart3, CloudDownload } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = {
  adSpends: '#ef4444',
  adSales: '#06b6d4',
  adRoi: '#8b5cf6',
  tSales: '#84cc16',
  tAcos: '#f59e0b',
  organicPct: '#3b82f6'
};

/* ─── Multi-Select Dropdown ──────────────────────────────────── */
interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
  icon?: boolean;
}

function MultiSelect({ label, options, selected, onChange, icon }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(s => s !== val) : [...selected, val]);
  };

  const displayText = selected.length === 0
    ? `All`
    : selected.length === 1
      ? selected[0]
      : `${selected[0]} +${selected.length - 1}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-2 h-8 px-3 border rounded-md text-[13px] font-medium transition-colors whitespace-nowrap bg-white text-slate-700 hover:bg-slate-50',
          selected.length > 0 ? 'border-indigo-400 ring-1 ring-indigo-400 text-indigo-700' : 'border-slate-200'
        )}
      >
        {icon && <span className="font-bold text-slate-400 mr-1">T</span>}
        <span className="text-slate-500 mr-1">{label}</span>
        <span className="max-w-[120px] truncate">{displayText}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform ml-1', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 min-w-[200px] max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl">
          {options.length === 0
            ? <div className="px-4 py-3 text-sm text-slate-400">No options</div>
            : options.map(opt => (
                <label key={opt} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-indigo-600 w-4 h-4 rounded"
                    checked={selected.includes(opt)}
                    onChange={() => toggle(opt)}
                  />
                  <span className="truncate">{opt}</span>
                </label>
              ))
          }
        </div>
      )}
    </div>
  );
}

/* ─── Growth Badge ───────────────────────────────────────────── */
function GrowthBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <div className="flex items-center gap-1 text-xs font-semibold">
      <span className={cn('flex items-center gap-0.5', up ? 'text-emerald-500' : 'text-rose-500')}>
        {up ? '↑' : '↓'} {Math.abs(pct).toFixed(2)}%
      </span>
    </div>
  );
}

/* ─── Filter Bar ─────────────────────────────────────────────── */
function FilterBar() {
  const { filters, setFilters, filterOptions } = useDashboard();
  const update = (key: keyof Filters) => (vals: string[]) => setFilters({ ...filters, [key]: vals });

  return (
    <div className="flex flex-wrap items-center gap-3 px-6 py-4 bg-white border-b border-slate-100">
      {/* Date range */}
      <div className="flex items-center gap-2 h-8 px-3 border border-slate-200 bg-white rounded-md text-[13px] font-medium text-slate-700">
        <CalendarIcon className="w-4 h-4 text-slate-400" />
        <span className="text-slate-500">Date</span>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
          className="bg-transparent border-none outline-none text-[13px] w-[110px] cursor-pointer"
        />
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        {(filters.dateFrom || filters.dateTo) && (
          <>
            <span className="text-slate-300">→</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
              className="bg-transparent border-none outline-none text-[13px] w-[110px] cursor-pointer"
            />
            <button onClick={() => setFilters({ ...filters, dateFrom: '', dateTo: '' })} className="ml-1 text-slate-400 hover:text-slate-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      <MultiSelect icon label="Platform"    options={filterOptions.platforms}     selected={filters.platforms}     onChange={update('platforms')} />
      <MultiSelect icon label="Category"    options={filterOptions.categories}    selected={filters.categories}    onChange={update('categories')} />
      <MultiSelect icon label="Sub-Category" options={filterOptions.subcategories} selected={filters.subcategories} onChange={update('subcategories')} />
      <MultiSelect icon label="Brand"       options={filterOptions.brands}        selected={filters.brands}        onChange={update('brands')} />

      {/* Clear all */}
      {(filters.platforms.length + filters.categories.length + filters.subcategories.length + filters.brands.length + filters.products.length + (filters.dateFrom ? 1 : 0)) > 0 && (
        <button
          onClick={() => setFilters({ platforms:[], categories:[], subcategories:[], brands:[], products:[], dateFrom:'', dateTo:'' })}
          className="h-8 px-3 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

/* ─── Overview Dashboard ─────────────────────────────────────── */
function OverviewDashboard({ activeTab }: { activeTab: string }) {
  const { rawData, kpis, filteredData, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
      </div>
    );
  }

  // Calculate daily data + percentages
  const rawTrend = groupByDate(filteredData, ['revenue', 'adSales', 'adSpend', 'units']).map(d => ({
    ...d,
    tacos: d.revenue > 0 ? (d.adSpend / d.revenue) * 100 : 0,
    roi: d.adSpend > 0 ? (d.adSales / d.adSpend) : 0,
    organicPct: d.revenue > 0 ? ((d.revenue - d.adSales) / d.revenue) * 100 : 0,
  })).slice(-30);

  // For the Data Table: group by Platform and Date
  const tableData = [...filteredData].reduce((acc, curr) => {
    const key = `${curr.date}_${curr.platform}`;
    if (!acc[key]) {
      acc[key] = { date: curr.date, platform: curr.platform, adSpend: 0, revenue: 0, tacos: 0 };
    }
    acc[key].adSpend += curr.adSpend;
    acc[key].revenue += curr.revenue;
    acc[key].tacos = acc[key].revenue > 0 ? (acc[key].adSpend / acc[key].revenue) * 100 : 0;
    return acc;
  }, {} as Record<string, any>);
  const tableRows = Object.values(tableData).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15); // Top 15 recent

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* Title */}
      <h2 className="text-xl font-medium text-slate-800 tracking-tight">Marketing Performance ({activeTab})</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="p-5 border-r border-b lg:border-b-0 border-slate-200 last:border-r-0 flex flex-col justify-center items-center text-center">
          <div className="text-[13px] font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
            Ad Spends ({activeTab}) <span className="text-slate-300">...</span>
          </div>
          <div className="text-2xl font-semibold text-slate-800 mb-1">{formatMoney(kpis.totalAdSpend).replace('₹', '')}</div>
          <GrowthBadge pct={-kpis.growth.adSpend} /> {/* Negative is good for spends conceptually, but user metabase usually just plots raw math. Let's do raw math */}
        </div>
        <div className="p-5 border-r border-b lg:border-b-0 border-slate-200 last:border-r-0 flex flex-col justify-center items-center text-center">
          <div className="text-[13px] font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
            Ad Sales ({activeTab}) <span className="text-slate-300">...</span>
          </div>
          <div className="text-2xl font-semibold text-slate-800 mb-1">{formatMoney(kpis.totalAdSales).replace('₹', '')}</div>
          <GrowthBadge pct={kpis.growth.adSales} />
        </div>
        <div className="p-5 border-r border-b lg:border-b-0 border-slate-200 last:border-r-0 flex flex-col justify-center items-center text-center">
          <div className="text-[13px] font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
            Ad ROI ({activeTab}) <span className="text-slate-300">...</span>
          </div>
          <div className="text-2xl font-semibold text-slate-800 mb-1">{kpis.avgROI.toFixed(1)}</div>
          <GrowthBadge pct={kpis.growth.roi} />
        </div>
        <div className="p-5 border-r border-b lg:border-b-0 border-slate-200 last:border-r-0 flex flex-col justify-center items-center text-center">
          <div className="text-[13px] font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
            T.ACOS% ({activeTab}) <span className="text-slate-300">...</span>
          </div>
          <div className="text-2xl font-semibold text-slate-800 mb-1">{kpis.avgTacos.toFixed(2)}%</div>
          <GrowthBadge pct={-kpis.growth.tacos} /> {/* Dropping tacos is red mathematically but good, will just show raw arrow */}
        </div>
        <div className="p-5 border-r border-b lg:border-b-0 border-slate-200 last:border-r-0 flex flex-col justify-center items-center text-center">
          <div className="text-[13px] font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
            Organic % ({activeTab}) <span className="text-slate-300">...</span>
          </div>
          <div className="text-2xl font-semibold text-slate-800 mb-1">{kpis.organicPct.toFixed(2)}%</div>
          <GrowthBadge pct={kpis.growth.organicPct} />
        </div>
        <div className="p-5 border-r border-b lg:border-b-0 border-slate-200 last:border-r-0 flex flex-col justify-center items-center text-center">
          <div className="text-[13px] font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
            Total Sales ({activeTab}) <span className="text-slate-300">...</span>
          </div>
          <div className="text-2xl font-semibold text-slate-800 mb-1">{formatMoney(kpis.totalRevenue).replace('₹', '')}</div>
          <GrowthBadge pct={kpis.growth.revenue} />
        </div>
      </div>

      {/* Trend Chart */}
      <Card className="shadow-sm border-slate-200 overflow-visible rounded-xl">
        <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-[15px] font-semibold text-slate-700">Spend & Sales Overview</CardTitle>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-md text-[13px] font-medium text-slate-600">
              <BarChart3 className="w-4 h-4" /> Metric <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="h-[380px] p-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rawTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fontSize:12, fill:'#94a3b8'}} tickFormatter={v => v.slice(5,10)} minTickGap={30} padding={{ left: 10, right: 10 }} />
              
              {/* Left Y Axis for core financial numbers */}
              <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{fontSize:12, fill:'#94a3b8'}} tickFormatter={v => formatNum(v)} />
              
              {/* Right Y Axis for ratios and percentages */}
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{fontSize:12, fill:'#94a3b8'}} hide />

              <Tooltip 
                contentStyle={{ borderRadius:'8px', border:'1px solid #e2e8f0', boxShadow:'0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize:'13px', padding: '12px' }}
                itemStyle={{ padding: '2px 0' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              
              <Line yAxisId="left" type="monotone" dataKey="adSpend" name="Ad Spends" stroke={COLORS.adSpends} strokeWidth={2.5} dot={{r: 3, strokeWidth: 2}} activeDot={{r: 6}} />
              <Line yAxisId="left" type="monotone" dataKey="adSales" name="Ad Sales" stroke={COLORS.adSales} strokeWidth={2.5} dot={{r: 3, strokeWidth: 2}} activeDot={{r: 6}} />
              <Line yAxisId="right" type="monotone" dataKey="roi" name="Ad ROI" stroke={COLORS.adRoi} strokeWidth={2.5} dot={{r: 3, strokeWidth: 2}} activeDot={{r: 6}} />
              <Line yAxisId="left" type="monotone" dataKey="revenue" name="T. Sales" stroke={COLORS.tSales} strokeWidth={2.5} dot={{r: 3, strokeWidth: 2}} activeDot={{r: 6}} />
              <Line yAxisId="right" type="monotone" dataKey="tacos" name="T.ACOS %" stroke={COLORS.tAcos} strokeWidth={2.5} dot={{r: 3, strokeWidth: 2}} activeDot={{r: 6}} />
              <Line yAxisId="right" type="monotone" dataKey="organicPct" name="Organic %" stroke={COLORS.organicPct} strokeWidth={2.5} dot={{r: 3, strokeWidth: 2}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Actual VS Budget Table (Mocked Target columns) */}
      <Card className="shadow-sm border-slate-200 rounded-xl">
        <CardHeader className="p-5 border-b border-slate-100">
          <CardTitle className="text-[15px] font-semibold text-slate-700">Daily Actual VS Budget</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead className="bg-[#f8fafc] text-slate-500 font-medium">
              <tr>
                <th className="px-5 py-3.5 border-b border-slate-200">Date</th>
                <th className="px-5 py-3.5 border-b border-slate-200">Platform</th>
                <th className="px-5 py-3.5 border-b border-slate-200 text-right">Spend Budget</th>
                <th className="px-5 py-3.5 border-b border-slate-200 text-right">Actual Spend</th>
                <th className="px-5 py-3.5 border-b border-slate-200 text-right">T. Sales Target</th>
                <th className="px-5 py-3.5 border-b border-slate-200 text-right">Actual T. Sales</th>
                <th className="px-5 py-3.5 border-b border-slate-200 text-right">TACOS Target</th>
                <th className="px-5 py-3.5 border-b border-slate-200 text-right">Actual TACOS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableRows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-700">{row.date}</td>
                  <td className="px-5 py-3.5 text-slate-600">{row.platform}</td>
                  {/* Mocked Budgets for demonstration of the layout */}
                  <td className="px-5 py-3.5 text-right text-slate-600">{formatNum(row.adSpend * 1.2)}</td>
                  <td className="px-5 py-3.5 text-right font-medium text-slate-800">{formatNum(row.adSpend)}</td>
                  <td className="px-5 py-3.5 text-right text-slate-600">{formatNum(row.revenue * 0.9)}</td>
                  <td className="px-5 py-3.5 text-right font-medium text-slate-800">{formatNum(row.revenue)}</td>
                  <td className="px-5 py-3.5 text-right text-slate-600">24.5%</td>
                  <td className="px-5 py-3.5 text-right font-medium text-slate-800">{row.tacos.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}

/* ─── Main Page containing the Top Nav Tabs ────────────────────── */
export default function Index() {
  const [activeTab, setActiveTab] = useState('Weekly');
  const tabs = ['Daily (T-1)', 'Weekly', 'MTD', 'FMCG Daily', 'Bread Daily', 'Campaign Performance'];

  return (
    <DashboardProvider>
      <DashboardLayout activePage="overview" setActivePage={() => {}}>
        <div className="min-h-screen bg-[#f8f9fc]">
          
          {/* Header & Tabs */}
          <div className="bg-white px-6 pt-5 pb-0 flex flex-col gap-4 sticky top-0 z-40 border-b border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-slate-900">Ads Dashboard</h1>
              <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <CloudDownload className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-3 text-[14px] font-medium transition-all whitespace-nowrap border-b-2",
                    activeTab === tab 
                      ? "border-sky-500 text-sky-600" 
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <FilterBar />
          
          <OverviewDashboard activeTab={activeTab} />

        </div>
      </DashboardLayout>
    </DashboardProvider>
  );
}

