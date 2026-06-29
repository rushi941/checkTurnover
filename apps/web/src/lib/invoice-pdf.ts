import { formatInrFromPaise } from '@/lib/utils';
import type { GstInvoice } from '@turnover/shared';

interface ShopProfile {
  name: string;
  address: string | null;
  gstin: string | null;
  ownerName: string | null;
  phone: string | null;
  city: string | null;
}

export function downloadInvoicePdf(invoice: GstInvoice, shop: ShopProfile) {
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) return;

  const line = invoice.lines[0];
  const gstTotal = invoice.cgstPaise + invoice.sgstPaise + invoice.igstPaise;
  const gstLabel =
    gstTotal > 0
      ? `CGST: ${formatInrFromPaise(invoice.cgstPaise)} · SGST: ${formatInrFromPaise(invoice.sgstPaise)}`
      : 'GST: Not applicable';

  w.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${invoice.invoiceNo}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 32px; color: #111; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 1.25rem; margin: 0 0 4px; }
    .muted { color: #666; font-size: 0.875rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f5f5f5; }
    .total { font-size: 1.125rem; font-weight: 700; margin-top: 16px; text-align: right; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>${shop.name}</h1>
  <p class="muted">${[shop.address, shop.city].filter(Boolean).join(' · ') || ''}</p>
  ${shop.gstin ? `<p class="muted">GSTIN: ${shop.gstin}</p>` : ''}
  ${shop.phone ? `<p class="muted">Phone: ${shop.phone}</p>` : ''}
  <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
  <p><strong>Tax Invoice</strong> · ${invoice.invoiceNo}</p>
  <p class="muted">Date: ${invoice.date}</p>
  <p><strong>Bill to:</strong> ${line?.customerName ?? 'Customer'}</p>
  <table>
    <thead><tr><th>Description</th><th>Amount</th></tr></thead>
    <tbody>
      <tr>
        <td>${line?.description ?? 'Goods / services'}</td>
        <td>${formatInrFromPaise(invoice.grandTotalPaise)}</td>
      </tr>
    </tbody>
  </table>
  <p class="muted">${gstLabel}</p>
  <p class="total">Grand Total: ${formatInrFromPaise(invoice.grandTotalPaise)}</p>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`);
  w.document.close();
}
