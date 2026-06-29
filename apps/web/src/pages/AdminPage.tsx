import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Link2 } from 'lucide-react';
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
import { PageLoader } from '@/components/ui/loader';
import { apiFetch } from '@/lib/api';
import type { AdminShop } from '@turnover/shared';

export function AdminPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [password, setPassword] = useState('');

  const { data: shops, isLoading } = useQuery({
    queryKey: ['admin-shops'],
    queryFn: () => apiFetch<{ data: AdminShop[] }>('/admin/shops').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch('/admin/shops', {
        method: 'POST',
        body: JSON.stringify({
          name,
          ownerName: ownerName || undefined,
          email,
          phone: phone || undefined,
          city: city || undefined,
          address: address || undefined,
          gstin: gstin || undefined,
          password,
        }),
      }),
    onSuccess: () => {
      toast.success('Shop onboarded successfully');
      qc.invalidateQueries({ queryKey: ['admin-shops'] });
      setName('');
      setOwnerName('');
      setEmail('');
      setPhone('');
      setCity('');
      setAddress('');
      setGstin('');
      setPassword('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetLinkMutation = useMutation({
    mutationFn: (userId: string) =>
      apiFetch<{ data: { token: string; path: string } }>(`/admin/users/${userId}/reset-link`, {
        method: 'POST',
      }),
    onSuccess: (res) => {
      const url = `${window.location.origin}${res.data.path}`;
      navigator.clipboard.writeText(url).then(() => {
        toast.success('Reset link copied to clipboard');
      }).catch(() => {
        toast.success('Reset link created', { description: url });
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <PageLoader label="Loading shops…" />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Onboard new client</h1>
        <p className="text-sm text-muted-foreground">
          Create shop accounts for market clients — share login URL + credentials.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New shop / client</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="grid gap-2 sm:col-span-2 lg:col-span-3">
            <Label>Shop name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Shree Ganesh Kirana" />
          </div>
          <div className="grid gap-2">
            <Label>Owner name</Label>
            <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Rajesh Patel" />
          </div>
          <div className="grid gap-2">
            <Label>Owner email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Phone (WhatsApp)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" />
          </div>
          <div className="grid gap-2">
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ahmedabad" />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>GSTIN</Label>
            <Input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="24AABCS1234F1Z5" />
          </div>
          <div className="grid gap-2">
            <Label>Login password *</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
          </div>
          <Button
            className="sm:col-span-2 lg:col-span-3 sm:w-fit"
            onClick={() => createMutation.mutate()}
            disabled={!name || !email || !password || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating…' : 'Onboard shop'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All shops ({shops?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:hidden">
            {(shops ?? []).map((s) => (
              <div key={s.id} className="rounded-lg border p-3 space-y-2">
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-muted-foreground">{s.ownerName ?? '—'} · {s.ownerEmail ?? '—'}</p>
                {s.phone && <p className="text-xs">{s.phone} · {s.city ?? ''}</p>}
                <div className="flex flex-wrap gap-2">
                  <ResetPasswordButton shopId={s.id} shopName={s.name} ownerEmail={s.ownerEmail} />
                  {s.ownerUserId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resetLinkMutation.mutate(s.ownerUserId!)}
                      disabled={resetLinkMutation.isPending}
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Reset link
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(shops ?? []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <div>{s.ownerName ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{s.ownerEmail}</div>
                    </TableCell>
                    <TableCell>{s.phone ?? '—'}</TableCell>
                    <TableCell>{s.city ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {s.ownerUserId && (
                          <Button
                            size="sm"
                            variant="outline"
                            title="Copy password reset link"
                            onClick={() => resetLinkMutation.mutate(s.ownerUserId!)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <ResetPasswordButton shopId={s.id} shopName={s.name} ownerEmail={s.ownerEmail} />
                      </div>
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
