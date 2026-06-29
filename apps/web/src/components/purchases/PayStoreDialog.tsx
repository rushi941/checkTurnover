import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiFetch, shopPath } from '@/lib/api';
import { useShopId } from '@/contexts/AuthContext';
import { cn, formatInrFromPaise, todayIso } from '@/lib/utils';
import type { PurchaseSourceSummary, StorePaymentResult } from '@turnover/shared';

interface Props {
  store: PurchaseSourceSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayStoreDialog({ store, open, onOpenChange }: Props) {
  const shopId = useShopId();
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [paymentMode, setPaymentMode] = useState('cash');
  const [note, setNote] = useState('');

  const { data: pendingAllTime } = useQuery({
    queryKey: ['store-pending', shopId, store.sourceName],
    queryFn: () =>
      apiFetch<{ data: { pendingPaise: number } }>(
        shopPath(shopId, `/purchases/store-pending?source=${encodeURIComponent(store.sourceName)}`),
      ).then((r) => r.data.pendingPaise),
    enabled: open,
  });

  const totalPendingPaise = pendingAllTime ?? store.pendingPaise;
  const maxRupees = totalPendingPaise / 100;

  useEffect(() => {
    if (!open) return;
    setAmount(String(maxRupees));
    setPaymentDate(todayIso());
    setPaymentMode('cash');
    setNote('');
  }, [open, store.sourceName, maxRupees]);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<{ data: StorePaymentResult }>(shopPath(shopId, '/purchases/pay-store'), {
        method: 'POST',
        body: JSON.stringify({
          sourceName: store.sourceName,
          amount: parseFloat(amount),
          paymentDate,
          paymentMode,
          note: note || undefined,
        }),
      }),
    onSuccess: (res) => {
      const { paidPaise, billsUpdated, remainingPendingPaise } = res.data;
      toast.success(
        `Paid ${formatInrFromPaise(paidPaise)} to ${store.sourceName} (${billsUpdated} bill${billsUpdated === 1 ? '' : 's'})`,
      );
      if (remainingPendingPaise > 0) {
        toast.info(`Still pending: ${formatInrFromPaise(remainingPendingPaise)}`);
      }
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['purchases-summary'] });
      qc.invalidateQueries({ queryKey: ['store-pending'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setQuickAmount = (fraction: number) => {
    const value = Math.round(maxRupees * fraction * 100) / 100;
    setAmount(String(value > 0 ? value : ''));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay store — {store.sourceName}</DialogTitle>
          <DialogDescription>
            Pay any amount against pending bills. Oldest bills are cleared first.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
          <p className="text-sm text-muted-foreground">Total pending (all bills)</p>
          <p className="text-2xl font-bold text-amber-800">{formatInrFromPaise(totalPendingPaise)}</p>
          {store.pendingPaise !== totalPendingPaise && (
            <p className="mt-1 text-xs text-muted-foreground">
              In current filter: {formatInrFromPaise(store.pendingPaise)}
            </p>
          )}
        </div>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Pay now (₹)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              max={maxRupees}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
            <div className="flex flex-wrap gap-2">
              {[
                { label: '25%', f: 0.25 },
                { label: '50%', f: 0.5 },
                { label: 'Full pending', f: 1 },
              ].map(({ label, f }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setQuickAmount(f)}
                  className={cn(
                    'rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Payment date</Label>
            <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Mode</Label>
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Note (optional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Partial payment to wholesaler"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={
              !amount ||
              parseFloat(amount) <= 0 ||
              parseFloat(amount) > maxRupees ||
              mutation.isPending ||
              totalPendingPaise <= 0
            }
          >
            Pay {amount ? `₹${amount}` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
