import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { signToken } from '../middleware/auth.js';
import type { AuthResponse, User, Shop } from '@turnover/shared';

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
    }>('SELECT id, name, address, gstin, invoice_prefix FROM shops WHERE id = $1', [
      user.shop_id,
    ]);
    const s = shopRes.rows[0];
    if (s) {
      shop = {
        id: s.id,
        name: s.name,
        address: s.address,
        gstin: s.gstin,
        invoicePrefix: s.invoice_prefix,
      };
    }
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
  address?: string;
  gstin?: string;
}) {
  const hash = await bcrypt.hash(input.password, 10);

  const shopRes = await query<{ id: string }>(
    `INSERT INTO shops (name, address, gstin) VALUES ($1, $2, $3) RETURNING id`,
    [input.name, input.address ?? null, input.gstin ?? null],
  );
  const shopId = shopRes.rows[0].id;

  await query(
    `INSERT INTO users (email, password_hash, role, shop_id, status)
     VALUES ($1, $2, 'shop', $3, 'active')`,
    [input.email.toLowerCase(), hash, shopId],
  );

  return { shopId };
}

export async function listShops() {
  const { rows } = await query<{
    id: string;
    name: string;
    address: string | null;
    gstin: string | null;
    invoice_prefix: string;
    owner_email: string | null;
  }>(
    `SELECT s.id, s.name, s.address, s.gstin, s.invoice_prefix, u.email AS owner_email
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
    ownerEmail: r.owner_email,
  }));
}
