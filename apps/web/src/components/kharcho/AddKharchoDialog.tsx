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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiFetch, shopPath } from '@/lib/api';
import { useShopId } from '@/contexts/AuthContext';
import { todayIso } from '@/lib/utils';
import { KHARCHO_CATEGORIES, type KharchoCategory, type ShopKharcho } from '@turnover/shared';

interface Props {
  defaultDate?: string;
  trigger?: React.ReactNode;
  editEntry?: ShopKharcho | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddKharchoDialog({
  defaultDate,
  trigger,
  editEntry,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const shopId = useShopId();
  const qc = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [category, setCategory] = useState<KharchoCategory>(editEntry?.category ?? 'bill');
  const [amount, setAmount] = useState(editEntry ? String(editEntry.amountPaise / 100) : '');
  const [date, setDate] = useState(editEntry?.date ?? defaultDate ?? todayIso());
  const [note, setNote] = useState(editEntry?.note ?? '');

  const isEdit = !!editEntry;

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        category,
        amount: parseFloat(amount),
        date,
        note: note || undefined,
      };
      if (isEdit) {
        return apiFetch<{ data: ShopKharcho }>(
          shopPath(shopId, `/kharcho/${editEntry!.id}`),
          { method: 'PUT', body: JSON.stringify(body) },
        );
      }
      return apiFetch<{ data: ShopKharcho }>(shopPath(shopId, '/kharcho'), {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Kharcho updated' : 'Kharcho added');
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['kharcho'] });
      qc.invalidateQueries({ queryKey: ['kharcho-summary'] });
      qc.invalidateQueries({ queryKey: ['monthly-report'] });
      qc.invalidateQueries({ queryKey: ['vakro-list'] });
      qc.invalidateQueries({ queryKey: ['vakro-detail'] });
      setOpen(false);
      if (!isEdit) {
        setCategory('bill');
        setAmount('');
        setDate(defaultDate ?? todayIso());
        setNote('');
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dialog = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit kharcho' : 'Add kharcho'}</DialogTitle>
        <DialogDescription>
          Bhadu, salary, bills, maintenance, car, EMI — shop running expenses (₹).
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as KharchoCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KHARCHO_CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.labelGu} — {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="kharcho-amount">Amount (₹)</Label>
          <Input
            id="kharcho-amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="2500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="kharcho-date">Date</Label>
          <Input
            id="kharcho-date"
            type="date"
            max={todayIso()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="kharcho-note">Note (optional)</Label>
          <Input
            id="kharcho-note"
            placeholder="e.g. June electricity bill"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() => mutation.mutate()}
          disabled={!amount || !category || mutation.isPending}
        >
          {isEdit ? 'Update' : 'Save'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  if (isEdit || controlledOpen !== undefined) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialog}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add kharcho
          </Button>
        )}
      </DialogTrigger>
      {dialog}
    </Dialog>
  );
}
