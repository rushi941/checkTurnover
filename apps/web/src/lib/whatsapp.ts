import { formatInrFromPaise } from '@/lib/utils';
import type { DashboardData } from '@turnover/shared';

export function buildDailySummaryMessage(shopName: string, date: string, data: DashboardData): string {
  const lines = [
    `*TurnOverCheck — ${shopName}*`,
    `Date: ${date}`,
    '',
    `Purchases: ${formatInrFromPaise(data.totalPurchasesPaise)}`,
    `Paid: ${formatInrFromPaise(data.totalPaidPaise)}`,
    `Pending: ${formatInrFromPaise(data.totalPendingPaise)}`,
    `Kharcho: ${formatInrFromPaise(data.totalKharchoPaise)}`,
    data.vakroPaise != null
      ? `Vakro: ${formatInrFromPaise(data.vakroPaise)}`
      : 'Vakro: Not entered',
    data.netProfitPaise != null
      ? `Net profit: ${formatInrFromPaise(data.netProfitPaise)}`
      : '',
  ].filter(Boolean);
  return lines.join('\n');
}

export function openWhatsAppShare(text: string, phone?: string) {
  const url = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
