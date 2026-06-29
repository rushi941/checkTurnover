import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatInrFromPaise } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning';
}

export function StatCard({ title, value, subtitle, icon: Icon, variant = 'default' }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div
          className={cn(
            'rounded-lg p-2',
            variant === 'success' && 'bg-emerald-100 text-emerald-700',
            variant === 'warning' && 'bg-amber-100 text-amber-700',
            variant === 'default' && 'bg-blue-100 text-blue-700',
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export function StatCardPaise({
  title,
  paise,
  ...rest
}: Omit<StatCardProps, 'value'> & { paise: number | null }) {
  return (
    <StatCard
      title={title}
      value={paise !== null ? formatInrFromPaise(paise) : '—'}
      {...rest}
    />
  );
}
