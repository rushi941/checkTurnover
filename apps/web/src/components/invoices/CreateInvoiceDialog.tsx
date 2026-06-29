import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InlineLoader } from '@/components/ui/loader';
import { apiFetch, shopPath } from '@/lib/api';
import { useShopId } from '@/contexts/AuthContext';
import { todayIso } from '@/lib/utils';
import type { GstInvoice } from '@turnover/shared';

export function CreateInvoiceDialog() {
  const shopId = useShopId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIso());
  const [gstPercent, setGstPercent] = useState('0');

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<{ data: GstInvoice }>(shopPath(shopId, '/invoices'), {
        method: 'POST',
        body: JSON.stringify({
          customerName,
          description: description || undefined,
          amount: parseFloat(amount),
          date,
          gstPercent: parseFloat(gstPercent) || 0,
        }),
      }),
    onSuccess: () => {
      toast.success('Invoice created');
      qc.invalidateQueries({ queryKey: ['invoices', shopId] });
      setOpen(false);
      setCustomerName('');
      setDescription('');
      setAmount('');
      setGstPercent('0');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create GST invoice</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New GST invoice</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Customer name</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Goods / services"
            />
          </div>
          <div className="grid gap-2">
            <Label>Amount (₹)</Label>
            <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>GST %</Label>
              <Input type="number" min="0" max="28" value={gstPercent} onChange={(e) => setGstPercent(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!customerName || !amount || mutation.isPending}
          >
            {mutation.isPending ? <InlineLoader /> : 'Create invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
