import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResetPasswordButton } from '@/components/admin/ResetShopPasswordDialog';
import { apiFetch } from '@/lib/api';

interface AdminShop {
  id: string;
  name: string;
  ownerEmail: string | null;
  ownerUserId: string | null;
  gstin: string | null;
}

export function AdminPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { data: shops } = useQuery({
    queryKey: ['admin-shops'],
    queryFn: () => apiFetch<{ data: AdminShop[] }>('/admin/shops').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch('/admin/shops', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),
    onSuccess: () => {
      toast.success('Shop created');
      qc.invalidateQueries({ queryKey: ['admin-shops'] });
      setName('');
      setEmail('');
      setPassword('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Manage shops</h1>
        <p className="text-sm text-muted-foreground">
          Create shops and force-reset shop owner passwords.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create new shop</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label>Shop name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Owner email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button
            className="w-full sm:col-span-3 sm:w-fit"
            onClick={() => createMutation.mutate()}
            disabled={!name || !email || !password || createMutation.isPending}
          >
            Create shop
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All shops</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 md:hidden">
            {(shops ?? []).map((s) => (
              <div key={s.id} className="rounded-lg border p-3 space-y-3">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{s.ownerEmail ?? '—'}</p>
                  {s.gstin && <p className="mt-1 text-xs text-muted-foreground">GSTIN: {s.gstin}</p>}
                </div>
                <ResetPasswordButton
                  shopId={s.id}
                  shopName={s.name}
                  ownerEmail={s.ownerEmail}
                />
              </div>
            ))}
          </div>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Owner email</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(shops ?? []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.ownerEmail ?? '—'}</TableCell>
                    <TableCell>{s.gstin ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <ResetPasswordButton
                        shopId={s.id}
                        shopName={s.name}
                        ownerEmail={s.ownerEmail}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
