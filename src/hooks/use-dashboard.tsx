import { useState, createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SALES_CSV_URL, SPENDS_CSV_URL, SalesRecord, normalizeRow, parseCSV } from '@/lib/data-utils';

interface Filters {
  platform: string;
  category: string;
  city: string;
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTERS: Filters = {
  platform: '',
  category: '',
  city: '',
  dateFrom: '',
  dateTo: '',
};

export function useDashboardData() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // Fetch from Google Sheets using React Query
  const { data: rawData = [], isLoading, isError, error } = useQuery({
    queryKey: ['sheetData'],
    queryFn: async () => {
      const [salesRes, spendsRes] = await Promise.all([
        fetch(SALES_CSV_URL),
        fetch(SPENDS_CSV_URL),
      ]);
      if (!salesRes.ok) throw new Error('Failed to fetch sales data from Google Sheets');

      const salesCsv = await salesRes.text();
      const salesRows = parseCSV(salesCsv);

      // Merge spends data if available
      let allRows = salesRows;
      if (spendsRes.ok) {
        const spendsCsv = await spendsRes.text();
        const spendsRows = parseCSV(spendsCsv);
        // Append spends rows (normalizeRow handles missing fields gracefully)
        allRows = [...salesRows, ...spendsRows];
      }

      return allRows.map(normalizeRow) as SalesRecord[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
  });

  // Extract unique options for dropdowns
  const categories = Array.from(new Set(rawData.map((r) => r.category))).sort();
  const cities = Array.from(new Set(rawData.map((r) => r.city))).sort();
  const platforms = Array.from(new Set(rawData.map((r) => r.platform))).sort();

  // Apply Filters
  const filteredData = rawData.filter((r) => {
    if (filters.platform && r.platform !== filters.platform) return false;
    if (filters.category && r.category !== filters.category) return false;
    if (filters.city && r.city !== filters.city) return false;
    if (filters.dateFrom && r.date < filters.dateFrom) return false;
    if (filters.dateTo && r.date > filters.dateTo) return false;
    return true;
  });

  // Calculate KPIs
  const totalRevenue = filteredData.reduce((s, r) => s + r.revenue, 0);
  const totalUnits = filteredData.reduce((s, r) => s + r.units, 0);
  const totalAdSpend = filteredData.reduce((s, r) => s + r.adSpend, 0);
  const totalAdSales = filteredData.reduce((s, r) => s + r.adSales, 0);
  const avgTacos = totalRevenue > 0 ? (totalAdSpend / totalRevenue) * 100 : 0;
  const avgROI = totalAdSpend > 0 ? totalAdSales / totalAdSpend : 0;

  const kpis = { totalRevenue, totalUnits, totalAdSpend, totalAdSales, avgTacos, avgROI };

  return {
    rawData,
    filteredData,
    kpis,
    filters,
    setFilters,
    filterOptions: { categories, cities, platforms },
    isLoading,
    isError,
    error,
  };
}

// React Context for easy access deep in the component tree
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
