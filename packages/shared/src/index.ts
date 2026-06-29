import type { ShopKharcho } from './kharcho.js';

export {
  APP_TIMEZONE,
  APP_TIMEZONE_LABEL,
  addDaysIso,
  currentMonth,
  formatDateInKolkata,
  formatDateTimeInKolkata,
  formatTimeInKolkata,
  isDateNotFuture,
  isValidIsoDate,
  isoDateInTimeZone,
  kolkataWeekday,
  monthEnd,
  monthLabel,
  monthStart,
  monthStartEnd,
  shiftMonth,
  startOfWeekIso,
  todayIso,
  toBusinessDateIso,
} from './dates.js';

export {
  KHARCHO_CATEGORIES,
  kharchoCategoryLabel,
  type KharchoCategory,
  type ShopKharcho,
  type KharchoSummary,
  type CreateKharchoInput,
  type UpdateKharchoInput,
} from './kharcho.js';

export {
  DEFAULT_PROFIT_MARGIN_PERCENT,
  netProfitPaise,
  profitFromVakroAfterKharcho,
  profitFromVakroPaise,
} from './profit.js';

export type UserRole = 'admin' | 'shop' | 'wholesaler';
export type PaymentStatus = 'pending' | 'partial' | 'paid';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  shopId: string | null;
  wholesalerId: string | null;
  status: 'active' | 'inactive';
}

export interface Shop {
  id: string;
  name: string;
  address: string | null;
  gstin: string | null;
  invoicePrefix: string;
  ownerName?: string | null;
  phone?: string | null;
  city?: string | null;
}

export interface GstInvoiceLine {
  description: string;
  customerName: string;
  amountPaise: number;
}

export interface GstInvoice {
  id: string;
  shopId: string;
  invoiceNo: string;
  date: string;
  lines: GstInvoiceLine[];
  taxableTotalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  grandTotalPaise: number;
  createdAt: string;
}

export interface AdminShop {
  id: string;
  name: string;
  address: string | null;
  gstin: string | null;
  invoicePrefix: string;
  ownerName: string | null;
  phone: string | null;
  city: string | null;
  ownerEmail: string | null;
  ownerUserId: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
  shop: Shop | null;
}

export interface DailyPurchase {
  id: string;
  shopId: string;
  date: string;
  sourceName: string;
  amountPaise: number;
  paidAmountPaise: number;
  pendingPaise: number;
  paymentStatus: PaymentStatus;
  note: string | null;
  createdAt: string;
}

export interface PurchasePayment {
  id: string;
  purchaseId: string;
  amountPaise: number;
  paymentDate: string;
  paymentMode: string;
  note: string | null;
  createdAt: string;
}

export interface DailyVakro {
  id: string;
  shopId: string;
  date: string;
  amountPaise: number;
  note: string | null;
  createdAt: string;
}

export interface DashboardData {
  date: string;
  totalPurchasesPaise: number;
  totalPaidPaise: number;
  totalPendingPaise: number;
  totalKharchoPaise: number;
  vakroPaise: number | null;
  profitPaise: number | null;
  netProfitPaise: number | null;
  profitMarginPercent: number;
  purchaseRows: DailyPurchase[];
  kharchoRows: ShopKharcho[];
  vakroEntered: boolean;
}

export interface PurchaseSourceSummary {
  sourceName: string;
  totalPaise: number;
  paidPaise: number;
  pendingPaise: number;
  entryCount: number;
  lastPurchaseDate: string;
}

export interface StorePaymentResult {
  sourceName: string;
  paidPaise: number;
  billsUpdated: number;
  remainingPendingPaise: number;
}

export interface PurchasesSummary {
  totalPaise: number;
  totalPaidPaise: number;
  totalPendingPaise: number;
  entryCount: number;
  sourceCount: number;
  byStore: PurchaseSourceSummary[];
}

export interface MonthlyReportDay {
  date: string;
  purchasesPaise: number;
  kharchoPaise: number;
  vakroPaise: number | null;
  profitPaise: number | null;
}

