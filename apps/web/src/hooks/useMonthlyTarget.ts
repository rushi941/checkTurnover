import { useQuery } from '@tanstack/react-query';
import { apiFetch, shopPath } from '@/lib/api';
import { useShopId } from '@/contexts/AuthContext';
import { currentMonth, monthLabel as formatMonthLabel } from '@/lib/utils';
import type { TargetProgress } from '@turnover/shared';

export function useMonthlyTarget(month = currentMonth()) {
  const shopId = useShopId();

  return useQuery({
    queryKey: ['target', shopId, month],
    queryFn: () =>
      apiFetch<{ data: TargetProgress }>(shopPath(shopId, `/targets/${month}`)).then(
        (r) => r.data,
      ),
  });
}

export function monthLabel(month: string): string {
  return formatMonthLabel(month);
}
