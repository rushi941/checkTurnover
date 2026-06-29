import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DashboardData } from '@turnover/shared';

const STEPS = [
  { id: 'purchase', label: 'Add today\'s first purchase', href: '/purchases' },
  { id: 'vakro', label: 'Enter tonight\'s Vakro', href: '/vakro' },
  { id: 'kharcho', label: 'Record shop kharcho (rent, bills)', href: '/kharcho' },
  { id: 'target', label: 'Set monthly target in Reports', href: '/reports' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

function storageKey(shopId: string) {
  return `turnover_onboarding_${shopId}`;
}

function loadDismissed(shopId: string) {
  try {
    return localStorage.getItem(`${storageKey(shopId)}_dismissed`) === '1';
  } catch {
    return false;
  }
}

interface Props {
  shopId: string;
  dashboard: DashboardData;
  hasMonthlyTarget?: boolean;
}

export function OnboardingChecklist({ shopId, dashboard, hasMonthlyTarget }: Props) {
  const [dismissed, setDismissed] = useState(() => loadDismissed(shopId));

  const completed = useMemo(() => {
    const done = new Set<StepId>();
    if (dashboard.purchaseRows.length > 0) done.add('purchase');
    if (dashboard.vakroEntered) done.add('vakro');
    if (dashboard.kharchoRows.length > 0) done.add('kharcho');
    if (hasMonthlyTarget) done.add('target');
    return done;
  }, [dashboard, hasMonthlyTarget]);

  const allDone = STEPS.every((s) => completed.has(s.id));

  useEffect(() => {
    if (allDone) {
      try {
        localStorage.setItem(`${storageKey(shopId)}_dismissed`, '1');
      } catch {
        /* ignore */
      }
    }
  }, [allDone, shopId]);

  if (dismissed || allDone) return null;

  return (
    <Card className="animate-in slide-in-from-top-2 fade-in border-primary/20 bg-primary/5 duration-500">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Getting started</CardTitle>
            <CardDescription>Complete these steps to use TurnOverCheck daily</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Dismiss checklist"
            onClick={() => {
              setDismissed(true);
              try {
                localStorage.setItem(`${storageKey(shopId)}_dismissed`, '1');
              } catch {
                /* ignore */
              }
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {STEPS.map((step) => {
          const done = completed.has(step.id);
          return (
            <Link
              key={step.id}
              to={step.href}
              className={cn(
                'flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm transition-colors hover:bg-muted',
                done && 'opacity-70',
              )}
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <span className={cn(done && 'line-through')}>{step.label}</span>
            </Link>
          );
        })}
        <p className="pt-1 text-xs text-muted-foreground">
          {completed.size}/{STEPS.length} completed
        </p>
      </CardContent>
    </Card>
  );
}
