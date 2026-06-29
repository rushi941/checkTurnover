import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiFetch, shopPath } from '@/lib/api';
import { useShopId } from '@/contexts/AuthContext';
import { buildExportWorkbook, downloadExcel, parseImportExcel } from '@/lib/excel';
import type {
  DataExportRow,
  DataImportPreview,
  DataImportResult,
  DataImportRow,
} from '@turnover/shared';

interface Props {
  from?: string;
  to?: string;
}

export function DataImportExport({ from, to }: Props) {
  const shopId = useShopId();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<DataImportPreview | null>(null);
  const [pendingRows, setPendingRows] = useState<DataImportRow[]>([]);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const qs = params.toString();
      return apiFetch<{ data: DataExportRow[] }>(
        shopPath(shopId, `/data/export${qs ? `?${qs}` : ''}`),
      ).then((r) => r.data);
    },
    onSuccess: (rows) => {
      const buffer = buildExportWorkbook(rows);
      const name = `turnover-export-${from ?? 'all'}${to ? `-to-${to}` : ''}.xlsx`;
      downloadExcel(buffer, name);
      toast.success(`Exported ${rows.length} rows`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const validateMutation = useMutation({
    mutationFn: (rows: DataImportRow[]) =>
      apiFetch<{ data: DataImportPreview }>(shopPath(shopId, '/data/import/validate'), {
        method: 'POST',
        body: JSON.stringify({ rows }),
      }).then((r) => r.data),
    onSuccess: (result, rows) => {
      setPreview(result);
      setPendingRows(rows);
      if (result.valid) {
        toast.success(`Valid: ${result.summary.purchaseRows} purchases, ${result.summary.vakroDays} vakro days`);
      } else {
        toast.error(`${result.errors.length} validation error(s) — fix Excel and try again`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const importMutation = useMutation({
    mutationFn: (rows: DataImportRow[]) =>
      apiFetch<{ data: DataImportResult }>(shopPath(shopId, '/data/import'), {
        method: 'POST',
        body: JSON.stringify({ rows }),
      }).then((r) => r.data),
    onSuccess: (result) => {
      toast.success(`Imported ${result.purchasesCreated} purchases, ${result.vakroDaysUpserted} vakro days`);
      setPreview(null);
      setPendingRows([]);
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['purchases-summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['vakro'] });
      qc.invalidateQueries({ queryKey: ['monthly-report'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
      qc.invalidateQueries({ queryKey: ['ai-turnover'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(null);
    setPendingRows([]);
    try {
      const buffer = await file.arrayBuffer();
      const rows = parseImportExcel(buffer);
      if (rows.length === 0) {
        toast.error('No data rows found in Excel');
        return;
      }
      validateMutation.mutate(rows);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not read Excel file');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function downloadTemplate() {
    const buffer = buildExportWorkbook([
      { date: '2026-06-01', storeName: 'Metro Cash & Carry', purchaseRupees: 6500, vakroRupees: 15800 },
      { date: '2026-06-01', storeName: 'Reliance Fresh', purchaseRupees: 4000, vakroRupees: 15800 },
      { date: '2026-06-02', storeName: 'Patel Brothers', purchaseRupees: 2100, vakroRupees: 14200 },
    ]);
    downloadExcel(buffer, 'turnover-import-template.xlsx');
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSpreadsheet className="h-5 w-5" />
          Import / Export Excel
        </CardTitle>
        <CardDescription>
          Columns: <strong>Date</strong>, <strong>Store Name</strong>, <strong>Purchase (₹)</strong>, <strong>Vakro (₹)</strong>.
          Same vakro value per date on all rows for that day.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={downloadTemplate}>
            Download template
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => fileRef.current?.click()}
            disabled={validateMutation.isPending}
          >
            <Upload className="h-4 w-4" />
            Import Excel
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {preview && (
          <div className="rounded-lg border p-3 text-sm">
            {preview.valid ? (
              <div className="space-y-2">
                <p className="font-medium text-emerald-800">Ready to import</p>
                <p className="text-muted-foreground">
                  {preview.summary.purchaseRows} purchase rows · {preview.summary.vakroDays} vakro days ·{' '}
                  {preview.summary.dateCount} dates
                </p>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => importMutation.mutate(pendingRows)}
                  disabled={importMutation.isPending}
                >
                  Confirm import
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-medium text-destructive">{preview.errors.length} error(s) found</p>
                <ul className="max-h-48 space-y-1 overflow-y-auto text-destructive/90">
                  {preview.errors.slice(0, 20).map((err, i) => (
                    <li key={i}>
                      Row {err.rowNumber} · {err.field}: {err.message}
                    </li>
                  ))}
                  {preview.errors.length > 20 && (
                    <li>…and {preview.errors.length - 20} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
