import { useState, createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SALES_CSV_URL, SalesRecord, normalizeRow, parseCSV } from '@/lib/data-utils';

export interface Filters {
  platforms: string[];
  categories: string[];
  subcategories: string[];
  brands: string[];
  products: string[];
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTERS: Filters = {
  platforms: [],
  categories: [],
  subcategories: [],
  brands: [],
  products: [],
  dateFrom: '',
  dateTo: '',
};

export function useDashboardData() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // Fetch from Google Sheets CSV (Sales tab ONLY as requested)
  const { data: rawData = [], isLoading, isError, error } = useQuery({
    queryKey: ['sheetData'],
    queryFn: async () => {
      const res = await fetch(SALES_CSV_URL);
      if (!res.ok) throw new Error('Failed to fetch sales data from Google Sheets');
      const csv = await res.text();
      return parseCSV(csv).map(normalizeRow) as SalesRecord[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Extract unique dropdown options
  const filterOptions = {
    platforms:    Array.from(new Set(rawData.map(r => r.platform))).filter(Boolean).sort(),
    categories:   Array.from(new Set(rawData.map(r => r.category))).filter(Boolean).sort(),
    subcategories:Array.from(new Set(rawData.map(r => r.subcategory))).filter(Boolean).sort(),
    brands:       Array.from(new Set(rawData.map(r => r.brand))).filter(Boolean).sort(),
    products:     Array.from(new Set(rawData.map(r => r.product))).filter(Boolean).sort(),
  };

  // Apply Filters
  const filteredData = rawData.filter(r => {
    if (filters.platforms.length    && !filters.platforms.includes(r.platform))       return false;
    if (filters.categories.length   && !filters.categories.includes(r.category))      return false;
    if (filters.subcategories.length && !filters.subcategories.includes(r.subcategory)) return false;
    if (filters.brands.length       && !filters.brands.includes(r.brand))            return false;
    if (filters.products.length     && !filters.products.includes(r.product))         return false;
    if (filters.dateFrom            && r.date < filters.dateFrom)                     return false;
    if (filters.dateTo              && r.date > filters.dateTo)                       return false;
    return true;
  });

  // ---------- KPIs for current period ----------
  const totalRevenue  = filteredData.reduce((s, r) => s + r.revenue,  0);
  const totalUnits    = filteredData.reduce((s, r) => s + r.units,     0);
  const totalAdSpend  = filteredData.reduce((s, r) => s + r.adSpend,   0);
  const totalAdSales  = filteredData.reduce((s, r) => s + r.adSales,   0);
  const avgTacos      = totalRevenue > 0 ? (totalAdSpend / totalRevenue) * 100 : 0;
  const avgROI        = totalAdSpend > 0 ? totalAdSales / totalAdSpend : 0;
  const organicPct    = totalRevenue > 0 ? ((totalRevenue - totalAdSales) / totalRevenue) * 100 : 0;

  // ---------- Previous period KPIs (same duration, shifted back) ----------
  const computePrev = () => {
    if (!filters.dateFrom || !filters.dateTo) {
      // No date range set: split all data in half
      const sorted = [...rawData].sort((a,b) => a.date.localeCompare(b.date));
      const mid = Math.floor(sorted.length / 2);
      const prev = sorted.slice(0, mid);
      const prevRev = prev.reduce((s,r) => s + r.revenue,  0);
      const prevAdSales = prev.reduce((s,r) => s + r.adSales,   0);
      return {
        revenue:  prevRev,
        units:    prev.reduce((s,r) => s + r.units,     0),
        adSpend:  prev.reduce((s,r) => s + r.adSpend,   0),
        adSales:  prevAdSales,
        organicPct: prevRev > 0 ? ((prevRev - prevAdSales) / prevRev) * 100 : 0,
      };
    }
    // Compute duration and shift window backward
    const from = new Date(filters.dateFrom);
    const to   = new Date(filters.dateTo);
    const diff = to.getTime() - from.getTime();
    const prevTo   = new Date(from.getTime() - 1).toISOString().slice(0,10);
    const prevFrom = new Date(from.getTime() - diff - 1).toISOString().slice(0,10);
    const prev = rawData.filter(r => r.date >= prevFrom && r.date <= prevTo);
    const prevRev = prev.reduce((s,r) => s + r.revenue,  0);
    const prevAdSales = prev.reduce((s,r) => s + r.adSales,   0);
    return {
      revenue:  prevRev,
      units:    prev.reduce((s,r) => s + r.units,     0),
      adSpend:  prev.reduce((s,r) => s + r.adSpend,   0),
      adSales:  prevAdSales,
      organicPct: prevRev > 0 ? ((prevRev - prevAdSales) / prevRev) * 100 : 0,
    };
  };

  const prevKpis = computePrev();

  // For percentages, growth is absolute difference
  const growth = (curr: number, prev: number) =>
    prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
  
  const absGrowth = (curr: number, prev: number) => curr - prev;

  const prevDateLabel = filters.dateFrom
    ? (() => {
        const from = new Date(filters.dateFrom);
        const to   = new Date(filters.dateTo);
        const diff = to.getTime() - from.getTime();
        const prevTo   = new Date(from.getTime() - 1);
        const prevFrom = new Date(from.getTime() - diff - 1);
        const fmt = (d: Date) => `${d.getDate()}/${d.getMonth()+1}`;
        return `${fmt(prevFrom)}-${fmt(prevTo)}`;
      })()
    : 'prev period';

  const kpis = {
    totalRevenue, totalUnits, totalAdSpend, totalAdSales, avgTacos, avgROI, organicPct,
    growth: {
      revenue:  growth(totalRevenue, prevKpis.revenue),
      units:    growth(totalUnits,   prevKpis.units),
      adSpend:  growth(totalAdSpend, prevKpis.adSpend),
      adSales:  growth(totalAdSales, prevKpis.adSales),
      tacos:    prevKpis.adSpend > 0
                  ? absGrowth(avgTacos, prevKpis.revenue > 0 ? (prevKpis.adSpend/prevKpis.revenue)*100 : 0) // point change
                  : 0,
      roi:      prevKpis.adSpend > 0
                  ? growth(avgROI, prevKpis.adSales/prevKpis.adSpend)
                  : 0,
      organicPct: absGrowth(organicPct, prevKpis.organicPct), // point change
    },
    prevDateLabel,
  };

  return {
    rawData, filteredData, kpis, filters, setFilters, filterOptions, isLoading, isError, error,
  };
}

const DashboardContext = createContext<ReturnType<typeof useDashboardData> | null>(null);

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
  const dashboard = useDashboardData();
  return <DashboardContext.Provider value={dashboard}>{children}</DashboardContext.Provider>;
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within DashboardProvider');
  return context;
};
