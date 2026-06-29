import type { DailyPurchase, DailyVakro, PaymentStatus, PurchasePayment, ShopKharcho } from '@turnover/shared';
import { kharchoCategoryLabel, type KharchoCategory } from '@turnover/shared';
import { toBusinessDateIso } from '@turnover/shared';

interface PurchaseRow {
  id: string;
  shop_id: string;
  date: string | Date;
  source_name: string;
  amount_paise: string;
  paid_amount_paise?: string;
  note: string | null;
  created_at: Date;
}

interface VakroRow {
  id: string;
  shop_id: string;
  date: string | Date;
  amount_paise: string;
  note: string | null;
  created_at: Date;
}

interface PaymentRow {
  id: string;
  purchase_id: string;
  amount_paise: string;
  payment_date: string | Date;
  payment_mode: string;
  note: string | null;
  created_at: Date;
}

function toDateIso(value: string | Date): string {
  return toBusinessDateIso(value);
}

export function paymentStatus(paidPaise: number, amountPaise: number): PaymentStatus {
  if (paidPaise <= 0) return 'pending';
  if (paidPaise >= amountPaise) return 'paid';
  return 'partial';
}

export function mapPurchase(row: PurchaseRow): DailyPurchase {
  const amountPaise = Number(row.amount_paise);
  const paidAmountPaise = Number(row.paid_amount_paise ?? 0);
  return {
    id: row.id,
    shopId: row.shop_id,
    date: toDateIso(row.date),
    sourceName: row.source_name,
    amountPaise,
    paidAmountPaise,
    pendingPaise: amountPaise - paidAmountPaise,
    paymentStatus: paymentStatus(paidAmountPaise, amountPaise),
    note: row.note,
    createdAt: row.created_at.toISOString(),
  };
}

export function mapVakro(row: VakroRow): DailyVakro {
  return {
    id: row.id,
    shopId: row.shop_id,
    date: toDateIso(row.date),
    amountPaise: Number(row.amount_paise),
    note: row.note,
    createdAt: row.created_at.toISOString(),
  };
}

export function mapPayment(row: PaymentRow): PurchasePayment {
  return {
    id: row.id,
    purchaseId: row.purchase_id,
    amountPaise: Number(row.amount_paise),
    paymentDate: toDateIso(row.payment_date),
    paymentMode: row.payment_mode,
    note: row.note,
    createdAt: row.created_at.toISOString(),
  };
}

interface KharchoRow {
  id: string;
  shop_id: string;
  date: string | Date;
  category: string;
  amount_paise: string;
  note: string | null;
  created_at: Date;
}

export function mapKharcho(row: KharchoRow): ShopKharcho {
  const category = row.category as KharchoCategory;
  return {
    id: row.id,
    shopId: row.shop_id,
    date: toDateIso(row.date),
    category,
    categoryLabel: kharchoCategoryLabel(category),
    amountPaise: Number(row.amount_paise),
    note: row.note,
    createdAt: row.created_at.toISOString(),
  };
}
