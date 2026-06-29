import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react';
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
import { apiFetch } from '@/lib/api';

interface Props {
  shopId: string;
  shopName: string;
  ownerEmail: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetShopPasswordDialog({
  shopId,
  shopName,
  ownerEmail,
  open,
  onOpenChange,
}: Props) {
  const qc = useQueryClient();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(`/admin/shops/${shopId}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password }),
      }),
    onSuccess: () => {
      toast.success(`Password updated for ${ownerEmail ?? shopName}`);
      qc.invalidateQueries({ queryKey: ['admin-shops'] });
      setPassword('');
      setConfirm('');
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSave = password.length >= 6 && password === confirm;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset shop password</DialogTitle>
          <DialogDescription>
            Force update login password for <strong>{shopName}</strong>
            {ownerEmail ? ` (${ownerEmail})` : ''}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>New password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
            />
          </div>
          <div className="grid gap-2">
            <Label>Confirm password</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!canSave || mutation.isPending}
          >
            Update password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ResetPasswordButton({
  shopId,
  shopName,
  ownerEmail,
}: {
  shopId: string;
  shopName: string;
  ownerEmail: string | null;
}) {
  const [open, setOpen] = useState(false);

  if (!ownerEmail) return null;

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <KeyRound className="h-3.5 w-3.5" />
        Reset password
      </Button>
      <ResetShopPasswordDialog
        shopId={shopId}
        shopName={shopName}
        ownerEmail={ownerEmail}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
