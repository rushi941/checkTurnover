import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import type { DailyPurchase } from '@turnover/shared';

type PaymentMode = 'pay' | 'full' | 'manual' | 'unpaid';

interface Props {
  purchase: DailyPurchase;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MODES: { id: PaymentMode; label: string }[] = [
  { id: 'pay', label: 'Pay amount' },
  { id: 'full', label: 'Mark paid' },
  { id: 'manual', label: 'Set paid ₹' },
  { id: 'unpaid', label: 'Mark unpaid' },
];

export function RecordPaymentDialog({ purchase, open, onOpenChange }: Props) {
  const shopId = useShopId();
  const qc = useQueryClient();
  const [mode, setMode] = useState<PaymentMode>('pay');
  const [amount, setAmount] = useState(String(purchase.pendingPaise / 100));
  const [manualPaid, setManualPaid] = useState(String(purchase.paidAmountPaise / 100));
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [paymentMode, setPaymentMode] = useState('cash');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setMode(purchase.pendingPaise > 0 ? 'pay' : 'manual');
    setAmount(String(purchase.pendingPaise / 100));
    setManualPaid(String(purchase.paidAmountPaise / 100));
    setPaymentDate(todayIso());
    setPaymentMode('cash');
    setNote('');
  }, [open, purchase]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['purchases'] });
    qc.invalidateQueries({ queryKey: ['purchases-summary'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['vakro-list'] });
    qc.invalidateQueries({ queryKey: ['vakro-detail'] });
  };

  const payMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ data: DailyPurchase }>(
        shopPath(shopId, `/purchases/${purchase.id}/payments`),
        {
          method: 'POST',
          body: JSON.stringify({
            amount: parseFloat(amount),
            paymentDate,
            paymentMode,
            note: note || undefined,
          }),
        },
      ),
    onSuccess: () => {
      toast.success('Payment recorded');
      invalidate();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markPaidMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ data: DailyPurchase }>(
        shopPath(shopId, `/purchases/${purchase.id}/mark-paid`),
        {
          method: 'POST',
          body: JSON.stringify({ paymentDate, paymentMode, note: note || undefined }),
        },
      ),
    onSuccess: () => {
      toast.success('Bill marked as fully paid');
      invalidate();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markUnpaidMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ data: DailyPurchase }>(
        shopPath(shopId, `/purchases/${purchase.id}/mark-unpaid`),
        { method: 'POST' },
      ),
    onSuccess: () => {
      toast.success('Bill marked as unpaid');
      invalidate();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setPaidMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ data: DailyPurchase }>(
        shopPath(shopId, `/purchases/${purchase.id}/paid-amount`),
        {
          method: 'PUT',
          body: JSON.stringify({
            paidAmount: parseFloat(manualPaid),
            paymentDate,
            paymentMode,
            note: note || undefined,
          }),
        },
      ),
    onSuccess: () => {
      toast.success('Paid amount updated');
      invalidate();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isPending =
    payMutation.isPending ||
    markPaidMutation.isPending ||
    markUnpaidMutation.isPending ||
    setPaidMutation.isPending;

  const handleSave = () => {
    if (mode === 'pay') payMutation.mutate();
    else if (mode === 'full') markPaidMutation.mutate();
    else if (mode === 'manual') setPaidMutation.mutate();
    else markUnpaidMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bill payment</DialogTitle>
          <DialogDescription>
            {purchase.sourceName} · {purchase.date} · Total{' '}
            {formatInrFromPaise(purchase.amountPaise)} · Paid{' '}
            {formatInrFromPaise(purchase.paidAmountPaise)} · Pending{' '}
            {formatInrFromPaise(purchase.pendingPaise)}
          </DialogDescription>
        </DialogHeader>

        <div
          role="group"
          aria-label="Payment mode"
          className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:grid-cols-4"
        >
          {MODES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={cn(
                'rounded-md px-2 py-1.5 text-xs font-medium transition-all sm:text-sm',
                mode === id
                  ? 'bg-background text-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 py-2">
          {mode === 'pay' && (
            <div className="grid gap-2">
              <Label>Pay now (₹) — partial or full pending</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                max={purchase.pendingPaise / 100}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          )}

          {mode === 'manual' && (
            <div className="grid gap-2">
              <Label>Total paid so far (₹) — 0 to {purchase.amountPaise / 100}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                max={purchase.amountPaise / 100}
                value={manualPaid}
                onChange={(e) => setManualPaid(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Set exact paid amount. Use 0 for unpaid, full bill amount for paid.
              </p>
            </div>
          )}

          {mode === 'unpaid' && (
            <p className="text-sm text-muted-foreground">
              This will clear all payments and mark the bill as <strong>not paid</strong>.
            </p>
          )}

          {mode === 'full' && purchase.pendingPaise <= 0 ? (
            <p className="text-sm text-muted-foreground">This bill is already fully paid.</p>
          ) : null}

          {mode !== 'unpaid' && (
            <>
              <div className="grid gap-2">
                <Label>Payment date</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
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
                  placeholder="Paid old bill after 10 days"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isPending ||
              (mode === 'pay' && (!amount || parseFloat(amount) <= 0)) ||
              (mode === 'manual' && manualPaid === '') ||
              (mode === 'full' && purchase.pendingPaise <= 0)
            }
            variant={mode === 'unpaid' ? 'destructive' : 'default'}
          >
            {mode === 'unpaid' ? 'Mark unpaid' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
