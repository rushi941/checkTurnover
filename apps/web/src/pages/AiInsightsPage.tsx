import { useState } from 'react';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { Sparkles, Target, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { StatCardPaise } from '@/components/dashboard/StatCard';

import { apiFetch, shopPath } from '@/lib/api';

import { useShopId } from '@/contexts/AuthContext';

import { formatInrFromPaise } from '@/lib/utils';

import type { AiTurnoverAnalysis, TurnoverPeriod } from '@turnover/shared';



function formatLakh(paise: number): string {

  const r = paise / 100;

  if (r >= 100000) return `₹${(r / 100000).toFixed(2)} Lakh`;

  return formatInrFromPaise(paise);

}



function TurnoverPanel({ data }: { data: AiTurnoverAnalysis }) {

  return (

    <div className="space-y-4">

      <div className="grid gap-4 sm:grid-cols-3">

        <StatCardPaise title="Total Vakro (Kamai)" paise={data.summary.totalVakroPaise} icon={TrendingUp} />

        <StatCardPaise title="Purchases" paise={data.summary.totalPurchasesPaise} icon={Target} />

        <StatCardPaise

          title="Profit"

          paise={data.summary.profitPaise}

          subtitle={`Margin ${data.summary.marginPercent}%`}

          icon={Sparkles}

          variant="success"

        />

      </div>



      {data.target.targetPaise !== null && (

        <Card className="border-violet-200 bg-gradient-to-br from-violet-50/50 to-white">

          <CardHeader className="pb-2">

            <CardTitle className="text-base">Monthly target progress</CardTitle>

            <CardDescription>

              Target {formatLakh(data.target.targetPaise)} · {data.target.percentCovered}% covered

            </CardDescription>

          </CardHeader>

          <CardContent className="space-y-3">

            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">

              <div

                className="h-full rounded-full bg-violet-600 transition-all"

                style={{ width: `${Math.min(100, data.target.percentCovered ?? 0)}%` }}

              />

            </div>

            <div className="flex flex-wrap gap-4 text-sm">

              <span>Achieved: <strong>{formatLakh(data.target.achievedPaise)}</strong></span>

              {data.target.pendingPaise !== null && data.target.pendingPaise > 0 && (

                <span className="text-amber-800">Pending: <strong>{formatLakh(data.target.pendingPaise)}</strong></span>

              )}

              {data.target.dailyNeededPaise && (

                <span>Daily needed: <strong>{formatLakh(data.target.dailyNeededPaise)}</strong></span>

              )}

            </div>

          </CardContent>

        </Card>

      )}



      {data.upcomingFestivals.length > 0 && (

        <Card>

          <CardHeader className="pb-2">

            <CardTitle className="text-base">Upcoming tyohar</CardTitle>

          </CardHeader>

          <CardContent className="flex flex-wrap gap-2">

            {data.upcomingFestivals.map((f) => (

              <Badge key={f.date} variant="secondary" className="text-xs py-1">

                {f.nameGu} · {f.date}

              </Badge>

            ))}

          </CardContent>

        </Card>

      )}



      <Card>

        <CardHeader>

          <CardTitle className="text-base">AI suggestions — sale badhane ke liye</CardTitle>

          <CardDescription>{data.poweredBy} · {data.label}</CardDescription>

        </CardHeader>

        <CardContent>

          <ul className="space-y-3">

            {data.suggestions.map((s, i) => (

              <li key={i} className="flex gap-2 text-sm leading-relaxed">

                <span className="text-violet-600 font-bold">{i + 1}.</span>

                <span>{s}</span>

              </li>

            ))}

          </ul>

        </CardContent>

      </Card>

    </div>

  );

}



export function AiInsightsPage() {

  const shopId = useShopId();

  const [period, setPeriod] = useState<TurnoverPeriod>('month');



  const { data, isFetching, isPending, isError, error, refetch } = useQuery({

    queryKey: ['ai-turnover', shopId, period],

    queryFn: () =>

      apiFetch<{ data: AiTurnoverAnalysis }>(

        shopPath(shopId, `/ai/turnover?period=${period}`),

      ).then((r) => r.data),

    placeholderData: keepPreviousData,

  });



  const analysis = data?.period === period ? data : undefined;

  const loading = isPending || (isFetching && !analysis);



  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 sm:text-2xl">

          <Sparkles className="h-6 w-6 text-violet-600 sm:h-7 sm:w-7" />

          AI Turnover Assistant

        </h1>

        <p className="text-sm text-muted-foreground sm:text-base">Smart analysis + sale badhane ke suggestions</p>

      </div>



      <Tabs value={period} onValueChange={(v) => setPeriod(v as TurnoverPeriod)}>

        <TabsList className="grid h-auto w-full grid-cols-3 sm:inline-flex sm:w-auto">

          <TabsTrigger value="week" className="px-2 text-xs sm:px-3 sm:text-sm">Week</TabsTrigger>

          <TabsTrigger value="month" className="px-2 text-xs sm:px-3 sm:text-sm">Month</TabsTrigger>

          <TabsTrigger value="all" className="px-2 text-xs sm:px-3 sm:text-sm">All</TabsTrigger>

        </TabsList>

      </Tabs>



      <div className="mt-4">

        {isError ? (

          <Card className="border-destructive/50">

            <CardContent className="pt-6 space-y-3">

              <p className="text-sm text-destructive">

                Could not load analysis: {error instanceof Error ? error.message : 'Something went wrong'}

              </p>

              <Button variant="outline" size="sm" onClick={() => refetch()}>

                Try again

              </Button>

            </CardContent>

          </Card>

        ) : loading ? (

          <p className="text-muted-foreground">Analyzing turnover…</p>

        ) : analysis ? (

          <TurnoverPanel data={analysis} />

        ) : null}

      </div>

    </div>

  );

}


