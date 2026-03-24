import { useState, createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SALES_CSV_URL, SalesRecord, normalizeRow, parseCSV } from '@/lib/data-utils';

export type TabType = 'Daily' | 'Weekly' | 'MTD';

export interface Filters {
  platforms: string[];
  categories: string[];
  subcategories: string[];
  brands: string[];
  products: string[];
  cities: string[];
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTERS: Filters = {
  platforms: [], categories: [], subcategories: [], brands: [], products: [], cities: [], dateFrom: '', dateTo: '',
};

export function useDashboardData() {
  const [activeTab, setActiveTab] = useState<TabType>('Daily');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [targetRevenue, setTargetRevenue] = useState(100000);
  const [targetTacos, setTargetTacos] = useState(15);

  const { data: rawData = [], isLoading, isError, error } = useQuery({
    queryKey: ['sheetData'],
    queryFn: async () => {
      const res = await fetch(SALES_CSV_URL);
      if (!res.ok) throw new Error('Failed to fetch sales data');
      const csv = await res.text();
      return parseCSV(csv).map(normalizeRow) as SalesRecord[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filterOptions = useMemo(() => ({
    platforms:    Array.from(new Set(rawData.map(r => r.platform))).filter(Boolean).sort(),
    categories:   Array.from(new Set(rawData.map(r => r.category))).filter(Boolean).sort(),
    subcategories:Array.from(new Set(rawData.map(r => r.subcategory))).filter(Boolean).sort(),
    brands:       Array.from(new Set(rawData.map(r => r.brand))).filter(Boolean).sort(),
    products:     Array.from(new Set(rawData.map(r => r.product))).filter(Boolean).sort(),
    cities:       Array.from(new Set(rawData.map(r => r.city))).filter(Boolean).sort(),
  }), [rawData]);

  const filteredData = useMemo(() => rawData.filter(r => {
    if (filters.platforms.length    && !filters.platforms.includes(r.platform))       return false;
    if (filters.categories.length   && !filters.categories.includes(r.category))      return false;
    if (filters.subcategories.length && !filters.subcategories.includes(r.subcategory)) return false;
    if (filters.brands.length       && !filters.brands.includes(r.brand))             return false;
    if (filters.products.length     && !filters.products.includes(r.product))         return false;
    if (filters.cities.length       && !filters.cities.includes(r.city))              return false;
    if (filters.dateFrom            && r.date < filters.dateFrom)                     return false;
    if (filters.dateTo              && r.date > filters.dateTo)                       return false;
    return true;
  }), [rawData, filters]);

  // Compute Current and Previous Periods for KPIs based on activeTab
  const { currentPeriodData, prevPeriodData, currentLabel, prevLabel } = useMemo(() => {
    if (filteredData.length === 0) return { currentPeriodData: [], prevPeriodData: [], currentLabel: '', prevLabel: '' };

    const sorted = [...filteredData].sort((a, b) => a.date.localeCompare(b.date));
    const maxDateStr = sorted[sorted.length - 1].date;
    const maxDate = new Date(maxDateStr);

    let currStart = new Date(maxDate);
    let currEnd = new Date(maxDate);
    let prevStart = new Date(maxDate);
    let prevEnd = new Date(maxDate);

    const shiftDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);
    const fmt = (d: Date) => d.toISOString().slice(0,10);

    if (activeTab === 'Daily') {
      currStart = maxDate;
      prevStart = shiftDays(maxDate, -1);
      prevEnd = shiftDays(maxDate, -1);
    } else if (activeTab === 'Weekly') {
      currStart = shiftDays(maxDate, -6); // 7 days inclusive
      prevStart = shiftDays(currStart, -7);
      prevEnd = shiftDays(maxDate, -7);
    } else if (activeTab === 'MTD') {
      currStart = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
      prevStart = new Date(maxDate.getFullYear(), maxDate.getMonth() - 1, 1);
      // MTD previous ends on the same day of the previous month (or end of that month if it overflows)
      prevEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() - 1, Math.min(maxDate.getDate(), new Date(maxDate.getFullYear(), maxDate.getMonth(), 0).getDate()));
    }

    const cStartStr = fmt(currStart);
    const cEndStr = fmt(currEnd);
    const pStartStr = fmt(prevStart);
    const pEndStr = fmt(prevEnd);

    const curr = filteredData.filter(r => r.date >= cStartStr && r.date <= cEndStr);
    const prev = filteredData.filter(r => r.date >= pStartStr && r.date <= pEndStr);

    const lbl = (s: Date, e: Date) => s.getTime() === e.getTime() ? `${s.getDate()} ${s.toLocaleString('default',{month:'short'})}` : `${s.getDate()} ${s.toLocaleString('default',{month:'short'})} - ${e.getDate()} ${e.toLocaleString('default',{month:'short'})}`;

    return { currentPeriodData: curr, prevPeriodData: prev, currentLabel: lbl(currStart, currEnd), prevLabel: lbl(prevStart, prevEnd) };
  }, [filteredData, activeTab]);

  const calcMetrics = (data: SalesRecord[]) => {
    const rev = data.reduce((s, r) => s + r.revenue, 0);
    const adS = data.reduce((s, r) => s + r.adSpend, 0);
    const adSales = data.reduce((s, r) => s + r.adSales, 0);
    return {
      revenue: rev,
      units: data.reduce((s, r) => s + r.units, 0),
      adSpend: adS,
      adSales: adSales,
      tacos: rev > 0 ? (adS / rev) * 100 : 0,
      roi: adS > 0 ? adSales / adS : 0,
      organicPct: rev > 0 ? ((rev - adSales) / rev) * 100 : 0,
    };
  };

  const currentMetrics = calcMetrics(currentPeriodData);
  const prevMetrics = calcMetrics(prevPeriodData);

  const growth = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
  const absGrowth = (curr: number, prev: number) => curr - prev;

  const kpis = {
    ...currentMetrics,
    growth: {
      revenue: growth(currentMetrics.revenue, prevMetrics.revenue),
      units: growth(currentMetrics.units, prevMetrics.units),
      adSpend: growth(currentMetrics.adSpend, prevMetrics.adSpend),
      adSales: growth(currentMetrics.adSales, prevMetrics.adSales),
      tacos: prevMetrics.adSpend > 0 ? absGrowth(currentMetrics.tacos, prevMetrics.tacos) : 0,
      roi: prevMetrics.adSpend > 0 ? growth(currentMetrics.roi, prevMetrics.roi) : 0,
      organicPct: absGrowth(currentMetrics.organicPct, prevMetrics.organicPct),
    },
    currentLabel,
    prevLabel,
  };

  return {
    rawData, filteredData, kpis, 
    filters, setFilters, filterOptions, 
    activeTab, setActiveTab,
    targetRevenue, setTargetRevenue,
    targetTacos, setTargetTacos,
    isLoading, isError, error,
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
