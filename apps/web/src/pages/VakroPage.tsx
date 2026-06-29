import { useEffect, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { apiFetch, shopPath } from '@/lib/api';

import { useShopId } from '@/contexts/AuthContext';

import { formatInrFromPaise, isDateNotFuture, isValidIsoDate, profitFromVakroPaise, todayIso, DEFAULT_PROFIT_MARGIN_PERCENT } from '@/lib/utils';

import type { DailyVakro } from '@turnover/shared';



function validateVakroForm(date: string, amount: string): string | null {

  if (!date) return 'Please select a date';

  if (!isValidIsoDate(date)) return 'Invalid date';

  if (!isDateNotFuture(date)) return 'Date cannot be in the future';

  if (!amount.trim()) return 'Vakro amount is required';

  const n = parseFloat(amount);

  if (!Number.isFinite(n) || n < 0) return 'Amount must be 0 or greater';

  return null;

}



export function VakroPage() {

  const shopId = useShopId();

  const qc = useQueryClient();

  const [date, setDate] = useState(todayIso());

  const [amount, setAmount] = useState('');

  const [note, setNote] = useState('');

  const [formError, setFormError] = useState<string | null>(null);



  const { data: existing, isFetching } = useQuery({

    queryKey: ['vakro', shopId, date],

    queryFn: () =>

      apiFetch<{ data: DailyVakro | null }>(shopPath(shopId, `/vakro?date=${date}`)).then(

        (r) => r.data,

      ),

    enabled: isValidIsoDate(date),

  });



  useEffect(() => {

    setAmount('');

    setNote('');

    setFormError(null);

  }, [date]);



  const mutation = useMutation({

    mutationFn: () =>

      apiFetch<{ data: DailyVakro }>(shopPath(shopId, '/vakro'), {

        method: 'PUT',

        body: JSON.stringify({

          amount: parseFloat(amount),

          date,

          note: note || undefined,

        }),

      }),

    onSuccess: () => {

      toast.success('Vakro saved');

      qc.invalidateQueries({ queryKey: ['dashboard'] });

      qc.invalidateQueries({ queryKey: ['vakro'] });

      qc.invalidateQueries({ queryKey: ['monthly-report'] });

      qc.invalidateQueries({ queryKey: ['calendar'] });

      qc.invalidateQueries({ queryKey: ['ai-turnover'] });

      setFormError(null);

    },

    onError: (e: Error) => toast.error(e.message),

  });



  function loadExisting() {

    if (existing) {

      setAmount(String(existing.amountPaise / 100));

      setNote(existing.note ?? '');

      setFormError(null);

    }

  }



  function handleSave() {

    const err = validateVakroForm(date, amount);

    if (err) {

      setFormError(err);

      return;

    }

    mutation.mutate();

  }



  const isToday = date === todayIso();
  const amountNum = parseFloat(amount);
  const estimatedProfitPaise =
    Number.isFinite(amountNum) && amountNum >= 0
      ? profitFromVakroPaise(Math.round(amountNum * 100))
      : null;

  return (

    <div className="mx-auto max-w-lg space-y-6">

      <div>

        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Vakro entry</h1>

        <p className="text-sm text-muted-foreground sm:text-base">

          Enter whole day sales total for any past or today date

        </p>

      </div>



      {existing && !isFetching && (

        <Card className="border-emerald-200 bg-emerald-50/50">

          <CardHeader className="pb-2">

            <CardDescription>Vakro saved for {date}</CardDescription>

            <CardTitle className="text-2xl text-emerald-800">

              {formatInrFromPaise(existing.amountPaise)}

            </CardTitle>

          </CardHeader>

          <CardContent>

            <Button variant="outline" size="sm" onClick={loadExisting}>

              Load to edit

            </Button>

          </CardContent>

        </Card>

      )}



      <Card>

        <CardHeader>

          <CardTitle>{existing ? 'Update Vakro' : 'Enter Vakro'}</CardTitle>

          <CardDescription>One total amount for the entire day&apos;s sales</CardDescription>

        </CardHeader>

        <CardContent className="space-y-4">

          <div className="grid gap-2">

            <Label htmlFor="vakro-date">Date</Label>

            <Input

              id="vakro-date"

              type="date"

              value={date}

              max={todayIso()}

              onChange={(e) => setDate(e.target.value)}

            />

            {!isToday && (

              <p className="text-xs text-muted-foreground">Entering for a past date</p>

            )}

          </div>

          <div className="grid gap-2">

            <Label htmlFor="vakro">Vakro amount (₹)</Label>

            <Input

              id="vakro"

              type="number"

              min="0"

              step="0.01"

              placeholder="15800"

              value={amount}

              onChange={(e) => {

                setAmount(e.target.value);

                setFormError(null);

              }}

              className="text-lg"

            />

            {estimatedProfitPaise !== null && amount.trim() && (
              <p className="text-sm text-emerald-700">
                Estimated profit ({DEFAULT_PROFIT_MARGIN_PERCENT}%):{' '}
                <strong>{formatInrFromPaise(estimatedProfitPaise)}</strong>
              </p>
            )}
          </div>

          <div className="grid gap-2">

            <Label htmlFor="vakro-note">Note (optional)</Label>

            <Input id="vakro-note" value={note} onChange={(e) => setNote(e.target.value)} />

          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <Button

            className="w-full"

            size="lg"

            onClick={handleSave}

            disabled={mutation.isPending || isFetching}

          >

            Save Vakro

          </Button>

        </CardContent>

      </Card>

    </div>

  );

}


