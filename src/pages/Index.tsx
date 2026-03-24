import { useState, useRef, useEffect } from 'react';
import { useDashboard, DashboardProvider, Filters, TabType } from '@/hooks/use-dashboard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { formatMoney, formatNum, formatPct, groupByDate } from '@/lib/data-utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar as CalendarIcon, ChevronDown, X, CloudDownload, Target, Settings, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetricBarChart } from '@/components/dashboard/MetricBarChart';
import { SmartInsights } from '@/components/dashboard/SmartInsights';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { PlatformPerformanceTable, CategoryPlatformTable } from '@/components/dashboard/PivotTables';

// Custom metric colors
const COLORS = { adSpends: '#ef4444', adSales: '#06b6d4', revenue: '#10b981' };

/* ─── Multi-Select Dropdown ──────────────────────────────────── */
function MultiSelect({ label, options, selected, onChange, icon }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void; icon?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const toggle = (val: string) => onChange(selected.includes(val) ? selected.filter(s => s !== val) : [...selected, val]);

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
        <span className="max-w-[120px] truncate">{selected.length === 0 ? 'All' : selected.length === 1 ? selected[0] : `${selected[0]} +${selected.length - 1}`}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform ml-1', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 min-w-[200px] max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl">
          {options.length === 0 ? <div className="px-4 py-3 text-sm text-slate-400">No options</div> : options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" className="accent-indigo-600 w-4 h-4 rounded" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
              <span className="truncate">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Filter Bar ─────────────────────────────────────────────── */
function FilterBar() {
  const { filters, setFilters, filterOptions } = useDashboard();
  const update = (key: keyof Filters) => (vals: string[]) => setFilters({ ...filters, [key]: vals });
  const hasFilters = filters.platforms.length + filters.categories.length + filters.subcategories.length + filters.brands.length + filters.products.length + filters.cities.length + (filters.dateFrom ? 1 : 0) > 0;

  return (
    <div className="flex flex-wrap items-center gap-3 px-6 py-4 bg-white border-b border-slate-100 sticky top-[60px] z-30">
      <div className="flex items-center gap-2 h-8 px-3 border border-slate-200 bg-white rounded-md text-[13px] font-medium text-slate-700 shadow-sm">
        <CalendarIcon className="w-4 h-4 text-slate-400" />
        <span className="text-slate-500">Date</span>
        <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} className="bg-transparent border-none outline-none text-[13px] w-[110px] cursor-pointer" />
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        {(filters.dateFrom || filters.dateTo) && (
          <>
            <span className="text-slate-300">→</span>
            <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} className="bg-transparent border-none outline-none text-[13px] w-[110px] cursor-pointer" />
            <button onClick={() => setFilters({ ...filters, dateFrom: '', dateTo: '' })} className="ml-1 text-slate-400 hover:text-slate-700"><X className="w-3.5 h-3.5" /></button>
          </>
        )}
      </div>
      <MultiSelect icon label="Platform" options={filterOptions.platforms} selected={filters.platforms} onChange={update('platforms')} />
      <MultiSelect icon label="City" options={filterOptions.cities} selected={filters.cities} onChange={update('cities')} />
      <MultiSelect icon label="Category" options={filterOptions.categories} selected={filters.categories} onChange={update('categories')} />
      <MultiSelect icon label="Sub-Category" options={filterOptions.subcategories} selected={filters.subcategories} onChange={update('subcategories')} />
      <MultiSelect icon label="Product" options={filterOptions.products} selected={filters.products} onChange={update('products')} />
      <MultiSelect icon label="Brand" options={filterOptions.brands} selected={filters.brands} onChange={update('brands')} />
      {hasFilters && <button onClick={() => setFilters({ platforms:[], categories:[], subcategories:[], brands:[], products:[], cities:[], dateFrom:'', dateTo:'' })} className="h-8 px-3 text-xs font-medium text-rose-500 hover:bg-rose-50 rounded-md transition-colors">Clear</button>}
    </div>
  );
}

/* ─── Growth Badge ───────────────────────────────────────────── */
function GrowthBadge({ pct, inverse = false }: { pct: number, inverse?: boolean }) {
  // If inverse is true, negative is green (good) - e.g. for TACoS
  const up = pct >= 0;
  const isGood = inverse ? !up : up;
  return (
    <div className="flex items-center gap-1 text-xs font-semibold mt-1">
      <span className={cn('flex items-center gap-0.5', isGood ? 'text-emerald-500' : 'text-rose-500')}>
        {up ? '↑' : '↓'} {Math.abs(pct).toFixed(2)}%
      </span>
    </div>
  );
}

