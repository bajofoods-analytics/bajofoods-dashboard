export const API_URL = 'https://sheetdb.io/api/v1/1uyo0jm2f3j4s';

export interface RawRow {
  [key: string]: string | number;
}

export interface SalesRecord {
  date: string;
  platform: string;
  category: string;
  city: string;
  brand: string;
  product: string;
  units: number;
  revenue: number;
  adSpend: number;
  adSales: number;
  tacos: number;
  adROI: number;
}

const num = (v: any) => parseFloat(String(v).replace(/[₹,%\s]/g,'')) || 0;

export function normalizeRow(r: RawRow): SalesRecord {
  const g = (k: string) => String(r[k] ?? r[k.toLowerCase()] ?? r[k.toUpperCase()] ?? '');
  
  const rev = num(g('Revenue') || g('revenue') || g('Sales'));
  const spend = num(g('Ad Spend') || g('AdSpend') || g('ad_spend') || 0);
  
  return {
    date:     g('Date') || g('date') || new Date().toISOString().slice(0, 10),
    platform: g('Platform') || g('platform') || 'Unknown',
    category: g('Category') || g('category') || 'Unknown',
    city:     g('City') || g('city') || 'Unknown',
    brand:    g('Brand') || g('brand') || 'Unknown',
    product:  g('Product') || g('product') || 'Unknown',
    units:    num(g('Units') || g('units') || g('Units Sold')),
    revenue:  rev,
    adSpend:  spend,
    adSales:  num(g('Ad Sales') || g('AdSales') || g('ad_sales') || 0),
    tacos:    num(g('TACOS') || g('tacos')) || (rev > 0 ? (spend / rev) * 100 : 0),
    adROI:    num(g('Ad ROI') || g('ROI') || g('roi')) || (spend > 0 ? num(g('Ad Sales')) / spend : 0),
  };
}

export const formatMoney = (v: number) => {
  if (v >= 100000) return '₹' + (v / 100000).toFixed(2) + 'L';
  if (v >= 1000) return '₹' + (v / 1000).toFixed(2) + 'K';
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};
export const formatNum = (v: number) => {
  if (v >= 100000) return (v / 100000).toFixed(2) + 'L';
  if (v >= 1000) return (v / 1000).toFixed(2) + 'K';
  return v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
export const formatPct = (v: number) => v.toFixed(1) + '%';

export function groupBy(data: SalesRecord[], key: keyof SalesRecord, valueKey: keyof SalesRecord = 'revenue') {
  const map: Record<string, number> = {};
  data.forEach(r => {
    const k = String(r[key]) || 'Unknown';
    map[k] = (map[k] || 0) + (r[valueKey] as number);
  });
  return map;
}

export function groupByDate(data: SalesRecord[], valueKeys: (keyof SalesRecord)[]) {
  const map: Record<string, any> = {};
  data.forEach(r => {
    if(!map[r.date]) {
      map[r.date] = { date: r.date };
      valueKeys.forEach(vk => map[r.date][vk] = 0);
    }
    valueKeys.forEach(vk => {
      map[r.date][vk] += (r[vk] as number);
    });
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}
