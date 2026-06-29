import { useQuery } from '@tanstack/react-query';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateInvoiceDialog } from '@/components/invoices/CreateInvoiceDialog';
import { PageLoader } from '@/components/ui/loader';
import { apiFetch, shopPath } from '@/lib/api';
import { useShopId } from '@/contexts/AuthContext';
import { downloadInvoicePdf } from '@/lib/invoice-pdf';
import { formatInrFromPaise } from '@/lib/utils';
import type { GstInvoice } from '@turnover/shared';

export function InvoicesPage() {
  const shopId = useShopId();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', shopId],
    queryFn: () =>
      apiFetch<{ data: GstInvoice[] }>(shopPath(shopId, '/invoices')).then((r) => r.data),
  });

  const { data: shopProfile } = useQuery({
    queryKey: ['invoice-shop-profile', shopId],
    queryFn: () =>
      apiFetch<{
        data: {
          name: string;
          address: string | null;
          gstin: string | null;
          ownerName: string | null;
          phone: string | null;
          city: string | null;
        };
      }>(shopPath(shopId, '/invoices/shop-profile')).then((r) => r.data),
  });

  function handleDownload(invoice: GstInvoice) {
    if (!shopProfile) {
      toast.error('Shop profile not loaded');
      return;
    }
    downloadInvoicePdf(invoice, shopProfile);
    toast.success('Opening print / PDF…');
  }

  if (isLoading) return <PageLoader label="Loading invoices…" />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">GST Invoices</h1>
          <p className="text-sm text-muted-foreground">Create tax invoices with auto invoice numbers</p>
        </div>
        <CreateInvoiceDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {(invoices ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <>
              <div className="space-y-2 md:hidden">
                {(invoices ?? []).map((inv) => (
                  <div key={inv.id} className="rounded-lg border p-3">
                    <p className="font-semibold">{inv.invoiceNo}</p>
                    <p className="text-xs text-muted-foreground">{inv.date}</p>
                    <p className="mt-1 font-medium">{formatInrFromPaise(inv.grandTotalPaise)}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => handleDownload(inv)}
                    >
                      <FileDown className="h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(invoices ?? []).map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoiceNo}</TableCell>
                        <TableCell>{inv.date}</TableCell>
                        <TableCell>{inv.lines[0]?.customerName ?? '—'}</TableCell>
                        <TableCell>{formatInrFromPaise(inv.grandTotalPaise)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => handleDownload(inv)}>
                            <FileDown className="h-4 w-4" />
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