/* ─── Target Inputs Component ────────────────────────────────── */
function StaticTargets() {
  const { targetRevenue, setTargetRevenue, targetTacos, setTargetTacos } = useDashboard();
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
        <Target className="w-4 h-4 text-indigo-500" /> Fixed Targets
      </h3>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Revenue Target (₹)</label>
        <input 
          type="number" 
          value={targetRevenue} 
          onChange={e => setTargetRevenue(Number(e.target.value))}
          className="w-full h-8 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-indigo-400 font-medium text-slate-700"
        />
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">TACoS Target (%)</label>
        <div className="relative">
          <input 
            type="number" 
            value={targetTacos} 
            onChange={e => setTargetTacos(Number(e.target.value))}
            className="w-full h-8 pl-3 pr-8 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-indigo-400 font-medium text-slate-700"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Trend Line Chart ───────────────────────────────────────── */
function UnifiedTrendChart() {
  const { filteredData } = useDashboard();
  const [metric, setMetric] = useState<'revenue' | 'adSales' | 'adSpend'>('revenue');

  // Daily trending is unaffected by global date boundaries if we want to show a timeline, but user requested tab responsive? 
  // "Global date filters should not affect this chart." - Okay, we just plot the raw timeline grouped by day.
  const rawData = groupByDate(filteredData, ['revenue', 'adSales', 'adSpend']).slice(-30); // Show last 30 days always

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-slate-600 uppercase tracking-wider">30-Day Trend Overview</h3>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as any)}
          className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-md px-2 py-1 outline-none focus:border-indigo-500 text-slate-700"
        >
          <option value="revenue">Total Revenue</option>
          <option value="adSales">Ad Sales</option>
          <option value="adSpend">Ad Spends</option>
        </select>
      </div>
      <div className="h-[250px] p-3 pl-0 pt-5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rawData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => v.slice(5, 10)} minTickGap={30} padding={{ left:10, right:10 }} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={v => formatNum(v)} tick={{ fontSize: 11, fill: '#64748b' }} />
            <RechartsTooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} 
              formatter={(val: number) => [formatMoney(val), metric.toUpperCase()]}
            />
            <Line type="monotone" dataKey={metric} stroke={COLORS[metric]} strokeWidth={3} dot={{r:0}} activeDot={{r:6, strokeWidth:0}} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── Overview Tab Component ─────────────────────────────────── */
function DashboardContent() {
  const { activeTab, kpis, filteredData, isLoading } = useDashboard();

  if (isLoading) return <div className="flex h-64 items-center justify-center"><div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"/></div>;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* 1. KPI Cards Row */}
      <div className="flex items-center justify-between pl-1">
        <p className="text-sm font-medium text-slate-500">
          Comparing <strong className="text-slate-700">{kpis.currentLabel}</strong> vs <strong className="text-slate-700">{kpis.prevLabel}</strong>
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-0 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="p-4 border-r border-b lg:border-b-0 border-slate-200 last:border-r-0 flex flex-col items-center text-center">
          <div className="text-[12px] font-medium text-slate-500 mb-1">Revenue</div>
          <div className="text-xl font-bold text-slate-800 tracking-tight">{formatMoney(kpis.revenue).replace('₹', '')}</div>
          <GrowthBadge pct={kpis.growth.revenue} />
        </div>
        <div className="p-4 border-r border-b lg:border-b-0 border-slate-200 last:border-r-0 flex flex-col items-center text-center">
          <div className="text-[12px] font-medium text-slate-500 mb-1">Ad Sales</div>
          <div className="text-xl font-bold text-slate-800 tracking-tight">{formatMoney(kpis.adSales).replace('₹', '')}</div>
          <GrowthBadge pct={kpis.growth.adSales} />
        </div>
        <div className="p-4 border-r border-b lg:border-b-0 border-slate-200 last:border-r-0 flex flex-col items-center text-center">
          <div className="text-[12px] font-medium text-slate-500 mb-1">Ad Spends</div>
          <div className="text-xl font-bold text-slate-800 tracking-tight">{formatMoney(kpis.adSpend).replace('₹', '')}</div>
          <GrowthBadge pct={-kpis.growth.adSpend} /> {/* Spend going down mathematically plotted as standard percentage, but let's just show raw */}
        </div>
        <div className="p-4 border-r border-b md:border-b-0 border-slate-200 last:border-r-0 flex flex-col items-center text-center">
          <div className="text-[12px] font-medium text-slate-500 mb-1">Units (QTY)</div>
          <div className="text-xl font-bold text-slate-800 tracking-tight">{formatNum(kpis.units)}</div>
          <GrowthBadge pct={kpis.growth.units} />
        </div>
        <div className="p-4 border-r border-slate-200 last:border-r-0 flex flex-col items-center text-center">
          <div className="text-[12px] font-medium text-slate-500 mb-1">Ad ROI</div>
          <div className="text-xl font-bold text-slate-800 tracking-tight">{kpis.roi.toFixed(2)}x</div>
          <GrowthBadge pct={kpis.growth.roi} />
        </div>
        <div className="p-4 border-r border-slate-200 last:border-r-0 flex flex-col items-center text-center">
          <div className="text-[12px] font-medium text-slate-500 mb-1">TACoS</div>
          <div className="text-xl font-bold text-slate-800 tracking-tight">{kpis.tacos.toFixed(2)}%</div>
          <GrowthBadge pct={-kpis.growth.tacos} inverse={true} />
        </div>
        <div className="p-4 border-slate-200 last:border-r-0 flex flex-col items-center text-center">
          <div className="text-[12px] font-medium text-slate-500 mb-1">Organic %</div>
          <div className="text-xl font-bold text-slate-800 tracking-tight">{kpis.organicPct.toFixed(2)}%</div>
          <GrowthBadge pct={kpis.growth.organicPct} />
        </div>
      </div>

      {/* 2. Top Section: Insights, Targets, Main Trend */}
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <StaticTargets />
          <SmartInsights data={filteredData} />
        </div>
        <div className="lg:col-span-3">
          <UnifiedTrendChart />
        </div>
      </div>

      {/* 3. Bar Charts Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricBarChart title="Platform Wise" data={filteredData} xAxisKey="platform" />
        <MetricBarChart title="Brand Wise" data={filteredData} xAxisKey="brand" />
        <MetricBarChart title="Category Wise" data={filteredData} xAxisKey="category" />
        <MetricBarChart title="Sub-Category Wise" data={filteredData} xAxisKey="subcategory" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <MetricBarChart title="Date-wise Sales" data={filteredData} xAxisKey="date" defaultMetric="revenue" />
        <MetricBarChart title="City-wise Performance" data={filteredData} xAxisKey="city" defaultMetric="revenue" />
      </div>

      {/* 4. Top/Bottom Products */}
      <TopProducts data={filteredData} />

      {/* 5. Pivoting Data Tables */}
      <div className="space-y-6 pt-6 border-t border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Deep Dive Tables</h2>
        <PlatformPerformanceTable data={filteredData} activeTab={activeTab} />
        <CategoryPlatformTable data={filteredData} activeTab={activeTab} />
      </div>

    </div>
  );
}

