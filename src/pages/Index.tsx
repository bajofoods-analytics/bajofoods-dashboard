import { useState } from 'react';
import { useDashboard, DashboardProvider } from '@/hooks/use-dashboard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/kpi-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney, formatNum, formatPct, groupByDate } from '@/lib/data-utils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { Calendar as CalendarIcon, Lightbulb, Target, Settings, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";

const COLORS = {
  revenue: '#10b981', // green
  adSales: '#8b5cf6', // purple
  adSpend: '#f43f5e', // red
  blue:    '#6366f1', // units sold
};

function OverviewDashboard() {
  const { kpis, filteredData, isLoading, filters, setFilters, filterOptions } = useDashboard();
  const [timeframe, setTimeframe] = useState<'daily'|'weekly'|'mtd'>('daily');

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
      </div>
    );
  }

  // Prep Chart Data
  const rawTrend = groupByDate(filteredData, ['revenue', 'adSales', 'adSpend', 'units']).slice(-30);
  
  return (
    <div className="space-y-6">
      
      {/* Top Filter Buttons matching Screenshot 2 */}
      <div className="flex gap-4 items-center">
        <div className="flex bg-slate-100/50 p-1 rounded-lg w-full max-w-sm border border-slate-200">
          {(['daily', 'weekly', 'mtd'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition-colors",
                timeframe === tf 
                  ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mb-6 items-center">
        <button className="flex items-center gap-2 h-9 px-4 border border-slate-200 bg-slate-50/50 rounded-full text-indigo-500 font-medium text-sm hover:bg-slate-100 transition-colors">
          <CalendarIcon className="w-4 h-4" />
          <span>2026-03-19</span>
        </button>

        <Select value={filters.category} onValueChange={(v) => setFilters({...filters, category: v === 'all' ? '' : v})}>
          <SelectTrigger className="w-[160px] h-9 text-sm bg-slate-50 border-slate-200 rounded-full font-medium text-slate-700">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {filterOptions.categories.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.platform} onValueChange={(v) => setFilters({...filters, platform: v === 'all' ? '' : v})}>
          <SelectTrigger className="w-[160px] h-9 text-sm bg-slate-50 border-slate-200 rounded-full font-medium text-slate-700">
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {filterOptions.platforms.map((p: string) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Total Revenue" value={formatMoney(kpis.totalRevenue)} trend="up" trendValue="+100.0%" />
        <KPICard title="Units Sold" value={formatNum(kpis.totalUnits)} trend="up" trendValue="+100.0%" />
        <KPICard title="Ad Spend" value={formatMoney(kpis.totalAdSpend)} trend="up" trendValue="+100.0%" />
        <KPICard title="Ad Sales" value={formatMoney(kpis.totalAdSales)} trend="up" trendValue="+100.0%" />
        <KPICard title="TACOS" value={formatPct(kpis.avgTacos)} trend="down" trendValue="+100.0%" />
        <KPICard title="Ad ROI" value={kpis.avgROI.toFixed(2)} trend="up" trendValue="+100.0%" />
      </div>

      <div className="mb-4 mt-8">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Sales Performance Overview</h2>
      </div>

      {/* Targets Setup */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Revenue Target */}
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
                <div className="h-full bg-slate-200 w-1/4 rounded-full" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-800">
                {formatMoney(kpis.totalRevenue)}
              </div>
            </div>
            <div className="ml-6 flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-medium mb-1">Target (₹)</span>
              <input 
                type="text" 
                placeholder="e.g. 50000" 
                className="w-28 h-8 text-sm px-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </Card>

        {/* TACOS Target */}
        <Card className="p-5 border border-slate-200 shadow-sm rounded-xl">
          <div className="flex items-center gap-2 mb-4 text-slate-500">
            <Settings className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider">TACOS Target</span>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>Current</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                <div className="h-full bg-amber-500 w-[20.3%] rounded-full" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-800">
                {formatPct(kpis.avgTacos)}
              </div>
            </div>
            <div className="ml-6 flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-medium mb-1">Target (%)</span>
              <input 
                type="text" 
                placeholder="e.g. 15" 
                className="w-24 h-8 text-sm px-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
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
          <li className="flex items-center before:content-['•'] before:mr-2 before:text-slate-400">
            Revenue increased by 3.4% compared to previous period
          </li>
          <li className="flex items-center before:content-['•'] before:mr-2 before:text-slate-400">
            NCR is the top city contributing 27% of revenue
          </li>
          <li className="flex items-center before:content-['•'] before:mr-2 before:text-slate-400">
            Ultra Low Carb Keto Atta - 1Kg has the highest Ad ROI at 6.8x
          </li>
          <li className="flex items-center before:content-['•'] before:mr-2 before:text-slate-400">
            Ready To Eat is the fastest growing category at +31.8%
          </li>
          <li className="flex items-center before:content-['•'] before:mr-2 before:text-slate-400">
            Thu has the highest sales by day of week
          </li>
        </ul>
      </div>

      {/* Multi-line Trend Chart */}
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
              <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fontSize: 11, fill: '#64748b'}} tickFormatter={(v) => v.slice(5, 10)} minTickGap={20} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => (v/100000).toFixed(0)+'L'} tick={{fontSize: 11, fill: '#64748b'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
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
        {/* Units Sold */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Units Sold</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rawTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(v) => v.slice(5, 10)} minTickGap={20} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => (v/1000).toFixed(0)+'K'} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip formatter={(value: number) => [formatNum(value), "Units Sold"]} cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="units" fill={COLORS.blue} radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ad Spends */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ad Spends</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rawTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(v) => v.slice(5, 10)} minTickGap={20} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => (v/100000).toFixed(0)+'L'} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip formatter={(value: number) => [formatMoney(value), "Ad Spends"]} cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="adSpend" fill={COLORS.adSpend} radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ad Sales */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ad Sales</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rawTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(v) => v.slice(5, 10)} minTickGap={20} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => (v/100000).toFixed(0)+'L'} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip formatter={(value: number) => [formatMoney(value), "Ad Sales"]} cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="adSales" fill={COLORS.adSales} radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}

function CategoryAnalysis() {
  return (
    <div className="flex h-[400px] flex-col items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm">
      <h3 className="text-xl font-semibold text-slate-800">Category Analysis</h3>
      <p className="text-slate-500 mt-2">Charts and deep dive tables coming soon.</p>
    </div>
  );
}

export default function Index() {
  const [activePage, setActivePage] = useState('overview');

  return (
    <DashboardProvider>
      <DashboardLayout activePage={activePage} setActivePage={setActivePage}>
        {activePage === 'overview' && <OverviewDashboard />}
        {activePage === 'category' && <CategoryAnalysis />}
        {activePage !== 'overview' && activePage !== 'category' && (
          <div className="flex h-[300px] flex-col items-center justify-center rounded-xl bg-slate-100 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-600 capitalize">{activePage.replace('-', ' ')} Page</h3>
            <p className="text-slate-500">Under Construction</p>
          </div>
        )}
      </DashboardLayout>
    </DashboardProvider>
  );
}
