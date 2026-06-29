import { Link } from 'react-router-dom';
import { Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, currentMonth, formatLakh } from '@/lib/utils';
import { monthLabel, useMonthlyTarget } from '@/hooks/useMonthlyTarget';
import type { TargetProgress } from '@turnover/shared';

interface MonthlyTargetCardProps {
  className?: string;
  compact?: boolean;
  month?: string;
}

function TargetProgressContent({ target, compact }: { target: TargetProgress; compact?: boolean }) {
  const hasTarget = target.targetPaise !== null && target.targetPaise > 0;
  const pct = target.percentCovered ?? 0;

  if (!hasTarget) {
    return (
      <div className={cn('space-y-2', compact && 'text-sm')}>
        <p className="text-muted-foreground">No kamai target set for this month yet.</p>
        <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
          <Link to="/reports">Set monthly target</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted sm:h-3">
        <div
          className="h-full rounded-full bg-violet-600 transition-all"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <div
        className={cn(
          'grid gap-2 text-sm',
          compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4',
        )}
      >
        <div>
          <p className="text-muted-foreground text-xs">Target</p>
          <p className="font-semibold tabular-nums">{formatLakh(target.targetPaise!)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Achieved</p>
          <p className="font-semibold tabular-nums text-emerald-700">{formatLakh(target.achievedPaise)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Covered</p>
          <p className="font-semibold">{pct}%</p>
        </div>
        {target.pendingPaise !== null && target.pendingPaise > 0 ? (
          <div>
            <p className="text-muted-foreground text-xs">Pending</p>
            <p className="font-semibold tabular-nums text-amber-800">{formatLakh(target.pendingPaise)}</p>
          </div>
        ) : (
          <div>
            <p className="text-muted-foreground text-xs">Status</p>
            <p className="font-semibold text-emerald-700">On track</p>
          </div>
        )}
      </div>
      {target.dailyNeededPaise && target.daysRemaining && target.daysRemaining > 0 && (
        <p className="text-xs text-muted-foreground">
          ~{formatLakh(target.dailyNeededPaise)} Vakro/day needed for next {target.daysRemaining} days
        </p>
      )}
    </div>
  );
}

export function MonthlyTargetCard({ className, compact, month: monthProp }: MonthlyTargetCardProps) {
  const month = useMonthlyTarget(monthProp);
  const label = monthLabel(month.data?.month ?? monthProp ?? currentMonth());

  if (month.isLoading) {
    return (
      <Card className={cn('border-violet-200', className)}>
        <CardContent className="py-6 text-sm text-muted-foreground">Loading target…</CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={cn('rounded-lg border border-violet-200 bg-violet-50/40 p-3', className)}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <Target className="h-4 w-4 text-violet-600" />
            {label} target
          </p>
          <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
            <Link to="/reports">Edit</Link>
          </Button>
        </div>
        {month.data && <TargetProgressContent target={month.data} compact />}
      </div>
    );
  }

  return (
    <Card className={cn('border-violet-200 bg-gradient-to-br from-violet-50/50 to-white', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-violet-600" />
          {label} — Kamai target
        </CardTitle>
        <CardDescription>Monthly Vakro goal and progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {month.data && <TargetProgressContent target={month.data} />}
        <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
          <Link to="/reports">View smart target suggestion</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function MonthlyTargetStrip() {
  const { data: target, isLoading } = useMonthlyTarget();
  const label = monthLabel(target?.month ?? currentMonth());

  if (isLoading || !target?.targetPaise) return null;

  const pct = target.percentCovered ?? 0;

  return (
    <Link
      to="/reports"
      className="block border-b border-violet-200/80 bg-violet-50/70 px-3 py-2 text-xs sm:px-6 sm:text-sm"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium text-violet-900">{label}</span>
        <span className="text-muted-foreground">Target</span>
        <span className="font-semibold tabular-nums">{formatLakh(target.targetPaise)}</span>
        <span className="hidden text-muted-foreground sm:inline">·</span>
        <span className="font-semibold text-emerald-700">{pct}% covered</span>
        {target.pendingPaise !== null && target.pendingPaise > 0 && (
          <>
            <span className="hidden text-muted-foreground sm:inline">·</span>
            <span className="text-amber-800">
              {formatLakh(target.pendingPaise)} pending
            </span>
          </>
        )}
        <span className="ml-auto hidden h-1.5 w-16 overflow-hidden rounded-full bg-violet-200 sm:block">
          <span className="block h-full rounded-full bg-violet-600" style={{ width: `${Math.min(100, pct)}%` }} />
        </span>
      </div>
    </Link>
  );
}