/* ─── Main Application Wrap ──────────────────────────────────── */
export default function Index() {
  const [internalPage, setInternalPage] = useState('overview');

  return (
    <DashboardProvider>
      <DashboardLayout activePage={internalPage} setActivePage={setInternalPage}>
        {/* We need to extract the Tab state out to render the header safely */}
        <DashboardPageContent />
      </DashboardLayout>
    </DashboardProvider>
  );
}

/* This split allows us to consume useDashboard() for the sticky header tabs */
function DashboardPageContent() {
  const { activeTab, setActiveTab } = useDashboard();
  const tabs: TabType[] = ['Daily', 'Weekly', 'MTD'];

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Header & Main Tabs */}
      <div className="bg-white px-6 pt-5 flex flex-col gap-4 sticky top-0 z-40 border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">E-Commerce Analytics</h1>
          <button className="flex items-center gap-2 p-2 px-4 hover:bg-slate-50 text-slate-600 font-medium text-sm rounded-md transition-colors border border-slate-200 shadow-sm">
            <CloudDownload className="w-4 h-4" /> Export Report
          </button>
        </div>
        <div className="flex items-center gap-8">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 text-[14px] font-semibold transition-all whitespace-nowrap border-b-[3px]",
                activeTab === tab 
                  ? "border-indigo-600 text-indigo-700" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              Overview ({tab})
            </button>
          ))}
        </div>
      </div>

      <FilterBar />
      <DashboardContent />
    </div>
  );
}

