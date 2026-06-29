import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../db/pool.js';
import { signToken } from '../middleware/auth.js';
import type { AuthResponse, User, Shop } from '@turnover/shared';

const RESET_TOKEN_HOURS = 24;

function mapShopRow(s: {
  id: string;
  name: string;
  address: string | null;
  gstin: string | null;
  invoice_prefix: string;
  owner_name?: string | null;
  phone?: string | null;
  city?: string | null;
}): Shop {
  return {
    id: s.id,
    name: s.name,
    address: s.address,
    gstin: s.gstin,
    invoicePrefix: s.invoice_prefix,
    ownerName: s.owner_name ?? null,
    phone: s.phone ?? null,
    city: s.city ?? null,
  };
}

export async function login(email: string, password: string): Promise<AuthResponse | null> {
  const { rows } = await query<{
    id: string;
    email: string;
    password_hash: string;
    role: User['role'];
    shop_id: string | null;
    wholesaler_id: string | null;
    status: User['status'];
  }>(
    `SELECT id, email, password_hash, role, shop_id, wholesaler_id, status
     FROM users WHERE email = $1`,
    [email.toLowerCase()],
  );

  const user = rows[0];
  if (!user || user.status !== 'active') return null;

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;

  let shop: Shop | null = null;
  if (user.shop_id) {
    const shopRes = await query<{
      id: string;
      name: string;
      address: string | null;
      gstin: string | null;
      invoice_prefix: string;
      owner_name: string | null;
      phone: string | null;
      city: string | null;
    }>(
      `SELECT id, name, address, gstin, invoice_prefix, owner_name, phone, city
       FROM shops WHERE id = $1`,
      [user.shop_id],
    );
    const s = shopRes.rows[0];
    if (s) shop = mapShopRow(s);
  }

  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    shopId: user.shop_id,
    wholesalerId: user.wholesaler_id,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      shopId: user.shop_id,
      wholesalerId: user.wholesaler_id,
      status: user.status,
    },
    shop,
  };
}

export async function createShopWithUser(input: {
  name: string;
  email: string;
  password: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  city?: string;
  gstin?: string;
}) {
  const hash = await bcrypt.hash(input.password, 10);

  const shopRes = await query<{ id: string }>(
    `INSERT INTO shops (name, owner_name, phone, address, city, gstin)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      input.name,
      input.ownerName?.trim() ?? null,
      input.phone?.trim() ?? null,
      input.address?.trim() ?? null,
      input.city?.trim() ?? null,
      input.gstin?.trim() ?? null,
    ],
  );
  const shopId = shopRes.rows[0].id;

  await query(
    `INSERT INTO users (email, password_hash, role, shop_id, status)
     VALUES ($1, $2, 'shop', $3, 'active')`,
    [input.email.toLowerCase(), hash, shopId],
  );

  return { shopId };
}

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM users WHERE email = $1 AND status = 'active'`,
    [email.toLowerCase()],
  );
  const user = rows[0];
  if (!user) return null;
  return createPasswordResetTokenByUserId(user.id);
}

export async function createPasswordResetForUser(userId: string): Promise<string | null> {
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM users WHERE id = $1 AND status = 'active'`,
    [userId],
  );
  if (rows.length === 0) return null;
  return createPasswordResetTokenByUserId(userId);
}

async function createPasswordResetTokenByUserId(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_HOURS * 60 * 60 * 1000);

  await query(
    `UPDATE password_reset_tokens SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId],
  );

  await query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, token, expiresAt.toISOString()],
  );

  return token;
}

export async function resetPasswordWithToken(token: string, password: string): Promise<boolean> {
  const { rows } = await query<{ user_id: string }>(
    `SELECT user_id FROM password_reset_tokens
     WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [token],
  );
  const row = rows[0];
  if (!row) return false;

  const ok = await resetUserPassword(row.user_id, password);
  if (!ok) return false;

  await query(
    `UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1`,
    [token],
  );
  return true;
}

export async function resetUserPassword(userId: string, password: string) {
  const hash = await bcrypt.hash(password, 10);
  const { rowCount } = await query(
    `UPDATE users SET password_hash = $1, updated_at = NOW()
     WHERE id = $2 AND status = 'active'`,
    [hash, userId],
  );
  return (rowCount ?? 0) > 0;
}

export async function resetShopOwnerPassword(shopId: string, password: string) {
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM users WHERE shop_id = $1 AND role = 'shop' LIMIT 1`,
    [shopId],
  );
  const owner = rows[0];
  if (!owner) return false;
  return resetUserPassword(owner.id, password);
}

export async function listShops() {
  const { rows } = await query<{
    id: string;
    name: string;
    address: string | null;
    gstin: string | null;
    invoice_prefix: string;
    owner_name: string | null;
    phone: string | null;
    city: string | null;
    owner_email: string | null;
    owner_user_id: string | null;
  }>(
    `SELECT s.id, s.name, s.address, s.gstin, s.invoice_prefix,
            s.owner_name, s.phone, s.city,
            u.email AS owner_email, u.id AS owner_user_id
     FROM shops s
     LEFT JOIN users u ON u.shop_id = s.id AND u.role = 'shop'
     ORDER BY s.created_at DESC`,
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address,
    gstin: r.gstin,
    invoicePrefix: r.invoice_prefix,
    ownerName: r.owner_name,
    phone: r.phone,
    city: r.city,
    ownerEmail: r.owner_email,
    ownerUserId: r.owner_user_id,
  }));
}
