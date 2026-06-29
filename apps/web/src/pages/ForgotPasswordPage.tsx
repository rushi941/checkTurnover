import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InlineLoader } from '@/components/ui/loader';
import { apiFetch } from '@/lib/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResetToken(null);
    try {
      const res = await apiFetch<{ data: { message: string; resetToken?: string } }>(
        '/auth/forgot-password',
        { method: 'POST', body: JSON.stringify({ email }) },
      );
      toast.success('Reset link created');
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-4">
      <Card className="w-full max-w-md animate-in fade-in zoom-in-95 shadow-2xl duration-300">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>
            Enter your shop email. Admin can also share a reset link from the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <InlineLoader /> : 'Get reset link'}
            </Button>
          </form>
          {resetToken && (
            <div className="mt-4 rounded-lg border bg-muted/50 p-3 text-sm animate-in fade-in">
              <p className="font-medium">Reset link (dev / testing):</p>
              <Link
                to={`/reset-password?token=${resetToken}`}
                className="mt-1 block break-all text-primary underline"
              >
                Open reset page
              </Link>
            </div>
          )}
          <p className="mt-4 text-center text-sm">
            <Link to="/login" className="text-primary underline">
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
