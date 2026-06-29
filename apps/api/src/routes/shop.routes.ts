import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, requireShopAccess } from '../middleware/auth.js';
import {
  createPurchase,
  updatePurchase,
  deletePurchase,
  listPurchases,
  getPurchasesSummary,
  listPurchaseSources,
  recordPayment,
  listPayments,
  markPurchasePaid,
  markPurchaseUnpaid,
  setPurchasePaidAmount,
  getStorePendingPaise,
  recordStorePayment,
} from '../services/purchase.service.js';
import { upsertVakro, getVakro } from '../services/vakro.service.js';
import { getDashboard, getMonthlyReport } from '../services/dashboard.service.js';
import { getAiTurnoverAnalysis } from '../modules/ai/turnover.service.js';
import { getCalendarMonth } from '../modules/calendar/calendar.service.js';
import { getTargetProgress, setMonthlyTarget } from '../services/target.service.js';
import { getTargetSuggestion } from '../modules/targets/target-suggestion.service.js';
import { exportDataRows, importDataRows, validateImportRows } from '../services/data.service.js';
import {
  createKharcho,
  updateKharcho,
  deleteKharcho,
  listKharcho,
  getKharchoSummary,
} from '../services/kharcho.service.js';
import { createInvoice, listInvoices, getShopForInvoice } from '../services/invoice.service.js';
import { getPurchaseId, getKharchoId, getShopId } from '../utils/params.js';
import { isDateNotFuture, isValidIsoDate, todayIso, currentMonth } from '../utils/dates.js';

export const shopRouter = Router({ mergeParams: true });

shopRouter.use(authMiddleware, requireShopAccess);

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .refine((d) => isValidIsoDate(d), 'Invalid calendar date')
  .refine((d) => isDateNotFuture(d), 'Date cannot be in the future');

const purchaseSchema = z.object({
  sourceName: z.string().min(1),
  amount: z.number().positive(),
  date: isoDateSchema.optional(),
  note: z.string().optional(),
  paidAmount: z.number().min(0).optional(),
});

const payStoreSchema = z.object({
  sourceName: z.string().min(1),
  amount: z.number().positive(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  paymentMode: z.enum(['cash', 'upi', 'card', 'bank']).optional(),
  note: z.string().optional(),
});

const setPaidAmountSchema = z.object({
  paidAmount: z.number().min(0),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  paymentMode: z.enum(['cash', 'upi', 'card', 'bank']).optional(),
  note: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  paymentMode: z.enum(['cash', 'upi', 'card', 'bank']).optional(),
  note: z.string().optional(),
});

const vakroSchema = z.object({
  amount: z.number().min(0),
  date: isoDateSchema.optional(),
  note: z.string().max(500).optional(),
});

const invoiceSchema = z.object({
  customerName: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  date: isoDateSchema.optional(),
  gstPercent: z.number().min(0).max(28).optional(),
});

const kharchoCategorySchema = z.enum([
  'bhadu',
  'nokar_salary',
  'bill',
  'maintenance',
  'car_insurance',
  'car_petrol',
  'emi',
  'other',
]);

const kharchoSchema = z.object({
  category: kharchoCategorySchema,
  amount: z.number().positive(),
  date: isoDateSchema.optional(),
  note: z.string().max(500).optional(),
});

const importRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  date: z.string(),
  storeName: z.string().optional(),
  purchaseAmount: z.number().optional(),
  vakroAmount: z.number().optional(),
});

