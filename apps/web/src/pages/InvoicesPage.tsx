import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

export function InvoicesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">GST Invoices</h1>
        <p className="text-sm text-muted-foreground sm:text-base">Formal billing with auto invoice numbers</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Coming in next sprint</CardTitle>
          </div>
          <CardDescription>
            GST PDF invoices with direct amount entry and auto incrementing invoice numbers (INV-2026-0001).
            Separate from daily galla entry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">Planned · v1.1</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
