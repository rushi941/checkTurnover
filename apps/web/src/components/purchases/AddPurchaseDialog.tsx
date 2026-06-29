import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch, shopPath } from '@/lib/api';
import { useShopId } from '@/contexts/AuthContext';
import type { DailyPurchase } from '@turnover/shared';

interface Props {
  defaultDate?: string;
  trigger?: React.ReactNode;
}

export function AddPurchaseDialog({ defaultDate, trigger }: Props) {
  const shopId = useShopId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [sourceName, setSourceName] = useState('');
  const [amount, setAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [note, setNote] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<{ data: DailyPurchase }>(shopPath(shopId, '/purchases'), {
        method: 'POST',
        body: JSON.stringify({
          sourceName,
          amount: parseFloat(amount),
          date: defaultDate,
          note: note || undefined,
          paidAmount: paidAmount ? parseFloat(paidAmount) : undefined,
        }),
      }),
    onSuccess: () => {
      toast.success('Purchase added');
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['purchases-summary'] });
      setOpen(false);
      setSourceName('');
      setAmount('');
      setPaidAmount('');
      setNote('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add purchase
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add purchase</DialogTitle>
          <DialogDescription>Enter source shop name and purchase amount (₹).</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="source">Source shop name</Label>
            <Input
              id="source"
              placeholder="e.g. Metro Wholesale"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="6500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="paid">Paid now (₹) — optional</Label>
            <Input
              id="paid"
              type="number"
              min="0"
              step="0.01"
              placeholder="0 = not paid yet"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!sourceName || !amount || mutation.isPending}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