shopRouter.get('/dashboard', async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const date = (req.query.date as string) ?? todayIso();
    const data = await getDashboard(shopId, date);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.get('/purchases', async (req, res, next) => {
  try {
    const result = await listPurchases(getShopId(req), {
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      source: req.query.source as string | undefined,
      search: req.query.search as string | undefined,
      paymentStatus: req.query.paymentStatus as string | undefined,
      sort: req.query.sort as string | undefined,
      page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
      limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 50,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

shopRouter.get('/purchases/summary', async (req, res, next) => {
  try {
    const data = await getPurchasesSummary(getShopId(req), {
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      source: req.query.source as string | undefined,
      search: req.query.search as string | undefined,
      paymentStatus: req.query.paymentStatus as string | undefined,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.get('/purchases/sources', async (req, res, next) => {
  try {
    const sources = await listPurchaseSources(getShopId(req));
    res.json({ data: sources });
  } catch (err) {
    next(err);
  }
});

shopRouter.get('/purchases/store-pending', async (req, res, next) => {
  try {
    const source = req.query.source as string | undefined;
    if (!source?.trim()) {
      res.status(400).json({ error: 'source query required', code: 'VALIDATION' });
      return;
    }
    const pendingPaise = await getStorePendingPaise(getShopId(req), source);
    res.json({ data: { sourceName: source.trim(), pendingPaise } });
  } catch (err) {
    next(err);
  }
});

shopRouter.post('/purchases/pay-store', async (req, res, next) => {
  try {
    const parsed = payStoreSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', code: 'VALIDATION' });
      return;
    }
    const data = await recordStorePayment(getShopId(req), parsed.data);
    res.status(201).json({ data });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('exceeds pending') || err.message.includes('No pending')) {
        res.status(400).json({ error: err.message, code: 'INVALID_PAYMENT' });
        return;
      }
      if (err.message.includes('must be greater')) {
        res.status(400).json({ error: err.message, code: 'VALIDATION' });
        return;
      }
    }
    next(err);
  }
});

shopRouter.post('/purchases', async (req, res, next) => {
  try {
    const parsed = purchaseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', code: 'VALIDATION' });
      return;
    }
    const data = await createPurchase(getShopId(req), parsed.data);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.put('/purchases/:purchaseId', async (req, res, next) => {
  try {
    const parsed = purchaseSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', code: 'VALIDATION' });
      return;
    }
    const data = await updatePurchase(getShopId(req), getPurchaseId(req), parsed.data);
    if (!data) {
      res.status(404).json({ error: 'Purchase not found', code: 'NOT_FOUND' });
      return;
    }
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.delete('/purchases/:purchaseId', async (req, res, next) => {
  try {
    const ok = await deletePurchase(getShopId(req), getPurchaseId(req));
    if (!ok) {
      res.status(404).json({ error: 'Purchase not found', code: 'NOT_FOUND' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

shopRouter.get('/purchases/:purchaseId/payments', async (req, res, next) => {
  try {
    const data = await listPayments(getShopId(req), getPurchaseId(req));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.post('/purchases/:purchaseId/payments', async (req, res, next) => {
  try {
    const parsed = paymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', code: 'VALIDATION' });
      return;
    }
    const data = await recordPayment(getShopId(req), getPurchaseId(req), parsed.data);
    if (!data) {
      res.status(404).json({ error: 'Purchase not found', code: 'NOT_FOUND' });
      return;
    }
    res.status(201).json({ data });
  } catch (err) {
    if (err instanceof Error && err.message.includes('exceeds pending')) {
      res.status(400).json({ error: err.message, code: 'OVERPAYMENT' });
      return;
    }
    next(err);
  }
});

shopRouter.post('/purchases/:purchaseId/mark-paid', async (req, res, next) => {
  try {
    const parsed = paymentSchema.partial().safeParse(req.body);
    const data = await markPurchasePaid(getShopId(req), getPurchaseId(req), parsed.success ? parsed.data : undefined);
    if (!data) {
      res.status(404).json({ error: 'Purchase not found', code: 'NOT_FOUND' });
      return;
    }
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.post('/purchases/:purchaseId/mark-unpaid', async (req, res, next) => {
  try {
    const data = await markPurchaseUnpaid(getShopId(req), getPurchaseId(req));
    if (!data) {
      res.status(404).json({ error: 'Purchase not found', code: 'NOT_FOUND' });
      return;
    }
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.put('/purchases/:purchaseId/paid-amount', async (req, res, next) => {
  try {
    const parsed = setPaidAmountSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', code: 'VALIDATION' });
      return;
    }
    const data = await setPurchasePaidAmount(getShopId(req), getPurchaseId(req), parsed.data);
    if (!data) {
      res.status(404).json({ error: 'Purchase not found', code: 'NOT_FOUND' });
      return;
    }
    res.json({ data });
  } catch (err) {
    if (err instanceof Error && err.message.includes('Paid amount must be')) {
      res.status(400).json({ error: err.message, code: 'INVALID_PAID_AMOUNT' });
      return;
    }
    next(err);
  }
});

shopRouter.get('/vakro', async (req, res, next) => {
  try {
    const date = (req.query.date as string) ?? todayIso();
    if (!isValidIsoDate(date)) {
      res.status(400).json({ error: 'Invalid date format', code: 'VALIDATION' });
      return;
    }
    const data = await getVakro(getShopId(req), date);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.put('/vakro', async (req, res, next) => {
  try {
    const parsed = vakroSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? 'Validation failed';
      res.status(400).json({ error: msg, code: 'VALIDATION' });
      return;
    }
    const data = await upsertVakro(getShopId(req), parsed.data);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.get('/invoices', async (req, res, next) => {
  try {
    const data = await listInvoices(getShopId(req));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.get('/invoices/shop-profile', async (req, res, next) => {
  try {
    const data = await getShopForInvoice(getShopId(req));
    if (!data) {
      res.status(404).json({ error: 'Shop not found', code: 'NOT_FOUND' });
      return;
    }
    res.json({
      data: {
        name: data.name,
        address: data.address,
        gstin: data.gstin,
        ownerName: data.owner_name,
        phone: data.phone,
        city: data.city,
      },
    });
  } catch (err) {
    next(err);
  }
});

shopRouter.post('/invoices', async (req, res, next) => {
  try {
    const parsed = invoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', code: 'VALIDATION' });
      return;
    }
    const data = await createInvoice(getShopId(req), parsed.data);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.get('/kharcho', async (req, res, next) => {
  try {
    const result = await listKharcho(getShopId(req), {
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      category: req.query.category as string | undefined,
      page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
      limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 100,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

shopRouter.get('/kharcho/summary', async (req, res, next) => {
  try {
    const data = await getKharchoSummary(getShopId(req), {
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      category: req.query.category as string | undefined,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.post('/kharcho', async (req, res, next) => {
  try {
    const parsed = kharchoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', code: 'VALIDATION' });
      return;
    }
    const data = await createKharcho(getShopId(req), parsed.data);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.put('/kharcho/:kharchoId', async (req, res, next) => {
  try {
    const parsed = kharchoSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', code: 'VALIDATION' });
      return;
    }
    const data = await updateKharcho(getShopId(req), getKharchoId(req), parsed.data);
    if (!data) {
      res.status(404).json({ error: 'Kharcho entry not found', code: 'NOT_FOUND' });
      return;
    }
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.delete('/kharcho/:kharchoId', async (req, res, next) => {
  try {
    const ok = await deleteKharcho(getShopId(req), getKharchoId(req));
    if (!ok) {
      res.status(404).json({ error: 'Kharcho entry not found', code: 'NOT_FOUND' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

shopRouter.get('/data/export', async (req, res, next) => {
  try {
    const data = await exportDataRows(getShopId(req), {
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.post('/data/import/validate', async (req, res, next) => {
  try {
    const schema = z.object({ rows: z.array(importRowSchema).min(1).max(5000) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid import payload', code: 'VALIDATION' });
      return;
    }
    const data = validateImportRows(parsed.data.rows);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.post('/data/import', async (req, res, next) => {
  try {
    const schema = z.object({ rows: z.array(importRowSchema).min(1).max(5000) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid import payload', code: 'VALIDATION' });
      return;
    }
    const preview = validateImportRows(parsed.data.rows);
    if (!preview.valid) {
      res.status(400).json({
        error: preview.errors[0]?.message ?? 'Validation failed',
        code: 'IMPORT_VALIDATION',
        data: preview,
      });
      return;
    }
    const data = await importDataRows(getShopId(req), parsed.data.rows);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.get('/reports/monthly', async (req, res, next) => {
  try {
    const month = (req.query.month as string) ?? currentMonth();
    const data = await getMonthlyReport(getShopId(req), month);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.get('/calendar', async (req, res, next) => {
  try {
    const month = (req.query.month as string) ?? currentMonth();
    const data = await getCalendarMonth(getShopId(req), month);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.get('/targets/:month/suggestion', async (req, res, next) => {
  try {
    const month = req.params['month'] as string;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({ error: 'month must be YYYY-MM', code: 'VALIDATION' });
      return;
    }
    const data = await getTargetSuggestion(getShopId(req), month);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.get('/targets/:month', async (req, res, next) => {
  try {
    const progress = await getTargetProgress(getShopId(req), req.params['month'] as string);
    res.json({ data: progress });
  } catch (err) {
    next(err);
  }
});

shopRouter.put('/targets/:month', async (req, res, next) => {
  try {
    const schema = z.object({ target: z.number().positive() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Target amount required (in ₹)', code: 'VALIDATION' });
      return;
    }
    const month = req.params['month'] as string;
    await setMonthlyTarget(getShopId(req), month, parsed.data.target);
    const progress = await getTargetProgress(getShopId(req), month);
    res.json({ data: progress });
  } catch (err) {
    next(err);
  }
});

shopRouter.get('/ai/turnover', async (req, res, next) => {
  try {
    const period = (req.query.period as string) ?? 'month';
    if (!['week', 'month', 'all'].includes(period)) {
      res.status(400).json({ error: 'period must be week, month, or all', code: 'VALIDATION' });
      return;
    }
    const data = await getAiTurnoverAnalysis(
      getShopId(req),
      period as 'week' | 'month' | 'all',
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

shopRouter.get('/ai/insights', async (req, res, next) => {
  try {
    const period = (req.query.period as string) ?? 'month';
    const data = await getAiTurnoverAnalysis(
      getShopId(req),
      ['week', 'month', 'all'].includes(period) ? (period as 'week' | 'month' | 'all') : 'month',
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});
