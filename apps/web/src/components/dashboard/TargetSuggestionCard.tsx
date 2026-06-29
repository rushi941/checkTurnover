import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, CalendarHeart } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch, shopPath } from '@/lib/api';
import { useShopId } from '@/contexts/AuthContext';
import { formatLakh } from '@/lib/utils';
import type { TargetProgress, TargetSuggestion } from '@turnover/shared';

interface Props {
  month: string;
  onApplySuggested?: (rupees: number) => void;
}

function impactVariant(impact: string): 'default' | 'secondary' | 'outline' {
  if (impact === 'high') return 'default';
  if (impact === 'medium') return 'secondary';
  return 'outline';
}

export function TargetSuggestionCard({ month, onApplySuggested }: Props) {
  const shopId = useShopId();
  const qc = useQueryClient();

  const { data: suggestion, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['target-suggestion', shopId, month],
    queryFn: () =>
      apiFetch<{ data: TargetSuggestion }>(shopPath(shopId, `/targets/${month}/suggestion`)).then(
        (r) => r.data,
      ),
  });

  const applyMutation = useMutation({
    mutationFn: (rupees: number) =>
      apiFetch<{ data: TargetProgress }>(shopPath(shopId, `/targets/${month}`), {
        method: 'PUT',
        body: JSON.stringify({ target: rupees }),
      }),
    onSuccess: (res) => {
      toast.success('Suggested target applied');
      qc.setQueryData(['target', shopId, month], res.data);
      qc.invalidateQueries({ queryKey: ['target', shopId, month] });
      qc.invalidateQueries({ queryKey: ['ai-turnover'] });
      if (res.data.targetPaise) {
        onApplySuggested?.(res.data.targetPaise / 100);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isError) {
    return (
      <Card className="border-amber-200">
        <CardContent className="py-4 space-y-2">
          <p className="text-sm text-destructive">
            Smart target could not load: {error instanceof Error ? error.message : 'Server error'}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-amber-200">
        <CardContent className="py-6 text-sm text-muted-foreground">Loading target suggestion…</CardContent>
      </Card>
    );
  }

  if (!suggestion) return null;

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50/60 to-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-amber-600" />
          Smart target — {suggestion.monthLabel}
        </CardTitle>
        <CardDescription>
          Last year + tyohar + market growth ke hisaab se suggested kamai goal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-white/80 p-4">
          <p className="text-sm text-muted-foreground">Suggested target</p>
          <p className="text-2xl font-bold text-amber-900 tabular-nums">
            {formatLakh(suggestion.suggestedTargetPaise)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            +{suggestion.upliftPercent}% uplift · base {formatLakh(suggestion.basePaise)}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button
              className="w-full sm:w-auto"
              onClick={() => applyMutation.mutate(suggestion.suggestedTargetRupees)}
              disabled={applyMutation.isPending}
            >
              Use suggested target
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onApplySuggested?.(suggestion.suggestedTargetRupees)}
            >
              Fill in form
            </Button>
          </div>
        </div>

        {suggestion.lastYear && (
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="font-medium">{suggestion.lastYearMonthLabel}</p>
              <p className="mt-1 text-muted-foreground">
                Achieved:{' '}
                <strong className="text-foreground">
                  {formatLakh(suggestion.lastYear.achievedPaise)}
                </strong>
              </p>
              {suggestion.lastYear.targetPaise !== null && (
                <p className="text-muted-foreground">
                  Target was: {formatLakh(suggestion.lastYear.targetPaise)}
                </p>
              )}
            </div>
            {suggestion.recentThreeMonthAvgPaise !== null && (
              <div className="rounded-lg border p-3">
                <p className="font-medium">Recent 3-month avg</p>
                <p className="mt-1 font-semibold tabular-nums">
                  {formatLakh(suggestion.recentThreeMonthAvgPaise)}
                </p>
              </div>
            )}
          </div>
        )}

        {suggestion.festivals.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <CalendarHeart className="h-4 w-4 text-amber-600" />
              Tyohar this month
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestion.festivals.map((f) => (
                <Badge key={f.date} variant={impactVariant(f.impact)} className="text-xs">
                  {f.nameGu} · {f.date.slice(8)}/{f.date.slice(5, 7)}
                  {f.impact === 'high' && ' ★'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium">Kyun ye target?</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {suggestion.reasoning.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-600 font-bold">{i + 1}.</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
