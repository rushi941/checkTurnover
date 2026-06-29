import * as XLSX from 'xlsx';
import type { DataExportRow, DataImportRow } from '@turnover/shared';
import { isValidIsoDate } from '@/lib/utils';

const DATE_HEADERS = ['date', 'dt', 'tarikh'];
const STORE_HEADERS = ['store name', 'store', 'source', 'shop', 'storename', 'supplier'];
const PURCHASE_HEADERS = ['purchase', 'purchase (₹)', 'purchase amount', 'amount', 'purchase ₹'];
const VAKRO_HEADERS = ['vakro', 'vakro (₹)', 'vakro amount', 'kamai', 'sales', 'vakro ₹'];

function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseExcelDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
  }
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const iso = `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    return isValidIsoDate(iso) ? iso : null;
  }
  const dt = new Date(s);
  if (!Number.isNaN(dt.getTime())) {
    const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    return isValidIsoDate(iso) ? iso : null;
  }
  return null;
}

function parseAmount(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/[,₹]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function findColumn(headers: string[], candidates: string[]): number {
  return headers.findIndex((h) => candidates.includes(normHeader(h)));
}

export function parseImportExcel(file: ArrayBuffer): DataImportRow[] {
  const wb = XLSX.read(file, { type: 'array', cellDates: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];

  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][];
  if (raw.length < 2) return [];

  const headerRow = (raw[0] as unknown[]).map((c) => String(c ?? ''));
  const dateCol = findColumn(headerRow, DATE_HEADERS);
  const storeCol = findColumn(headerRow, STORE_HEADERS);
  const purchaseCol = findColumn(headerRow, PURCHASE_HEADERS);
  const vakroCol = findColumn(headerRow, VAKRO_HEADERS);

  if (dateCol === -1) {
    throw new Error('Missing "Date" column. Expected headers: Date, Store Name, Purchase (₹), Vakro (₹)');
  }

  const rows: DataImportRow[] = [];
  for (let i = 1; i < raw.length; i += 1) {
    const line = raw[i] as unknown[];
    if (!line || line.every((c) => c === '' || c === null || c === undefined)) continue;

    const date = parseExcelDate(line[dateCol]);
    const storeName = storeCol >= 0 ? String(line[storeCol] ?? '').trim() : '';
    const purchaseAmount = purchaseCol >= 0 ? parseAmount(line[purchaseCol]) : undefined;
    const vakroAmount = vakroCol >= 0 ? parseAmount(line[vakroCol]) : undefined;

    rows.push({
      rowNumber: i + 1,
      date: date ?? '',
      storeName: storeName || undefined,
      purchaseAmount,
      vakroAmount,
    });
  }

  return rows;
}

export function buildExportWorkbook(rows: DataExportRow[]): ArrayBuffer {
  const data = [
    ['Date', 'Store Name', 'Purchase (₹)', 'Vakro (₹)'],
    ...rows.map((r) => [
      r.date,
      r.storeName ?? '',
      r.purchaseRupees ?? '',
      r.vakroRupees ?? '',
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 14 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'TurnOverCheck');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

export function downloadExcel(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
