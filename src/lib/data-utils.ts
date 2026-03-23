// Google Sheets published CSV export URL (Master_Qcom_Sales_data tab)
const SHEET_ID = '2PACX-1vTfh4HeBsX_YgPhB-uSiw_H70nyfC4YZrK2kwvO76Vacg7RejixntnYKRkKPsIEq8ff02zq16lXD7XD';
const SALES_GID  = '637248182';
const SPENDS_GID = '429145227';

export const SALES_CSV_URL  = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=${SALES_GID}&single=true&output=csv`;
export const SPENDS_CSV_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=${SPENDS_GID}&single=true&output=csv`;

/** Parse raw CSV text into an array of row objects keyed by header names */
export function parseCSV(csvText: string): RawRow[] {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  // Basic CSV splitter that handles quoted commas
  const splitLine = (line: string): string[] => {
    const cols: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        cols.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    return cols;
  };

  const headers = splitLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = splitLine(line);
    const row: RawRow = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

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
