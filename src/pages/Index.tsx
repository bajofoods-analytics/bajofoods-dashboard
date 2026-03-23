import { useState, useRef, useEffect } from 'react';
import { useDashboard, DashboardProvider, Filters } from '@/hooks/use-dashboard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/kpi-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatMoney, formatNum, formatPct, groupByDate } from '@/lib/data-utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { Calendar as CalendarIcon, ChevronDown, X, Lightbulb, Target, Settings, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = {
  revenue: '#10b981',
  adSales: '#8b5cf6',
  adSpend: '#f43f5e',
  blue:    '#6366f1',
};

/* ─── Multi-Select Dropdown ──────────────────────────────────── */
interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
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
    ? `All ${label}`
    : selected.length === 1
      ? selected[0]
      : `${selected[0]} +${selected.length - 1}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-2 h-9 px-3 border rounded-full text-sm font-medium transition-colors whitespace-nowrap',
          selected.length > 0
            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
        )}
      >
        <span className="max-w-[130px] truncate">{displayText}</span>
        {selected.length > 0 && (
          <span
            onClick={e => { e.stopPropagation(); onChange([]); }}
            className="ml-1 text-indigo-400 hover:text-indigo-700"
          >
            <X className="w-3 h-3" />
          </span>
        )}
        <ChevronDown className={cn('w-3 h-3 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 min-w-[200px] max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl">
          {options.length === 0
            ? <div className="px-4 py-3 text-sm text-slate-400">No options</div>
            : options.map(opt => (
                <label
                  key={opt}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
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
function GrowthBadge({ pct, label }: { pct: number; label: string }) {
  const up = pct >= 0;
  return (
    <div className="flex items-center gap-1 text-[10px] font-semibold">
      <span className={cn('flex items-center gap-0.5', up ? 'text-emerald-600' : 'text-rose-500')}>
        {up ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
      </span>
      <span className="text-slate-400 font-normal">vs {label}</span>
    </div>
  );
}

/* ─── Filter Bar ─────────────────────────────────────────────── */
function FilterBar() {
  const { filters, setFilters, filterOptions } = useDashboard();

  const update = (key: keyof Filters) => (vals: string[]) =>
    setFilters({ ...filters, [key]: vals });

  return (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 px-6 py-3">
        {/* Date range */}
        <div className="flex items-center gap-1 h-9 px-3 border border-slate-200 bg-slate-50 rounded-full text-sm font-medium text-slate-700">
          <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
            className="bg-transparent border-none outline-none text-xs w-[110px] cursor-pointer"
          />
          <span className="text-slate-300">→</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
            className="bg-transparent border-none outline-none text-xs w-[110px] cursor-pointer"
          />
          {(filters.dateFrom || filters.dateTo) && (
            <button onClick={() => setFilters({ ...filters, dateFrom: '', dateTo: '' })} className="ml-1 text-slate-400 hover:text-slate-700">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <MultiSelect label="Platform"    options={filterOptions.platforms}     selected={filters.platforms}     onChange={update('platforms')} />
        <MultiSelect label="Category"    options={filterOptions.categories}    selected={filters.categories}    onChange={update('categories')} />
        <MultiSelect label="Sub-Category" options={filterOptions.subcategories} selected={filters.subcategories} onChange={update('subcategories')} />
        <MultiSelect label="Brand"       options={filterOptions.brands}        selected={filters.brands}        onChange={update('brands')} />
        <MultiSelect label="Product"     options={filterOptions.products}      selected={filters.products}      onChange={update('products')} />

        {/* Clear all */}
        {(filters.platforms.length + filters.categories.length + filters.subcategories.length + filters.brands.length + filters.products.length + (filters.dateFrom ? 1 : 0)) > 0 && (
          <button
            onClick={() => setFilters({ platforms:[], categories:[], subcategories:[], brands:[], products:[], dateFrom:'', dateTo:'' })}
            className="h-9 px-3 text-xs font-medium text-rose-500 hover:text-rose-700 border border-rose-200 bg-rose-50 rounded-full flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Overview Dashboard ─────────────────────────────────────── */
function OverviewDashboard() {
  const { kpis, filteredData, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
      </div>
    );
  }

  const rawTrend = groupByDate(filteredData, ['revenue', 'adSales', 'adSpend', 'units']).slice(-30);

  return (
    <div className="space-y-6 p-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Total Revenue"
          value={formatMoney(kpis.totalRevenue)}
          trend={kpis.growth.revenue >= 0 ? 'up' : 'down'}
          trendValue={<GrowthBadge pct={kpis.growth.revenue} label={kpis.prevDateLabel} />}
        />
        <KPICard
          title="Units Sold"
          value={formatNum(kpis.totalUnits)}
          trend={kpis.growth.units >= 0 ? 'up' : 'down'}
          trendValue={<GrowthBadge pct={kpis.growth.units} label={kpis.prevDateLabel} />}
        />
        <KPICard
          title="Ad Spend"
          value={formatMoney(kpis.totalAdSpend)}
          trend={kpis.growth.adSpend <= 0 ? 'up' : 'down'}
          trendValue={<GrowthBadge pct={kpis.growth.adSpend} label={kpis.prevDateLabel} />}
        />
        <KPICard
          title="Ad Sales"
          value={formatMoney(kpis.totalAdSales)}
          trend={kpis.growth.adSales >= 0 ? 'up' : 'down'}
          trendValue={<GrowthBadge pct={kpis.growth.adSales} label={kpis.prevDateLabel} />}
        />
        <KPICard
          title="TACOS"
          value={formatPct(kpis.avgTacos)}
          trend={kpis.growth.tacos <= 0 ? 'up' : 'down'}
          trendValue={<GrowthBadge pct={kpis.growth.tacos} label={kpis.prevDateLabel} />}
        />
        <KPICard
          title="Ad ROI"
          value={kpis.avgROI.toFixed(2) + 'x'}
          trend={kpis.growth.roi >= 0 ? 'up' : 'down'}
          trendValue={<GrowthBadge pct={kpis.growth.roi} label={kpis.prevDateLabel} />}
        />
      </div>

      <div className="mb-4 mt-8">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Sales Performance Overview</h2>
      </div>

      {/* Targets */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 border border-slate-200 shadow-sm rounded-xl">
          <div className="flex items-center gap-2 mb-4 text-slate-500">
            <Target className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Revenue Target</span>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>Achievement</span>
                <span className="flex items-center text-indigo-500 cursor-pointer hover:underline">
                  Set target <ArrowRight className="w-3 h-3 ml-1" />
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-1/4 rounded-full" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-800">{formatMoney(kpis.totalRevenue)}</div>
            </div>
            <div className="ml-6 flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-medium mb-1">Target (₹)</span>
              <input type="text" placeholder="e.g. 50000" className="w-28 h-8 text-sm px-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 shadow-sm rounded-xl">
          <div className="flex items-center gap-2 mb-4 text-slate-500">
            <Settings className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider">TACOS Target</span>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-slate-500 mb-2"><span>Current</span></div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(kpis.avgTacos, 100)}%` }} />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-800">{formatPct(kpis.avgTacos)}</div>
            </div>
            <div className="ml-6 flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-medium mb-1">Target (%)</span>
              <input type="text" placeholder="e.g. 15" className="w-24 h-8 text-sm px-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
        </Card>
      </div>

      {/* Smart Insights */}
      <div className="bg-[#f8f9fc] border border-[#eef2f6] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-indigo-500 font-semibold text-xs tracking-wider uppercase">
          <Lightbulb className="w-4 h-4" />
          <span>Smart Insights</span>
        </div>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-center before:content-['•'] before:mr-2 before:text-slate-400">Revenue data now live from Google Sheets</li>
          <li className="flex items-center before:content-['•'] before:mr-2 before:text-slate-400">Use multi-select filters above to drill down</li>
          <li className="flex items-center before:content-['•'] before:mr-2 before:text-slate-400">KPIs show growth % vs previous period automatically</li>
        </ul>
      </div>

      {/* Trend Chart */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-0 pt-5 px-6">
          <CardTitle className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
            Revenue • Ad Sales • Ad Spends Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] pt-4 px-2 pb-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rawTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.revenue} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={COLORS.revenue} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colAdS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.adSales} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={COLORS.adSales} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colAdSp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.adSpend} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={COLORS.adSpend} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fontSize:11,fill:'#64748b'}} tickFormatter={v => v.slice(5,10)} minTickGap={20} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={v => formatMoney(v)} tick={{fontSize:11,fill:'#64748b'}} />
              <Tooltip
                contentStyle={{ borderRadius:'8px', border:'1px solid #e2e8f0', boxShadow:'0 4px 6px -1px rgb(0 0 0/0.1)', fontSize:'12px' }}
                formatter={(value: number, name: string) => [formatMoney(value), name.toUpperCase()]}
              />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.revenue} strokeWidth={2} fillOpacity={1} fill="url(#colRev)" />
              <Area type="monotone" dataKey="adSales" name="Ad Sales" stroke={COLORS.adSales} strokeWidth={2} fillOpacity={1} fill="url(#colAdS)" />
              <Area type="monotone" dataKey="adSpend" name="Ad Spends" stroke={COLORS.adSpend} strokeWidth={2} fillOpacity={1} fill="url(#colAdSp)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex justify-center items-center gap-6 mt-2 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full ring-2 ring-emerald-500 bg-emerald-100" /> Revenue</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full ring-2 ring-violet-500 bg-violet-100" /> Ad Sales</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full ring-2 ring-rose-500 bg-rose-100" /> Ad Spends</span>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Bar Charts */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Units Sold</CardTitle></CardHeader>
          <CardContent className="h-[200px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rawTrend} margin={{ top:10, right:10, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fontSize:10,fill:'#94a3b8'}} tickFormatter={v=>v.slice(5,10)} minTickGap={20} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={v=>formatNum(v)} tick={{fontSize:10,fill:'#94a3b8'}} />
                <Tooltip formatter={(value: number) => [formatNum(value), 'Units Sold']} cursor={{fill:'#f8fafc'}} />
                <Bar dataKey="units" fill={COLORS.blue} radius={[4,4,0,0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ad Spends</CardTitle></CardHeader>
          <CardContent className="h-[200px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rawTrend} margin={{ top:10, right:10, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fontSize:10,fill:'#94a3b8'}} tickFormatter={v=>v.slice(5,10)} minTickGap={20} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={v=>formatMoney(v)} tick={{fontSize:10,fill:'#94a3b8'}} />
                <Tooltip formatter={(value: number) => [formatMoney(value), 'Ad Spends']} cursor={{fill:'#f8fafc'}} />
                <Bar dataKey="adSpend" fill={COLORS.adSpend} radius={[4,4,0,0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ad Sales</CardTitle></CardHeader>
          <CardContent className="h-[200px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rawTrend} margin={{ top:10, right:10, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fontSize:10,fill:'#94a3b8'}} tickFormatter={v=>v.slice(5,10)} minTickGap={20} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={v=>formatMoney(v)} tick={{fontSize:10,fill:'#94a3b8'}} />
                <Tooltip formatter={(value: number) => [formatMoney(value), 'Ad Sales']} cursor={{fill:'#f8fafc'}} />
                <Bar dataKey="adSales" fill={COLORS.adSales} radius={[4,4,0,0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function Index() {
  const [activePage, setActivePage] = useState('overview');

  return (
    <DashboardProvider>
      <DashboardLayout activePage={activePage} setActivePage={setActivePage}>
        <div className="min-h-screen bg-slate-50">
          <FilterBar />
          <div className="max-w-[1600px] mx-auto">
            {activePage === 'overview' && <OverviewDashboard />}
            {activePage !== 'overview' && (
              <div className="flex h-[300px] flex-col items-center justify-center rounded-xl bg-slate-100 border border-slate-200 m-6">
                <h3 className="text-lg font-semibold text-slate-600 capitalize">{activePage.replace('-', ' ')} Page</h3>
                <p className="text-slate-500">Under Construction</p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </DashboardProvider>
  );
}
