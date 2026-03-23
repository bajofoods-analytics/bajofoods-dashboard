// Google Sheets published CSV export (new sheet)
const SHEET_ID = '2PACX-1vQ0ey_-9cl1Gyc8VZM5-fEbvmQmFzGFqD9PJPD8XchMe6FVrg_hZMoDTnvPGtGsTpbz4Ku_C1hm22MO';
const SALES_GID  = '0';
const SPENDS_GID = '429145227';

export const SALES_CSV_URL  = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=${SALES_GID}&single=true&output=csv`;
export const SPENDS_CSV_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=${SPENDS_GID}&single=true&output=csv`;

/** Parse raw CSV text into an array of row objects keyed by header names */
export function parseCSV(csvText: string): RawRow[] {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  const splitLine = (line: string): string[] => {
    const cols: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; }
      else { cur += ch; }
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
  subcategory: string;
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
  // Case-insensitive key lookup
  const keys = Object.keys(r);
  const find = (...candidates: string[]) => {
    for (const c of candidates) {
      const found = keys.find(k => k.trim().toLowerCase() === c.toLowerCase());
      if (found && String(r[found]).trim()) return String(r[found]).trim();
    }
    return '';
  };

  const rev   = num(find('Revenue', 'revenue', 'Sales', 'Ordered Product Sales'));
  const spend = num(find('Ad Spend', 'AdSpend', 'ad_spend', 'Spends', 'Total Spends'));

  return {
    date:        find('Date', 'date', 'Order Date', 'Week') || new Date().toISOString().slice(0,10),
    platform:    find('Platform', 'platform', 'Channel') || 'Unknown',
    category:    find('Category', 'category', 'Product Category') || 'Unknown',
    subcategory: find('Sub Category', 'Subcategory', 'subcategory', 'Sub-Category', 'SubCategory') || 'Unknown',
    city:        find('City', 'city', 'Region', 'Location') || 'Unknown',
    brand:       find('Brand', 'brand', 'Brand Name') || 'Unknown',
    product:     find('Product', 'product', 'Product Name', 'ASIN', 'SKU', 'Item') || 'Unknown',
    units:       num(find('Units', 'units', 'Units Sold', 'Qty', 'Quantity')),
    revenue:     rev,
    adSpend:     spend,
    adSales:     num(find('Ad Sales', 'AdSales', 'ad_sales', 'Attributed Sales')),
    tacos:       num(find('TACOS', 'tacos', 'TACoS')) || (rev > 0 ? (spend / rev) * 100 : 0),
    adROI:       num(find('Ad ROI', 'ROI', 'roi', 'ROAS')) || (spend > 0 ? num(find('Ad Sales', 'AdSales')) / spend : 0),
  };
}

/**
 * Format money values:
 * >= 1 Crore (1,00,00,000) → X.XXCr
 * >= 1 Lakh (1,00,000)      → X.XXL
 * >= 1 Thousand (1,000)     → X.XXK
 * else                      → ₹X
 */
export const formatMoney = (v: number): string => {
  if (v >= 1_00_00_000) return '₹' + (v / 1_00_00_000).toFixed(2) + 'Cr';
  if (v >= 1_00_000)    return '₹' + (v / 1_00_000).toFixed(2) + 'L';
  if (v >= 1_000)       return '₹' + (v / 1_000).toFixed(2) + 'K';
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

export const formatNum = (v: number): string => {
  if (v >= 1_00_00_000) return (v / 1_00_00_000).toFixed(2) + 'Cr';
  if (v >= 1_00_000)    return (v / 1_00_000).toFixed(2) + 'L';
  if (v >= 1_000)       return (v / 1_000).toFixed(2) + 'K';
  return v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

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
    if (!map[r.date]) {
      map[r.date] = { date: r.date };
      valueKeys.forEach(vk => map[r.date][vk] = 0);
    }
    valueKeys.forEach(vk => { map[r.date][vk] += (r[vk] as number); });
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}