export interface MonthlyReport {
  month: string;
  totalPurchasesPaise: number;
  totalKharchoPaise: number;
  totalVakroPaise: number;
  totalProfitPaise: number;
  profitMarginPercent: number;
  days: MonthlyReportDay[];
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  code?: string;
}

export interface CreatePurchaseInput {
  sourceName: string;
  amount: number;
  date?: string;
  note?: string;
  paidAmount?: number;
}

export interface RecordPaymentInput {
  amount: number;
  paymentDate?: string;
  paymentMode?: string;
  note?: string;
}

export interface UpsertVakroInput {
  amount: number;
  date?: string;
  note?: string;
}

/** One row from Excel import: date, store, purchase ₹, vakro ₹ */
export interface DataImportRow {
  rowNumber: number;
  date: string;
  storeName?: string;
  purchaseAmount?: number;
  vakroAmount?: number;
}

export interface DataImportRowError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface DataExportRow {
  date: string;
  storeName: string | null;
  purchaseRupees: number | null;
  vakroRupees: number | null;
}

export interface DataImportPreview {
  valid: boolean;
  errors: DataImportRowError[];
  summary: {
    purchaseRows: number;
    vakroDays: number;
    dateCount: number;
  };
}

export interface DataImportResult {
  purchasesCreated: number;
  vakroDaysUpserted: number;
}

export type TargetSuggestionBasis =
  | 'last_year_achieved'
  | 'last_year_target'
  | 'recent_average'
  | 'market_default';

export interface TargetSuggestion {
  month: string;
  monthLabel: string;
  lastYearMonth: string;
  lastYearMonthLabel: string;
  lastYear: {
    targetPaise: number | null;
    achievedPaise: number;
  } | null;
  recentThreeMonthAvgPaise: number | null;
  festivals: {
    date: string;
    nameHi: string;
    nameGu: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  suggestedTargetPaise: number;
  suggestedTargetRupees: number;
  basePaise: number;
  upliftPercent: number;
  basedOn: TargetSuggestionBasis;
  reasoning: string[];
}

export interface CreateShopInput {
  name: string;
  email: string;
  password: string;
  address?: string;
  gstin?: string;
}

export type TurnoverPeriod = 'week' | 'month' | 'all';

export interface FestivalInfo {
  date: string;
  nameHi: string;
  nameGu: string;
  category: string;
}

export type ChoghadiyaQuality = 'shubh' | 'ashubh' | 'neutral';

export interface ChoghadiyaSlot {
  name: string;
  nameGu: string;
  quality: ChoghadiyaQuality;
  qualityLabel: string;
  start: string;
  end: string;
}

export interface TithiInfo {
  name: string;
  paksha: 'Shukla' | 'Krishna';
  nameHi: string;
  nameGu: string;
  pakshaHi: string;
  pakshaGu: string;
}

export interface CalendarDay {
  date: string;
  kamaiPaise: number | null;
  purchasesPaise: number;
  profitPaise: number | null;
  festival: Omit<FestivalInfo, 'date'> | null;
  tithi: TithiInfo | null;
  tithis: TithiInfo[];
  nakshatra: string | null;
  varaHi: string | null;
  varaEn: string | null;
  sunrise: string | null;
  sunset: string | null;
  choghadiya: { day: ChoghadiyaSlot[]; night: ChoghadiyaSlot[] } | null;
}

export interface CalendarMonth {
  month: string;
  days: CalendarDay[];
  festivals: FestivalInfo[];
}

export interface TargetProgress {
  month: string;
  targetPaise: number | null;
  achievedPaise: number;
  pendingPaise: number | null;
  percentCovered: number | null;
  daysRemaining: number;
  dailyNeededPaise: number | null;
}

export interface AiTurnoverAnalysis {
  period: TurnoverPeriod;
  label: string;
  from: string | null;
  to: string;
  summary: {
    totalVakroPaise: number;
    totalPurchasesPaise: number;
    profitPaise: number;
    marginPercent: number;
    avgDailyKamaiPaise: number;
    vakroDays: number;
  };
  target: TargetProgress;
  upcomingFestivals: { date: string; nameHi: string; nameGu: string }[];
  suggestions: string[];
  poweredBy: string;
}
