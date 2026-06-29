import { pool } from '../db/pool.js';
import { rupeesToPaise } from '../utils/money.js';
import { mapPayment, mapPurchase } from '../utils/mappers.js';
import { todayIso } from '../utils/dates.js';

export async function recordPayment(
  shopId: string,
  purchaseId: string,
  input: {
    amount: number;
    paymentDate?: string;
    paymentMode?: string;
    note?: string;
  },
) {
  const amountPaise = rupeesToPaise(input.amount);
  const paymentDate = input.paymentDate ?? todayIso();
  const paymentMode = input.paymentMode ?? 'cash';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const purchaseRes = await client.query(
      'SELECT * FROM daily_purchases WHERE id = $1 AND shop_id = $2 FOR UPDATE',
      [purchaseId, shopId],
    );
    if (purchaseRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const purchase = purchaseRes.rows[0] as {
      amount_paise: string;
      paid_amount_paise: string;
    };
    const totalPaise = Number(purchase.amount_paise);
    const currentPaid = Number(purchase.paid_amount_paise ?? 0);
    const pending = totalPaise - currentPaid;

    if (amountPaise > pending) {
      await client.query('ROLLBACK');
      throw new Error(`Payment exceeds pending amount (${pending / 100} ₹)`);
    }

    await client.query(
      `INSERT INTO purchase_payments (purchase_id, shop_id, amount_paise, payment_date, payment_mode, note)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [purchaseId, shopId, amountPaise, paymentDate, paymentMode, input.note ?? null],
    );

    const { rows } = await client.query(
      `UPDATE daily_purchases
       SET paid_amount_paise = paid_amount_paise + $1, updated_at = NOW()
       WHERE id = $2 AND shop_id = $3
       RETURNING *`,
      [amountPaise, purchaseId, shopId],
    );

    await client.query('COMMIT');
    return mapPurchase(rows[0] as never);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listPayments(shopId: string, purchaseId: string) {
  const { rows } = await pool.query(
    `SELECT pp.* FROM purchase_payments pp
     JOIN daily_purchases dp ON dp.id = pp.purchase_id
     WHERE pp.purchase_id = $1 AND pp.shop_id = $2 AND dp.shop_id = $2
     ORDER BY pp.payment_date DESC, pp.created_at DESC`,
    [purchaseId, shopId],
  );
  return rows.map((r) => mapPayment(r as never));
}

export async function markPurchasePaid(
  shopId: string,
  purchaseId: string,
  input?: { paymentDate?: string; paymentMode?: string; note?: string },
) {
  const purchaseRes = await pool.query(
    'SELECT * FROM daily_purchases WHERE id = $1 AND shop_id = $2',
    [purchaseId, shopId],
  );
  if (purchaseRes.rows.length === 0) return null;

  const purchase = purchaseRes.rows[0] as {
    amount_paise: string;
    paid_amount_paise: string;
  };
  const pending = Number(purchase.amount_paise) - Number(purchase.paid_amount_paise ?? 0);
  if (pending <= 0) return mapPurchase(purchaseRes.rows[0] as never);

  return recordPayment(shopId, purchaseId, {
    amount: pending / 100,
    paymentDate: input?.paymentDate,
    paymentMode: input?.paymentMode ?? 'cash',
    note: input?.note ?? 'Marked as fully paid',
  });
}
