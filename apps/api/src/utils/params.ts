import type { Request } from 'express';

function param(req: Request, key: string): string {
  const value = req.params[key];
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export function getShopId(req: Request): string {
  const id = param(req, 'shopId');
  if (!id) throw new Error('shopId param required');
  return id;
}

export function getPurchaseId(req: Request): string {
  const id = param(req, 'purchaseId');
  if (!id) throw new Error('purchaseId param required');
  return id;
}

export function getKharchoId(req: Request): string {
  const id = param(req, 'kharchoId');
  if (!id) throw new Error('kharchoId param required');
  return id;
}
