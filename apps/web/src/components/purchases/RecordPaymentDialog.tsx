import { useState } from 'react';
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
import { formatInrFromPaise, todayIso } from '@/lib/utils';
import type { DailyPurchase } from '@turnover/shared';

interface Props {
  purchase: DailyPurchase;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordPaymentDialog({ purchase, open, onOpenChange }: Props) {
  const shopId = useShopId();
  const qc = useQueryClient();
  const [amount, setAmount] = useState(String(purchase.pendingPaise / 100));
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [paymentMode, setPaymentMode] = useState('cash');
  const [note, setNote] = useState('');

  const mutation = useMutation({
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
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['purchases-summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
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
          body: JSON.stringify({ paymentDate, paymentMode }),
        },
      ),
    onSuccess: () => {
      toast.success('Marked as fully paid');
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['purchases-summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            {purchase.sourceName} · Total {formatInrFromPaise(purchase.amountPaise)} · Pending{' '}
            {formatInrFromPaise(purchase.pendingPaise)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Payment amount (₹)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              max={purchase.pendingPaise / 100}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
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
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Paid after 10 days" />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => markPaidMutation.mutate()}
            disabled={markPaidMutation.isPending || purchase.pendingPaise <= 0}
          >
            Pay full pending
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!amount || mutation.isPending}
          >
            Save payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
