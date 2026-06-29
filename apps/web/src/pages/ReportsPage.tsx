import { useEffect, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {

  Table,

  TableBody,

  TableCell,

  TableHead,

  TableHeader,

  TableRow,

} from '@/components/ui/table';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { StatCardPaise } from '@/components/dashboard/StatCard';

import { MonthlyTargetCard } from '@/components/dashboard/MonthlyTargetCard';

import { TargetSuggestionCard } from '@/components/dashboard/TargetSuggestionCard';

import { ShoppingCart, Wallet, TrendingUp, Target, Receipt } from 'lucide-react';

import { Link } from 'react-router-dom';

import { apiFetch, shopPath } from '@/lib/api';

import { useShopId } from '@/contexts/AuthContext';

import { currentMonth, formatInrFromPaise, formatLakh, shiftMonth } from '@/lib/utils';

import { monthLabel, useMonthlyTarget } from '@/hooks/useMonthlyTarget';

import type { MonthlyReport, TargetProgress } from '@turnover/shared';



export function ReportsPage() {

  const shopId = useShopId();

  const [month, setMonth] = useState(currentMonth());

  const qc = useQueryClient();

  const [targetInput, setTargetInput] = useState('');



  const { data: report, isLoading: reportLoading, isError: reportError } = useQuery({

    queryKey: ['monthly-report', shopId, month],

    queryFn: () =>

      apiFetch<{ data: MonthlyReport }>(shopPath(shopId, `/reports/monthly?month=${month}`)).then(

        (r) => r.data,

      ),

  });



  const { data: targetProgress } = useMonthlyTarget(month);

  useEffect(() => {
    if (targetProgress?.targetPaise) {
      setTargetInput(String(targetProgress.targetPaise / 100));
    } else {
      setTargetInput('');
    }
  }, [month, targetProgress?.targetPaise]);

  const targetMutation = useMutation({

    mutationFn: (targetRupees: number) =>

      apiFetch<{ data: TargetProgress }>(shopPath(shopId, `/targets/${month}`), {

        method: 'PUT',

        body: JSON.stringify({ target: targetRupees }),

      }),

    onSuccess: (res) => {

      toast.success('Monthly target saved');

      qc.setQueryData(['target', shopId, month], res.data);

      qc.invalidateQueries({ queryKey: ['target', shopId, month] });

      qc.invalidateQueries({ queryKey: ['target-suggestion', shopId, month] });

      qc.invalidateQueries({ queryKey: ['ai-turnover'] });

      setTargetInput(String(res.data.targetPaise! / 100));

    },

    onError: (e: Error) => toast.error(e.message),

  });



  return (

    <div className="space-y-6">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Monthly report</h1>

          <p className="text-sm text-muted-foreground sm:text-base">

            {monthLabel(month)} — Vakro, target & daily breakdown

          </p>

        </div>

        <div className="flex items-center justify-center gap-2">

          <Button variant="outline" size="icon" onClick={() => setMonth(shiftMonth(month, -1))}>

            <ChevronLeft className="h-4 w-4" />

          </Button>

          <span className="min-w-[140px] text-center text-sm font-medium">{monthLabel(month)}</span>

          <Button variant="outline" size="icon" onClick={() => setMonth(shiftMonth(month, 1))}>

            <ChevronRight className="h-4 w-4" />

          </Button>

        </div>

      </div>



      <TargetSuggestionCard

        month={month}

        onApplySuggested={(rupees) => {

          setTargetInput(String(rupees));

          targetMutation.mutate(rupees);

        }}

      />



      <Card className="border-violet-200">

        <CardHeader>

          <CardTitle className="flex items-center gap-2 text-base">

            <Target className="h-5 w-5" />

            Set / update target — {monthLabel(month)}

          </CardTitle>

          <CardDescription>

            e.g. 15 Lakh — enter amount in ₹ (1500000 for 15 Lakh)

          </CardDescription>

        </CardHeader>

        <CardContent className="space-y-4">

          {targetProgress?.targetPaise ? (

            <div className="rounded-lg border bg-violet-50/50 px-3 py-2 text-sm">

              Current target:{' '}

              <strong className="tabular-nums">{formatLakh(targetProgress.targetPaise)}</strong>

              {' · '}

              Achieved:{' '}

              <strong className="tabular-nums text-emerald-700">

                {formatLakh(targetProgress.achievedPaise)}

              </strong>

              {targetProgress.percentCovered !== null && (

                <span> ({targetProgress.percentCovered}% covered)</span>

              )}

            </div>

          ) : (

            <p className="text-sm text-muted-foreground">No target set for {monthLabel(month)} yet.</p>

          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">

            <div className="grid w-full gap-2 sm:flex-1 sm:min-w-[200px]">

              <Label>Target (₹)</Label>

              <Input

                type="number"

                placeholder="1500000 = 15 Lakh"

                value={targetInput}

                onChange={(e) => setTargetInput(e.target.value)}

              />

            </div>

            <Button

              className="w-full sm:w-auto"

              onClick={() => targetMutation.mutate(parseFloat(targetInput))}

              disabled={!targetInput || targetMutation.isPending}

            >

              {targetProgress?.targetPaise ? 'Update target' : 'Set target'}

            </Button>

            <Button variant="outline" className="w-full sm:w-auto" asChild>

              <Link to="/ai">AI suggestions</Link>

            </Button>

          </div>

        </CardContent>

      </Card>



      <MonthlyTargetCard compact month={month} />



      {reportLoading ? (

        <p className="text-sm text-muted-foreground">Loading monthly data…</p>

      ) : reportError || !report ? (

        <p className="text-sm text-destructive">Could not load report for this month.</p>

      ) : (

        <>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <StatCardPaise title="Total purchases" paise={report.totalPurchasesPaise} icon={ShoppingCart} />

            <StatCardPaise title="Total kharcho" paise={report.totalKharchoPaise} icon={Receipt} variant="warning" />

            <StatCardPaise title="Total Vakro" paise={report.totalVakroPaise} icon={Wallet} />

            <StatCardPaise title="Net profit" paise={report.totalProfitPaise} subtitle={`${report.profitMarginPercent}% of Vakro − kharcho`} icon={TrendingUp} variant="success" />

          </div>



          <Card>

            <CardHeader>

              <CardTitle>Daily breakdown</CardTitle>

              <CardDescription>Purchases, Vakro & profit ({report.profitMarginPercent}% of Vakro − kharcho)</CardDescription>

            </CardHeader>

            <CardContent>

              <div className="space-y-2 md:hidden">

                {report.days.length === 0 ? (

                  <p className="py-6 text-center text-sm text-muted-foreground">No data this month</p>

                ) : (

                  report.days.map((day) => (

                    <div key={day.date} className="rounded-lg border p-3">

                      <p className="font-medium">{day.date}</p>

                      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">

                        <div>

                          <p className="text-muted-foreground">Buy</p>

                          <p className="tabular-nums">{formatInrFromPaise(day.purchasesPaise)}</p>

                        </div>

                        <div>

                          <p className="text-muted-foreground">Vakro</p>

                          <p className="tabular-nums">

                            {day.vakroPaise !== null ? formatInrFromPaise(day.vakroPaise) : '—'}

                          </p>

                        </div>

                        <div>

                          <p className="text-muted-foreground">Profit</p>

                          <p className="tabular-nums text-emerald-700">

                            {day.profitPaise !== null ? formatInrFromPaise(day.profitPaise) : '—'}

                          </p>

                        </div>

                      </div>

                    </div>

                  ))

                )}

              </div>

              <div className="hidden md:block">

                <Table>

                  <TableHeader>

                    <TableRow>

                      <TableHead>Date</TableHead>

                      <TableHead>Purchases</TableHead>

                      <TableHead>Vakro</TableHead>

                      <TableHead>Profit</TableHead>

                    </TableRow>

                  </TableHeader>

                  <TableBody>

                    {report.days.length === 0 ? (

                      <TableRow>

                        <TableCell colSpan={4} className="text-center text-muted-foreground">

                          No data this month

                        </TableCell>

                      </TableRow>

                    ) : (

                      report.days.map((day) => (

                        <TableRow key={day.date}>

                          <TableCell>{day.date}</TableCell>

                          <TableCell>{formatInrFromPaise(day.purchasesPaise)}</TableCell>

                          <TableCell>

                            {day.vakroPaise !== null ? formatInrFromPaise(day.vakroPaise) : '—'}

                          </TableCell>

                          <TableCell>

                            {day.profitPaise !== null ? formatInrFromPaise(day.profitPaise) : '—'}

                          </TableCell>

                        </TableRow>

                      ))

                    )}

                  </TableBody>

                </Table>

              </div>

            </CardContent>

          </Card>

        </>

      )}

    </div>

  );

}


